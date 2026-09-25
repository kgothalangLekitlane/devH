const multer = require("multer")

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 6,
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WEBP, MP4, or WEBM files are allowed"))
    }
    cb(null, true)
  },
})

const hasSignature = (buffer, mimetype) => {
  if (!Buffer.isBuffer(buffer)) return false
  if (mimetype === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  if (mimetype === "image/png") return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (mimetype === "image/webp") return buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP"
  if (mimetype === "video/mp4") return buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp"
  if (mimetype === "video/webm") return buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
  return false
}

const validatePostMediaContent = (req, res, next) => {
  const files = Array.isArray(req.files) ? req.files : []
  const invalid = files.find(file => !hasSignature(file.buffer, file.mimetype))
  if (!invalid) return next()
  return res.status(400).json({ error: "One or more uploaded media files are invalid or corrupted" })
}

module.exports = upload
module.exports.validatePostMediaContent = validatePostMediaContent
