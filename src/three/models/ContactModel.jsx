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

  // Visibility & idle animation
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const section = useStore.getState().activeSection;
    const targetOpacity = section === 'contact' ? 1 : 0;
    opacityRef.current += (targetOpacity - opacityRef.current) * 0.05;
    groupRef.current.visible = opacityRef.current > 0.01;

    groupRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.transparent = true;
        child.material.opacity = opacityRef.current;
      }
    });

    if (section === 'contact') {
      const t = clock.elapsedTime;
      groupRef.current.position.y = -0.6 + Math.sin(t * 0.6) * 0.025;
      groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.04;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[0, -0.6, 0]}
      rotation={[0, 0.15, 0]}
      scale={1.05}
    >
      <primitive object={clonedScene} />
    </group>
  );
}
