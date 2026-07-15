import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCommit } from '../api/client.js';
import CommitHeader from '../components/CommitHeader.jsx';
import DiffFile from '../components/DiffFile.jsx';

export default function CommitPage() {
  const { owner, repo, sha } = useParams();
  const [state, setState] = useState({ status: 'loading', commit: null, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', commit: null, error: null });

    getCommit(owner, repo, sha)
      .then((commit) => {
        if (!cancelled) setState({ status: 'success', commit, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', commit: null, error });
      });

    return () => {
      cancelled = true;
    };
  }, [owner, repo, sha]);

  if (state.status === 'loading') {
    return (
      <main className="page page--centered">
        <p>Loading commit…</p>
      </main>
    );
  }

  if (state.status === 'error') {
    return (
      <main className="page page--centered">
        <p className="error-message">
          {state.error.status === 404
            ? `Could not find commit ${sha} in ${owner}/${repo}.`
            : state.error.message}
        </p>
      </main>
    );
  }

  const { commit } = state;

  return (
    <main className="page">
      <CommitHeader commit={commit} />
      <div className="diff-file-list">
        {commit.files.length === 0 ? (
          <p>This commit did not change any files.</p>
        ) : (
          commit.files.map((file) => <DiffFile file={file} key={file.filename} />)
        )}
      </div>
    </main>
  );
}
