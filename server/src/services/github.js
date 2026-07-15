const GITHUB_API = 'https://api.github.com';

/**
 * Thin wrapper around a small slice of the GitHub REST API.
 * Kept as a plain function (not a class) so it's trivial to unit test
 * by mocking global fetch / nock.
 */
export async function fetchCommit(owner, repo, sha) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/commits/${sha}`;

  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'commit-diff-viewer',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const body = await safeJson(response);
    const error = new Error(body?.message || `GitHub API responded with ${response.status}`);
    error.status = response.status === 404 ? 404 : response.status === 403 ? 429 : 502;
    error.githubStatus = response.status;
    throw error;
  }

  const data = await response.json();
  return normalizeCommit(data, owner, repo);
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Reshape GitHub's commit payload into the smaller, UI-friendly shape
 * documented in SOLUTION.md / the API doc this project was built against.
 */
function normalizeCommit(data, owner, repo) {
  const authorLogin = data.author?.login ?? null;
  const committerLogin = data.committer?.login ?? null;

  return {
    sha: data.sha,
    htmlUrl: data.html_url,
    owner,
    repo,
    message: data.commit.message,
    author: {
      name: data.commit.author?.name ?? null,
      email: data.commit.author?.email ?? null,
      date: data.commit.author?.date ?? null,
      login: authorLogin,
      avatarUrl: data.author?.avatar_url ?? null,
      profileUrl: data.author?.html_url ?? null,
    },
    committer: {
      name: data.commit.committer?.name ?? null,
      email: data.commit.committer?.email ?? null,
      date: data.commit.committer?.date ?? null,
      login: committerLogin,
      avatarUrl: data.committer?.avatar_url ?? null,
    },
    parents: (data.parents ?? []).map((p) => ({ sha: p.sha, htmlUrl: p.html_url })),
    stats: {
      additions: data.stats?.additions ?? 0,
      deletions: data.stats?.deletions ?? 0,
      total: data.stats?.total ?? 0,
    },
    files: (data.files ?? []).map((f) => ({
      filename: f.filename,
      previousFilename: f.previous_filename ?? null,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      changes: f.changes,
      patch: f.patch ?? null, // undefined for binary files / too-large diffs
      blobUrl: f.blob_url,
    })),
  };
}
