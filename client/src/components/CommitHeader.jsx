function formatDate(iso) {
  if (!iso) return 'Unknown date';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CommitHeader({ commit }) {
  const { author, message, sha, stats, htmlUrl, owner, repo, parents } = commit;
  const [title, ...bodyLines] = message.split('\n');
  const body = bodyLines.join('\n').trim();

  return (
    <header className="commit-header">
      <div className="commit-header__breadcrumb">
        {owner}/{repo}
      </div>

      <h1 className="commit-header__title">{title}</h1>
      {body && <pre className="commit-header__body">{body}</pre>}

      <div className="commit-header__meta">
        {author.avatarUrl && (
          <img className="commit-header__avatar" src={author.avatarUrl} alt={author.name || 'author'} />
        )}
        <div className="commit-header__meta-text">
          <span className="commit-header__author">{author.name || author.login || 'Unknown author'}</span>
          <span className="commit-header__date"> committed on {formatDate(author.date)}</span>
        </div>
      </div>

      <div className="commit-header__stats">
        <a className="commit-header__sha" href={htmlUrl} target="_blank" rel="noreferrer">
          {sha.slice(0, 7)}
        </a>
        {parents.length > 0 && (
          <span className="commit-header__parents">
            parent {parents.length > 1 ? 's' : ''}:{' '}
            {parents.map((p) => (
              <a key={p.sha} href={p.htmlUrl} target="_blank" rel="noreferrer" className="commit-header__parent">
                {p.sha.slice(0, 7)}
              </a>
            ))}
          </span>
        )}
        <span className="commit-header__additions">+{stats.additions}</span>
        <span className="commit-header__deletions">-{stats.deletions}</span>
      </div>
    </header>
  );
}
