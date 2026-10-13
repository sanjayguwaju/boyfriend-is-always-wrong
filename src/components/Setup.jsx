export default function Setup({ girlName, boyName, onGirlName, onBoyName, onPhoto }) {
  return (
    <details className="cfg">
      <summary>⚙️ Names &amp; photos</summary>
      <div className="setup">
        <div className="card">
          👩 Her name
          <input type="text" maxLength={14} value={girlName} onChange={(e) => onGirlName(e.target.value)} />
          <label className="up">
            📷 Upload her face
            <input type="file" accept="image/*" onChange={(e) => onPhoto('g', e.target.files?.[0])} />
          </label>
        </div>
        <div className="card">
          🧑 His name
          <input type="text" maxLength={14} value={boyName} onChange={(e) => onBoyName(e.target.value)} />
          <label className="up">
            📷 Upload his face
            <input type="file" accept="image/*" onChange={(e) => onPhoto('b', e.target.files?.[0])} />
          </label>
        </div>
      </div>
      <p className="note">
        🔒 Photos stay in your browser. Nothing is uploaded anywhere. Use a close-up, front-facing photo.
      </p>
    </details>
  );
}
