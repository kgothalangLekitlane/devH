const multer = require("multer")

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, or WEBP images are allowed"))
    }
    cb(null, true)
  },
})

module.exports = upload
