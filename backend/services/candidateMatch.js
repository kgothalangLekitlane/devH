function normalize(values) {
  return [...new Set((Array.isArray(values) ? values : []).map(v => String(v).trim().toLowerCase()).filter(Boolean))];
}

function scoreCandidate(candidate, job) {
  const candidateSkills = normalize(candidate.skills);
  const requiredSkills = normalize(job.skills || job.requiredSkills);
  const matchedSkills = requiredSkills.filter(skill => candidateSkills.includes(skill));
  const missingSkills = requiredSkills.filter(skill => !candidateSkills.includes(skill));
  const skillScore = requiredSkills.length ? (matchedSkills.length / requiredSkills.length) * 65 : 65;

  const candidateLocation = String(candidate.location || '').toLowerCase();
  const jobLocation = String(job.location || '').toLowerCase();
  const remote = Boolean(job.remote || job.isRemote);
  const locationScore = remote || !jobLocation || candidateLocation.includes(jobLocation) ? 15 : 0;

  const experienceScore = candidate.experienceLevel && job.experienceLevel &&
    String(candidate.experienceLevel).toLowerCase() === String(job.experienceLevel).toLowerCase() ? 20 : 10;

  return {
    score: Math.round(Math.min(100, skillScore + locationScore + experienceScore)),
    matchedSkills,
    missingSkills,
    breakdown: { skills: Math.round(skillScore), location: locationScore, experience: experienceScore }
  };
}

module.exports = { scoreCandidate };
