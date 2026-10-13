export default function ComboAnnouncer({ combo }) {
  if (combo < 3) return null;

  let cls = 'combo-banner combo-banner--low';
  let text = `COMBO ×${combo}!`;

  if (combo >= 10) {
    cls = 'combo-banner combo-banner--ultra';
    text = `UNSTOPPABLE!! ×${combo} 💥`;
  } else if (combo >= 5) {
    cls = 'combo-banner combo-banner--high';
    text = `SUPER COMBO ×${combo} 🔥`;
  }

  // key=combo forces remount (re-triggers CSS animation) on every new combo value
  return (
    <div className={cls} key={combo} aria-live="assertive">
      {text}
    </div>
  );
}
