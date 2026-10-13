export default function Stage({
  containerRef,
  gTagRef,
  bTagRef,
  bubbleRef,
  girlName,
  boyName,
  bubble,
  pows,
  onPunch,
}) {
  return (
    <div
      id="stage"
      className="stage"
      ref={containerRef}
      onPointerDown={(e) => {
        if (e.target.tagName === 'CANVAS') onPunch();
      }}
    >
      <div className="tag g" ref={gTagRef}>{girlName}</div>
      <div className="tag b" ref={bTagRef}>{boyName}</div>
      <div className={`bubble${bubble.on ? ' on' : ''}`} ref={bubbleRef}>{bubble.text}</div>
      {pows.map((p) => (
        <div key={p.id} className="pow" style={{ left: p.x, top: p.y }}>
          {p.text}
        </div>
      ))}
    </div>
  );
}
