import * as THREE from 'three';
import { createFace, drawFace } from './faces.js';

// Match the flat, bright look of the original prototype.
THREE.ColorManagement.enabled = false;

const GX = -1.7; // Shreeja's start x
const BX = 1.7; // Sanjay's start x
const BOY_FACES = ['👨', '😅', '😬', '😣', '😖', '😫'];

/**
 * Creates the 3D boxing ring and both fighters inside `container`.
 * `overlay` holds DOM nodes the engine positions every frame: { gTag, bTag, bubble }.
 */
export function createGame(container, overlay, { onImpact }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1b1030);
  scene.fog = new THREE.Fog(0x1b1030, 14, 28);
  const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 60);

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(3, 8, 6);
  scene.add(sun);
  const spot = new THREE.PointLight(0xff8fb8, 0.6, 20);
  spot.position.set(0, 5, 3);
  scene.add(spot);

  const mat = (c, r = 0.6) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const box = (w, h, d, c, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
    m.position.set(x, y, z);
    scene.add(m);
    return m;
  };

  // Ring: apron, canvas, posts, ropes
  box(11, 0.3, 8, 0x2b2f8f, 0, -0.35, 0);
  box(9, 0.3, 6, 0xe11d63, 0, -0.05, 0);
  [[-4.3, -2.8], [4.3, -2.8], [-4.3, 2.8], [4.3, 2.8]].forEach(([x, z]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 12), mat(0xfafafa));
    p.position.set(x, 1.2, z);
    scene.add(p);
  });
  [0.8, 1.4, 2].forEach((y) => {
    box(8.6, 0.07, 0.07, 0xffffff, 0, y, -2.8);
    box(0.07, 0.07, 5.6, 0xffffff, -4.3, y, 0);
    box(0.07, 0.07, 5.6, 0xffffff, 4.3, y, 0);
  });

  function fighter({ top, shorts, skin, hair, glove, face, girl }) {
    const g = new THREE.Group();
    const add = (geo, m, x, y, z, parent = g) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    };
    const leg = (x) =>
      add(new THREE.CylinderGeometry(girl ? 0.1 : 0.17, girl ? 0.09 : 0.15, 0.8, 12), mat(skin), x, 0.4, 0);
    leg(girl ? -0.15 : -0.25);
    leg(girl ? 0.15 : 0.25);

    if (girl) {
      add(new THREE.CylinderGeometry(0.3, 0.7, 0.6, 24), mat(shorts), 0, 0.95, 0); // skirt
      add(new THREE.CylinderGeometry(0.33, 0.28, 0.8, 16), mat(top), 0, 1.62, 0);
    } else {
      add(new THREE.CylinderGeometry(0.5, 0.46, 0.5, 16), mat(shorts), 0, 0.93, 0);
      add(new THREE.CylinderGeometry(0.58, 0.44, 0.9, 16), mat(top), 0, 1.55, 0);
    }

    const head = new THREE.Group();
    head.position.set(0, 2.3, 0);
    g.add(head);
    add(new THREE.SphereGeometry(0.5, 24, 18), mat(skin), 0, 0, 0, head).scale.set(girl ? 0.95 : 1.06, 1.05, 0.82);
    add(new THREE.SphereGeometry(0.53, 24, 18), mat(hair), 0, girl ? 0.06 : 0.1, -0.1, head).scale.set(
      girl ? 1.02 : 1.06,
      girl ? 1.05 : 0.95,
      0.85
    );

    if (girl) {
      add(new THREE.SphereGeometry(0.5, 16, 14), mat(hair), 0, -0.5, -0.3, head).scale.set(1, 1.2, 0.5);
      [-1, 1].forEach((s) =>
        add(new THREE.SphereGeometry(0.3, 12, 10), mat(hair), s * 0.46, -0.3, -0.05, head).scale.set(0.5, 1.5, 0.6)
      );
      const bow = mat(0xff4d8d);
      add(new THREE.SphereGeometry(0.15, 10, 8), bow, 0.3, 0.45, 0.25, head);
      add(new THREE.SphereGeometry(0.15, 10, 8), bow, 0.55, 0.4, 0.25, head);
      add(new THREE.SphereGeometry(0.09, 10, 8), mat(0xffffff), 0.43, 0.43, 0.3, head);
    }

    const fm = new THREE.MeshBasicMaterial({ map: face.t, transparent: true });
    add(new THREE.CircleGeometry(0.43, 40), fm, 0, -0.02, 0.4, head);

    const arms = [-1, 1].map((s) => {
      const p = new THREE.Group();
      p.position.set(s * (girl ? 0.45 : 0.72), girl ? 1.85 : 1.93, 0);
      g.add(p);
      const r = girl ? 0.075 : 0.13;
      add(new THREE.CylinderGeometry(r, r, 0.7, 10), mat(skin), 0, -0.35, 0, p);
      add(new THREE.SphereGeometry(girl ? 0.2 : 0.25, 14, 12), mat(glove, 0.4), 0, -0.78, 0, p);
      return p;
    });
    scene.add(g);
    return { g, head, fm, arms };
  }

  const gFace = createFace('g');
  const bFace = createFace('b');
  const girl = fighter({
    top: 0xff5c9a, shorts: 0x6a1b9a, skin: 0xf1c7a5, hair: 0x2a1a14, glove: 0xff2d87, face: gFace, girl: true,
  });
  const boy = fighter({
    top: 0x2e86de, shorts: 0x263238, skin: 0xe0b48f, hair: 0x1b1b1b, glove: 0x1565c0, face: bFace, girl: false,
  });
  girl.g.position.x = GX;
  girl.g.rotation.y = 0.45;
  girl.g.scale.setScalar(0.95);
  boy.g.position.x = BX;
  boy.g.rotation.y = -0.45;
  boy.g.scale.setScalar(1.1);
  girl.arms.forEach((a) => (a.rotation.x = -1.1));

  drawFace(gFace);
  drawFace(bFace);

  // ---- state ----
  let pt = -1; // punch progress, -1 = idle
  let hitDone = false;
  let ht = 0; // hit reaction, 1 -> 0
  let shk = 0; // camera shake
  let ko = false;
  let mood = 0; // 0..1 patience used
  let t0 = 0;
  let boyKey = '';
  let raf = 0;
  const parts = [];
  const starGeo = new THREE.OctahedronGeometry(0.1);
  const starMat = new THREE.MeshBasicMaterial({ color: 0xffd23f });

  const proj = (v) => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const p = v.clone().project(cam);
    return { x: (p.x * 0.5 + 0.5) * w, y: (-p.y * 0.5 + 0.5) * h };
  };

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    const d = Math.max(8.6, 9.2 / cam.aspect);
    cam.position.set(0, 2.8 + d * 0.05, d);
    cam.lookAt(0, 1.5, 0);
    cam.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  function impact() {
    ht = 1;
    shk = 0.3;
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(starGeo, starMat);
      m.position.set(BX - 0.4, 2.4, 0.6);
      scene.add(m);
      parts.push({ m, vx: (Math.random() - 0.2) * 4, vy: Math.random() * 4 + 1, vz: Math.random() * 2, l: 0.7 });
    }
    onImpact(proj(new THREE.Vector3(BX - 0.3, 2.5, 0.6)));
  }

  let last = performance.now();
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t0 += dt;

    girl.g.position.y = Math.sin(t0 * 6) * 0.04;
    boy.g.position.y = Math.sin(t0 * 5 + 1) * 0.03;

    let k = 0;
    if (pt >= 0) {
      pt += dt / 0.28;
      k = Math.sin(Math.min(pt, 1) * Math.PI);
      if (!hitDone && pt >= 0.5) {
        hitDone = true;
        impact();
      }
      if (pt >= 1) pt = -1;
    }
    girl.g.position.x = GX + 1.0 * k;
    girl.g.rotation.y = 0.45 + 0.25 * k;
    girl.arms[1].rotation.x = -1.1 - 0.47 * k;
    girl.arms[1].rotation.z = -0.1 * k;

    ht = Math.max(0, ht - dt * 2.2);
    boy.g.position.x = BX + 0.8 * ht;
    boy.g.rotation.z = -0.3 * ht + (ko ? -1.45 : 0);
    boy.head.rotation.z = Math.sin(t0 * 40) * 0.25 * ht;
    boy.head.rotation.x = -0.3 * ht;
    boy.arms[0].rotation.z = -1.2 * ht;
    boy.arms[1].rotation.z = 1.2 * ht;
    boy.fm.color.setRGB(1, 1 - 0.6 * ht, 1 - 0.6 * ht);

    shk = Math.max(0, shk - dt * 1.2);
    cam.position.x = (Math.random() - 0.5) * shk;

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.l -= dt;
      p.vy -= 9 * dt;
      p.m.position.x += p.vx * dt;
      p.m.position.y += p.vy * dt;
      p.m.position.z += p.vz * dt;
      p.m.rotation.x += dt * 10;
      if (p.l <= 0) {
        scene.remove(p.m);
        parts.splice(i, 1);
      }
    }

    // Sanjay's face reacts: calmer -> stressed, 😣 on hits, 😭 only on KO
    const key = `${Math.round(mood * 25)}:${ht > 0.35 ? 1 : 0}:${ko ? 1 : 0}`;
    if (!bFace.img && key !== boyKey) {
      boyKey = key;
      bFace.emo = ko ? '😭' : ht > 0.35 ? '😣' : BOY_FACES[Math.min(5, Math.floor((mood * 100) / 17))];
      drawFace(bFace);
    }

    // HTML overlay (name callouts + sorry bubble) follows the 3D heads
    const w = container.clientWidth;
    const clampX = (x, m) => `${Math.max(m, Math.min(w - m, x))}px`;
    const gp = proj(new THREE.Vector3(girl.g.position.x, 3.0, 0));
    const bq = proj(new THREE.Vector3(boy.g.position.x, 3.4, 0));
    const bp = proj(new THREE.Vector3(boy.g.position.x, 4.05, 0));
    if (overlay.gTag) {
      overlay.gTag.style.left = clampX(gp.x, 45);
      overlay.gTag.style.top = `${gp.y}px`;
    }
    if (overlay.bTag) {
      overlay.bTag.style.left = clampX(bq.x, 45);
      overlay.bTag.style.top = `${bq.y}px`;
    }
    if (overlay.bubble) {
      overlay.bubble.style.left = clampX(bp.x, 80);
      overlay.bubble.style.top = `${Math.max(30, bp.y)}px`;
    }

    renderer.render(scene, cam);
  }
  raf = requestAnimationFrame(loop);

  return {
    canPunch: () => pt < 0 && !ko,
    punch() {
      pt = 0;
      hitDone = false;
    },
    setMood(m) {
      mood = m;
    },
    setKO(v) {
      ko = v;
    },
    setPhoto(kind, img) {
      const f = kind === 'g' ? gFace : bFace;
      f.img = img;
      drawFace(f);
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
