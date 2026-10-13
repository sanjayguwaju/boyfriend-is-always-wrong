export default function Stats({ punches, combo, sorries, best }) {
  const items = [
    { label: 'Punches', value: punches, hot: false },
    { label: 'Combo', value: combo, hot: combo >= 3 },
    { label: 'Sorries', value: sorries, hot: false },
    { label: 'Best KO', value: best || '—', hot: false },
  ];

  return (
    <div className="stats">
      {items.map(({ label, value, hot }) => (
        <div className={`stat${hot ? ' stat--hot' : ''}`} key={label}>
          <b>{value}</b>
          {label}
        </div>
      ))}
    </div>
  );
}
