import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useGLTF, useAnimations, useTexture, useVideoTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import useStore from '../../store/useStore';

useGLTF.preload('/models/character.glb');
useGLTF.preload('/models/desk_scene.glb');

// ─── Clay render palette — soft matte toy-like aesthetic ──────────────────────
// "No glossy, metallic, or highly reflective surfaces.
//  Everything looks like soft matte plastic or painted wood."
const DESK_COLORS = {
  'room': '#F6F6F6', // Background cream
  'desk': '#F4F1EC', // Soft white / cream
  'chair': '#F4F1EC', // Cream seat
  'shelf': '#B68035', // Warm brown (Desk legs & shelves)
  'mouse': '#F4F1EC', // Soft white
  'plant': '#8EBB4A', // Main green
  'frame': '#AD9582', // Muted beige
  'blackboard': '#AF9782', // Warm beige
  'music': null,
  'carpet': null,
  'penguin': '#2A2D35', // Dark charcoal
  'penguin-wing-left': '#F4F1EC',
  'penguin-wing-right': '#F4F1EC',
  'shadow-catcher': null,
  'desktop-plane-0': null,
  'desktop-plane-1': null,
};

// ── Carpet texture — smooth concentric rounded-rectangle rings like David's rug ──
function buildCarpetTexture() {
  const S = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d');

  // Helper: draw a single rounded rect
  const rrect = (inset, color) => {
    const x = inset, y = inset;
    const w = S - inset * 2, h = S - inset * 2;
    const r = Math.max(w * 0.16, 8);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();
  };

  // Outer border: warm muted yellow
  rrect(0, '#E7A641');
  // Middle border: soft golden brown
  rrect(40, '#B68035');
  // Inner section: lighter cream-yellow
  rrect(100, '#F4E2A8');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  tex.needsUpdate = true;
  return tex;
}

// ── Character color palette — exact spec from provided color palette image ──
// Reference: boy model with warm skin, dark charcoal shirt, near-black pants,
//            cream shoe soles, warm brown hair.
const CHAR_COLORS = {
  'head': '#EEC4A2', // warm peach skin (#EEC4A2 exact from palette)
  'skin': '#EEC4A2', // same — arms, hands, neck
  'hair': '#A27D65', // beautiful warm brown hair as requested
  'black': '#4E4844', // shirt — dark gray (#4E4844 from palette, dark but not pure black)
  'gray': '#282624', // pants — very dark brown-black (#282624 from palette)
  'white': '#EDEBEB', // shoe soles — soft cream (#EDEBEB from palette)
  'face': null,      // eyes — uses eyesTex texture (unchanged)
};

// Per-part roughness — each body part has its own material personality
const CHAR_ROUGHNESS = {
  'head': 0.78, // skin — soft warm matte, slight subsurface feel
  'skin': 0.78, // arms/hands — same
  'hair': 0.75, // hair — matte but slightly smoother than skin
  'black': 0.84, // shirt — soft fabric, no sheen
  'gray': 0.88, // pants — heavier fabric, most matte
  'white': 0.52, // shoe soles — smooth rubber material
};

/**
 * HeroModel — Premium cinematic desk workspace.
 *
 * Key features:
 * - Monitor 1 (left): animated scrolling code texture (monitor1.jpg)
 * - Monitor 2 (right): static texture (monitor2.jpg), slightly dimmer
 * - Softer shadow maps, reduced harsh directional contribution
 * - Warm brown carpet + cream surfaces matching new palette
 * - Character: softer ambient fill to avoid harsh shadow patches
 * - Local lights: warm key + cool monitor rim + amber carpet bounce
 */
export default function HeroModel() {
  const groupRef = useRef();
  const charGroupRef = useRef();
  const [landed, setLanded] = useState(false);
  const fallY = useRef(10);

  const { scene: charScene, animations: charAnims } = useGLTF('/models/character.glb');
  const { scene: deskScene } = useGLTF('/models/desk_scene.glb');

  const { actions } = useAnimations(charAnims, charGroupRef);

  // Per-instance refs
  const opacityRef = useRef(1);
  const monitorCodeRef = useRef(null); // RIGHT monitor — colorful code, scrolling
  const monitorUIRef = useRef(null); // LEFT monitor  — UI screenshot, subtle
  const scrollOffsetRef = useRef(0);
  const carpetTexRef = useRef(null);
  const floatOffset = useRef(Math.random() * Math.PI * 2);

  // ── Textures ──────────────────────────────────────────────────────────────
  // Fallback textures
  const monitor1Tex = useTexture('/textures/monitor3.jpg');
  const monitor2Tex = useTexture('/textures/monitor2.jpg');
  const bgTex = useTexture('/textures/bg.webp');
  const eyesTex = useTexture('/textures/eyesformodel.png');

  // Video Texture — pointed to monitor_video.mp4 in public/textures/
  // Note: App will suspend until this video is found.
  // If the video is missing, the model will disappear.
  const videoTex = useVideoTexture('/textures/monitor_video1.mp4', {
    muted: true,
    loop: true,
    start: true,
    crossOrigin: 'Anonymous'
  });

  useMemo(() => {
    // monitor1Tex properties
    monitor1Tex.colorSpace = THREE.SRGBColorSpace;
    monitor1Tex.flipY = false;
    monitor1Tex.wrapT = THREE.RepeatWrapping;
    monitor1Tex.wrapS = THREE.ClampToEdgeWrapping;
    monitor1Tex.needsUpdate = true;

    // monitor2Tex properties
    monitor2Tex.colorSpace = THREE.SRGBColorSpace;
    monitor2Tex.flipY = false;
    monitor2Tex.wrapT = THREE.ClampToEdgeWrapping;
    monitor2Tex.wrapS = THREE.ClampToEdgeWrapping;
    monitor2Tex.needsUpdate = true;

    bgTex.colorSpace = THREE.SRGBColorSpace;
    bgTex.flipY = false;

    eyesTex.colorSpace = THREE.SRGBColorSpace;
    eyesTex.flipY = true;
    eyesTex.wrapS = THREE.RepeatWrapping;
    eyesTex.repeat.set(-1, 1);
    eyesTex.offset.set(1, 0);

    // ── Video Texture fitting logic ──
    if (videoTex) {
      videoTex.colorSpace = THREE.SRGBColorSpace;
      videoTex.flipY = false;
      videoTex.wrapS = videoTex.wrapT = THREE.ClampToEdgeWrapping;

      const video = videoTex.image;
      // Zoom out significantly (values > 1.0) using center-based scaling
      // 1.8x zoom out ensures the video fits comfortably inside the monitor bezels
      videoTex.center.set(0.5, 0.5);
      videoTex.repeat.set(1.8, 1.8);
      videoTex.offset.set(0, 0);
    }
  }, [monitor1Tex, monitor2Tex, bgTex, eyesTex, videoTex]);

  // ── Character clone ────────────────────────────────────────────────────────
  const clonedChar = useMemo(() => {
    const clone = SkeletonUtils.clone(charScene);
    clone.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = false;

      const name = child.name.toLowerCase();

      if (name.includes('face')) {
        // Eyes: use the eye texture map (unchanged)
        child.material = new THREE.MeshStandardMaterial({
          map: eyesTex,
          transparent: true,
          alphaTest: 0.1,
          side: THREE.FrontSide,
          roughness: 0.80,
          metalness: 0.0,
          envMapIntensity: 0.0,
        });
      } else {
        // Improved matching: check if name contains any of our palette keys
        const matchedKey = Object.keys(CHAR_COLORS).find(k => k !== 'face' && name.includes(k));

        const color = matchedKey ? CHAR_COLORS[matchedKey] : null;
        const roughness = matchedKey ? (CHAR_ROUGHNESS[matchedKey] ?? 0.85) : 0.85;

        if (color) {
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            roughness,
            metalness: 0.0,
            envMapIntensity: 0.0,
          });
        }
      }
    });

    clone.scale.set(1.02, 1.02, 1.02);
    clone.position.set(0, 0, 0);
    return clone;
  }, [charScene, eyesTex]);

  // Build carpet canvas texture once
  useMemo(() => {
    carpetTexRef.current = buildCarpetTexture();
  }, []);

  // ── Desk scene clone ───────────────────────────────────────────────────────
  const clonedDesk = useMemo(() => {
    const clone = deskScene.clone(true);
    clone.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;

      const name = child.name;

      // ── Hidden ──
      if (name === 'shadow-catcher') {
        child.visible = false;
        return;
      }

      // ── PRIMARY screen (desktop-plane-1) → videoTex ──
      if (name === 'desktop-plane-1') {
        const mat = new THREE.MeshStandardMaterial({
          map: videoTex || monitor1Tex,
          roughness: 0.4,
          metalness: 0.0,
          emissive: new THREE.Color('#2A2D35'), // dark charcoal base
          emissiveMap: videoTex || monitor1Tex,
          emissiveIntensity: 2.2,
          envMapIntensity: 0.0,
        });
        monitorCodeRef.current = mat;
        child.material = mat;
        return;
      }

      // ── SECONDARY screen ──
      if (name.startsWith('desktop-plane-') && name !== 'desktop-plane-0' && name !== 'desktop-plane-1') {
        const mat = new THREE.MeshStandardMaterial({
          map: monitor2Tex,
          roughness: 0.4,
          metalness: 0.0,
          emissive: new THREE.Color('#2A2D35'),
          emissiveMap: monitor2Tex,
          emissiveIntensity: 1.2, // slightly dimmer than monitor 1
          envMapIntensity: 0.0,
        });
        monitorUIRef.current = mat;
        child.material = mat;
        return;
      }

      // ── Monitor bezel/body ──
      if (name === 'desktop-plane-0') {
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#2A2D35'), // dull black / dark charcoal
          roughness: 0.75,
          metalness: 0.0,
        });
        return;
      }

      // ── Music icon ──
      if (name === 'music') {
        child.material = new THREE.MeshStandardMaterial({
          map: bgTex,
          transparent: true,
          alphaTest: 0.1,
          roughness: 0.5,
          envMapIntensity: 0.25,
        });
        return;
      }

      // ── Corkboard / Blackboard ──
      if (name === 'blackboard') {
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#AF9782'), // warm beige base
          roughness: 0.85,
          metalness: 0.0,
          side: THREE.FrontSide,
        });
        child.castShadow = false;
        return;
      }

      // ── Carpet ──
      if (name === 'carpet') {
        child.material = new THREE.MeshStandardMaterial({
          map: carpetTexRef.current,
          roughness: 0.95, // very matte fabric
          metalness: 0.0,
          envMapIntensity: 0.0,
        });
        child.receiveShadow = true;
        return;
      }

      // ── MESHES WITH VERTEX COLORS (Books, Rubik's cube, Pot, Pins, Desk Legs) ──
      if (['shelf', 'plant', 'frame', 'blackboard'].includes(name)) {
        let roughness = 0.85;
        if (name === 'plant') roughness = 0.55;
        if (name === 'shelf') roughness = 0.8;

        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#FFFFFF'), // Pure white to let vertex colors shine
          vertexColors: true, // RESTORE ALL THE ORIGINAL BAKED COLORS!
          roughness: roughness,
          metalness: 0.0,
          envMapIntensity: 0.0,
        });

        if (name === 'plant' || name === 'blackboard') {
          child.castShadow = false;
        }
        if (name === 'plant') {
          child.receiveShadow = false;
        }
        return;
      }

      // ── All other exactly named nodes ──
      const color = DESK_COLORS[name];
      if (color) {
        let roughness = 0.85; // default fallback

        // Exact roughness matching based on prompt
        if (name === 'desk' || name === 'room') roughness = 0.75;
        if (name === 'chair') roughness = 0.65;
        if (name === 'mouse' || name.startsWith('penguin')) roughness = 0.7;

        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          roughness: roughness,
          metalness: 0.0,
          envMapIntensity: 0.0,
        });

        child.material = mat;
      } else {
        // Fallback for completely unknown meshes (preserve their original materials)
        if (child.material) {
          const applyClay = (mat) => {
            if (mat && mat.isMeshStandardMaterial) {
              mat.roughness = 0.85;
              mat.metalness = 0.0;
              mat.envMapIntensity = 0.0;
            }
          };
          if (Array.isArray(child.material)) {
            child.material.forEach(applyClay);
          } else {
            applyClay(child.material);
          }
        }
      }
    });
    return clone;
  }, [deskScene, monitor1Tex, monitor2Tex, bgTex, videoTex]);

  // ── Animation: wave → typing ───────────────────────────────────────────────
  useEffect(() => {
    if (!actions || !landed) return;

    const waveAction = actions['wave'];
    const workAction = actions['left-desktop'] || actions['idle'];

    if (waveAction && workAction) {
      const timer = setTimeout(() => {
        waveAction.reset().setLoop(THREE.LoopOnce, 1);
        waveAction.clampWhenFinished = true;
        waveAction.play();
        workAction.reset().setLoop(THREE.LoopRepeat, Infinity);
      }, 200);

      const mixer = waveAction.getMixer();
      const onFinished = (e) => {
        if (e.action === waveAction) {
          workAction.reset().play();
          workAction.crossFadeFrom(waveAction, 1.2, true);
        }
      };

      mixer.addEventListener('finished', onFinished);
      return () => {
        clearTimeout(timer);
        mixer.removeEventListener('finished', onFinished);
      };
    } else if (workAction) {
      workAction.reset().fadeIn(0.5).play();
      workAction.setLoop(THREE.LoopRepeat, Infinity);
    }
  }, [actions, landed]);

  // ── Per-frame ──────────────────────────────────────────────────────────────
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const section = useStore.getState().activeSection;
    const showContent = useStore.getState().showContent;
    const isHome = section === 'home';

    const t = state.clock.elapsedTime;

    // ── RIGHT monitor (code) — scroll upward + gentle pulse ──
    if (monitorCodeRef.current) {
      // Only scroll if we are NOT using the video texture
      if (monitorCodeRef.current.map !== videoTex) {
        scrollOffsetRef.current += delta * 0.048; // slow, elegant scroll
        monitorCodeRef.current.map.offset.y = scrollOffsetRef.current;
        monitorCodeRef.current.emissiveMap.offset.y = scrollOffsetRef.current;
      }

      monitorCodeRef.current.emissiveIntensity =
        2.0 + Math.sin(t * 1.2 + floatOffset.current) * 0.18;
    }

    // ── LEFT monitor (UI) — static image, very subtle pulse ──
    if (monitorUIRef.current) {
      monitorUIRef.current.emissiveIntensity =
        1.3 + Math.sin(t * 0.8 + floatOffset.current + 1.4) * 0.08;
    }

    if (!isHome || !showContent) {
      opacityRef.current = 0;
      if (groupRef.current.visible) groupRef.current.visible = false;
      return;
    }

    const prevOpacity = opacityRef.current;
    opacityRef.current = 1;

    if (!groupRef.current.visible) {
      groupRef.current.visible = true;
      if (actions) Object.values(actions).forEach(a => a && (a.paused = false));
    }

    if (groupRef.current.visible) {
      const mouse = state.pointer;

      // Fall-in animation
      if (!landed) {
        fallY.current = THREE.MathUtils.lerp(fallY.current, 0, 0.15);
        charGroupRef.current.position.y = fallY.current;
        if (fallY.current < 0.01) {
          fallY.current = 0;
          charGroupRef.current.position.y = 0;
          setLanded(true);
        }
      }

      // Gentle whole-group float — slow, calm
      const floatY = Math.sin(t * 0.55 + floatOffset.current) * 0.045;
      groupRef.current.position.y = -2.1 + floatY;

      // Mouse parallax — smooth, minimal
      groupRef.current.rotation.y = 3.85 + mouse.x * 0.07;
      groupRef.current.rotation.x = mouse.y * 0.055;
    }

    // Material opacity (section transitions)
    if (Math.abs(opacityRef.current - prevOpacity) > 0.001) {
      groupRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
          child.material.opacity = opacityRef.current;
          if (opacityRef.current > 0.99) child.material.transparent = false;
        }
      });
    }
  });

  return (
    <group
      ref={groupRef}
      position={[2.8, -2.1, 0]}
      rotation={[0, 3.85, 0]}
      scale={0.92}
    >
      {/* Desk + environment */}
      <primitive object={clonedDesk} />

      {/* ── Clay render local studio lights ── */}

      {/*
        Soft warm fill — front-left, illuminates character face + desk.
        Large distance, linear decay (=1), low intensity = no hot spots.
        This is the "key" in a clay studio setup.
      */}
      <pointLight
        position={[-1.5, 3.0, 3.5]}
        intensity={1.0}
        color="#F4F1EC" // Soft warm cinematic key
        distance={15}
        decay={1.2}
      />

      {/*
        Warm right fill — balances the key from the right side.
        Keeps the character and desk evenly lit from both sides (wrap lighting).
      */}
      <pointLight
        position={[2.0, 2.0, 3.0]}
        intensity={0.6}
        color="#AF9782" // Warm beige fill
        distance={12}
        decay={1.2}
      />

      {/* Monitor Light Spill */}
      <pointLight
        position={[0.5, 1.2, 0.5]}
        intensity={0.4}
        color="#A0B7D3" // Soft blue monitor glow
        distance={3.5}
        decay={2}
      />


      {/* Character */}
      <group ref={charGroupRef} position={[0, 10, 0]}>
        <primitive object={clonedChar} />
      </group>
    </group>
  );
}
