const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4 } = require("uuid");
const { normalizePath } = require(".");

/**
 * Copy uploaded file to frontend/documents directory for URL access
 * @param {string} originalPath - Path of the original uploaded file
 * @param {string} filename - Original filename
 */
function copyToFrontendDocuments(originalPath, filename) {
  try {
    const frontendDocumentsPath = path.resolve(
      __dirname,
      "../../../frontend/public/documents"
    );

    // Ensure the frontend documents directory exists
    if (!fs.existsSync(frontendDocumentsPath)) {
      fs.mkdirSync(frontendDocumentsPath, { recursive: true });
    }

    const destinationPath = path.join(frontendDocumentsPath, filename);

    // Copy the file if the original exists
    if (fs.existsSync(originalPath)) {
      fs.copyFileSync(originalPath, destinationPath);
      console.log(`File copied to frontend/public/documents: ${filename}`);
      return {
        success: true,
        frontendPath: destinationPath,
        publicUrl: `/documents/${filename}`,
      };
    }

    return { success: false, error: "Source file not found" };
  } catch (error) {
    console.error("Error copying file to frontend/public/documents:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle File uploads for auto-uploading.
 * Mostly used for internal GUI/API uploads.
 */
const fileUploadStorage = multer.diskStorage({
  destination: function (_, __, cb) {
    const uploadOutput =
      process.env.NODE_ENV === "development"
        ? path
            .resolve(__dirname, `../../../collector/hotdir`)
            .replace(/\\/g, "/")
        : path
            .resolve(process.env.STORAGE_DIR, `../../collector/hotdir`)
            .replace(/\\/g, "/");
    cb(null, uploadOutput);
  },
  filename: function (_, file, cb) {
    file.originalname = normalizePath(
      Buffer.from(file.originalname, "latin1").toString("utf8")
    );
    cb(null, file.originalname);
  },
});

/**
 * Handle API file upload as documents - this does not manipulate the filename
 * at all for encoding/charset reasons.
 */
const fileAPIUploadStorage = multer.diskStorage({
  destination: function (_, __, cb) {
    const uploadOutput =
      process.env.NODE_ENV === "development"
        ? path
            .resolve(__dirname, `../../../collector/hotdir`)
            .replace(/\\/g, "/")
        : path
            .resolve(process.env.STORAGE_DIR, `../../collector/hotdir`)
            .replace(/\\/g, "/");
    cb(null, uploadOutput);
  },
  filename: function (_, file, cb) {
    file.originalname = normalizePath(
      Buffer.from(file.originalname, "latin1").toString("utf8")
    );
    cb(null, file.originalname);
  },
});

// Asset storage for logos
const assetUploadStorage = multer.diskStorage({
  destination: function (_, __, cb) {
    const uploadOutput =
      process.env.NODE_ENV === "development"
        ? path.resolve(__dirname, `../../storage/assets`)
        : path.resolve(process.env.STORAGE_DIR, "assets");
    fs.mkdirSync(uploadOutput, { recursive: true });
    return cb(null, uploadOutput);
  },
  filename: function (_, file, cb) {
    file.originalname = normalizePath(
      Buffer.from(file.originalname, "latin1").toString("utf8")
    );
    cb(null, file.originalname);
  },
});

/**
 * Handle PFP file upload as logos
 */
const pfpUploadStorage = multer.diskStorage({
  destination: function (_, __, cb) {
    const uploadOutput =
      process.env.NODE_ENV === "development"
        ? path.resolve(__dirname, `../../storage/assets/pfp`)
        : path.resolve(process.env.STORAGE_DIR, "assets/pfp");
    fs.mkdirSync(uploadOutput, { recursive: true });
    return cb(null, uploadOutput);
  },
  filename: function (req, file, cb) {
    const randomFileName = `${v4()}${path.extname(
      normalizePath(file.originalname)
    )}`;
    req.randomFileName = randomFileName;
    cb(null, randomFileName);
  },
});

/**
 * Handle Generic file upload as documents from the GUI
 * @param {Request} request
 * @param {Response} response
 * @param {NextFunction} next
 */
function handleFileUpload(request, response, next) {
  const upload = multer({
    storage: fileUploadStorage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  }).single("file");
  upload(request, response, function (err) {
    if (err) {
      let errorMessage = `Invalid file upload. ${err.message}`;
      if (err.code === "LIMIT_FILE_SIZE") {
        errorMessage = "File too large. Maximum file size is 100MB.";
      }
      response
        .status(500)
        .json({
          success: false,
          error: errorMessage,
        })
        .end();
      return;
    }

    // Copy uploaded file to frontend/documents for URL access
    if (request.file) {
      const copyResult = copyToFrontendDocuments(
        request.file.path,
        request.file.originalname
      );
      request.frontendCopyResult = copyResult;
    }

    next();
  });
}

/**
 * Handle API file upload as documents - this does not manipulate the filename
 * at all for encoding/charset reasons.
 * @param {Request} request
 * @param {Response} response
 * @param {NextFunction} next
 */
function handleAPIFileUpload(request, response, next) {
  const upload = multer({
    storage: fileAPIUploadStorage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  }).single("file");
  upload(request, response, function (err) {
    if (err) {
      let errorMessage = `Invalid file upload. ${err.message}`;
      if (err.code === "LIMIT_FILE_SIZE") {
        errorMessage = "File too large. Maximum file size is 100MB.";
      }
      response
        .status(500)
        .json({
          success: false,
          error: errorMessage,
        })
        .end();
      return;
    }

    // Copy uploaded file to frontend/documents for URL access
    if (request.file) {
      const copyResult = copyToFrontendDocuments(
        request.file.path,
        request.file.originalname
      );
      request.frontendCopyResult = copyResult;
    }

    next();
  });
}

/**
 * Handle logo asset uploads
 */
function handleAssetUpload(request, response, next) {
  const upload = multer({
    storage: assetUploadStorage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  }).single("logo");
  upload(request, response, function (err) {
    if (err) {
      let errorMessage = `Invalid file upload. ${err.message}`;
      if (err.code === "LIMIT_FILE_SIZE") {
        errorMessage = "File too large. Maximum file size is 100MB.";
      }
      response
        .status(500)
        .json({
          success: false,
          error: errorMessage,
        })
        .end();
      return;
    }
    next();
  });
}

/**
 * Handle PFP file upload as logos
 */
function handlePfpUpload(request, response, next) {
  const upload = multer({
    storage: pfpUploadStorage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  }).single("file");
  upload(request, response, function (err) {
    if (err) {
      let errorMessage = `Invalid file upload. ${err.message}`;
      if (err.code === "LIMIT_FILE_SIZE") {
        errorMessage = "File too large. Maximum file size is 100MB.";
      }
      response
        .status(500)
        .json({
          success: false,
          error: errorMessage,
        })
        .end();
      return;
    }
    next();
  });
}

module.exports = {
  handleFileUpload,
  handleAPIFileUpload,
  handleAssetUpload,
  handlePfpUpload,
  copyToFrontendDocuments,
};
