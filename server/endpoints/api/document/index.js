const { Telemetry } = require("../../../models/telemetry");
const { validApiKey } = require("../../../utils/middleware/validApiKey");
const { handleAPIFileUpload } = require("../../../utils/files/multer");
const {
  viewLocalFiles,
  findDocumentInDocuments,
  getDocumentsByFolder,
  normalizePath,
  isWithin,
} = require("../../../utils/files");
const { reqBody } = require("../../../utils/http");
const { EventLogs } = require("../../../models/eventLogs");
const { CollectorApi } = require("../../../utils/collectorApi");
const fs = require("fs");
const path = require("path");
const { Document } = require("../../../models/documents");
const { purgeFolder } = require("../../../utils/files/purgeDocument");
const { addPublicDocument } = require("../../../utils/publicDocuments");
const documentsPath =
  process.env.NODE_ENV === "development"
    ? path.resolve(__dirname, "../../../storage/documents")
    : path.resolve(process.env.STORAGE_DIR, `documents`);

function apiDocumentEndpoints(app) {
  if (!app) return;

  app.post(
    "/v1/document/upload",
    [validApiKey, handleAPIFileUpload],
    async (request, response) => {
      /*
    #swagger.tags = ['Documents']
    #swagger.description = 'Upload a new file to InteplastLLM to be parsed and prepared for embedding.'
    #swagger.requestBody = {
      description: 'File to be uploaded.',
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: 'object',
            required: ['file'],
            properties: {
              file: {
                type: 'string',
                format: 'binary',
                description: 'The file to upload'
              },
              addToWorkspaces: {
                type: 'string',
                description: 'comma-separated text-string of workspace slugs to embed the document into post-upload. eg: workspace1,workspace2',
              }
            },
            required: ['file']
          }
        }
      }
    }
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
              success: true,
              error: null,
              documents: [
                {
                  "location": "custom-documents/anythingllm.txt-6e8be64c-c162-4b43-9997-b068c0071e8b.json",
                  "name": "anythingllm.txt-6e8be64c-c162-4b43-9997-b068c0071e8b.json",
                  "url": "file:///Users/tim/Documents/anything-llm/collector/hotdir/anythingllm.txt",
                  "title": "anythingllm.txt",
                  "docAuthor": "Unknown",
                  "description": "Unknown",
                  "docSource": "a text file uploaded by the user.",
                  "chunkSource": "anythingllm.txt",
                  "published": "1/16/2024, 3:07:00 PM",
                  "wordCount": 93,
                  "token_count_estimate": 115,
                }
              ]
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
    */
      try {
        const Collector = new CollectorApi();
        const { originalname } = request.file;
        const { addToWorkspaces = "" } = reqBody(request);
        const processingOnline = await Collector.online();

        if (!processingOnline) {
          response
            .status(500)
            .json({
              success: false,
              error: `Document processing API is not online. Document ${originalname} will not be processed automatically.`,
            })
            .end();
          return;
        }

        const { success, reason, documents } =
          await Collector.processDocument(originalname);
        if (!success) {
          response
            .status(500)
            .json({ success: false, error: reason, documents })
            .end();
          return;
        }

        Collector.log(
          `Document ${originalname} uploaded processed and successfully. It is now available in documents.`
        );
        await Telemetry.sendTelemetry("document_uploaded");
        await EventLogs.logEvent("api_document_uploaded", {
          documentName: originalname,
        });

        // Add document to public access if enabled
        let publicDocumentInfo = null;
        if (process.env.ENABLE_PUBLIC_DOCUMENTS === "true" && documents?.[0]) {
          const hotdirPath = path.resolve(
            __dirname,
            process.env.NODE_ENV === "development"
              ? "../../../collector/hotdir"
              : "../../../../collector/hotdir"
          );
          const sourcePath = path.join(hotdirPath, originalname);

          if (fs.existsSync(sourcePath)) {
            const publicResult = addPublicDocument(sourcePath, originalname);
            if (publicResult.success) {
              publicDocumentInfo = {
                publicUrl: publicResult.publicUrl,
                publicFilename: publicResult.publicFilename,
                documentId: publicResult.documentId,
              };
            }
          }
        }

        if (!!addToWorkspaces)
          await Document.api.uploadToWorkspace(
            addToWorkspaces,
            documents?.[0].location
          );

        // Include frontend URL information if copy was successful
        const frontendInfo =
          request.frontendCopyResult && request.frontendCopyResult.success
            ? {
                frontendUrl: request.frontendCopyResult.publicUrl,
                frontendPath: request.frontendCopyResult.frontendPath,
              }
            : null;

        response.status(200).json({
          success: true,
          error: null,
          documents,
          publicDocument: publicDocumentInfo,
          frontendAccess: frontendInfo,
        });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/document/upload/:folderName",
    [validApiKey, handleAPIFileUpload],
    async (request, response) => {
      /*
      #swagger.tags = ['Documents']
      #swagger.description = 'Upload a new file to a specific folder in InteplastLLM to be parsed and prepared for embedding. If the folder does not exist, it will be created.'
      #swagger.parameters['folderName'] = {
        in: 'path',
        description: 'Target folder path (defaults to \"custom-documents\" if not provided)',
        required: true,
        type: 'string',
        example: 'my-folder'
      }
      #swagger.requestBody = {
        description: 'File to be uploaded.',
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: 'object',
              required: ['file'],
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                  description: 'The file to upload'
                },
                addToWorkspaces: {
                  type: 'string',
                  description: 'comma-separated text-string of workspace slugs to embed the document into post-upload. eg: workspace1,workspace2',
                }
              }
            }
          }
        }
      }
      #swagger.responses[200] = {
        content: {
          "application/json": {
            schema: {
              type: 'object',
              example: {
                success: true,
                error: null,
                documents: [{
                  "location": "custom-documents/anythingllm.txt-6e8be64c-c162-4b43-9997-b068c0071e8b.json",
                  "name": "anythingllm.txt-6e8be64c-c162-4b43-9997-b068c0071e8b.json",
                  "url": "file:///Users/tim/Documents/anything-llm/collector/hotdir/anythingllm.txt",
                  "title": "anythingllm.txt",
                  "docAuthor": "Unknown",
                  "description": "Unknown",
                  "docSource": "a text file uploaded by the user.",
                  "chunkSource": "anythingllm.txt",
                  "published": "1/16/2024, 3:07:00 PM",
                  "wordCount": 93,
                  "token_count_estimate": 115
                }]
              }
            }
          }
        }
      }
      #swagger.responses[403] = {
        schema: {
          "$ref": "#/definitions/InvalidAPIKey"
        }
      }
      #swagger.responses[500] = {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: {
              type: 'object',
              example: {
                success: false,
                error: "Document processing API is not online. Document will not be processed automatically."
              }
            }
          }
        }
      }
      */
      try {
        const { originalname } = request.file;
        const { addToWorkspaces = "" } = reqBody(request);
        let folder = request.params?.folderName || "custom-documents";
        folder = normalizePath(folder);
        const targetFolderPath = path.join(documentsPath, folder);

        if (
          !isWithin(path.resolve(documentsPath), path.resolve(targetFolderPath))
        )
          throw new Error("Invalid folder name");
        if (!fs.existsSync(targetFolderPath))
          fs.mkdirSync(targetFolderPath, { recursive: true });

        const Collector = new CollectorApi();
        const processingOnline = await Collector.online();
        if (!processingOnline) {
          response
            .status(500)
            .json({
              success: false,
              error: `Document processing API is not online. Document ${originalname} will not be processed automatically.`,
            })
            .end();
          return;
        }

        // Process the uploaded document
        const { success, reason, documents } =
          await Collector.processDocument(originalname);
        if (!success) {
          response
            .status(500)
            .json({ success: false, error: reason, documents })
            .end();
          return;
        }

        // For each processed document, check if it is already in the desired folder.
        // If not, move it using similar logic as in the move-files endpoint.
        for (const doc of documents) {
          const currentFolder = path.dirname(doc.location);
          if (currentFolder !== folder) {
            const sourcePath = path.join(
              documentsPath,
              normalizePath(doc.location)
            );
            const destinationPath = path.join(
              targetFolderPath,
              path.basename(doc.location)
            );

            if (
              !isWithin(documentsPath, sourcePath) ||
              !isWithin(documentsPath, destinationPath)
            )
              throw new Error("Invalid file location");

            fs.renameSync(sourcePath, destinationPath);
            doc.location = path.join(folder, path.basename(doc.location));
            doc.name = path.basename(doc.location);
          }
        }

        Collector.log(
          `Document ${originalname} uploaded, processed, and moved to folder ${folder} successfully.`
        );

        await Telemetry.sendTelemetry("document_uploaded");
        await EventLogs.logEvent("api_document_uploaded", {
          documentName: originalname,
          folder,
        });

        if (!!addToWorkspaces)
          await Document.api.uploadToWorkspace(
            addToWorkspaces,
            documents?.[0].location
          );

        // Include frontend URL information if copy was successful
        const frontendInfo =
          request.frontendCopyResult && request.frontendCopyResult.success
            ? {
                frontendUrl: request.frontendCopyResult.publicUrl,
                frontendPath: request.frontendCopyResult.frontendPath,
              }
            : null;

        response.status(200).json({
          success: true,
          error: null,
          documents,
          frontendAccess: frontendInfo,
        });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/document/upload-link",
    [validApiKey],
    async (request, response) => {
      /*
    #swagger.tags = ['Documents']
    #swagger.description = 'Upload a valid URL for InteplastLLM to scrape and prepare for embedding. Optionally, specify a comma-separated list of workspace slugs to embed the document into post-upload.'
    #swagger.requestBody = {
      description: 'Link of web address to be scraped and optionally a comma-separated list of workspace slugs to embed the document into post-upload.',
      required: true,
      content: {
          "application/json": {
            schema: {
              type: 'object',
              example: {
                "link": "https://anythingllm.com",
                "addToWorkspaces": "workspace1,workspace2",
                "scraperHeaders": {
                  "Authorization": "Bearer token123",
                  "My-Custom-Header": "value"
                }
              }
            }
          }
        }
    }
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
              success: true,
              error: null,
              documents: [
                {
                  "id": "c530dbe6-bff1-4b9e-b87f-710d539d20bc",
                  "url": "file://useanything_com.html",
                  "title": "useanything_com.html",
                  "docAuthor": "no author found",
                  "description": "No description found.",
                  "docSource": "URL link uploaded by the user.",
                  "chunkSource": "https:anythingllm.com.html",
                  "published": "1/16/2024, 3:46:33 PM",
                  "wordCount": 252,
                  "pageContent": "InteplastLLM is the best....",
                  "token_count_estimate": 447,
                  "location": "custom-documents/url-useanything_com-c530dbe6-bff1-4b9e-b87f-710d539d20bc.json"
                }
              ]
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
    */
      try {
        const Collector = new CollectorApi();
        const {
          link,
          addToWorkspaces = "",
          scraperHeaders = {},
        } = reqBody(request);
        const processingOnline = await Collector.online();

        if (!processingOnline) {
          response
            .status(500)
            .json({
              success: false,
              error: `Document processing API is not online. Link ${link} will not be processed automatically.`,
            })
            .end();
          return;
        }

        const { success, reason, documents } = await Collector.processLink(
          link,
          scraperHeaders
        );
        if (!success) {
          response
            .status(500)
            .json({ success: false, error: reason, documents })
            .end();
          return;
        }

        Collector.log(
          `Link ${link} uploaded processed and successfully. It is now available in documents.`
        );
        await Telemetry.sendTelemetry("link_uploaded");
        await EventLogs.logEvent("api_link_uploaded", {
          link,
        });

        if (!!addToWorkspaces)
          await Document.api.uploadToWorkspace(
            addToWorkspaces,
            documents?.[0].location
          );
        response.status(200).json({ success: true, error: null, documents });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/document/raw-text",
    [validApiKey],
    async (request, response) => {
      /*
     #swagger.tags = ['Documents']
     #swagger.description = 'Upload a file by specifying its raw text content and metadata values without having to upload a file.'
     #swagger.requestBody = {
      description: 'Text content and metadata of the file to be saved to the system. Use metadata-schema endpoint to get the possible metadata keys',
      required: true,
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
              "textContent": "This is the raw text that will be saved as a document in InteplastLLM.",
              "addToWorkspaces": "workspace1,workspace2",
              "metadata": {
                "title": "This key is required. See in /server/endpoints/api/document/index.js:287",
                "keyOne": "valueOne",
                "keyTwo": "valueTwo",
                "etc": "etc"
              }
            }
          }
        }
      }
     }
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
              success: true,
              error: null,
              documents: [
                {
                  "id": "c530dbe6-bff1-4b9e-b87f-710d539d20bc",
                  "url": "file://my-document.txt",
                  "title": "hello-world.txt",
                  "docAuthor": "no author found",
                  "description": "No description found.",
                  "docSource": "My custom description set during upload",
                  "chunkSource": "no chunk source specified",
                  "published": "1/16/2024, 3:46:33 PM",
                  "wordCount": 252,
                  "pageContent": "InteplastLLM is the best....",
                  "token_count_estimate": 447,
                  "location": "custom-documents/raw-my-doc-text-c530dbe6-bff1-4b9e-b87f-710d539d20bc.json"
                }
              ]
            }
          }
        }
      }
     }
     #swagger.responses[403] = {
       schema: {
         "$ref": "#/definitions/InvalidAPIKey"
       }
     }
     */
      try {
        const Collector = new CollectorApi();
        const requiredMetadata = ["title"];
        const {
          textContent,
          metadata = {},
          addToWorkspaces = "",
        } = reqBody(request);
        const processingOnline = await Collector.online();

        if (!processingOnline) {
          response
            .status(500)
            .json({
              success: false,
              error: `Document processing API is not online. Request will not be processed.`,
            })
            .end();
          return;
        }

        if (
          !requiredMetadata.every(
            (reqKey) =>
              Object.keys(metadata).includes(reqKey) && !!metadata[reqKey]
          )
        ) {
          response
            .status(422)
            .json({
              success: false,
              error: `You are missing required metadata key:value pairs in your request. Required metadata key:values are ${requiredMetadata
                .map((v) => `'${v}'`)
                .join(", ")}`,
            })
            .end();
          return;
        }

        if (!textContent || textContent?.length === 0) {
          response
            .status(422)
            .json({
              success: false,
              error: `The 'textContent' key cannot have an empty value.`,
            })
            .end();
          return;
        }

        const { success, reason, documents } = await Collector.processRawText(
          textContent,
          metadata
        );
        if (!success) {
          response
            .status(500)
            .json({ success: false, error: reason, documents })
            .end();
          return;
        }

        Collector.log(
          `Document created successfully. It is now available in documents.`
        );
        await Telemetry.sendTelemetry("raw_document_uploaded");
        await EventLogs.logEvent("api_raw_document_uploaded");

        if (!!addToWorkspaces)
          await Document.api.uploadToWorkspace(
            addToWorkspaces,
            documents?.[0].location
          );
        response.status(200).json({ success: true, error: null, documents });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get("/v1/documents", [validApiKey], async (_, response) => {
    /*
    #swagger.tags = ['Documents']
    #swagger.description = 'List of all locally-stored documents in instance'
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
             "localFiles": {
              "name": "documents",
              "type": "folder",
              items: [
                {
                  "name": "my-stored-document.json",
                  "type": "file",
                  "id": "bb07c334-4dab-4419-9462-9d00065a49a1",
                  "url": "file://my-stored-document.txt",
                  "title": "my-stored-document.txt",
                  "cached": false
                },
              ]
             }
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
    */
    try {
      const localFiles = await viewLocalFiles();
      response.status(200).json({ localFiles });
    } catch (e) {
      console.error(e.message, e);
      response.sendStatus(500).end();
    }
  });

  app.get(
    "/v1/documents/folder/:folderName",
    [validApiKey],
    async (request, response) => {
      /*
    #swagger.tags = ['Documents']
    #swagger.description = 'Get all documents stored in a specific folder.'
    #swagger.parameters['folderName'] = {
      in: 'path',
      description: 'Name of the folder to retrieve documents from',
      required: true,
      type: 'string'
    }
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
              folder: "custom-documents",
              documents: [
                {
                  name: "document1.json",
                  type: "file",
                  cached: false,
                  pinnedWorkspaces: [],
                  watched: false,
                  more: "data",
                },
                {
                  name: "document2.json",
                  type: "file",
                  cached: false,
                  pinnedWorkspaces: [],
                  watched: false,
                  more: "data",
                },
              ]
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
    */
      try {
        const { folderName } = request.params;
        const result = await getDocumentsByFolder(folderName);
        response.status(200).json(result);
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/document/accepted-file-types",
    [validApiKey],
    async (_, response) => {
      /*
    #swagger.tags = ['Documents']
    #swagger.description = 'Check available filetypes and MIMEs that can be uploaded.'
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
              "types": {
                "application/mbox": [
                  ".mbox"
                ],
                "application/pdf": [
                  ".pdf"
                ],
                "application/vnd.oasis.opendocument.text": [
                  ".odt"
                ],
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
                  ".docx"
                ],
                "text/plain": [
                  ".txt",
                  ".md"
                ]
              }
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
    */
      try {
        const types = await new CollectorApi().acceptedFileTypes();
        if (!types) {
          response.sendStatus(404).end();
          return;
        }

        response.status(200).json({ types });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/document/metadata-schema",
    [validApiKey],
    async (_, response) => {
      /*
    #swagger.tags = ['Documents']
    #swagger.description = 'Get the known available metadata schema for when doing a raw-text upload and the acceptable type of value for each key.'
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
             "schema": {
                "keyOne": "string | number | nullable",
                "keyTwo": "string | number | nullable",
                "specialKey": "number",
                "title": "string",
              }
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
    */
      try {
        response.status(200).json({
          schema: {
            // If you are updating this be sure to update the collector METADATA_KEYS constant in /processRawText.
            url: "string | nullable",
            title: "string",
            docAuthor: "string | nullable",
            description: "string | nullable",
            docSource: "string | nullable",
            chunkSource: "string | nullable",
            published: "epoch timestamp in ms | nullable",
          },
        });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  // Be careful and place as last route to prevent override of the other /document/ GET
  // endpoints!
  app.get("/v1/document/:docName", [validApiKey], async (request, response) => {
    /*
    #swagger.tags = ['Documents']
    #swagger.description = 'Get a single document by its unique InteplastLLM document name'
    #swagger.parameters['docName'] = {
        in: 'path',
        description: 'Unique document name to find (name in /documents)',
        required: true,
        type: 'string'
    }
    #swagger.responses[200] = {
      content: {
        "application/json": {
          schema: {
            type: 'object',
            example: {
             "localFiles": {
              "name": "documents",
              "type": "folder",
              items: [
                {
                  "name": "my-stored-document.txt-uuid1234.json",
                  "type": "file",
                  "id": "bb07c334-4dab-4419-9462-9d00065a49a1",
                  "url": "file://my-stored-document.txt",
                  "title": "my-stored-document.txt",
                  "cached": false
                },
              ]
             }
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      schema: {
        "$ref": "#/definitions/InvalidAPIKey"
      }
    }
    */
    try {
      const { docName } = request.params;
      const document = await findDocumentInDocuments(docName);
      if (!document) {
        response.sendStatus(404).end();
        return;
      }
      response.status(200).json({ document });
    } catch (e) {
      console.error(e.message, e);
      response.sendStatus(500).end();
    }
  });

  app.post(
    "/v1/document/create-folder",
    [validApiKey],
    async (request, response) => {
      /*
      #swagger.tags = ['Documents']
      #swagger.description = 'Create a new folder inside the documents storage directory.'
      #swagger.requestBody = {
        description: 'Name of the folder to create.',
        required: true,
        content: {
          "application/json": {
            schema: {
              type: 'string',
              example: {
                "name": "new-folder"
              }
            }
          }
        }
      }
      #swagger.responses[200] = {
        content: {
          "application/json": {
            schema: {
              type: 'object',
              example: {
                success: true,
                message: null
              }
            }
          }
        }
      }
      #swagger.responses[403] = {
        schema: {
          "$ref": "#/definitions/InvalidAPIKey"
        }
      }
      */
      try {
        const { name } = reqBody(request);
        const storagePath = path.join(documentsPath, normalizePath(name));
        if (!isWithin(path.resolve(documentsPath), path.resolve(storagePath)))
          throw new Error("Invalid path name");

        if (fs.existsSync(storagePath)) {
          response.status(500).json({
            success: false,
            message: "Folder by that name already exists",
          });
          return;
        }

        fs.mkdirSync(storagePath, { recursive: true });
        response.status(200).json({ success: true, message: null });
      } catch (e) {
        console.error(e);
        response.status(500).json({
          success: false,
          message: `Failed to create folder: ${e.message}`,
        });
      }
    }
  );

  app.delete(
    "/v1/document/remove-folder",
    [validApiKey],
    async (request, response) => {
      /*
      #swagger.tags = ['Documents']
      #swagger.description = 'Remove a folder and all its contents from the documents storage directory.'
      #swagger.requestBody = {
        description: 'Name of the folder to remove.',
        required: true,
        content: {
          "application/json": {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: "my-folder"
                }
              }
            }
          }
        }
      }
      #swagger.responses[200] = {
        content: {
          "application/json": {
            schema: {
              type: 'object',
              example: {
                success: true,
                message: "Folder removed successfully"
              }
            }
          }
        }
      }
      #swagger.responses[403] = {
        schema: {
          "$ref": "#/definitions/InvalidAPIKey"
        }
      }
      */
      try {
        const { name } = reqBody(request);
        await purgeFolder(name);
        response
          .status(200)
          .json({ success: true, message: "Folder removed successfully" });
      } catch (e) {
        console.error(e);
        response.status(500).json({
          success: false,
          message: `Failed to remove folder: ${e.message}`,
        });
      }
    }
  );

  app.post(
    "/v1/document/move-files",
    [validApiKey],
    async (request, response) => {
      /*
      #swagger.tags = ['Documents']
      #swagger.description = 'Move files within the documents storage directory.'
      #swagger.requestBody = {
        description: 'Array of objects containing source and destination paths of files to move.',
        required: true,
        content: {
          "application/json": {
            schema: {
              type: 'object',
              example: {
                "files": [
                  {
                    "from": "custom-documents/file.txt-fc4beeeb-e436-454d-8bb4-e5b8979cb48f.json",
                    "to": "folder/file.txt-fc4beeeb-e436-454d-8bb4-e5b8979cb48f.json"
                  }
                ]
              }
            }
          }
        }
      }
      #swagger.responses[200] = {
        content: {
          "application/json": {
            schema: {
              type: 'object',
              example: {
                success: true,
                message: null
              }
            }
          }
        }
      }
      #swagger.responses[403] = {
        schema: {
          "$ref": "#/definitions/InvalidAPIKey"
        }
      }
      */
      try {
        const { files } = reqBody(request);
        const docpaths = files.map(({ from }) => from);
        const documents = await Document.where({ docpath: { in: docpaths } });
        const embeddedFiles = documents.map((doc) => doc.docpath);
        const moveableFiles = files.filter(
          ({ from }) => !embeddedFiles.includes(from)
        );
        const movePromises = moveableFiles.map(({ from, to }) => {
          const sourcePath = path.join(documentsPath, normalizePath(from));
          const destinationPath = path.join(documentsPath, normalizePath(to));
          return new Promise((resolve, reject) => {
            if (
              !isWithin(documentsPath, sourcePath) ||
              !isWithin(documentsPath, destinationPath)
            )
              return reject("Invalid file location");

            fs.rename(sourcePath, destinationPath, (err) => {
              if (err) {
                console.error(`Error moving file ${from} to ${to}:`, err);
                reject(err);
              } else {
                resolve();
              }
            });
          });
        });
        Promise.all(movePromises)
          .then(() => {
            const unmovableCount = files.length - moveableFiles.length;
            if (unmovableCount > 0) {
              response.status(200).json({
                success: true,
                message: `${unmovableCount}/${files.length} files not moved. Unembed them from all workspaces.`,
              });
            } else {
              response.status(200).json({
                success: true,
                message: null,
              });
            }
          })
          .catch((err) => {
            console.error("Error moving files:", err);
            response
              .status(500)
              .json({ success: false, message: "Failed to move some files." });
          });
      } catch (e) {
        console.error(e);
        response
          .status(500)
          .json({ success: false, message: "Failed to move files." });
      }
    }
  );

  // Workspace Document Viewer Endpoints

  app.get(
    "/v1/workspace/:workspaceSlug/document/:docId",
    [validApiKey],
    async (request, response) => {
      /*
      #swagger.tags = ['Documents']
      #swagger.description = 'Get document metadata for workspace document viewer'
      #swagger.parameters['workspaceSlug'] = {
        in: 'path',
        description: 'Workspace slug',
        required: true,
        type: 'string'
      }
      #swagger.parameters['docId'] = {
        in: 'path', 
        description: 'Document ID or title',
        required: true,
        type: 'string'
      }
      */
      try {
        const { workspaceSlug, docId } = request.params;
        const decodedDocId = decodeURIComponent(docId);

        // Optional: Validate workspace exists (for better error messages)
        // Note: Currently documents are global, not workspace-specific
        // But we could add workspace validation here if needed

        console.log(
          `Document lookup request: workspace=${workspaceSlug}, docId=${decodedDocId}`
        );

        // Find document by matching title or ID
        const document = await findDocumentByIdOrTitle(decodedDocId);

        if (!document) {
          return response.status(404).json({
            success: false,
            error: "Document not found",
          });
        }

        // Determine document type from file extension
        const getDocumentType = (url, title) => {
          const fileUrl = url || title || "";
          const extension = fileUrl.toLowerCase().split(".").pop();

          switch (extension) {
            case "pdf":
              return "pdf";
            case "doc":
            case "docx":
              return "docx";
            case "txt":
              return "text";
            case "html":
            case "htm":
              return "html";
            default:
              return "text"; // Default fallback to text
          }
        };

        const documentType = getDocumentType(document.url, document.title);
        const isOriginalPDF = documentType === "pdf";

        response.status(200).json({
          success: true,
          document: {
            id: document.id,
            title: document.title,
            filename: document.title,
            type: documentType,
            content: document.pageContent,
            metadata: {
              wordCount: document.wordCount,
              token_count_estimate: document.token_count_estimate,
              docAuthor: document.docAuthor,
              published: document.published,
            },
            source: isOriginalPDF
              ? `/v1/workspace/${workspaceSlug}/document/${encodeURIComponent(docId)}/pdf`
              : null,
            chunks: [], // Will be populated if needed
          },
        });
      } catch (e) {
        console.error("Document fetch error:", e);
        response.status(500).json({
          success: false,
          error: "Failed to fetch document",
        });
      }
    }
  );

  app.post(
    "/v1/workspace/:workspaceSlug/document/:docId/ask",
    [validApiKey],
    async (request, response) => {
      /*
      #swagger.tags = ['Documents']  
      #swagger.description = 'Ask questions about a specific document'
      #swagger.parameters['workspaceSlug'] = {
        in: 'path',
        description: 'Workspace slug',
        required: true,
        type: 'string'
      }
      #swagger.parameters['docId'] = {
        in: 'path',
        description: 'Document ID or title', 
        required: true,
        type: 'string'
      }
      #swagger.requestBody = {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: 'object',
              properties: {
                question: {
                  type: 'string',
                  description: 'Question to ask about the document'
                },
                contextMode: {
                  type: 'string', 
                  description: 'Context mode for the question'
                }
              },
              required: ['question']
            }
          }
        }
      }
      */
      try {
        const { workspaceSlug, docId } = request.params;
        const { question, contextMode } = reqBody(request);
        const decodedDocId = decodeURIComponent(docId);

        // Find the document
        const document = await findDocumentByIdOrTitle(decodedDocId);
        if (!document) {
          return response.status(404).json({
            success: false,
            error: "Document not found",
          });
        }

        // Mock response with document content analysis
        // In real implementation, this would:
        // 1. Query vector database for document-specific chunks
        // 2. Generate LLM response with source mapping
        // 3. Return response with highlight coordinates
        const mockResponse = {
          id: Date.now(),
          type: "message",
          textResponse: `Based on the document "${document.title}", here is the answer to your question: "${question}". 

This document appears to be a business quotation with the following key information:
- Company: 維克整合股份有限公司 (Vsys Integration Corp)
- Contact: 林雅萍 (Grace Lin)  
- Quote Number: QT25P0104R4
- Total Amount: $207,900 USD
- Product: PVC板材平面度瑕疵檢測系統 (PVC Board Flatness Defect Detection System)

The system includes front and back surface inspection capabilities with cameras, lighting, and AI-based defect detection software.`,
          sourceMapping: [
            {
              chunkId: "chunk-1",
              similarity: 0.95,
              content: "維克整合股份有限公司 - 報價單",
              metadata: {
                chunkIndex: 0,
                pageNumber: 1,
                startOffset: 0,
                endOffset: 50,
              },
            },
            {
              chunkId: "chunk-2",
              similarity: 0.88,
              content: "PVC板材平面度瑕疵檢測系統",
              metadata: {
                chunkIndex: 1,
                pageNumber: 1,
                startOffset: 200,
                endOffset: 250,
              },
            },
          ],
        };

        response.status(200).json({
          success: true,
          response: mockResponse,
        });
      } catch (e) {
        console.error("Document Q&A error:", e);
        response.status(500).json({
          success: false,
          error: "Failed to process question",
        });
      }
    }
  );

  app.get(
    "/v1/workspace/:workspaceSlug/document/:docId/chunk/:chunkId",
    [validApiKey],
    async (request, response) => {
      /*
      #swagger.tags = ['Documents']
      #swagger.description = 'Get specific document chunk details'
      #swagger.parameters['workspaceSlug'] = {
        in: 'path',
        description: 'Workspace slug',
        required: true,
        type: 'string'
      }
      #swagger.parameters['docId'] = {
        in: 'path',
        description: 'Document ID or title',
        required: true, 
        type: 'string'
      }
      #swagger.parameters['chunkId'] = {
        in: 'path',
        description: 'Chunk ID',
        required: true,
        type: 'string'
      }
      */
      try {
        const { workspaceSlug, docId, chunkId } = request.params;
        const decodedDocId = decodeURIComponent(docId);

        const document = await findDocumentByIdOrTitle(decodedDocId);
        if (!document) {
          return response.status(404).json({
            success: false,
            error: "Document not found",
          });
        }

        // Mock chunk data - in real implementation would query vector database
        const chunkData = {
          id: chunkId,
          content: "Sample chunk content from the document...",
          metadata: {
            pageNumber: 1,
            startOffset: 100,
            endOffset: 200,
            similarity: 0.92,
          },
        };

        response.status(200).json({
          success: true,
          chunk: chunkData,
        });
      } catch (e) {
        console.error("Chunk fetch error:", e);
        response.status(500).json({
          success: false,
          error: "Failed to fetch chunk",
        });
      }
    }
  );

  app.get(
    "/v1/workspace/:workspaceSlug/document/:docId/pdf",
    [validApiKey],
    async (request, response) => {
      /*
      #swagger.tags = ['Documents']
      #swagger.description = 'Serve original PDF file for document viewer'
      #swagger.parameters['workspaceSlug'] = {
        in: 'path',
        description: 'Workspace slug', 
        required: true,
        type: 'string'
      }
      #swagger.parameters['docId'] = {
        in: 'path',
        description: 'Document ID or title',
        required: true,
        type: 'string'  
      }
      */
      try {
        const { workspaceSlug, docId } = request.params;
        const decodedDocId = decodeURIComponent(docId);

        const document = await findDocumentByIdOrTitle(decodedDocId);
        if (!document) {
          return response.status(404).json({
            success: false,
            error: "Document not found",
          });
        }

        // Check if original PDF file exists
        const originalUrl = document.url;
        if (originalUrl && originalUrl.startsWith("file://")) {
          const filePath = originalUrl.replace("file://", "");
          const normalizedPath = filePath.replace(/\\/g, "/");

          if (fs.existsSync(normalizedPath)) {
            // Serve the original PDF file
            response.setHeader("Content-Type", "application/pdf");
            response.setHeader(
              "Content-Disposition",
              `inline; filename="${document.title}"`
            );

            const fileStream = fs.createReadStream(normalizedPath);
            fileStream.pipe(response);
            return;
          }
        }

        // If no original PDF found, return error
        response.status(404).json({
          success: false,
          error: "Original PDF file not found",
        });
      } catch (e) {
        console.error("PDF serve error:", e);
        response.status(500).json({
          success: false,
          error: "Failed to serve PDF file",
        });
      }
    }
  );
  // Public Document Management Endpoints
  app.get("/v1/public-documents", [validApiKey], async (request, response) => {
    /*
      #swagger.tags = ['Documents']
      #swagger.description = 'List all public documents'
      */
    try {
      const { listPublicDocuments } = require("../../../utils/publicDocuments");
      const documents = listPublicDocuments();

      response.status(200).json({
        success: true,
        documents,
      });
    } catch (e) {
      console.error("Public documents list error:", e);
      response.status(500).json({
        success: false,
        error: "Failed to list public documents",
      });
    }
  });

  app.post(
    "/v1/public-documents/add",
    [validApiKey],
    async (request, response) => {
      /*
      #swagger.tags = ['Documents']
      #swagger.description = 'Add a document to public access'
      #swagger.requestBody = {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: 'object',
              properties: {
                filename: {
                  type: 'string',
                  description: 'Original filename'
                },
                preferredName: {
                  type: 'string',
                  description: 'Preferred public filename (optional)'
                }
              },
              required: ['filename']
            }
          }
        }
      }
      */
      try {
        const { filename, preferredName } = reqBody(request);
        const { addPublicDocument } = require("../../../utils/publicDocuments");

        const hotdirPath = path.resolve(
          __dirname,
          process.env.NODE_ENV === "development"
            ? "../../../collector/hotdir"
            : "../../../../collector/hotdir"
        );
        const sourcePath = path.join(hotdirPath, filename);

        if (!fs.existsSync(sourcePath)) {
          return response.status(404).json({
            success: false,
            error: "Source document not found in hotdir",
          });
        }

        const result = addPublicDocument(sourcePath, filename, preferredName);

        response.status(200).json(result);
      } catch (e) {
        console.error("Add public document error:", e);
        response.status(500).json({
          success: false,
          error: "Failed to add public document",
        });
      }
    }
  );

  app.delete(
    "/v1/public-documents/:documentId",
    [validApiKey],
    async (request, response) => {
      /*
      #swagger.tags = ['Documents']
      #swagger.description = 'Remove a document from public access'
      #swagger.parameters['documentId'] = {
        in: 'path',
        description: 'Document ID',
        required: true,
        type: 'string'
      }
      */
      try {
        const { documentId } = request.params;
        const {
          removePublicDocument,
        } = require("../../../utils/publicDocuments");

        const result = removePublicDocument(documentId);

        response.status(200).json(result);
      } catch (e) {
        console.error("Remove public document error:", e);
        response.status(500).json({
          success: false,
          error: "Failed to remove public document",
        });
      }
    }
  );
}

// Helper function to find document by ID or title
async function findDocumentByIdOrTitle(docId) {
  try {
    // Get all document files from storage
    const documentsDir = path.join(documentsPath, "custom-documents");
    if (!fs.existsSync(documentsDir)) {
      return null;
    }

    const files = fs.readdirSync(documentsDir);

    // Normalize function to handle spaces, hyphens, and case while preserving Unicode
    const normalize = (str) => {
      return str
        .toLowerCase()
        .replace(/\.pdf$/i, "") // Remove .pdf extension
        .replace(/[\s\-_\.]/g, "") // Remove only spaces, hyphens, underscores, dots
        .trim();
    };

    // Additional exact match function that preserves all characters
    const exactMatch = (str) => {
      return str
        .replace(/\.pdf$/i, "") // Remove .pdf extension only
        .trim();
    };

    const normalizedDocId = normalize(docId);
    
    // Enable debug logging for Unicode document searches
    const hasUnicode = /[^\u0000-\u007F]/.test(docId);
    if (hasUnicode) {
      console.log(`[Unicode Document Search] Looking for: "${docId}"`);
      console.log(`[Unicode Document Search] Normalized: "${normalizedDocId}"`);
      console.log(`[Unicode Document Search] Exact: "${exactMatch(docId)}"`);
    }

    // Search through JSON files for matching title or ID
    for (const file of files) {
      if (file.endsWith(".json")) {
        try {
          const filePath = path.join(documentsDir, file);
          const documentData = JSON.parse(fs.readFileSync(filePath, "utf8"));

          // Direct ID match
          if (documentData.id === docId) {
            return documentData;
          }

          // Normalize title and filename for comparison
          const normalizedTitle = normalize(documentData.title || "");
          const normalizedFilename = normalize(file);
          const exactTitle = exactMatch(documentData.title || "");
          const exactDocId = exactMatch(docId);

          // Check various matching strategies
          if (
            // Exact title match (full string)
            documentData.title === docId ||
            // Exact match without extension
            exactTitle === exactDocId ||
            // Normalized matches (ASCII-safe)
            normalizedTitle === normalizedDocId ||
            normalizedFilename.includes(normalizedDocId) ||
            normalizedDocId.includes(normalizedTitle) ||
            // Partial matches for complex titles
            (normalizedTitle &&
              normalizedDocId &&
              (normalizedTitle.includes(normalizedDocId) ||
                normalizedDocId.includes(normalizedTitle))) ||
            // Unicode-safe exact matches
            (exactTitle &&
              exactDocId &&
              (exactTitle.includes(exactDocId) ||
                exactDocId.includes(exactTitle)))
          ) {
            console.log(
              `Document found: ${documentData.title} matches query: ${docId}`
            );
            return documentData;
          }
        } catch (err) {
          console.error(`Error reading document file ${file}:`, err);
          continue;
        }
      }
    }

    console.log(`No document found for query: ${docId}`);
    console.log(
      `Available documents:`,
      files
        .filter((f) => f.endsWith(".json"))
        .map((f) => {
          try {
            const data = JSON.parse(
              fs.readFileSync(path.join(documentsDir, f), "utf8")
            );
            return data.title;
          } catch (e) {
            return f;
          }
        })
    );

    return null;
  } catch (e) {
    console.error("Error searching for document:", e);
    return null;
  }
}

module.exports = { apiDocumentEndpoints };
