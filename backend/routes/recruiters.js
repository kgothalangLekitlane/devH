const express = require("express");
const router = express.Router();
const { getRecruiters, createRecruiter, postJob, getJobs } = require("../controllers/recruiterController");
const authenticate = require("../middleware/authMiddleware");

router.get("/", getRecruiters);
router.post("/register", authenticate, createRecruiter);
router.post("/jobs", authenticate, postJob);
router.get("/jobs", getJobs);

module.exports = router;