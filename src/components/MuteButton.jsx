export default function MuteButton({ muted, onToggle }) {
  return (
    <button
      className="mute-btn"
      onClick={onToggle}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      title={muted ? 'Unmute' : 'Mute'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
