const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const uploadFile = async (req, uploadDir) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      throw new Error("No files were uploaded.");
    }

    const uploadedFiles = [];

    const decodeFilename = (encodedName) => {
      return Buffer.from(encodedName, "binary").toString("utf-8");
    };

    try {
      const baseUploadDir = path.join("files", uploadDir);
      await fs.mkdir("files", { recursive: true });
      await fs.mkdir(baseUploadDir, { recursive: true });

      for (const key in req.files) {
        const fileOrFiles = req.files[key];

        const filesArray = Array.isArray(fileOrFiles)
          ? fileOrFiles
          : [fileOrFiles];

        for (const file of filesArray) {
          if (!file || !file.name || !file.data) {
            throw new Error("Invalid file object");
          }

          const decodedName = decodeFilename(file.name);
          const fileExtension = path.extname(decodedName);
          const baseName = path.basename(decodedName, fileExtension);

          const uniqueName = `${baseName}-${uuidv4()}${fileExtension}`;
          const filePath = path.join(baseUploadDir, uniqueName);

          await fs.writeFile(filePath, file.data);
          uploadedFiles.push(filePath);
        }
      }
    } catch (error) {
      throw error;
    }

    return uploadedFiles.length > 1 ? uploadedFiles : uploadedFiles[0];
  } catch (error) {
    return error;
  }
};

module.exports = { uploadFile };
