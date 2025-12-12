import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GestureState } from '../types';

interface TreeParticlesProps {
  isExploded: boolean;
  onInteract: () => void;
  gestureRef: React.MutableRefObject<GestureState>;
}

const PARTICLE_COUNT = 4000;
const TREE_HEIGHT = 12;
const TREE_BASE_RADIUS = 5;

// Utility to generate random point in a sphere (for explosion state)
const randomSpherePoint = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  return { x, y, z };
};

const TreeParticles: React.FC<TreeParticlesProps> = ({ isExploded, onInteract, gestureRef }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  // Generate particle data once
  const { treePositions, explodedPositions, colors } = useMemo(() => {
    const tPositions = new Float32Array(PARTICLE_COUNT * 3);
    const ePositions = new Float32Array(PARTICLE_COUNT * 3);
    const cData = new Float32Array(PARTICLE_COUNT * 3);
    const color = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // --- Tree Shape Generation (Spiral Cone) ---
      const y = (i / PARTICLE_COUNT) * TREE_HEIGHT - (TREE_HEIGHT / 2); // Height from bottom to top
      const progress = (y + TREE_HEIGHT / 2) / TREE_HEIGHT; // 0 to 1
      
      // Radius decreases as we go up
      const radius = TREE_BASE_RADIUS * (1 - progress) + (Math.random() * 0.5); 
      
      // Spiral angle
      const angle = i * 0.5 + Math.random() * 0.2;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Add a little noise to make it organic
      tPositions[i * 3] = x + (Math.random() - 0.5) * 0.5;
      tPositions[i * 3 + 1] = y + (Math.random() - 0.5) * 0.5;
      tPositions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.5;

      // --- Exploded Shape Generation (Random Cloud) ---
      const sphere = randomSpherePoint(15 + Math.random() * 10);
      ePositions[i * 3] = sphere.x;
      ePositions[i * 3 + 1] = sphere.y;
      ePositions[i * 3 + 2] = sphere.z;

      // --- Colors ---
      // Mostly green, with some "ornaments" (Red, Gold, Blue)
      const random = Math.random();
      if (random > 0.95) {
        color.setHex(0xff0000); // Red ornament
      } else if (random > 0.90) {
        color.setHex(0xffd700); // Gold ornament
      } else if (random > 0.88) {
        color.setHex(0x00bfff); // Blue ornament
      } else {
        // Varied greens
        color.setHSL(0.3 + Math.random() * 0.1, 0.8, 0.4 + Math.random() * 0.4); 
      }

      cData[i * 3] = color.r;
      cData[i * 3 + 1] = color.g;
      cData[i * 3 + 2] = color.b;
    }

    return {
      treePositions: tPositions,
      explodedPositions: ePositions,
      colors: cData
    };
  }, []);

  // Initialize current positions to tree positions
  const currentPositions = useMemo(() => new Float32Array(treePositions), [treePositions]);

  useFrame(() => {
    if (!geometryRef.current || !pointsRef.current) return;

    // --- Particle Animation ---
    const positions = geometryRef.current.attributes.position.array as Float32Array;
    const target = isExploded ? explodedPositions : treePositions;
    const speed = isExploded ? 0.04 : 0.05;

    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      positions[i] += (target[i] - positions[i]) * speed;
      if (!isExploded && i % 3 === 1) { // subtle y-axis bobbing
         positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.002;
      }
    }
    geometryRef.current.attributes.position.needsUpdate = true;
    
    // --- Rotation Logic ---
    const gesture = gestureRef.current;
    if (gesture.active) {
       // Hand control mode
       // Map X (0..1) to Rotation Y (-PI to PI) - Left/Right
       const targetRotY = (gesture.x - 0.5) * Math.PI * 3;
       
       // Map Y (0..1) to Rotation X (-PI/4 to PI/4) - Up/Down tilt
       // Note: Inverting Y because hand up usually means "look up" (tilt back) or "lift object"
       const targetRotX = (gesture.y - 0.5) * Math.PI;

       // Smooth interpolation
       pointsRef.current.rotation.y += (targetRotY - pointsRef.current.rotation.y) * 0.1;
       pointsRef.current.rotation.x += (targetRotX - pointsRef.current.rotation.x) * 0.1;

    } else if (!isExploded) {
       // Auto rotation mode
       pointsRef.current.rotation.y += 0.002;
       // Return to upright
       pointsRef.current.rotation.x += (0 - pointsRef.current.rotation.x) * 0.05;
    }
  });

  return (
    <points 
      ref={pointsRef} 
      onClick={(e) => {
        e.stopPropagation();
        onInteract();
      }}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={currentPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default TreeParticles;
