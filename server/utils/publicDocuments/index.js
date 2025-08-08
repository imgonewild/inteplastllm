const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Path to public documents directory
const publicDocumentsPath = path.resolve(__dirname, "../../public/document");

// Path to document mappings file
const mappingsPath = path.resolve(
  __dirname,
  "../../storage/public-document-mappings.json"
);

/**
 * Load document mappings from storage
 * @returns {Object} Document mappings object
 */
function loadDocumentMappings() {
  try {
    if (fs.existsSync(mappingsPath)) {
      const data = fs.readFileSync(mappingsPath, "utf8");
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error("Error loading document mappings:", error);
    return {};
  }
}

/**
 * Save document mappings to storage
 * @param {Object} mappings - Document mappings object
 */
function saveDocumentMappings(mappings) {
  try {
    fs.writeFileSync(mappingsPath, JSON.stringify(mappings, null, 2));
  } catch (error) {
    console.error("Error saving document mappings:", error);
  }
}

/**
 * Generate a safe filename for public access
 * @param {string} originalName - Original filename
 * @param {string} preferredName - Preferred public name (optional)
 * @returns {string} Safe filename
 */
function generateSafeFilename(originalName, preferredName = null) {
  const extension = path.extname(originalName);
  const baseName = preferredName || path.basename(originalName, extension);

  // Clean the filename - remove special characters except hyphens and underscores
  const cleanName = baseName
    .replace(/[^a-zA-Z0-9\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `${cleanName}${extension}`;
}

/**
 * Add a document to public access
 * @param {string} sourcePath - Path to source document in hotdir
 * @param {string} originalFilename - Original filename
 * @param {string} preferredPublicName - Preferred public filename (optional)
 * @returns {Object} Result with success status and public URL
 */
function addPublicDocument(
  sourcePath,
  originalFilename,
  preferredPublicName = null
) {
  try {
    // Ensure public documents directory exists
    if (!fs.existsSync(publicDocumentsPath)) {
      fs.mkdirSync(publicDocumentsPath, { recursive: true });
    }

    // Generate safe filename for public access
    let publicFilename = generateSafeFilename(
      originalFilename,
      preferredPublicName
    );
    let publicPath = path.join(publicDocumentsPath, publicFilename);

    // Handle filename conflicts by appending number
    let counter = 1;
    const baseFilename = publicFilename;
    const extension = path.extname(publicFilename);
    const nameWithoutExt = path.basename(publicFilename, extension);

    while (fs.existsSync(publicPath)) {
      publicFilename = `${nameWithoutExt}-${counter}${extension}`;
      publicPath = path.join(publicDocumentsPath, publicFilename);
      counter++;
    }

    // Copy file to public directory
    fs.copyFileSync(sourcePath, publicPath);

    // Load and update mappings
    const mappings = loadDocumentMappings();
    const documentId = uuidv4();

    mappings[documentId] = {
      originalFilename,
      publicFilename,
      publicPath: `/document/${publicFilename}`,
      sourcePath,
      uploadedAt: new Date().toISOString(),
      accessCount: 0,
    };

    saveDocumentMappings(mappings);

    console.log(
      `[PUBLIC_DOCUMENTS]: Added ${originalFilename} as ${publicFilename}`
    );

    return {
      success: true,
      documentId,
      publicUrl: `/document/${publicFilename}`,
      publicFilename,
    };
  } catch (error) {
    console.error("Error adding public document:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Remove a document from public access
 * @param {string} documentId - Document ID to remove
 * @returns {Object} Result with success status
 */
function removePublicDocument(documentId) {
  try {
    const mappings = loadDocumentMappings();

    if (!mappings[documentId]) {
      return {
        success: false,
        error: "Document not found",
      };
    }

    const document = mappings[documentId];
    const publicPath = path.join(publicDocumentsPath, document.publicFilename);

    // Remove file from public directory
    if (fs.existsSync(publicPath)) {
      fs.unlinkSync(publicPath);
    }

    // Remove from mappings
    delete mappings[documentId];
    saveDocumentMappings(mappings);

    console.log(`[PUBLIC_DOCUMENTS]: Removed ${document.publicFilename}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error removing public document:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get public document info by ID
 * @param {string} documentId - Document ID
 * @returns {Object|null} Document info or null if not found
 */
function getPublicDocument(documentId) {
  const mappings = loadDocumentMappings();
  return mappings[documentId] || null;
}

/**
 * List all public documents
 * @returns {Object} All public document mappings
 */
function listPublicDocuments() {
  return loadDocumentMappings();
}

/**
 * Increment access count for a document
 * @param {string} publicFilename - Public filename
 */
function incrementAccessCount(publicFilename) {
  try {
    const mappings = loadDocumentMappings();

    // Find document by public filename
    for (const [id, doc] of Object.entries(mappings)) {
      if (doc.publicFilename === publicFilename) {
        doc.accessCount = (doc.accessCount || 0) + 1;
        doc.lastAccessedAt = new Date().toISOString();
        saveDocumentMappings(mappings);
        break;
      }
    }
  } catch (error) {
    console.error("Error incrementing access count:", error);
  }
}

module.exports = {
  addPublicDocument,
  removePublicDocument,
  getPublicDocument,
  listPublicDocuments,
  incrementAccessCount,
  generateSafeFilename,
};
