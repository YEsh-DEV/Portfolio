import React, { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import useStore from '../../store/useStore';

useGLTF.preload('/models/character.glb');
useGLTF.preload('/models/desk_scene.glb');

// ─── Color palette for desk scene nodes ─────────────────────────────────────
const DESK_COLORS = {
  'room': '#FFFFFF',  // bright white to render as cream under lights
  'chair': '#F5F3EE',  // very warm white chair
  'shelf': '#DDD0BE',  // lighter warm wood
  'mouse': '#EFEFEF',  // light gray mouse
  'desktop-plane-0': '#2C2C2C',  // monitor bezel (keep)
  'desktop-plane-1': null,       // texture (keep)
  'plant': '#6DBF3E',  // brighter green — reference has vivid lime-green
  'frame': '#B8A48C',  // lighter tan frame
  'blackboard': '#3A5C3A',  // deep forest green (reference has dark green board)
  'music': null,       // texture (keep)
  'carpet': '#E8A020',  // golden amber — reference is warm yellow-orange, NOT bright orange
  'penguin': '#1A1A1A',  // (keep)
  'penguin-wing-left': '#1A1A1A',  // (keep)
  'penguin-wing-right': '#1A1A1A',  // (keep)
  'shadow-catcher': null,       // (keep)
};

// ─── Color palette for character mesh parts ─────────────────────────────────
const CHAR_COLORS = {
  'black': '#1A1A1A',   // very dark — hair stays dark
  'gray': '#111111',   // near-black pants (reference character wears dark outfit)
  'white': '#1A1A1A',   // black t-shirt (keep dark)
  'head': '#E8C49A',   // slightly more golden skin tone
  'skin': '#E8C49A',   // match head
  'face': null,        // texture (keep)
};

/**
 * HeroModel — The full desk + room scene + character sitting.
 * 
 * Animation sequence:
 *   1. Character starts with "wave" (looking back, waving hello)
 *   2. Crossfades to "left-desktop" (working at the laptop)
 * 
 * Uses SkeletonUtils.clone() for the character to properly handle
 * skinned mesh transforms (scale, position).
 */
export default function HeroModel() {
  const groupRef = useRef();
  const charGroupRef = useRef();

  // Load models
  const { scene: charScene, animations: charAnims } = useGLTF('/models/character.glb');
  const { scene: deskScene } = useGLTF('/models/desk_scene.glb');

  // Animations bind to charGroupRef so bones are inside the ref
  const { actions } = useAnimations(charAnims, charGroupRef);
  const opacityRef = useRef(1);

  // Load textures
  const monitorTex = useTexture('/textures/monitor.webp');
  const spritesTex = useTexture('/textures/sprites.png');
  const bgTex = useTexture('/textures/bg.webp');
  const eyesTex = useTexture('/textures/eyesformodel.png');

  // Configure textures
  useMemo(() => {
    [monitorTex, spritesTex, bgTex].forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.flipY = false;
    });

    // Eye texture specific config — flipped to correct "upside down" issue
    eyesTex.colorSpace = THREE.SRGBColorSpace;
    eyesTex.flipY = true; 
    eyesTex.wrapS = THREE.RepeatWrapping;
    eyesTex.repeat.set(-1, 1);
    eyesTex.offset.set(1, 0);
  }, [monitorTex, spritesTex, bgTex, eyesTex]);

  // ── Clone & color the character (SkeletonUtils for proper skinned mesh) ──
  const clonedChar = useMemo(() => {
    const clone = SkeletonUtils.clone(charScene);
    clone.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = false; // Disable to prevent dark shadows from the desk falling on the char

      const name = child.name.toLowerCase();

      if (name === 'face') {
        child.material = new THREE.MeshStandardMaterial({
          map: eyesTex,
          transparent: true,
          alphaTest: 0.1,
          side: THREE.FrontSide,
          roughness: 0.8,
          envMapIntensity: 0.3,
        });
      } else {
        const color = CHAR_COLORS[name];
        if (color) {
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            roughness: name === 'skin' || name === 'head' ? 0.7 : 0.5,
            metalness: 0.0,
            envMapIntensity: 0.5,
          });
        }
      }
    });

    // Scale character to match desk proportions (character is ~3x larger)
    // and position at the chair location in the desk scene
    clone.scale.set(0.78, 0.78, 0.78);
    clone.position.set(0, 0.22, 0);

    return clone;
  }, [charScene, spritesTex]);

  // ── Clone & color the desk scene ─────────────────────────────────────────
  const clonedDesk = useMemo(() => {
    const clone = deskScene.clone(true);
    clone.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = false; // Disable by default to keep the scene bright and avoid table shadows

      const name = child.name;
      console.log('DESK MESH:', name);

      // Shadow catcher — transparent plane that only receives shadows
      if (name === 'shadow-catcher') {
        child.visible = false; // Hide this to remove the ugly black blob
        return;
      }

      // Monitor screen — code editor texture with emissive glow
      if (name === 'desktop-plane-1') {
        child.material = new THREE.MeshStandardMaterial({
          map: monitorTex,
          roughness: 0.9, // Increased roughness to remove bright glare/reflections
          metalness: 0.0,
          emissive: new THREE.Color('#ffffff'),
          emissiveMap: monitorTex,
          emissiveIntensity: 1.2,
          envMapIntensity: 0.0, // Remove environment reflections from screen
        });
        return;
      }

      // Music icon — uses the bg.webp sprite
      if (name === 'music') {
        child.material = new THREE.MeshStandardMaterial({
          map: bgTex,
          transparent: true,
          alphaTest: 0.1,
          roughness: 0.5,
          envMapIntensity: 0.3,
        });
        return;
      }

      // Desktop bezel
      if (name === 'desktop-plane-0') {
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#E0E0E0'),
          roughness: 0.25,
          metalness: 0.3,
          envMapIntensity: 0.6,
          side: THREE.FrontSide,
        });
        return;
      }



      // Blackboard — render front side only to prevent artifact
      if (name === 'blackboard') {
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#3D5C3D'),
          roughness: 0.8,
          metalness: 0.0,
          side: THREE.FrontSide,
          envMapIntensity: 0.3,
        });
        child.castShadow = false;
        return;
      }

      // All other nodes — use the color map
      const color = DESK_COLORS[name];
      if (color) {
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          roughness: name === 'carpet' ? 0.9 : 0.4, // Increased contrast (was 0.55)
          metalness: name === 'chair' ? 0.1 : 0.0,
          envMapIntensity: 1.2, // Increased contrast (was 0.5)
        });
      }
    });
    return clone;
  }, [deskScene, monitorTex, bgTex]);

  // ── Animation sequence: wave → left-desktop ──────────────────────────────
  useEffect(() => {
    if (!actions) return;

    const waveAction = actions['wave'];
    const workAction = actions['left-desktop'] || actions['idle'];

    if (waveAction && workAction) {
      // 1. Start with the work action (typing at desk)
      workAction.reset().play();
      workAction.setLoop(THREE.LoopRepeat, Infinity);

      // 2. Delay the wave by 2.5 seconds so the user has time to see it after load
      const timer = setTimeout(() => {
        waveAction.reset().setLoop(THREE.LoopOnce, 1);
        waveAction.clampWhenFinished = true;
        waveAction.play();
        waveAction.crossFadeFrom(workAction, 0.5, true);
      }, 2000);

      // 3. When wave finishes → crossfade smoothly back to working
      const mixer = waveAction.getMixer();
      const onFinished = (e) => {
        if (e.action === waveAction) {
          workAction.reset().play();
          workAction.crossFadeFrom(waveAction, 0.8, true);
        }
      };

      mixer.addEventListener('finished', onFinished);
      return () => {
        clearTimeout(timer);
        mixer.removeEventListener('finished', onFinished);
      };
    } else if (workAction) {
      // Fallback: just play work/idle
      workAction.reset().fadeIn(0.5).play();
      workAction.setLoop(THREE.LoopRepeat, Infinity);
    }
  }, [actions]);

  // ── Per-frame: visibility & performance optimization ──────────────────
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const section = useStore.getState().activeSection;
    const isHome = section === 'home';
    
    // HARD CUT: If we are NOT on the home section, the hero model MUST be invisible immediately.
    // This prevents it from bleeding into the About or other sections.
    if (!isHome) {
      opacityRef.current = 0;
      if (groupRef.current.visible) groupRef.current.visible = false;
      return;
    }

    // Faster transition speed
    const targetOpacity = 1; // Since we hard cut for !isHome, target is always 1 here
    const prevOpacity = opacityRef.current;
    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, 0.2);
    
    // Strict visibility toggle
    const shouldBeVisible = opacityRef.current > 0.01;
    if (groupRef.current.visible !== shouldBeVisible) {
      groupRef.current.visible = shouldBeVisible;
      
      // Pause/Resume animations to save CPU
      if (actions) {
        Object.values(actions).forEach(action => {
          if (action) action.paused = !shouldBeVisible;
        });
      }
    }

    if (shouldBeVisible) {
      const mouse = state.pointer;
      // Base rotation 3.85 + slow continuous rotation + mouse parallax
      groupRef.current.rotation.y = 3.85 + (state.clock.elapsedTime * 0.05) + (mouse.x * 0.3);
      groupRef.current.rotation.x = mouse.y * 0.1;
    }

    // Only traverse to update materials if opacity is actually changing
    if (Math.abs(opacityRef.current - prevOpacity) > 0.001) {
      groupRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
          child.material.opacity = opacityRef.current;
          // Optimization: if fully opaque, disable transparency to help depth sorting
          if (opacityRef.current > 0.99) {
             child.material.transparent = false;
          }
        }
      });
    }
  });

  return (
    <group
      ref={groupRef}
      position={[2.2, -1.8, 0]}
      rotation={[0, 3.85, 0]}
      scale={0.8}

    >
      {/* Desk scene (room, desk, chair, decorations) */}
      <primitive object={clonedDesk} />

      {/* Hero Fill Light — ensures the character is always clearly visible regardless of global lighting */}
      <pointLight position={[-0.5, 2.5, 2]} intensity={5} color="#FFF8F0" distance={6} decay={2} />
      <pointLight position={[1, 1, 1.5]} intensity={2} color="#FFFFFF" distance={4} decay={2} />

      {/* Character — scale/position set on clonedChar via SkeletonUtils */}
      <group ref={charGroupRef}>
        <primitive object={clonedChar} />
      </group>
    </group>
  );
}
