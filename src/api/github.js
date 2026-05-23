import { Octokit } from '@octokit/rest';

let octokitInstance = null;

export function initOctokit(token, baseUrl) {
  octokitInstance = new Octokit({
    auth: token,
    baseUrl: baseUrl || 'https://api.github.com',
  });
}

export function getOctokit() {
  return octokitInstance;
}

export async function fetchIssues(owner, repo, params = {}) {
  const octokit = getOctokit();
  const { data } = await octokit.issues.listForRepo({
    owner,
    repo,
    state: params.state || 'open',
    labels: params.labels || undefined,
    sort: params.sort || 'created',
    direction: params.direction || 'desc',
    per_page: params.per_page || 30,
    page: params.page || 1,
  });
  return data.filter(issue => !issue.pull_request);
}

export async function fetchIssue(owner, repo, issueNumber) {
  const octokit = getOctokit();
  const { data } = await octokit.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });
  return data;
}

export async function fetchIssueComments(owner, repo, issueNumber) {
  const octokit = getOctokit();
  const { data } = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber,
  });
  return data;
}

export async function createIssue(owner, repo, { title, body, labels, assignees }) {
  const octokit = getOctokit();
  const { data } = await octokit.issues.create({
    owner,
    repo,
    title,
    body: body || '',
    labels: labels || [],
    assignees: assignees || [],
  });
  return data;
}

export async function updateIssue(owner, repo, issueNumber, { title, body, state, labels, assignees }) {
  const octokit = getOctokit();
  const { data } = await octokit.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    title,
    body,
    state,
    labels,
    assignees,
  });
  return data;
}

export async function addComment(owner, repo, issueNumber, body) {
  const octokit = getOctokit();
  const { data } = await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  });
  return data;
}

export async function fetchLabels(owner, repo) {
  const octokit = getOctokit();
  const { data } = await octokit.issues.listLabelsForRepo({ owner, repo });
  return data;
}

export async function fetchCollaborators(owner, repo) {
  const octokit = getOctokit();
  try {
    const { data } = await octokit.repos.listCollaborators({ owner, repo });
    return data;
  } catch {
    return [];
  }
}

export async function validateCredentials(token, owner, repo, baseUrl) {
  const testOctokit = new Octokit({
    auth: token,
    baseUrl: baseUrl || 'https://api.github.com',
  });
  const { data } = await testOctokit.repos.get({ owner, repo });
  return data;
}
