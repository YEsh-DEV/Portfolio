import React, { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';

useGLTF.preload('/models/character.glb');

// ─── Hologram GLSL Shader ─────────────────────────────────────────────────────
const hologramVertexShader = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const hologramFragmentShader = /* glsl */`
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    // Scan line effect
    float scanLine = step(0.5, fract(vPosition.y * 8.0 - uTime * 1.5));
    float lineAlpha = mix(0.7, 1.0, scanLine);

    // Edge glow (fresnel-like)
    float fresnel = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    fresnel = pow(fresnel, 1.5);

    // Base hologram color — bright cyan/blue
    vec3 color = vec3(0.0, 0.78, 1.0);
    color = mix(color, vec3(0.2, 0.9, 1.0), fresnel);

    // Flicker
    float flicker = 0.92 + 0.08 * sin(uTime * 18.0 + vPosition.y * 5.0);

    float alpha = (0.55 + fresnel * 0.45) * lineAlpha * flicker * uOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * HologramModel — shown in the About section.
 * Renders the character with a glowing blue hologram shader.
 */
export default function HologramModel() {
  const groupRef = useRef();
  const ringRef = useRef();
  const diskRef = useRef();
  const lightRef = useRef();
  const { scene, animations } = useGLTF('/models/character.glb');
  const { actions } = useAnimations(animations, groupRef);
  const opacityRef = useRef(0);
  const timeRef = useRef(0);

  // Create hologram material
  const hologramMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: hologramVertexShader,
    fragmentShader: hologramFragmentShader,
    uniforms: {
      uTime:    { value: 0 },
      uOpacity: { value: 0 },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), []);

  // Clone and apply hologram material to all meshes
  const hologramScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (child.isMesh) {
        child.material = hologramMaterial;
      }
    });
    return clone;
  }, [scene, hologramMaterial]);

  // Play animations
  useEffect(() => {
    if (!actions) return;
    if (actions['t-idle']) {
        actions['t-idle'].reset().fadeIn(0.5).play();
        actions['t-idle'].setLoop(THREE.LoopRepeat, Infinity);
    } else if (actions['idle']) {
        actions['idle'].reset().fadeIn(0.5).play();
        actions['idle'].setLoop(THREE.LoopRepeat, Infinity);
    }
  }, [actions]);

  // ── Per-frame: visibility & performance optimization ──────────────────
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const section = useStore.getState().activeSection;
    const isAbout = section === 'about';

    // HARD CUT: If we are NOT on the about section, the hologram MUST be invisible immediately.
    // This prevents it from bleeding into the Hero or other sections.
    if (!isAbout) {
      opacityRef.current = 0;
      if (groupRef.current.visible) groupRef.current.visible = false;
      return;
    }

    // Faster transition speed for other sections
    const targetOpacity = isAbout ? 1 : 0;
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

    // Slow rotation when visible
    if (shouldBeVisible) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.25;
    }

    // Update shared material uniforms once (NO TRAVERSAL NEEDED)
    hologramMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    hologramMaterial.uniforms.uOpacity.value = opacityRef.current;

    // Update pedestal elements via refs
    if (ringRef.current) {
      ringRef.current.material.opacity = 0.6 * opacityRef.current;
      ringRef.current.visible = shouldBeVisible;
    }
    if (diskRef.current) {
      diskRef.current.material.opacity = 0.3 * opacityRef.current;
      diskRef.current.visible = shouldBeVisible;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 4 * opacityRef.current;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[0, -0.2, 0]}
      scale={1.1}
    >
      <primitive object={hologramScene} />

      {/* Glowing pedestal ring */}
      <mesh ref={ringRef} position={[0, -0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.72, 64]} />
        <meshBasicMaterial color="#00AAFF" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner disk glow */}
      <mesh ref={diskRef} position={[0, -0.66, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 64]} />
        <meshBasicMaterial color="#0055AA" transparent opacity={0} />
      </mesh>
      {/* Spotlight cone from below */}
      <pointLight ref={lightRef} position={[0, -0.3, 0]} intensity={0} color="#00AAFF" distance={3} />
    </group>
  );
}

