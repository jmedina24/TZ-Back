// utils/image.js
function getFileName(file) {
  // con express-fileupload la ruta viene en tempFilePath
  const filePath = file.path || file.tempFilePath;

  if (!filePath) {
    console.error("getFileName: filePath viene vacío", file);
    return "";
  }

  // Soportar tanto Windows (\) como Linux (/)
  const fileSplit = filePath.split(/[/\\]/);

  // Tomamos los últimos dos segmentos: carpeta/archivo.ext
  const len = fileSplit.length;
  if (len < 2) {
    return fileSplit[len - 1] || "";
  }

  return `${fileSplit[len - 2]}/${fileSplit[len - 1]}`;
}

module.exports = {
  getFileName,
};
