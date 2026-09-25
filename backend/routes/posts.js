const express = require("express")
const router = express.Router()
const { getPosts, createPost, getPost, likePost, repostPost, addComment, deletePost, deleteComment } = require("../controllers/postController")
const authenticate = require("../middleware/authMiddleware")
const postMediaUpload = require("../middleware/postMediaUpload")
const { validatePostMediaContent } = postMediaUpload

router.get("/", getPosts)
router.post("/", authenticate, (req, res, next) => {
  postMediaUpload.array("media", 6)(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || "Invalid media upload" })
    next()
  })
}, validatePostMediaContent, createPost)
router.get("/:id", getPost)
router.post("/:id/like", authenticate, likePost)
router.post("/:id/repost", authenticate, repostPost)
router.post("/:id/comments", authenticate, addComment)
router.delete("/:id", authenticate, deletePost)
router.delete("/:id/comments/:commentId", authenticate, deleteComment)

module.exports = router