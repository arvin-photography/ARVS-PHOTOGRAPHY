import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { pointer, rig } from '../lib/rig';
import { fx } from '../lib/fx';

/* Scroll-driven camera: reads the shared `rig` state (tweened by GSAP) every frame. */
export default function CameraRig() {
  const { camera, size } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const smooth = useRef({ x: 0, y: 0 });
  const last = useRef({ focal: '', dist: '' });

  useFrame((_, dt) => {
    const s = smooth.current;
    const d = 1 - Math.exp(-dt * 3);
    s.x += (pointer.x - s.x) * d;
    s.y += (pointer.y - s.y) * d;

    const k = rig.idle;
    const theta = rig.theta + s.x * 0.22 * k - rig.intro * 1.1;
    const phi = rig.phi - s.y * 0.1 * k + rig.intro * 0.25;
    const radius = rig.radius + rig.intro * 2.6;

    target.set(rig.tx, rig.ty, rig.tz);
    camera.position.set(
      target.x + radius * Math.sin(theta) * Math.cos(phi),
      target.y + radius * Math.sin(phi),
      target.z + radius * Math.cos(theta) * Math.cos(phi)
    );
    camera.lookAt(target);

    camera.fov = rig.fov;
    camera.setViewOffset(size.width, size.height, -rig.shiftX * size.width, -rig.shiftY * size.height, size.width, size.height);
    camera.updateProjectionMatrix();

    // live HUD readouts
    if (fx.hud) {
      const focal = `${Math.round(camera.getFocalLength())}mm`;
      const dist = `${Math.max(0, radius - 0.04).toFixed(2)}m`;
      if (focal !== last.current.focal) fx.hud.focal.textContent = last.current.focal = focal;
      if (dist !== last.current.dist) fx.hud.dist.textContent = last.current.dist = dist;
    }
  });
  return null;
}
