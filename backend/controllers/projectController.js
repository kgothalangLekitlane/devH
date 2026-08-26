const mongoose = require("mongoose");
const Project = require("../models/Project");

const cleanUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return undefined;
  if (!/^https?:\/\//i.test(url)) throw new Error("Project links must start with http:// or https://");
  return url;
};

const normalizeStack = (value) => Array.isArray(value)
  ? value.map((item) => String(item).trim()).filter(Boolean).slice(0, 20)
  : String(value || "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 20);

const serialize = (project) => ({
  id: project._id,
  title: project.title,
  description: project.description,
  techStack: project.techStack,
  githubUrl: project.githubUrl,
  liveUrl: project.liveUrl,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
  owner: project.owner ? {
    id: project.owner._id,
    firstName: project.owner.firstName,
    lastName: project.owner.lastName,
    username: project.owner.username,
    profileImage: project.owner.profileImage,
  } : undefined,
});

const listProjects = async (req, res) => {
  try {
    const projects = await Project.find({}).sort({ createdAt: -1 }).populate("owner", "firstName lastName username profileImage");
    res.json({ projects: projects.map(serialize) });
  } catch (error) {
    console.error("List projects error:", error);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
};

const getProject = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid project id" });
    const project = await Project.findById(req.params.id).populate("owner", "firstName lastName username profileImage");
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ project: serialize(project) });
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({ message: "Failed to fetch project" });
  }
};

const createProject = async (req, res) => {
  try {
    const { title, description, techStack, githubUrl, liveUrl } = req.body;
    if (!String(title || "").trim() || !String(description || "").trim()) {
      return res.status(400).json({ message: "Title and description are required" });
    }
    const project = await Project.create({
      owner: req.user.id,
      title: String(title).trim(),
      description: String(description).trim(),
      techStack: normalizeStack(techStack),
      githubUrl: cleanUrl(githubUrl),
      liveUrl: cleanUrl(liveUrl),
    });
    await project.populate("owner", "firstName lastName username profileImage");
    res.status(201).json({ project: serialize(project) });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(400).json({ message: error.message || "Failed to create project" });
  }
};

const updateProject = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid project id" });
    const project = await Project.findOne({ _id: req.params.id, owner: req.user.id });
    if (!project) return res.status(404).json({ message: "Project not found or not owned by you" });
    const { title, description, techStack, githubUrl, liveUrl } = req.body;
    if (title !== undefined) project.title = String(title).trim();
    if (description !== undefined) project.description = String(description).trim();
    if (techStack !== undefined) project.techStack = normalizeStack(techStack);
    if (githubUrl !== undefined) project.githubUrl = cleanUrl(githubUrl);
    if (liveUrl !== undefined) project.liveUrl = cleanUrl(liveUrl);
    await project.save();
    await project.populate("owner", "firstName lastName username profileImage");
    res.json({ project: serialize(project) });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(400).json({ message: error.message || "Failed to update project" });
  }
};

const deleteProject = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid project id" });
    const deleted = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Project not found or not owned by you" });
    res.json({ message: "Project deleted" });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ message: "Failed to delete project" });
  }
};

module.exports = { listProjects, getProject, createProject, updateProject, deleteProject };
