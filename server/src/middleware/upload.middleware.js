const multer = require('multer');
const path = require('path');
const { generateUUID } = require('../utils/helpers');

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 314572800; // 300MB

const allowedMimeTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
const allowedExtensions = ['.mp4', '.mov', '.avi'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${generateUUID()}${ext}`;
    cb(null, uniqueName);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext) && !allowedMimeTypes.includes(file.mimetype)) {
    const error = new Error('视频格式不支持，仅支持 mp4/mov/avi');
    error.statusCode = 400;
    error.name = 'ValidationError';
    return cb(error, false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

module.exports = { upload, UPLOAD_DIR, MAX_FILE_SIZE };
