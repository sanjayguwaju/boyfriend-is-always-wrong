import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, resample, weld, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';

global.ProgressEvent = class ProgressEvent {};

class PolyfillFileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result =
        'data:' +
        (blob.type || 'application/octet-stream') +
        ';base64,' +
        Buffer.from(buf).toString('base64');
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    });
  }
}
global.FileReader = PolyfillFileReader;

function createIdleClip(sourceClip, name = 'idle') {
  const tracks = [];
  const duration = 2.0; // 2s smooth breathing loop
  for (const track of sourceClip.tracks) {
    const stride = track.getValueSize();
    const val0 = Array.from(track.values.slice(0, stride));

    if (track.name.endsWith('.position')) {
      const times = [0, 1.0, 2.0];
      const values = [];
      for (const t of times) {
        // subtle ~1.2cm breathing bob on hips
        const bob = Math.sin((t / duration) * Math.PI * 2) * 1.2;
        values.push(val0[0], val0[1] + bob, val0[2]);
      }
      tracks.push(new THREE.VectorKeyframeTrack(track.name, times, values));
    } else if (track.name.endsWith('.quaternion')) {
      const times = [0, 1.0, 2.0];
      const q0 = new THREE.Quaternion().fromArray(val0);
      const values = [];
      for (const t of times) {
        if (track.name.includes('Spine')) {
          const breath = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(1, 0, 0),
            Math.sin((t / duration) * Math.PI * 2) * 0.02
          );
          const q = q0.clone().multiply(breath);
          values.push(q.x, q.y, q.z, q.w);
        } else {
          values.push(val0[0], val0[1], val0[2], val0[3]);
        }
      }
      tracks.push(new THREE.QuaternionKeyframeTrack(track.name, times, values));
    }
  }
  return new THREE.AnimationClip(name, duration, tracks);
}

function convertFbxToRawGlb(fbxPath, clips, materialConfig) {
  const buf = fs.readFileSync(fbxPath);
  const loader = new FBXLoader();
  const obj = loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');

  // Scale down ~100x (Mixamo cm to Three.js meters)
  obj.scale.setScalar(0.01);

  // Apply PBR standard materials
  obj.traverse((child) => {
    if (child.isMesh) {
      if (child.name.includes('Joints')) {
        child.material = new THREE.MeshStandardMaterial({
          color: materialConfig.jointsColor,
          roughness: 0.6,
          metalness: 0.15,
        });
      } else {
        child.material = new THREE.MeshStandardMaterial({
          color: materialConfig.surfaceColor,
          roughness: 0.45,
          metalness: 0.1,
        });
      }
    }
  });

  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      obj,
      (gltf) => resolve(new Uint8Array(gltf)),
      (err) => reject(err),
      { binary: true, animations: clips }
    );
  });
}

async function optimizeGlb(rawGlbBuffer, outputPath) {
  const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
  const doc = await io.readBinary(rawGlbBuffer);

  await doc.transform(
    resample(),
    prune(),
    dedup(),
    weld(),
    meshopt({ encoder: MeshoptEncoder })
  );

  const optimized = await io.writeBinary(doc);
  fs.writeFileSync(outputPath, Buffer.from(optimized));
  const stats = fs.statSync(outputPath);
  console.log(`Saved ${outputPath}: ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size} bytes)`);
  return stats.size;
}

async function main() {
  console.log('--- Converting Shreeja (Punching.fbx) ---');
  const shreejaLoader = new FBXLoader();
  const shreejaBuf = fs.readFileSync('fbx/Punching.fbx');
  const shreejaObj = shreejaLoader.parse(
    shreejaBuf.buffer.slice(shreejaBuf.byteOffset, shreejaBuf.byteOffset + shreejaBuf.byteLength),
    ''
  );
  const rawPunchClip = shreejaObj.animations.find((a) => a.name === 'mixamo.com').clone();
  rawPunchClip.name = 'punch';
  const shreejaIdleClip = createIdleClip(rawPunchClip, 'idle');

  const shreejaRawGlb = await convertFbxToRawGlb(
    'fbx/Punching.fbx',
    [shreejaIdleClip, rawPunchClip],
    {
      surfaceColor: 0xe11d63, // Vibrant hot pink boxing outfit
      jointsColor: 0x3b1626,  // Plum/dark accent
    }
  );
  const shreejaSize = await optimizeGlb(shreejaRawGlb, 'public/models/shreeja.glb');

  console.log('--- Converting Sanjay (Head Hit.fbx + Defeated.fbx) ---');
  const sanjayLoader = new FBXLoader();
  const hitBuf = fs.readFileSync('fbx/Head Hit.fbx');
  const hitObj = sanjayLoader.parse(hitBuf.buffer.slice(hitBuf.byteOffset, hitBuf.byteOffset + hitBuf.byteLength), '');
  const rawHitClip = hitObj.animations.find((a) => a.name === 'mixamo.com').clone();
  rawHitClip.name = 'hit';
  const sanjayIdleClip = createIdleClip(rawHitClip, 'idle');

  const defBuf = fs.readFileSync('fbx/Defeated.fbx');
  const defObj = sanjayLoader.parse(defBuf.buffer.slice(defBuf.byteOffset, defBuf.byteOffset + defBuf.byteLength), '');
  const rawDefClip = defObj.animations.find((a) => a.name === 'mixamo.com').clone();
  rawDefClip.name = 'defeated';

  const sanjayRawGlb = await convertFbxToRawGlb(
    'fbx/Head Hit.fbx',
    [sanjayIdleClip, rawHitClip, rawDefClip],
    {
      surfaceColor: 0x1e66d0, // Boxing royal blue
      jointsColor: 0x0f172a,  // Slate navy accent
    }
  );
  const sanjaySize = await optimizeGlb(sanjayRawGlb, 'public/models/sanjay.glb');

  const totalMb = ((shreejaSize + sanjaySize) / 1024 / 1024).toFixed(2);
  console.log(`\nTOTAL MODEL SIZE: ${totalMb} MB (Target was < 3 MB)`);
}

main().catch((err) => {
  console.error('Conversion failed:', err);
  process.exit(1);
});
