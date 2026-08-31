const Post = require("../models/Post")
const mongoose = require("mongoose")

const getPosts = async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50)
    const posts = await Post.find()
      .populate("author", "firstName lastName username")
      .populate("comments.user", "firstName lastName username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
    res.json({ posts, page, limit })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" })
  }
}

const createPost = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim()
    const content = String(req.body.content || "").trim()
    const tags = Array.isArray(req.body.tags) ? req.body.tags.slice(0, 20).map(tag => String(tag).trim()).filter(Boolean) : []
    if (!title || !content) return res.status(400).json({ error: "Title and content are required" })
    if (title.length > 200 || content.length > 20000) return res.status(400).json({ error: "Post is too long" })

    const post = await Post.create({ title, content, author: req.user.id, tags })
    await post.populate("author", "firstName lastName username")
    res.status(201).json({ message: "Post created", post })
  } catch (error) {
    console.error("Create post error:", error)
    res.status(500).json({ error: "Failed to create post" })
  }
}

const getPost = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid post ID" })
    const post = await Post.findById(req.params.id)
      .populate("author", "firstName lastName username")
      .populate("comments.user", "firstName lastName username")
    if (!post) return res.status(404).json({ error: "Post not found" })
    res.json(post)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch post" })
  }
}

const likePost = async (req, res) => {
  try {
    const postId = req.params.id
    const userId = req.user.id
    if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ error: "Invalid post ID" })

    const post = await Post.findById(postId)
    if (!post) return res.status(404).json({ error: "Post not found" })
    const hasLiked = post.likes.some(id => id.toString() === String(userId))

    const updated = await Post.findByIdAndUpdate(
      postId,
      hasLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } },
      { new: true }
    ).select("likes")

    res.json({ message: hasLiked ? "Post unliked" : "Post liked", likes: updated.likes.length })
  } catch (error) {
    res.status(500).json({ error: "Failed to like post" })
  }
}

const addComment = async (req, res) => {
  try {
    const postId = req.params.id
    const text = String(req.body.text || "").trim()
    if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ error: "Invalid post ID" })
    if (!text || text.length > 2000) return res.status(400).json({ error: "Comment must be between 1 and 2000 characters" })

    const post = await Post.findById(postId)
    if (!post) return res.status(404).json({ error: "Post not found" })
    post.comments.push({ user: req.user.id, text })
    await post.save()
    await post.populate("comments.user", "firstName lastName username")
    res.status(201).json({ message: "Comment added", comment: post.comments[post.comments.length - 1] })
  } catch (error) {
    res.status(500).json({ error: "Failed to add comment" })
  }
}

const deletePost = async (req, res) => {
  try {
    const postId = req.params.id
    if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ error: "Invalid post ID" })

    const post = await Post.findById(postId).select("author")
    if (!post) return res.status(404).json({ error: "Post not found" })
    if (String(post.author) !== String(req.user.id)) return res.status(403).json({ error: "You can only delete your own posts" })

    await Post.findByIdAndDelete(postId)
    res.json({ message: "Post deleted", postId })
  } catch (error) {
    console.error("Delete post error:", error)
    res.status(500).json({ error: "Failed to delete post" })
  }
}

const deleteComment = async (req, res) => {
  try {
    const { id: postId, commentId } = req.params
    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: "Invalid post or comment ID" })
    }

    const post = await Post.findById(postId).select("comments")
    if (!post) return res.status(404).json({ error: "Post not found" })
    const comment = post.comments.id(commentId)
    if (!comment) return res.status(404).json({ error: "Comment not found" })
    if (String(comment.user) !== String(req.user.id)) return res.status(403).json({ error: "You can only delete your own comments" })

    comment.deleteOne()
    await post.save()
    res.json({ message: "Comment deleted", commentId })
  } catch (error) {
    console.error("Delete comment error:", error)
    res.status(500).json({ error: "Failed to delete comment" })
  }
}

module.exports = { getPosts, createPost, getPost, likePost, addComment, deletePost, deleteComment }
