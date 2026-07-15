export default function DiffLine({ line }) {
  const sign = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';

  return (
    <tr className={`diff-line diff-line--${line.type}`}>
      <td className="diff-line__lineno diff-line__lineno--old">{line.oldLineNo ?? ''}</td>
      <td className="diff-line__lineno diff-line__lineno--new">{line.newLineNo ?? ''}</td>
      <td className="diff-line__marker">{sign}</td>
      <td className="diff-line__content">
        <code>{line.content}</code>
      </td>
    </tr>
  );
}
