function PlayerCard({ emoji, label, name, onName, onPhoto, colorClass }) {
  return (
    <div className={`player-card ${colorClass}`}>
      <div className="player-card-header">
        <span className="player-card-emoji">{emoji}</span>
        <span>{label}</span>
      </div>
      <input
        type="text"
        className="player-name-input"
        maxLength={14}
        value={name}
        onChange={(e) => onName(e.target.value)}
        placeholder={`${label}'s name`}
      />
      <label className="photo-upload-btn">
        📷 Upload photo
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onPhoto(e.target.files?.[0])}
        />
      </label>
    </div>
  );
}

export default function LobbyScreen({
  girlName,
  boyName,
  onGirlName,
  onBoyName,
  onPhoto,
  best,
  onStart,
  gameReady,
}) {
  return (
    <div className="lobby-overlay">
      <div className="lobby-inner">
        {/* Hero */}
        <div className="lobby-hero">
          <div className="lobby-glove">🥊</div>
          <h1 className="lobby-title">Boyfriend Is Always Wrong</h1>
          <p className="lobby-tagline">She's always right. He's always sorry.</p>
        </div>

        {/* Player setup */}
        <div className="player-cards">
          <PlayerCard
            emoji="👩"
            label="Her"
            name={girlName}
            onName={onGirlName}
            onPhoto={(f) => onPhoto('g', f)}
            colorClass="player-card--girl"
          />
          <PlayerCard
            emoji="🧑"
            label="Him"
            name={boyName}
            onName={onBoyName}
            onPhoto={(f) => onPhoto('b', f)}
            colorClass="player-card--boy"
          />
        </div>

        {/* Privacy note */}
        <p className="lobby-privacy">
          🔒 Photos stay in your browser — nothing is uploaded.
        </p>

        {/* Start button */}
        <button
          className="start-btn"
          onClick={onStart}
          disabled={!gameReady}
        >
          {gameReady ? '▶  START GAME' : '⏳  Loading arena…'}
        </button>

        {/* Best score */}
        {best > 0 && (
          <p className="lobby-best">
            🏆 Personal best: <strong>{best} punches</strong>
          </p>
        )}

        {/* Controls hint */}
        <p className="lobby-hint">Tap the ring · tap the button · or press Space</p>
      </div>
    </div>
  );
}
