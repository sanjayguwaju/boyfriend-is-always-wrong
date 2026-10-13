export default function PatienceBar({ name, hp }) {
  let fillClass = 'bar-fill';
  if (hp >= 70) fillClass += ' bar-fill--danger';
  else if (hp >= 40) fillClass += ' bar-fill--warning';
  if (hp >= 90) fillClass += ' bar-fill--pulse';

  return (
    <div>
      <div className="lbl">
        <span>💔 {name}'s patience</span>
        <span>{Math.round(hp)}%</span>
      </div>
      <div className="bar">
        <i className={fillClass} style={{ width: `${hp}%` }} />
      </div>
    </div>
  );
}
