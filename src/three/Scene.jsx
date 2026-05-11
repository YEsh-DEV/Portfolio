import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useProgress, Environment } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../store/useStore';
import HeroModel from './models/HeroModel';
import HologramModel from './models/HologramModel';
import ContactModel from './models/ContactModel';
import './Scene.css';

// ─── Camera sections config ───────────────────────────────────────────────────
// Pulled back further and FOV reduced for cinematic "telephoto" look.
// This makes the model feel properly proportioned without being overwhelming.
const CAMERA_STATES = {
  home: { pos: [0, 4.2, 14], target: [1.0, 0.4, 0], fov: 32 },
  about: { pos: [0, 1.6, 5.5], target: [0, 1.0, 0], fov: 36 },
  projects: { pos: [0, 4.0, 9.0], target: [0, 0.0, 0], fov: 35 },
  contact: { pos: [0, 1.4, 6.0], target: [0.4, 0.6, 0], fov: 40 },
};

// Warm cream-brown for home — rich enough to provide contrast against the 3D scene
const BG_COLORS = {
  home: new THREE.Color('#ede5d8'),
  about: new THREE.Color('#071230'),
  projects: new THREE.Color('#ede5d8'),
  contact: new THREE.Color('#ebe3d4'),
};

// ─── Smooth Camera Controller ─────────────────────────────────────────────────
function CameraRig() {
  const { camera } = useThree();
  const scene = useThree((s) => s.scene);
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const currentBg = useRef(new THREE.Color('#ede5d8'));
  const lookHelper = useRef(new THREE.Vector3());
  const lerpSpeed = 0.08;

  useFrame(() => {
    const scroll = useStore.getState().scrollProgress;

    let statePos, stateTarget, stateFov, stateBg;

    if (scroll < 0.333) {
      const t = scroll / 0.333;
      statePos = CAMERA_STATES.home.pos.map((v, i) => THREE.MathUtils.lerp(v, CAMERA_STATES.about.pos[i], t));
      stateTarget = CAMERA_STATES.home.target.map((v, i) => THREE.MathUtils.lerp(v, CAMERA_STATES.about.target[i], t));
      stateFov = THREE.MathUtils.lerp(CAMERA_STATES.home.fov, CAMERA_STATES.about.fov, t);
      stateBg = BG_COLORS.home.clone().lerp(BG_COLORS.about, t);
    } else if (scroll < 0.666) {
      const t = (scroll - 0.333) / 0.333;
      statePos = CAMERA_STATES.about.pos.map((v, i) => THREE.MathUtils.lerp(v, CAMERA_STATES.projects.pos[i], t));
      stateTarget = CAMERA_STATES.about.target.map((v, i) => THREE.MathUtils.lerp(v, CAMERA_STATES.projects.target[i], t));
      stateFov = THREE.MathUtils.lerp(CAMERA_STATES.about.fov, CAMERA_STATES.projects.fov, t);
      stateBg = BG_COLORS.about.clone().lerp(BG_COLORS.projects, t);
    } else {
      const t = Math.min((scroll - 0.666) / 0.334, 1.0);
      statePos = CAMERA_STATES.projects.pos.map((v, i) => THREE.MathUtils.lerp(v, CAMERA_STATES.contact.pos[i], t));
      stateTarget = CAMERA_STATES.projects.target.map((v, i) => THREE.MathUtils.lerp(v, CAMERA_STATES.contact.target[i], t));
      stateFov = THREE.MathUtils.lerp(CAMERA_STATES.projects.fov, CAMERA_STATES.contact.fov, t);
      stateBg = BG_COLORS.projects.clone().lerp(BG_COLORS.contact, t);
    }

    targetPos.current.set(...statePos);
    camera.position.lerp(targetPos.current, lerpSpeed);

    targetLook.current.set(...stateTarget);
    lookHelper.current.lerp(targetLook.current, lerpSpeed);
    camera.lookAt(lookHelper.current);

    camera.fov += (stateFov - camera.fov) * lerpSpeed;
    camera.updateProjectionMatrix();

    currentBg.current.lerp(stateBg, lerpSpeed);
    scene.background = currentBg.current;
  });

  return null;
}

// ─── Loading Progress Sync ────────────────────────────────────────────────────
function ProgressSync() {
  const { progress, active } = useProgress();

  useEffect(() => {
    // Update store directly without subscribing to it in this component
    useStore.getState().setLoadProgress(progress);
    
    if (!active && progress === 100) {
      const timer1 = setTimeout(() => {
        useStore.getState().setLoading(false);
        const timer2 = setTimeout(() => useStore.getState().setShowContent(true), 700);
        return () => clearTimeout(timer2);
      }, 800);
      return () => clearTimeout(timer1);
    }
  }, [progress, active]);

  return null;
}

// ─── Scroll Listener ─────────────────────────────────────────────────────────
function useScrollSection() {
  const { setActiveSection, setScrollProgress } = useStore();

  useEffect(() => {
    const SECTIONS = ['home', 'about', 'projects', 'contact'];
    const handler = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? window.scrollY / total : 0);

      let current = 'home';
      for (const id of SECTIONS.slice(1)) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.45) current = id;
        }
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);
}

// ─── Main Scene ───────────────────────────────────────────────────────────────
export default function Scene() {
  useScrollSection();

  return (
    <div className="canvas-root">
      <Canvas
        camera={{ fov: 32, near: 0.05, far: 200, position: [0, 4.2, 14] }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.95, // slightly reduced — keeps clay surfaces soft, not blown
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        shadows="soft"
        dpr={[1, Math.min(window.devicePixelRatio, 2)]}
        onCreated={({ scene }) => {
          // Clay render BG — matches the warm cream floor/ground plane color
          scene.background = new THREE.Color('#F5EFE6');
        }}
      >
        <ProgressSync />
        <CameraRig />

        {/* ── Soft Studio Lighting — Clay Render Aesthetic ── */}

        {/*
          High ambient — clay renders are evenly lit from all sides.
          Warm white, strong enough to lift all surfaces to their true color.
        */}
        <ambientLight intensity={1.1} color="#fff8f0" />

        {/*
          Soft key light — warm, from upper-right front.
          Low intensity — just enough to give gentle directional AO feel.
          Very soft shadow (radius 10) — blurred like baked ambient occlusion.
        */}
        <directionalLight
          position={[8, 10, 6]}
          intensity={0.65}
          color="#fff4e8"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.1}
          shadow-camera-far={60}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
          shadow-bias={-0.0005}
          shadow-radius={10}
        />

        {/* Gentle left fill — prevents any harsh shadows, wraps light around forms */}
        <directionalLight position={[-6, 5, 4]} intensity={0.35} color="#fff0e0" />

        {/*
          Hemisphere — warm cream sky, warm taupe ground.
          Matches the floor/background color for seamless grounding.
        */}
        <hemisphereLight skyColor="#fff5e8" groundColor="#e8d8c0" intensity={0.75} />

        {/* ── 3D Models ── */}
        <Suspense fallback={null}>
          {/* Hero: desk + character scene */}
          <HeroModel />
          {/* About: holographic character */}
          <HologramModel />
          {/* Contact: character + boxes scene */}
          <ContactModel />
        </Suspense>
      </Canvas>
    </div>
  );
}
