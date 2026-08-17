const mongoose = require("mongoose")

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true, trim: true, maxlength: 20000 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tags: [{ type: String, trim: true, maxlength: 50 }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now, index: true }
})

postSchema.index({ createdAt: -1 })

const Post = mongoose.model("Post", postSchema)
module.exports = Post
