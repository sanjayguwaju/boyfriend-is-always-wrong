import { CanvasTexture } from 'three';

// A face is a 256px canvas used as a texture on the head of a fighter.
// Default: emoji on a colored disc. Upload a photo and it replaces the emoji.
export function createFace(kind) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  return {
    kind,
    c,
    t: new CanvasTexture(c),
    img: null,
    emo: kind === 'g' ? '👩' : '👨',
  };
}

export function drawFace(f) {
  const x = f.c.getContext('2d');
  x.clearRect(0, 0, 256, 256);
  x.save();
  x.beginPath();
  x.arc(128, 128, 122, 0, 7);
  x.clip();
  if (f.img) {
    const s = Math.min(f.img.width, f.img.height);
    x.drawImage(f.img, (f.img.width - s) / 2, (f.img.height - s) / 2, s, s, 0, 0, 256, 256);
  } else {
    x.fillStyle = f.kind === 'g' ? '#ffd1e1' : '#cfe3ff';
    x.fillRect(0, 0, 256, 256);
    x.font = '170px serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(f.emo, 128, 138);
  }
  x.restore();
  x.lineWidth = 8;
  x.strokeStyle = '#fff';
  x.beginPath();
  x.arc(128, 128, 122, 0, 7);
  x.stroke();
  f.t.needsUpdate = true;
}
