export async function getCommit(owner, repo, sha) {
  const res = await fetch(`/api/repositories/${owner}/${repo}/commit/${sha}`);
  const body = await res.json();

  if (!res.ok) {
    const error = new Error(body.error || 'Something went wrong fetching this commit.');
    error.status = res.status;
    throw error;
  }

  return body;
}
