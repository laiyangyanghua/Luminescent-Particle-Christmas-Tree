import React, { useState, Suspense, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles, Html } from '@react-three/drei';
import TreeParticles from './components/TreeParticles';
import UIOverlay from './components/UIOverlay';
import GestureHandler from './components/GestureHandler';
import { GestureState } from './types';

const App: React.FC = () => {
  const [isExploded, setIsExploded] = useState(false);
  
  // Use a ref for continuous gesture data to avoid re-rendering the Canvas on every frame
  const gestureRef = useRef<GestureState>({ x: 0.5, y: 0.5, active: false });

  const toggleExplosion = () => {
    setIsExploded((prev) => !prev);
  };

  const handleGesture = useCallback((data: { x: number; y: number; isFist: boolean; isDetected: boolean }) => {
    gestureRef.current = {
      x: data.x,
      y: data.y,
      active: data.isDetected
    };

    // Trigger explosion state change based on Fist detection
    // Add a check to prevent constant state updates if value hasn't changed
    if (data.isDetected) {
       setIsExploded((prev) => {
         if (prev !== data.isFist) return data.isFist;
         return prev;
       });
    }
  }, []);

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black pointer-events-none" />

      <UIOverlay isExploded={isExploded} toggleExplosion={toggleExplosion} />
      
      <GestureHandler onGesture={handleGesture} />

      <Canvas
        camera={{ position: [0, 2, 25], fov: 60 }}
        dpr={[1, 2]} // Support high-DPI screens
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={<Html center className="text-white">Loading Magic...</Html>}>
          {/* Scene Environment */}
          <color attach="background" args={['#050505']} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          {/* Ambient magical sparkles */}
          <Sparkles count={200} scale={20} size={4} speed={0.4} opacity={0.5} color="#fff" />

          {/* Lights */}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#ffddaa" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#aabbff" />

          {/* The Tree */}
          <group position={[0, -2, 0]}>
             <TreeParticles 
               isExploded={isExploded} 
               onInteract={toggleExplosion} 
               gestureRef={gestureRef}
             />
          </group>

          {/* Controls: Rotate up/down/left/right 
              We disable autoRotate if gesture is active to prevent fighting 
          */}
          <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            minDistance={10} 
            maxDistance={50} 
            autoRotate={!isExploded && !gestureRef.current.active}
            autoRotateSpeed={0.5}
            enableDamping={true}
            dampingFactor={0.05}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default App;
