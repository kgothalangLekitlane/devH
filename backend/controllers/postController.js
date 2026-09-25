const Post = require("../models/Post")
const Notification = require("../models/Notification")
const mongoose = require("mongoose")
const { GridFSBucket, ObjectId } = require("mongodb")

const createNotification = async ({ recipient, sender, type, text, link }) => {
  if (!recipient || String(recipient) === String(sender)) return
  try { await Notification.create({ recipient, sender, type, text, link }) }
  catch (error) { console.error("Create notification error:", error) }
}

const postPopulate = query => query
  .populate("author", "firstName lastName username profileImage")
  .populate({ path: "repostOf", populate: { path: "author", select: "firstName lastName username profileImage" } })
  .populate("comments.user", "firstName lastName username profileImage")

const parseTags = value => {
  if (Array.isArray(value)) return value.slice(0, 20).map(tag => String(tag).trim()).filter(Boolean)
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.slice(0, 20).map(tag => String(tag).trim()).filter(Boolean)
    } catch {}
    return value.split(",").slice(0, 20).map(tag => tag.trim()).filter(Boolean)
  }
  return []
}

const storePostMedia = async (files, userId) => {
  if (!files?.length) return []
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) throw new Error("Database is not ready for media upload")
  const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "postMedia" })
  const stored = []
  try {
    for (const file of files) {
      const type = file.mimetype.startsWith("video/") ? "video" : "image"
      const filename = String(userId) + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "-" + (file.originalname || "media")
      const uploadStream = bucket.openUploadStream(filename, {
        contentType: file.mimetype,
        metadata: { userId: String(userId), type },
      })
      await new Promise((resolve, reject) => {
        uploadStream.on("finish", resolve).on("error", reject)
        uploadStream.end(file.buffer)
      })
      stored.push({
        fileId: uploadStream.id,
        type,
        mimeType: file.mimetype,
        url: "/api/post-media/" + uploadStream.id.toString(),
        filename: file.originalname || "media",
      })
    }
    return stored
  } catch (error) {
    await Promise.allSettled(stored.map(media => bucket.delete(new ObjectId(media.fileId))))
    throw error
  }
}

const getPosts = async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50)
    const posts = await postPopulate(Post.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit))
    res.json({ posts, page, limit })
  } catch (error) { console.error("Fetch posts error:", error); res.status(500).json({ error: "Failed to fetch posts" }) }
}

const createPost = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim()
    const content = String(req.body.content || "").trim()
    const tags = parseTags(req.body.tags)
    const files = Array.isArray(req.files) ? req.files : []
    const totalBytes = files.reduce((sum, file) => sum + Number(file.size || file.buffer?.length || 0), 0)
    if (!title && !content && !files.length) return res.status(400).json({ error: "Add a title, caption, or media before publishing" })
    if (title.length > 200 || content.length > 20000) return res.status(400).json({ error: "Post is too long" })
    if (files.length > 6) return res.status(400).json({ error: "You can attach up to 6 media files" })
    if (totalBytes > 100 * 1024 * 1024) return res.status(400).json({ error: "Total media size cannot exceed 100 MB" })
    const media = await storePostMedia(files, req.user.id)
    const post = await Post.create({ title: title || "Media post", content, media, author: req.user.id, tags })
    await post.populate("author", "firstName lastName username profileImage")
    res.status(201).json({ message: "Post created", post })
  } catch (error) { console.error("Create post error:", error); res.status(500).json({ error: error.message || "Failed to create post" }) }
}

const getPost = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid post ID" })
    const post = await postPopulate(Post.findById(req.params.id))
    if (!post) return res.status(404).json({ error: "Post not found" })
    res.json(post)
  } catch (error) { res.status(500).json({ error: "Failed to fetch post" }) }
}

const likePost = async (req, res) => {
  try {
    const postId = req.params.id; const userId = req.user.id
    if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ error: "Invalid post ID" })
    const post = await Post.findById(postId).select("likes author")
    if (!post) return res.status(404).json({ error: "Post not found" })
    const hasLiked = post.likes.some(id => id.toString() === String(userId))
    const updated = await Post.findByIdAndUpdate(postId, hasLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } }, { new: true }).select("likes")
    if (!hasLiked) await createNotification({ recipient: post.author, sender: userId, type: "like", text: "liked your post", link: "/dashboard?post=" + postId })
    res.json({ message: hasLiked ? "Post unliked" : "Post liked", liked: !hasLiked, likes: updated.likes })
  } catch (error) { console.error("Like post error:", error); res.status(500).json({ error: "Failed to like post" }) }
}

const repostPost = async (req, res) => {
  try {
    const postId = req.params.id; const userId = req.user.id
    if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ error: "Invalid post ID" })
    const original = await Post.findById(postId).select("title content media tags author repostOf")
    if (!original) return res.status(404).json({ error: "Post not found" })
    const sourceId = original.repostOf || original._id
    const source = original.repostOf ? await Post.findById(sourceId).select("title content media tags author") : original
    if (!source) return res.status(404).json({ error: "Original post not found" })
    if (String(source.author) === String(userId)) return res.status(400).json({ error: "You cannot repost your own post" })
    const existing = await Post.findOne({ author: userId, repostOf: source._id }).select("_id")
    if (existing) {
      await Post.findByIdAndDelete(existing._id)
      const updated = await Post.findByIdAndUpdate(source._id, { $pull: { reposts: userId } }, { new: true }).select("reposts")
      return res.json({ message: "Repost removed", reposted: false, sourceId: String(source._id), reposts: updated?.reposts || [] })
    }
    await Post.create({ title: source.title, content: source.content, media: source.media, tags: source.tags, author: userId, repostOf: source._id })
    const updated = await Post.findByIdAndUpdate(source._id, { $addToSet: { reposts: userId } }, { new: true }).select("reposts")
    await createNotification({ recipient: source.author, sender: userId, type: "repost", text: "reposted your post", link: "/dashboard?post=" + source._id })
    res.status(201).json({ message: "Post reposted", reposted: true, sourceId: String(source._id), reposts: updated?.reposts || [] })
  } catch (error) {
    console.error("Repost post error:", error)
    if (error?.code === 11000) return res.status(409).json({ error: "You have already reposted this post" })
    res.status(500).json({ error: "Failed to repost post" })
  }
}

const addComment = async (req, res) => {
  try {
    const postId = req.params.id; const text = String(req.body.text || "").trim()
    if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ error: "Invalid post ID" })
    if (!text || text.length > 2000) return res.status(400).json({ error: "Comment must be between 1 and 2000 characters" })
    const post = await Post.findById(postId)
    if (!post) return res.status(404).json({ error: "Post not found" })
    post.comments.push({ user: req.user.id, text }); await post.save()
    await createNotification({ recipient: post.author, sender: req.user.id, type: "comment", text: "commented on your post", link: "/dashboard?post=" + postId })
    await post.populate("comments.user", "firstName lastName username profileImage")
    res.status(201).json({ message: "Comment added", comment: post.comments[post.comments.length - 1] })
  } catch (error) { console.error("Add comment error:", error); res.status(500).json({ error: "Failed to add comment" }) }
}

const deletePost = async (req, res) => {
  try {
    const postId = req.params.id
    if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ error: "Invalid post ID" })
    const post = await Post.findById(postId).select("author repostOf")
    if (!post) return res.status(404).json({ error: "Post not found" })
    if (String(post.author) !== String(req.user.id)) return res.status(403).json({ error: "You can only delete your own posts" })
    if (post.repostOf) await Post.findByIdAndUpdate(post.repostOf, { $pull: { reposts: req.user.id } })
    await Post.findByIdAndDelete(postId); res.json({ message: "Post deleted", postId })
  } catch (error) { console.error("Delete post error:", error); res.status(500).json({ error: "Failed to delete post" }) }
}

const deleteComment = async (req, res) => {
  try {
    const { id: postId, commentId } = req.params
    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) return res.status(400).json({ error: "Invalid post or comment ID" })
    const post = await Post.findById(postId).select("comments")
    if (!post) return res.status(404).json({ error: "Post not found" })
    const comment = post.comments.id(commentId)
    if (!comment) return res.status(404).json({ error: "Comment not found" })
    if (String(comment.user) !== String(req.user.id)) return res.status(403).json({ error: "You can only delete your own comments" })
    comment.deleteOne(); await post.save(); res.json({ message: "Comment deleted", commentId })
  } catch (error) { console.error("Delete comment error:", error); res.status(500).json({ error: "Failed to delete comment" }) }
}

module.exports = { getPosts, createPost, getPost, likePost, repostPost, addComment, deletePost, deleteComment }