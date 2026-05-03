# Implementation Plan: Clone David Heckhoff 3D Portfolio

## 1. Overview & Analysis
This document outlines the architecture, scroll mechanic, animation systems, and specific implementation steps to clone the real-time 3D portfolio from `https://david-hckh.com/`.

**(Note: Audio player implementation is deferred per user request. Focus is entirely on 3D models and layout)**

### 1.1 Local 3D Assets Discovered (`public/models/`)
*   `character.glb` — The main animated character rig (contains `wave`, `left-desktop`, `t-idle`, `contact-idle`, `idle`).
*   `desk_scene.glb` — The environment and room props for the primary Hero section.
*   `prop_a.glb` & `prop_b.glb` — Additional scene props or floating elements.

### 1.2 How Scroll Works (Architecture)
The UI drives the 3D canvas via a Zustand store (`useStore`).
1.  **State Sync:** A global scroll event listener in `Scene.jsx` computes a normalized `0.0` to `1.0` value based on the total document height minus the viewport height. This writes to `scrollProgress`. It simultaneously checks DOM bounding rects to determine the string `activeSection`.
2.  **Camera Lerping:** Inside the `<Canvas>`, the `CameraRig` hooks into `useFrame`. It segments the `1.0` scroll span into specific thirds. For example, scrolling from `0.0` to `0.33` mathematically interpolates the camera from the `home` variables (`pos`, `target`, `fov`, `bgColor`) directly over to the `about` variations.
3.  **Model Rendering & Visibility:** All 3D Components (`HeroModel`, `ContactModel`, etc.) remain actively mounted. Each runs its own `useFrame` watching `activeSection`. If they are the active section, an internal `opacityRef` lerps to `1.0` (fading them in), otherwise down to `0.0`. If opacity falls below 0.01, `groupRef.visible` is toggled `false` for performance.

### 1.3 How Models & Materials are Colored
Coloring isn't baked into the `.glb`. Instead, we dynamically traverse the meshes on load (via React `useMemo` hooks) to inject `THREE.MeshStandardMaterial`:
*   In `HeroModel`, objects are checked via `name` against JS dictionaries (`DESK_COLORS` & `CHAR_COLORS`).
*   Shadows are enabled per-mesh. Specific nodes like `desktop-plane-1` get `useTexture` code editor projection with `emissive` glow properties, and the face receives a sprite sheet texture (`sprites.png`).

### 1.4 How Animations are Triggered
The `@react-three/drei` hook `useAnimations` retrieves the internal animation tracks from `character.glb`.
*   A `useEffect` hook triggers them directly. For instance, in `HeroModel.jsx`, it fetches `actions['wave']` and `actions['left-desktop']`. It plays the wave once (`THREE.LoopOnce`), and when the `AnimationMixer` fires a `finished` event, it cross-fades into the looping `left-desktop` typing animation.

### 1.5 Identified 3D Engine Issues (To Fix)
*   **Crucial Animation Bug:** `scene.clone(true)` breaks `SkinnedMesh` skeletons across instances. Without `SkeletonUtils.clone()`, multiple character instances conflict and freeze.
*   **Position Discarding:** Moving a skeleton bone directly (e.g., `child.position.y = -4.3`) fails because `AnimationMixer` constantly overwrites local matrix transforms. This offsets placement wildly.
*   **Depth Z-Fighting:** Keeping material transparency turned on (`transparent: true`) indefinitely breaks depth buffers, causing mesh intersections (like hair/teeth) to render in weird orders.

## 2. Todo List

### Phase 1: Clean Up 3D Models & Rigs
- [ ] Install/Import `SkeletonUtils` from `three-stdlib`. Refactor `HeroModel`, `HologramModel`, and `ContactModel` to correctly clone `character.glb`.
- [ ] Group Transforms: Fix placement math by ensuring skeleton models are nested in a parent `<group>` that receives position/scale, instead of injecting hard offsets onto bones during the `useMemo` traversal.
- [ ] Optimize render order: Update `opacityRef` checks in every model to toggle `transparent = false` as soon as opacity goes above `0.99`.

### Phase 2: Color, Layout, & Typography Parity
- [ ] Verify `CHAR_COLORS` and `DESK_COLORS` dictionaries correspond directly to colors from the target site. Map these accurately.
- [ ] Synchronize HTML overlays: Add the definitive typography CSS for `HeroSection` ("WEB DEVELOPER"), matching positioning to the main reference.
- [ ] Ensure textures (`monitor.webp`, `bg.webp`, `sprites.png`) apply to their respective 3D elements properly in the newly wrapped groups.

### Phase 3: Implement `prop_a` & `prop_b` (Projects/Scene Expand)
- [ ] Analyze how `prop_a.glb` and `prop_b.glb` fit into the grand scene (likely floating assets or specific elements for the Projects/Contact section).
- [ ] *[Pending User Input:] Provide the exact animation details mappings to `prop_a`, `prop_b`, and specific camera layout mappings needed for the 3D gallery.*