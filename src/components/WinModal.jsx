export default function WinModal({ text, onAgain }) {
  if (!text) return null;
  return (
    <div className="win on">
      <div>
        <h2>KO! 🏆</h2>
        <p>{text}</p>
        <button onClick={onAgain}>Round 2 🔔</button>
      </div>
    </div>
  );
}
