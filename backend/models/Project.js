const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    techStack: { type: [String], default: [] },
    githubUrl: { type: String, trim: true, maxlength: 500 },
    liveUrl: { type: String, trim: true, maxlength: 500 },
    imageUrl: { type: String, trim: true, maxlength: 500 },
    category: { type: String, trim: true, maxlength: 80 },
    status: { type: String, enum: ["planning", "in-progress", "completed", "maintained"], default: "completed" },
    featured: { type: Boolean, default: false, index: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

projectSchema.index({ owner: 1, featured: -1, updatedAt: -1 });

module.exports = mongoose.model("Project", projectSchema);
