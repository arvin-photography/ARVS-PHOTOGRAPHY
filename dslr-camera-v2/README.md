# DSLR camera – 3D model + viewfinder reveal

## Files
- `dslr_camera.web.glb` – **use this on the site** (1.3 MB). Geometry is meshopt-compressed and textures are WebP, so add `loader.setMeshoptDecoder(MeshoptDecoder)` (from `three/addons/libs/meshopt_decoder.module.js`) as the demo does.
- `dslr_camera.glb` – the same model uncompressed (5.6 MB), for other tools.
- Both: ~109k triangles, PBR materials (clearcoat, a transmissive front lens element), printed markings baked into textures. Lens faces +Z, back/viewfinder faces -Z, bottom sits at y = 0. About 1.4 units wide.
- `dslr_camera.blend` – the Blender source file, if you want to edit the model.
- `index.html` – a working three.js demo of the scroll animation. Serve the folder over http (e.g. `npx serve .`); opening it straight from disk won't load the .glb.

## Named parts you can use in code
| Node | Use |
|---|---|
| `DSLR_Camera` | root – move/rotate/scale the whole camera |
| `ViewfinderAnchor` | empty at the eyepiece – fly the web camera here to "look through" it |
| `LensAnchor` | empty at the front of the lens |
| `Screen` | rear LCD (UVs set up for an image viewed from behind) – put your project on it as live view |
| `ShutterButton` | animate a press when the shot fires |
| `Viewfinder_Glass`, `Lens_Glass`, `Lens_ZoomRing`, `Lens_FocusRing`, `ModeDial` … | everything else is split into named pieces |

## Using your project image
In `index.html`, set `CONFIG.PROJECT_IMAGE = "/img/my-project.jpg"` (3:2 looks best). It goes onto the rear LCD and into the viewfinder.
Timing for each part of the animation lives in `CONFIG.BEATS` (values are 0–1 scroll progress through the section).

## Rebuilding the web file
`npx gltf-transform optimize dslr_camera.glb dslr_camera.web.glb --compress meshopt --texture-compress webp --texture-size 4096 --join false --flatten false --prune false`
(`--prune false` keeps the ViewfinderAnchor/LensAnchor markers.)
