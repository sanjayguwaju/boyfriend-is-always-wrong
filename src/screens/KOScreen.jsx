function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export default function KOScreen({
  girlName,
  boyName,
  round,
  punches,
  elapsedMs,
  peakCombo,
  best,
  isNewBest,
  onNextRound,
  onMenu,
}) {
  return (
    <div className="ko-overlay">
      <div className="ko-card">
        {/* Trophy */}
        <div className="ko-trophy" aria-hidden="true">🏆</div>
        <h2 className="ko-heading">K · O !</h2>
        <p className="ko-winner">
          {girlName} wins Round {round}!
        </p>

        {isNewBest && (
          <div className="new-best-badge" aria-live="polite">
            🎉 New Best!
          </div>
        )}

        {/* Stats grid */}
        <div className="ko-stats">
          <div className="ko-stat">
            <span className="ko-stat-icon">👊</span>
            <span className="ko-stat-label">Punches</span>
            <span className="ko-stat-val">{punches}</span>
          </div>
          <div className="ko-stat">
            <span className="ko-stat-icon">⏱</span>
            <span className="ko-stat-label">Time</span>
            <span className="ko-stat-val">{formatTime(elapsedMs)}</span>
          </div>
          <div className="ko-stat">
            <span className="ko-stat-icon">💥</span>
            <span className="ko-stat-label">Peak Combo</span>
            <span className="ko-stat-val">×{peakCombo}</span>
          </div>
          <div className="ko-stat">
            <span className="ko-stat-icon">🏅</span>
            <span className="ko-stat-label">Best KO</span>
            <span className="ko-stat-val">{best || '—'}</span>
          </div>
        </div>

        <p className="ko-note">
          {boyName} said sorry {punches} time{punches !== 1 ? 's' : ''} 😅
        </p>

        {/* Actions */}
        <div className="ko-actions">
          <button className="ko-btn ko-btn--primary" onClick={onNextRound}>
            ▶ Next Round
          </button>
          <button className="ko-btn ko-btn--secondary" onClick={onMenu}>
            🏠 Menu
          </button>
        </div>
      </div>
    </div>
  );
}
