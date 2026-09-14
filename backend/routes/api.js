const express = require('express');
const router = express.Router();

const { getUsers, getUserById, searchCandidates } = require('../controllers/userController');
const { getMessages, getMessagesWithUser, postMessage } = require('../controllers/messageController');
const { getRecruiters, createRecruiter, postJob, getJobs } = require('../controllers/recruiterController');
const { getResources, addResource } = require('../controllers/resourceController');
const { getPosts, createPost, getPost, likePost, repostPost, addComment, deletePost, deleteComment } = require('../controllers/postController');
const { registerUser, loginUser } = require('../controllers/authController');
const authenticate = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Auth routes
router.post('/auth/register', (req, res, next) => {
  upload.single('profile')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Invalid file upload' });
    }
    next();
  });
}, registerUser);
router.post('/auth/login', loginUser);

// Users
router.get('/users', authenticate, getUsers);
router.get('/users/search', authenticate, searchCandidates);
router.get('/users/:id', getUserById);

// Posts
router.get('/posts', getPosts);
router.get('/posts/:id', getPost);
router.post('/posts', authenticate, createPost);
router.post('/posts/:id/like', authenticate, likePost);
router.post('/posts/:id/repost', authenticate, repostPost);
router.post('/posts/:id/comments', authenticate, addComment);
router.delete('/posts/:id', authenticate, deletePost);
router.delete('/posts/:id/comments/:commentId', authenticate, deleteComment);

// Messages
router.get('/messages', authenticate, getMessages);
router.get('/messages/:userId', authenticate, getMessagesWithUser);
router.post('/messages', authenticate, postMessage);

// Recruiters & Jobs
router.get('/recruiters', getRecruiters);
router.post('/recruiters', authenticate, createRecruiter);
router.get('/recruiters/jobs', getJobs);
router.post('/recruiters/jobs', authenticate, postJob);

// Resources
router.get('/resources', getResources);
router.post('/resources', authenticate, addResource);

module.exports = router;
