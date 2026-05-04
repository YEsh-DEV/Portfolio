import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useProgress, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../store/useStore';
import HeroModel from './models/HeroModel';
import HologramModel from './models/HologramModel';
import ContactModel from './models/ContactModel';
import './Scene.css';

// ─── Camera sections config ───────────────────────────────────────────────────────────────────────────────────
const CAMERA_STATES = {
  home: { pos: [0, 1.5, 6], target: [0.8, 0.5, 0], fov: 35 },
  about: { pos: [0, 1.6, 5.5], target: [0, 1.0, 0], fov: 36 },
  projects: { pos: [0, 4.0, 9.0], target: [0, 0.0, 0], fov: 35 },
  contact: { pos: [0, 1.4, 6.0], target: [0.4, 0.6, 0], fov: 40 },
};

const BG_COLORS = {
  home: new THREE.Color('#EDE8DF'),
  about: new THREE.Color('#071230'),
  projects: new THREE.Color('#EDE8DF'),
  contact: new THREE.Color('#EDE9E0'),
};

// ─── Smooth Camera Controller ─────────────────────────────────────────────────
function CameraRig() {
  const { camera } = useThree();
  const scene = useThree((s) => s.scene);
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const currentBg = useRef(new THREE.Color('#EDE8DF'));
  const lookHelper = useRef(new THREE.Vector3());
  const lerpSpeed = 0.08;

  useFrame(() => {
    const scroll = useStore.getState().scrollProgress;

    // We have 4 sections, so scroll goes from 0 to 1.
    // 0.00 to 0.33 = home to about
    // 0.33 to 0.66 = about to projects
    // 0.66 to 1.00 = projects to contact

    let statePos, stateTarget, stateFov, stateBg;

    if (scroll < 0.333) {
      const t = scroll / 0.333;
      statePos = [
        THREE.MathUtils.lerp(CAMERA_STATES.home.pos[0], CAMERA_STATES.about.pos[0], t),
        THREE.MathUtils.lerp(CAMERA_STATES.home.pos[1], CAMERA_STATES.about.pos[1], t),
        THREE.MathUtils.lerp(CAMERA_STATES.home.pos[2], CAMERA_STATES.about.pos[2], t)
      ];
      stateTarget = [
        THREE.MathUtils.lerp(CAMERA_STATES.home.target[0], CAMERA_STATES.about.target[0], t),
        THREE.MathUtils.lerp(CAMERA_STATES.home.target[1], CAMERA_STATES.about.target[1], t),
        THREE.MathUtils.lerp(CAMERA_STATES.home.target[2], CAMERA_STATES.about.target[2], t)
      ];
      stateFov = THREE.MathUtils.lerp(CAMERA_STATES.home.fov, CAMERA_STATES.about.fov, t);
      stateBg = BG_COLORS.home.clone().lerp(BG_COLORS.about, t);
    } else if (scroll < 0.666) {
      const t = (scroll - 0.333) / 0.333;
      statePos = [
        THREE.MathUtils.lerp(CAMERA_STATES.about.pos[0], CAMERA_STATES.projects.pos[0], t),
        THREE.MathUtils.lerp(CAMERA_STATES.about.pos[1], CAMERA_STATES.projects.pos[1], t),
        THREE.MathUtils.lerp(CAMERA_STATES.about.pos[2], CAMERA_STATES.projects.pos[2], t)
      ];
      stateTarget = [
        THREE.MathUtils.lerp(CAMERA_STATES.about.target[0], CAMERA_STATES.projects.target[0], t),
        THREE.MathUtils.lerp(CAMERA_STATES.about.target[1], CAMERA_STATES.projects.target[1], t),
        THREE.MathUtils.lerp(CAMERA_STATES.about.target[2], CAMERA_STATES.projects.target[2], t)
      ];
      stateFov = THREE.MathUtils.lerp(CAMERA_STATES.about.fov, CAMERA_STATES.projects.fov, t);
      stateBg = BG_COLORS.about.clone().lerp(BG_COLORS.projects, t);
    } else {
      const t = Math.min((scroll - 0.666) / 0.334, 1.0);
      statePos = [
        THREE.MathUtils.lerp(CAMERA_STATES.projects.pos[0], CAMERA_STATES.contact.pos[0], t),
        THREE.MathUtils.lerp(CAMERA_STATES.projects.pos[1], CAMERA_STATES.contact.pos[1], t),
        THREE.MathUtils.lerp(CAMERA_STATES.projects.pos[2], CAMERA_STATES.contact.pos[2], t)
      ];
      stateTarget = [
        THREE.MathUtils.lerp(CAMERA_STATES.projects.target[0], CAMERA_STATES.contact.target[0], t),
        THREE.MathUtils.lerp(CAMERA_STATES.projects.target[1], CAMERA_STATES.contact.target[1], t),
        THREE.MathUtils.lerp(CAMERA_STATES.projects.target[2], CAMERA_STATES.contact.target[2], t)
      ];
      stateFov = THREE.MathUtils.lerp(CAMERA_STATES.projects.fov, CAMERA_STATES.contact.fov, t);
      stateBg = BG_COLORS.projects.clone().lerp(BG_COLORS.contact, t);
    }

    // Lerp camera position smoothly
    targetPos.current.set(...statePos);
    camera.position.lerp(targetPos.current, lerpSpeed);

    // Lerp look-at smoothly
    targetLook.current.set(...stateTarget);
    lookHelper.current.lerp(targetLook.current, lerpSpeed);
    camera.lookAt(lookHelper.current);

    // Lerp FOV smoothly
    camera.fov += (stateFov - camera.fov) * lerpSpeed;
    camera.updateProjectionMatrix();

    // Lerp background color
    currentBg.current.lerp(stateBg, lerpSpeed);
    scene.background = currentBg.current;
  });

  return null;
}

// ─── Loading Progress Sync ────────────────────────────────────────────────────
function ProgressSync() {
  const { progress, active } = useProgress();
  const { setLoadProgress, setLoading } = useStore();

  useEffect(() => {
    setLoadProgress(progress);
    if (!active && progress === 100) {
      setTimeout(() => setLoading(false), 800);
    }
  }, [progress, active]);

  return null;
}

// ─── Scroll Listener (outside Canvas) ────────────────────────────────────────
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
    handler(); // run once on mount
    return () => window.removeEventListener('scroll', handler);
  }, []);
}

// ─── Main Scene ───────────────────────────────────────────────────────────────
export default function Scene() {
  useScrollSection();

  return (
    <div className="canvas-root">
      <Canvas
        camera={{ fov: 35, near: 0.05, far: 200, position: [0, 1.5, 6] }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
        shadows="soft"
        dpr={[1, Math.min(window.devicePixelRatio, 2)]}
      >
        <fog attach="fog" args={['#f5f3ee', 8, 20]} />
        <ProgressSync />
        <CameraRig />

        {/* ── Lighting ── */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.1}
          shadow-camera-far={50}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        <directionalLight position={[-5, 3, -2]} intensity={0.4} />
        <hemisphereLight skyColor={"#ffffff"} groundColor={"#f5e6d3"} intensity={0.6} />

        {/* ── Environment for PBR textures — apartment gives warm/neutral lighting ── */}
        <Environment preset="apartment" background={false} />

        {/* ── 3D Models ── */}k
        <Suspense fallback={null}>
          {/* Hero: desk + character scene */}
          <HeroModel />
          {/* About: holographic character */}
          <HologramModel />
          {/* Contact: character + boxes scene */}
          <ContactModel />
        </Suspense>

        {/* ── Ground shadow (hero only) ── */}
        <ContactShadows
          position={[0, -1.5, 0]}
          opacity={0.4}
          scale={10}
          blur={2}
          far={4}
        />
      </Canvas>
    </div>
  );
}
