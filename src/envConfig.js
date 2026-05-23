function parseRepoFullName(fullName) {
  const trimmed = fullName.trim();
  if (!trimmed.includes('/')) {
    return null;
  }

  const [owner, repo] = trimmed.split('/').map(part => part.trim());
  if (!owner || !repo) {
    return null;
  }

  return {
    owner,
    repo,
    fullName: `${owner}/${repo}`,
  };
}

export function getAllowedRepoOptions() {
  const raw = import.meta.env.VITE_GITHUB_ALLOWED_REPOS || '';
  return raw
    .split(',')
    .map(parseRepoFullName)
    .filter(Boolean);
}

export function getEnvDefaults() {
  const token = import.meta.env.VITE_GITHUB_TOKEN?.trim() || '';
  const baseUrl = import.meta.env.VITE_GITHUB_BASE_URL?.trim() || 'https://api.github.com';
  const repoDesc = import.meta.env.VITE_GITHUB_REPO_DESC?.trim() || '';
  const allowedRepos = getAllowedRepoOptions();

  if (!token) {
    return null;
  }

  if (allowedRepos.length > 0) {
    const selected = allowedRepos[0];
    return {
      token,
      baseUrl,
      owner: selected.owner,
      repo: selected.repo,
      repoFullName: selected.fullName,
      repoDesc,
      allowedRepos: allowedRepos.map(item => item.fullName),
    };
  }

  const owner = import.meta.env.VITE_GITHUB_OWNER?.trim() || '';
  const repo = import.meta.env.VITE_GITHUB_REPO?.trim() || '';
  if (!owner || !repo) {
    return null;
  }

  return {
    token,
    baseUrl,
    owner,
    repo,
    repoFullName: `${owner}/${repo}`,
    repoDesc,
    allowedRepos: [],
  };
}

export function isRepoAllowed(repoFullName) {
  const allowed = getAllowedRepoOptions().map(item => item.fullName);
  if (allowed.length === 0) {
    return true;
  }
  return allowed.includes(repoFullName);
}
