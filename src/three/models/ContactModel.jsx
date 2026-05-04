import React, { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';

useGLTF.preload('/models/character.glb');

/**
 * ContactModel — character with arms crossed.
 */
export default function ContactModel() {
  const groupRef = useRef();
  const { scene, animations } = useGLTF('/models/character.glb');
  const { actions } = useAnimations(animations, groupRef);
  const opacityRef = useRef(0);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    // Reset internal transforms to ensure component-level positioning works correctly
    clone.position.set(0, 0, 0);
    clone.rotation.set(0, 0, 0);
    clone.scale.set(1, 1, 1);
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          if (child.material.map) {
            child.material.map.colorSpace = THREE.SRGBColorSpace;
            child.material.needsUpdate = true;
          }
          child.material.envMapIntensity = 0.7;
        }
      }
    });
    return clone;
  }, [scene]);

  // Play animations
  useEffect(() => {
    if (!actions) return;
    if (actions['contact-idle']) {
      actions['contact-idle'].reset().fadeIn(0.5).play();
      actions['contact-idle'].setLoop(THREE.LoopRepeat, Infinity);
    } else if (actions['idle']) {
      actions['idle'].reset().fadeIn(0.5).play();
      actions['idle'].setLoop(THREE.LoopRepeat, Infinity);
    }
  }, [actions]);

  // ── Per-frame: visibility & performance optimization ──────────────────
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const section = useStore.getState().activeSection;
    const isContact = section === 'contact';

    // Faster transition speed
    const targetOpacity = isContact ? 1 : 0;
    const prevOpacity = opacityRef.current;
    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, 0.15);

    // Strict visibility toggle
    const shouldBeVisible = opacityRef.current > 0.01;
    if (groupRef.current.visible !== shouldBeVisible) {
      groupRef.current.visible = shouldBeVisible;

      // Pause/Resume animations
      if (actions) {
        Object.values(actions).forEach(action => {
          if (action) action.paused = !shouldBeVisible;
        });
      }
    }

    // Only traverse to update materials if opacity is actually changing
    if (Math.abs(opacityRef.current - prevOpacity) > 0.001) {
      groupRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
          child.material.opacity = opacityRef.current;
          if (opacityRef.current > 0.99) child.material.transparent = false;
        }
      });
    }

    // Procedural movement only when visible
    if (shouldBeVisible) {
      const t = state.clock.elapsedTime;
      // Centered at -1.8 to match the floor level of the other models
      groupRef.current.position.y = -1.8 + Math.sin(t * 0.6) * 0.025;
      groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.04;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[0, -1.8, 0]}
      rotation={[0, 0.15, 0]}
      scale={1.05}
    >
      <primitive object={clonedScene} />
    </group>
  );
}
