const key = (kind) => `sjPhoto${kind}`;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// Crop to a centered square and keep a small copy so the photo survives reloads.
export async function importPhoto(file, kind) {
  const img = await loadImage(await readFile(file));
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const s = Math.min(img.width, img.height);
  c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 256, 256);
  const dataUrl = c.toDataURL('image/jpeg', 0.85);
  try {
    localStorage.setItem(key(kind), dataUrl);
  } catch {
    /* storage can be unavailable */
  }
  return loadImage(dataUrl);
}

export async function loadSavedPhoto(kind) {
  try {
    const u = localStorage.getItem(key(kind));
    return u ? await loadImage(u) : null;
  } catch {
    return null;
  }
}

export function readBest() {
  try {
    return parseInt(localStorage.getItem('shreejaBest3d') || '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(n) {
  try {
    localStorage.setItem('shreejaBest3d', String(n));
  } catch {
    /* ignore */
  }
}
