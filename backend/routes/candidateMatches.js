const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getMatches } = require('../services/candidateMatchController');

router.get('/:jobId', auth, getMatches);

module.exports = router;
