export default function Stats({ punches, combo, sorries, best }) {
  const items = [
    ['Punches', punches],
    ['Combo', combo],
    ['Sorries', sorries],
    ['Fastest KO', best],
  ];
  return (
    <div className="stats">
      {items.map(([label, value]) => (
        <div className="stat" key={label}>
          <b>{value}</b>
          {label}
        </div>
      ))}
    </div>
  );
}
