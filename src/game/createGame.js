import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { createFace, drawFace } from './faces.js';

// Match the flat, bright look of the original prototype.
THREE.ColorManagement.enabled = false;

const GX = -1.6; // Shreeja's ring position
const BX = 1.6;  // Sanjay's ring position
const BOY_FACES = ['👨', '😅', '😬', '😣', '😖', '😫'];

/**
 * Creates the 3D boxing ring and loads the Mixamo characters.
 * overlay: { gTag, bTag, bubble }
 */
export function createGame(container, overlay, { onImpact, onReady }) {
  // Loading indicator inside the stage
  const loadingEl = document.createElement('div');
  loadingEl.className = 'stage-ring-loader';
  loadingEl.innerHTML = '<span class="spin-glove">🥊</span><span>Loading ring...</span>';
  container.appendChild(loadingEl);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1b1030);
  scene.fog = new THREE.Fog(0x1b1030, 14, 28);
  const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 60);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(3, 8, 6);
  scene.add(sun);
  const spot = new THREE.PointLight(0xff8fb8, 0.7, 20);
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
  [
    [-4.3, -2.8],
    [4.3, -2.8],
    [-4.3, 2.8],
    [4.3, 2.8],
  ].forEach(([x, z]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 12), mat(0xfafafa));
    p.position.set(x, 1.2, z);
    scene.add(p);
  });
  [0.8, 1.4, 2.0].forEach((y) => {
    box(8.6, 0.07, 0.07, 0xffffff, 0, y, -2.8);
    box(0.07, 0.07, 5.6, 0xffffff, -4.3, y, 0);
    box(0.07, 0.07, 5.6, 0xffffff, 4.3, y, 0);
  });

  // Face textures
  const gFace = createFace('g');
  const bFace = createFace('b');
  drawFace(gFace);
  drawFace(bFace);

  const gFaceMat = new THREE.MeshBasicMaterial({ map: gFace.t, transparent: true, side: THREE.DoubleSide });
  const bFaceMat = new THREE.MeshBasicMaterial({ map: bFace.t, transparent: true, side: THREE.DoubleSide });

  // Glove mesh helper
  const makeGlove = (color) => {
    return new THREE.Mesh(
      new THREE.SphereGeometry(14, 16, 14),
      new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.1 })
    );
  };

  // Animation states & references
  let shreejaMixer = null;
  let sanjayMixer = null;
  let shreejaActions = {};
  let sanjayActions = {};
  let shreejaHeadBone = null;
  let sanjayHeadBone = null;
  let shreejaGloveBone = null;
  let shreejaRoot = null;
  let sanjayRoot = null;
  let modelsLoaded = false;

  let isPunching = false;
  let punchProgress = 0;
  let punchDuration = 1.033;
  let hitDone = false;
  let ht = 0; // hit reaction 1 -> 0
  let shk = 0; // camera shake
  let ko = false;
  let mood = 0;
  let boyKey = '';

  const gltfLoader = new GLTFLoader();
  gltfLoader.setMeshoptDecoder(MeshoptDecoder);

  // Load models in parallel
  Promise.all([
    new Promise((resolve, reject) => gltfLoader.load('/models/shreeja.glb', resolve, undefined, reject)),
    new Promise((resolve, reject) => gltfLoader.load('/models/sanjay.glb', resolve, undefined, reject)),
  ])
    .then(([shreejaGltf, sanjayGltf]) => {
      // Setup Shreeja
      shreejaRoot = shreejaGltf.scene;
      shreejaRoot.position.set(GX, 0, 0);
      shreejaRoot.rotation.y = 1.15; // 3/4 facing Sanjay and camera
      scene.add(shreejaRoot);

      shreejaMixer = new THREE.AnimationMixer(shreejaRoot);
      shreejaGltf.animations.forEach((clip) => {
        const action = shreejaMixer.clipAction(clip);
        shreejaActions[clip.name] = action;
        if (clip.name === 'punch') punchDuration = clip.duration;
      });

      // Find bones
      shreejaRoot.traverse((c) => {
        if (c.isBone && c.name === 'mixamorigHead') shreejaHeadBone = c;
        if (c.isBone && c.name === 'mixamorigRightHand') shreejaGloveBone = c;
        if (c.isBone && (c.name === 'mixamorigRightHand' || c.name === 'mixamorigLeftHand')) {
          const glove = makeGlove(0xff2d87);
          glove.position.set(0, 10, 0);
          c.add(glove);
        }
      });

      // Attach face disc to Shreeja's head bone
      if (shreejaHeadBone) {
        const disc = new THREE.Mesh(new THREE.CircleGeometry(14, 32), gFaceMat);
        disc.position.set(0, 8, 14);
        shreejaHeadBone.add(disc);
      }

      // Start idle
      if (shreejaActions['idle']) {
        shreejaActions['idle'].setLoop(THREE.LoopRepeat);
        shreejaActions['idle'].play();
      }

      // Setup Sanjay
      sanjayRoot = sanjayGltf.scene;
      sanjayRoot.position.set(BX, 0, 0);
      sanjayRoot.rotation.y = -1.15; // 3/4 facing Shreeja and camera
      scene.add(sanjayRoot);

      sanjayMixer = new THREE.AnimationMixer(sanjayRoot);
      sanjayGltf.animations.forEach((clip) => {
        const action = sanjayMixer.clipAction(clip);
        sanjayActions[clip.name] = action;
      });

      sanjayRoot.traverse((c) => {
        if (c.isBone && c.name === 'mixamorigHead') sanjayHeadBone = c;
        if (c.isBone && (c.name === 'mixamorigRightHand' || c.name === 'mixamorigLeftHand')) {
          const glove = makeGlove(0x1565c0);
          glove.position.set(0, 10, 0);
          c.add(glove);
        }
      });

      // Attach face disc to Sanjay's head bone
      if (sanjayHeadBone) {
        const disc = new THREE.Mesh(new THREE.CircleGeometry(14, 32), bFaceMat);
        disc.position.set(0, 8, 14);
        sanjayHeadBone.add(disc);
      }

      // Start idle
      if (sanjayActions['idle']) {
        sanjayActions['idle'].setLoop(THREE.LoopRepeat);
        sanjayActions['idle'].play();
      }

      modelsLoaded = true;

      // Hide loading overlay
      if (loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);
    })
    .catch((err) => {
      console.error('Error loading characters:', err);
      loadingEl.innerHTML = '<span>Error loading ring</span>';
    });

  // Star particles for punch impact
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

  function triggerImpact() {
    ht = 1.0;
    shk = 0.35;

    // Position of impact around Sanjay's face
    const impactPoint = new THREE.Vector3();
    if (sanjayHeadBone) {
      sanjayHeadBone.getWorldPosition(impactPoint);
      impactPoint.z += 0.1;
    } else {
      impactPoint.set(BX - 0.3, 1.7, 0.3);
    }

    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(starGeo, starMat);
      m.position.copy(impactPoint);
      scene.add(m);
      parts.push({
        m,
        vx: (Math.random() - 0.2) * 4,
        vy: Math.random() * 4 + 1,
        vz: Math.random() * 2,
        l: 0.7,
      });
    }

    onImpact(proj(impactPoint));

    // Sanjay reaction
    if (ko) {
      if (sanjayActions['idle']) sanjayActions['idle'].stop();
      if (sanjayActions['hit']) sanjayActions['hit'].stop();
      if (sanjayActions['defeated']) {
        sanjayActions['defeated'].reset();
        sanjayActions['defeated'].setLoop(THREE.LoopOnce, 1);
        sanjayActions['defeated'].clampWhenFinished = true;
        sanjayActions['defeated'].play();
      }
    } else {
      if (sanjayActions['hit']) {
        if (sanjayActions['idle']) sanjayActions['idle'].stop();
        sanjayActions['hit'].reset();
        sanjayActions['hit'].setLoop(THREE.LoopOnce, 1);
        sanjayActions['hit'].clampWhenFinished = false;
        sanjayActions['hit'].play();
      }
    }
  }

  let last = performance.now();
  let firstFrame = true;

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // Update animation mixers
    if (shreejaMixer) shreejaMixer.update(dt);
    if (sanjayMixer) sanjayMixer.update(dt);

    // Punch timing logic
    if (isPunching) {
      punchProgress += dt;
      // Glove connects halfway through the jab/cross animation
      if (!hitDone && punchProgress >= 0.52) {
        hitDone = true;
        triggerImpact();
      }
      if (punchProgress >= punchDuration) {
        isPunching = false;
        if (shreejaActions['punch']) shreejaActions['punch'].stop();
        if (shreejaActions['idle']) {
          shreejaActions['idle'].reset().fadeIn(0.15).play();
        }
      }
    }

    // Hit fadeout & return to idle for Sanjay
    if (ht > 0) {
      ht = Math.max(0, ht - dt * 2.0);
      bFaceMat.color.setRGB(1, 1 - 0.6 * ht, 1 - 0.6 * ht);
      if (!ko && ht === 0 && sanjayActions['hit'] && !sanjayActions['hit'].isRunning()) {
        if (sanjayActions['idle']) sanjayActions['idle'].reset().fadeIn(0.15).play();
      }
    }

    // Camera shake
    shk = Math.max(0, shk - dt * 1.5);
    cam.position.x = (Math.random() - 0.5) * shk;

    // Update stars
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

    // Sanjay face emoji updates
    const key = `${Math.round(mood * 25)}:${ht > 0.35 ? 1 : 0}:${ko ? 1 : 0}`;
    if (!bFace.img && key !== boyKey) {
      boyKey = key;
      bFace.emo = ko ? '😭' : ht > 0.35 ? '😣' : BOY_FACES[Math.min(5, Math.floor((mood * 100) / 17))];
      drawFace(bFace);
    }

    // Position HTML tags and sorry bubble based on 3D head bone locations
    const w = container.clientWidth;
    const clampX = (x, m) => `${Math.max(m, Math.min(w - m, x))}px`;

    const gHeadPos = new THREE.Vector3();
    if (shreejaHeadBone) {
      shreejaHeadBone.getWorldPosition(gHeadPos);
      gHeadPos.y += 0.45;
    } else {
      gHeadPos.set(GX, 2.2, 0);
    }
    const gp = proj(gHeadPos);

    const bHeadPos = new THREE.Vector3();
    if (sanjayHeadBone) {
      sanjayHeadBone.getWorldPosition(bHeadPos);
    } else {
      bHeadPos.set(BX, 2.2, 0);
    }
    const bTagPos = bHeadPos.clone();
    bTagPos.y += 0.45;
    const bubblePos = bHeadPos.clone();
    bubblePos.y += 0.95;

    const bq = proj(bTagPos);
    const bp = proj(bubblePos);

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

    if (firstFrame && modelsLoaded) {
      firstFrame = false;
      onReady?.();
    }
  }
  let raf = requestAnimationFrame(loop);

  return {
    canPunch: () => modelsLoaded && !isPunching && !ko,
    punch() {
      if (!modelsLoaded || isPunching || ko) return;
      isPunching = true;
      punchProgress = 0;
      hitDone = false;

      if (shreejaActions['idle']) shreejaActions['idle'].stop();
      if (shreejaActions['punch']) {
        shreejaActions['punch'].reset();
        shreejaActions['punch'].setLoop(THREE.LoopOnce, 1);
        shreejaActions['punch'].clampWhenFinished = false;
        shreejaActions['punch'].play();
      }
    },
    setMood(m) {
      mood = m;
    },
    setKO(v) {
      ko = v;
      if (v) {
        if (sanjayActions['idle']) sanjayActions['idle'].stop();
        if (sanjayActions['hit']) sanjayActions['hit'].stop();
        if (sanjayActions['defeated']) {
          sanjayActions['defeated'].reset();
          sanjayActions['defeated'].setLoop(THREE.LoopOnce, 1);
          sanjayActions['defeated'].clampWhenFinished = true;
          sanjayActions['defeated'].play();
        }
      } else {
        // Round 2 reset
        if (sanjayActions['defeated']) sanjayActions['defeated'].stop();
        if (sanjayActions['hit']) sanjayActions['hit'].stop();
        if (shreejaActions['punch']) shreejaActions['punch'].stop();
        isPunching = false;
        hitDone = false;
        ht = 0;
        mood = 0;
        if (sanjayActions['idle']) sanjayActions['idle'].reset().fadeIn(0.2).play();
        if (shreejaActions['idle']) shreejaActions['idle'].reset().fadeIn(0.2).play();
      }
    },
    setPhoto(kind, img) {
      const f = kind === 'g' ? gFace : bFace;
      f.img = img;
      drawFace(f);
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (shreejaMixer) shreejaMixer.stopAllAction();
      if (sanjayMixer) sanjayMixer.stopAllAction();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      gFace.t.dispose();
      bFace.t.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      if (loadingEl.parentNode) {
        loadingEl.parentNode.removeChild(loadingEl);
      }
    },
  };
}
