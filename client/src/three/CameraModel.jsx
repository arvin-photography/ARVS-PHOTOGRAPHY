import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import gsap from 'gsap';
import { MODEL_CENTER, rig } from '../lib/rig';
import { cursorBus, fx, shutter } from '../lib/fx';
import { ANIMATED, mergeStaticMeshes } from './mergeStaticMeshes';
import { liveViewMaterial } from './liveView';

export const MODEL_URL = '/models/dslr_camera.web.glb';
useGLTF.preload(MODEL_URL);

const Z_AXIS = new THREE.Vector3(0, 0, 1);
const _q = new THREE.Quaternion();

/* The DSLR: material fixes, mesh merging, idle float, lens-ring spin, click-to-shoot. */
export default function CameraModel() {
  const { scene } = useGLTF(MODEL_URL);
  const float = useRef();
  const nodes = useRef({});
  const hoverable = useRef(null);

  useLayoutEffect(() => {
    const n = {};
    scene.traverse((o) => {
      if (o.isMesh && o.material) {
        const m = o.material;
        m.envMapIntensity = 1.3;
        // PERF: a transmissive material makes three.js render the whole scene a second
        // time every frame. Fake the lens glass with a cheap, reflective transparent coat.
        if (m.transmission > 0) {
          o.material = new THREE.MeshPhysicalMaterial({
            color: '#0b0d14',
            roughness: 0.03,
            metalness: 0.2,
            clearcoat: 1,
            clearcoatRoughness: 0.02,
            transparent: true,
            opacity: 0.38,
            envMapIntensity: 2.4,
            depthWrite: false,
          });
          m.dispose();
        }
      }
      if (ANIMATED.includes(o.name)) {
        n[o.name] = { obj: o, q: o.quaternion.clone(), p: o.position.clone() };
      }
    });
    // rear LCD: live view of the portrait (useGLTF caches the scene, so only once)
    const screen = scene.getObjectByName('Screen');
    if (screen && !screen.userData.liveView) {
      const mat = liveViewMaterial();
      screen.traverse((o) => {
        if (o.isMesh) {
          o.material.dispose?.();
          o.material = mat;
        }
      });
      screen.userData.liveView = true;
    }
    // PERF: nothing else in the model ever moves → skip per-frame matrix recomputation
    scene.traverse((o) => {
      if (o !== scene && !ANIMATED.includes(o.name)) {
        o.updateMatrix();
        o.matrixAutoUpdate = false;
      }
    });
    // PERF: ~82 draw calls → one per material (useGLTF caches the scene, so only once)
    if (!scene.userData.merged) {
      scene.userData.merged = mergeStaticMeshes(scene);
      if (import.meta.env.DEV) console.info('[camera] draw calls', scene.userData.merged);
    }
    nodes.current = n;

    // 3D shutter-button press, used by fx.shutter()
    fx.pressShutterButton = () => {
      const b = n.ShutterButton?.obj;
      if (!b) return;
      gsap.killTweensOf(b.position);
      gsap.fromTo(
        b.position,
        { y: n.ShutterButton.p.y - 0.014 },
        { y: n.ShutterButton.p.y, duration: 0.35, ease: 'back.out(3)' }
      );
    };
    return () => {
      fx.pressShutterButton = null;
    };
  }, [scene]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const g = float.current;
    if (!g) return;
    const k = rig.idle;
    g.position.y = Math.sin(t * 0.9) * 0.035 * k - rig.intro * 0.25;
    g.rotation.z = Math.sin(t * 0.55) * 0.035 * k;
    g.rotation.x = Math.cos(t * 0.45) * 0.025 * k;
    g.rotation.y = Math.sin(t * 0.3) * 0.06 * k - rig.intro * 0.6;

    // lens rings rotate around the optical (Z) axis as you scroll
    const spin = (name, angle) => {
      const it = nodes.current[name];
      if (!it) return;
      _q.setFromAxisAngle(Z_AXIS, angle);
      it.obj.quaternion.copy(it.q).premultiply(_q);
    };
    spin('Lens_ZoomRing', rig.ring);
    spin('Lens_FocusRing', rig.focus * 2.2);

    // the camera is only clickable while idle in the hero; clear a stale "Shoot" label
    const on = rig.idle > 0.92 && rig.intro < 0.05;
    if (on !== hoverable.current) {
      hoverable.current = on;
      if (!on && cursorBus.override === 'Shoot') cursorBus.set(null);
    }
  });

  const onOver = (e) => {
    e.stopPropagation();
    if (rig.idle > 0.9 && rig.intro < 0.05) cursorBus.set('Shoot');
  };
  const onOut = () => cursorBus.set(null);
  const onClick = (e) => {
    e.stopPropagation();
    if (rig.idle > 0.9 && rig.intro < 0.05) shutter();
  };

  const c = MODEL_CENTER;
  return (
    <group ref={float}>
      {/* pivot the float/rotation around the body centre */}
      <group position={c}>
        <primitive object={scene} position={[-c[0], -c[1], -c[2]]} />
        {/* PERF: pointer events hit a 12-triangle box instead of raycasting
            the model's ~105k triangles on every mouse move */}
        <mesh position={[-0.02 - c[0], 0.54 - c[1], 0.28 - c[2]]} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
          <boxGeometry args={[1.5, 1.1, 1.35]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </group>
    </group>
  );
}
