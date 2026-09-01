const GITHUB_API = "https://api.github.com";

const githubFetch = async (path) => {
  const response = await fetch(`${GITHUB_API}${path}`, { headers: { Accept: "application/vnd.github+json", "User-Agent": "DevHeaven" } });
  if (!response.ok) {
    const error = new Error(response.status === 404 ? "GitHub user not found" : `GitHub API error (${response.status})`);
    error.status = response.status === 404 ? 404 : 502;
    throw error;
  }
  return response.json();
};

const getGithubProfile = async (username) => {
  const safe = String(username || "").trim().replace(/^@/, "");
  if (!/^[A-Za-z0-9-]{1,39}$/.test(safe)) { const e = new Error("Invalid GitHub username"); e.status = 400; throw e; }
  const [profile, repositories] = await Promise.all([
    githubFetch(`/users/${encodeURIComponent(safe)}`),
    githubFetch(`/users/${encodeURIComponent(safe)}/repos?per_page=100&sort=updated&type=owner`),
  ]);
  const repos = repositories.filter(repo => !repo.fork).map(repo => ({ id: repo.id, name: repo.name, fullName: repo.full_name, description: repo.description, url: repo.html_url, language: repo.language, stars: repo.stargazers_count, forks: repo.forks_count, updatedAt: repo.updated_at })).sort((a, b) => (b.stars - a.stars) || (new Date(b.updatedAt) - new Date(a.updatedAt))).slice(0, 30);
  const languages = {};
  repos.forEach(repo => { if (repo.language) languages[repo.language] = (languages[repo.language] || 0) + 1; });
  return { profile: { login: profile.login, name: profile.name, avatar: profile.avatar_url, bio: profile.bio, htmlUrl: profile.html_url, publicRepos: profile.public_repos, followers: profile.followers, following: profile.following, createdAt: profile.created_at }, repositories: repos, languages };
};

module.exports = { getGithubProfile };
