const express = require("express")
const mongoose = require("mongoose")
const { GridFSBucket, ObjectId } = require("mongodb")

const router = express.Router()

router.get("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid media ID" })
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) return res.status(503).json({ error: "Database is unavailable" })

    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "postMedia" })
    const fileId = new ObjectId(req.params.id)
    const files = await bucket.find({ _id: fileId }).toArray()
    if (!files.length) return res.status(404).json({ error: "Media not found" })

    const file = files[0]
    res.set("Content-Type", file.contentType || "application/octet-stream")
    res.set("Content-Length", String(file.length))
    res.set("Accept-Ranges", "bytes")
    res.set("Cache-Control", "public, max-age=31536000, immutable")

    bucket.openDownloadStream(fileId)
      .on("error", () => { if (!res.headersSent) res.status(404).end() })
      .pipe(res)
  } catch (error) {
    console.error("Get post media error:", error)
    if (!res.headersSent) res.status(500).json({ error: "Failed to load media" })
  }
})

module.exports = router
