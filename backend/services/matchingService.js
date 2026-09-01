const normalise = (value) => String(value || '').trim().toLowerCase();

const unique = (values) => [...new Set(values.filter(Boolean))];

/**
 * Score a developer against a job using transparent, explainable signals.
 * This deliberately avoids opaque ML dependencies at this stage.
 */
export function scoreCandidateForJob(candidate, job) {
  const candidateSkills = unique((candidate?.skills || []).map(normalise));
  const requiredSkills = unique((job?.skills || []).map(normalise));
  const matchedSkills = requiredSkills.filter((skill) => candidateSkills.includes(skill));

  const skillScore = requiredSkills.length
    ? Math.round((matchedSkills.length / requiredSkills.length) * 70)
    : 0;

  const candidateLocation = normalise(candidate?.location);
  const jobLocation = normalise(job?.location);
  const locationMatch = Boolean(candidateLocation && jobLocation && candidateLocation === jobLocation);
  const remoteMatch = Boolean(job?.remote);
  const locationScore = locationMatch || remoteMatch ? 15 : 0;

  const experience = normalise(candidate?.experience);
  const experienceScore = experience && experience !== 'beginner' ? 15 : 8;

  const score = Math.min(100, skillScore + locationScore + experienceScore);

  return {
    score,
    matchedSkills,
    missingSkills: requiredSkills.filter((skill) => !matchedSkills.includes(skill)),
    locationMatch,
    remoteMatch,
  };
}

export function rankCandidates(candidates, job) {
  return candidates
    .map((candidate) => ({ candidate, match: scoreCandidateForJob(candidate, job) }))
    .sort((a, b) => b.match.score - a.match.score);
}
