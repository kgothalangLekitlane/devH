const Job = require('../models/Job');
const User = require('../models/User');
const { scoreCandidate } = require('./candidateMatch');

exports.getMatches = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.jobId, recruiter: req.user.id }).lean();
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const applicants = Array.isArray(job.applicants) ? job.applicants : [];
    const ids = applicants.map(a => a.user || a.candidate || a).filter(Boolean);
    const users = await User.find({ _id: { $in: ids } })
      .select('name username avatar bio skills location experienceLevel availability')
      .lean();
    const byId = new Map(users.map(u => [String(u._id), u]));

    const matches = ids.map(id => {
      const candidate = byId.get(String(id));
      if (!candidate) return null;
      const match = scoreCandidate(candidate, job);
      return { candidate, ...match };
    }).filter(Boolean).sort((a, b) => b.score - a.score);

    res.json({ job: { _id: job._id, title: job.title }, matches });
  } catch (error) {
    console.error('Candidate matching error:', error);
    res.status(500).json({ message: 'Unable to calculate candidate matches' });
  }
};
