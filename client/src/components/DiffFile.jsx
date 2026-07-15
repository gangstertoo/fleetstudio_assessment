import { useState } from 'react';
import { parsePatch } from '../utils/parsePatch.js';
import DiffLine from './DiffLine.jsx';

const STATUS_LABEL = {
  added: 'Added',
  removed: 'Deleted',
  modified: 'Modified',
  renamed: 'Renamed',
};

export default function DiffFile({ file }) {
  const [collapsed, setCollapsed] = useState(false);
  const hunks = parsePatch(file.patch);

  return (
    <section className="diff-file">
      <header className="diff-file__header" onClick={() => setCollapsed((c) => !c)}>
        <button
          className="diff-file__toggle"
          aria-label={collapsed ? 'Expand file diff' : 'Collapse file diff'}
        >
          {collapsed ? '▶' : '▼'}
        </button>
        <span className="diff-file__filename">
          {file.previousFilename ? `${file.previousFilename} → ${file.filename}` : file.filename}
        </span>
        <span className={`diff-file__status diff-file__status--${file.status}`}>
          {STATUS_LABEL[file.status] || file.status}
        </span>
        <span className="diff-file__stat-additions">+{file.additions}</span>
        <span className="diff-file__stat-deletions">-{file.deletions}</span>
      </header>

      {!collapsed && (
        <div className="diff-file__body">
          {hunks.length === 0 ? (
            <p className="diff-file__no-diff">
              {file.patch === null
                ? 'No textual diff available for this file (binary file, or diff too large).'
                : 'No changes to display.'}
            </p>
          ) : (
            hunks.map((hunk, i) => (
              <table className="diff-hunk" key={i}>
                <tbody>
                  <tr className="diff-hunk__header">
                    <td colSpan={4}>
                      {hunk.header} {hunk.context}
                    </td>
                  </tr>
                  {hunk.lines.map((line, j) => (
                    <DiffLine line={line} key={j} />
                  ))}
                </tbody>
              </table>
            ))
          )}
        </div>
      )}
    </section>
  );
}
