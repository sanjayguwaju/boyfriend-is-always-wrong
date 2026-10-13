import MuteButton from './MuteButton.jsx';

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export default function Header({ round, elapsedMs, muted, onMuteToggle }) {
  return (
    <div className="hud-header">
      <div className="hud-round">Round {round}</div>
      <div className="hud-timer" aria-label={`Elapsed time ${formatTime(elapsedMs)}`}>
        ⏱ {formatTime(elapsedMs)}
      </div>
      <MuteButton muted={muted} onToggle={onMuteToggle} />
    </div>
  );
}
