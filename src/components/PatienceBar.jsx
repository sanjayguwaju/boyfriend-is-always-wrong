export default function PatienceBar({ name, hp }) {
  return (
    <div>
      <div className="lbl">
        <span>💔 {name}'s patience</span>
        <span>{Math.round(hp)}%</span>
      </div>
      <div className="bar">
        <i style={{ width: `${hp}%` }} />
      </div>
    </div>
  );
}
