const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const { listProjects, getProject, createProject, updateProject, deleteProject } = require("../controllers/projectController");

router.get("/", listProjects);
router.get("/:id", getProject);
router.post("/", authenticate, createProject);
router.put("/:id", authenticate, updateProject);
router.delete("/:id", authenticate, deleteProject);

module.exports = router;
