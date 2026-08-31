const mongoose = require("mongoose")

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now }
}, { _id: true })

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true, trim: true, maxlength: 20000 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tags: [{ type: String, trim: true, maxlength: 50 }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
})

postSchema.index({ createdAt: -1 })
postSchema.index({ author: 1, createdAt: -1 })
postSchema.index({ tags: 1, createdAt: -1 })

postSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

const Post = mongoose.model("Post", postSchema)
module.exports = Post
