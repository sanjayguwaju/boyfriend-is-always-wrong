export default function Loader() {
  return (
    <div className="loader-overlay" role="status" aria-label="Loading arena">
      <div className="loader-inner">
        <div className="loader-icon">🥊</div>
        <p className="loader-text">Loading arena…</p>
      </div>
    </div>
  );
}
