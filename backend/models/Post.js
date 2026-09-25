const mongoose = require("mongoose")

const mediaSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, enum: ["image", "video"], required: true },
  mimeType: { type: String, required: true },
  url: { type: String, required: true },
  filename: { type: String, default: "" },
}, { _id: true })

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now }
}, { _id: true })

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, default: "", trim: true, maxlength: 20000 },
  media: { type: [mediaSchema], default: [] },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tags: [{ type: String, trim: true, maxlength: 50 }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [commentSchema],
  reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  repostOf: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
})

postSchema.index({ createdAt: -1 })
postSchema.index({ author: 1, createdAt: -1 })
postSchema.index({ tags: 1, createdAt: -1 })
postSchema.index({ author: 1, repostOf: 1 }, { unique: true, partialFilterExpression: { repostOf: { $type: "objectId" } } })

postSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

const Post = mongoose.model("Post", postSchema)
module.exports = Post