import { Suspense, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import CameraModel from './CameraModel';
import CameraRig from './CameraRig';
import { rig } from '../lib/rig';
import { fx } from '../lib/fx';
import { isTouch } from '../lib/support';

/* PERF: drives rendering ourselves, capped at 60 fps. On 120/144 Hz screens the default
   loop would render the scene 2–2.4× more often for no visible gain. Also implements
   pausing (fx.setFrameloop('never')) once the 3D view is hidden. */
function Driver() {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    const MIN_DT = 1000 / 61;
    let raf;
    let last = 0;
    let active = true;
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      if (!active || t - last < MIN_DT) return;
      last = t;
      advance(t / 1000);
    };
    raf = requestAnimationFrame(loop);
    fx.setFrameloop = (mode) => {
      active = mode !== 'never';
    };
    return () => {
      cancelAnimationFrame(raf);
      fx.setFrameloop = null;
    };
  }, [advance]);
  return null;
}

/* PERF: render the contact shadow live only during the intro, then freeze it */
function Shadow() {
  const [frames, setFrames] = useState(Infinity);
  useFrame(() => {
    if (frames === Infinity && rig.intro < 0.002) setFrames(1);
  });
  return <ContactShadows frames={frames} position={[0, -0.02, 0.28]} opacity={0.6} scale={5} blur={2.8} far={1.6} resolution={512} color="#000" />;
}

/* ───────────── canvas ───────────── */
export default function CameraScene() {
  // PERF: adaptive pixel ratio — drops to 1x on slower GPUs, up to 1.5x when there is headroom
  // phones/tablets: 1.25× is visually identical on a small dense screen but ~30% fewer pixels
  const DPR_MAX = isTouch ? 1.25 : 1.5;
  const [dpr, setDpr] = useState(() => Math.min(DPR_MAX, window.devicePixelRatio || 1));
  return (
    <Canvas
      className="gl"
      dpr={dpr}
      frameloop="never"
      camera={{ fov: 32, near: 0.01, far: 60, position: [2, 1.4, 3] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      style={{ touchAction: 'pan-y' }}
    >
      <PerformanceMonitor
        bounds={() => [45, 58]}
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(Math.min(DPR_MAX, window.devicePixelRatio || 1))}
        flipflops={3}
        onFallback={() => setDpr(1)}
      />
      <Driver />
      <CameraRig />

      {/* PERF: one real light; the red/blue rim lights now live in the baked environment
          (free at runtime) instead of two per-pixel spotlights */}
      <ambientLight intensity={0.12} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} color="#fff4e6" />

      <Suspense fallback={null}>
        <CameraModel />
        <Shadow />
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={2.6} position={[2.5, 3, 3]} scale={[5, 2, 1]} />
          <Lightformer form="rect" intensity={1.2} position={[-4, 1.5, 1]} scale={[2, 4, 1]} />
          <Lightformer form="rect" intensity={5} position={[-3.5, 1.6, -2.8]} scale={[3, 3, 1]} color="#ff4a26" />
          <Lightformer form="rect" intensity={2.2} position={[3, 1, -3]} scale={[2.5, 2.5, 1]} color="#9fb6ff" />
          <Lightformer form="circle" intensity={2.5} position={[0, 5, 0]} scale={3} />
          <Lightformer form="rect" intensity={0.8} position={[0, 0.5, -5]} scale={[8, 1, 1]} color="#b8c6ff" />
        </Environment>
      </Suspense>
    </Canvas>
  );
}
