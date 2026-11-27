import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Model parts that animate stay separate meshes; everything else may be merged.
export const ANIMATED = ['ShutterButton', 'Lens_ZoomRing', 'Lens_FocusRing'];
// …plus parts that get their own material at runtime (the rear LCD shows a live view)
const SEPARATE = [...ANIMATED, 'Screen'];

const GETTERS = ['getX', 'getY', 'getZ', 'getW'];

/* PERF: copy a (possibly quantized / interleaved) glTF geometry into plain float
   buffers, baked into model space, so many meshes can be merged into one draw call. */
function toModelSpace(src, matrix) {
  const g = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv']) {
    const a = src.getAttribute(name);
    if (!a) continue;
    const out = new Float32Array(a.count * a.itemSize);
    for (let i = 0; i < a.count; i++) for (let c = 0; c < a.itemSize; c++) out[i * a.itemSize + c] = a[GETTERS[c]](i);
    g.setAttribute(name, new THREE.BufferAttribute(out, a.itemSize));
  }
  const count = src.getAttribute('position').count;
  const idx = src.index ? Array.from(src.index.array) : Array.from({ length: count }, (_, i) => i);
  if (matrix.determinant() < 0) for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
  g.setIndex(idx);
  g.applyMatrix4(matrix);
  return g;
}

export function mergeStaticMeshes(root) {
  const animated = new Set();
  root.traverse((o) => SEPARATE.includes(o.name) && o.traverse((c) => animated.add(c)));
  const groups = new Map();
  root.traverse((o) => {
    if (!o.isMesh || animated.has(o) || Array.isArray(o.material)) return;
    const key = `${o.material.uuid}|${['normal', 'uv'].filter((n) => o.geometry.getAttribute(n)).join(',')}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  });
  let before = 0;
  let after = 0;
  for (const meshes of groups.values()) {
    before += meshes.length;
    if (meshes.length < 2) {
      after += 1;
      continue;
    }
    const geoms = meshes.map((m) => {
      // matrix relative to the glTF root (the root itself gets positioned by React)
      const rel = m.matrix.clone();
      for (let p = m.parent; p && p !== root; p = p.parent) rel.premultiply(p.matrix);
      return toModelSpace(m.geometry, rel);
    });
    const merged = mergeGeometries(geoms, false);
    geoms.forEach((g) => g.dispose());
    if (!merged) {
      after += meshes.length;
      continue;
    }
    const mesh = new THREE.Mesh(merged, meshes[0].material);
    mesh.name = `merged:${meshes[0].material.name || 'mat'}`;
    mesh.matrixAutoUpdate = false;
    root.add(mesh);
    meshes.forEach((m) => {
      m.parent.remove(m);
      m.geometry.dispose();
    });
    after += 1;
  }
  return { before, after };
}
