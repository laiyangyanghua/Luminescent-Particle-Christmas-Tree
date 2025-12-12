import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Hand, Disc } from 'lucide-react';

// Declare globals for the script-loaded libraries
declare global {
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

interface GestureHandlerProps {
  onGesture: (data: { x: number; y: number; isFist: boolean; isDetected: boolean }) => void;
}

const GestureHandler: React.FC<GestureHandlerProps> = ({ onGesture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [status, setStatus] = useState<string>('正在初始化...');
  const [isEnabled, setIsEnabled] = useState(false); // User toggle for camera

  useEffect(() => {
    if (!isEnabled) {
      setIsCameraActive(false);
      return;
    }

    let camera: any = null;
    let hands: any = null;

    const onResults = (results: any) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx && videoRef.current) {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw video frame
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          
          // Draw landmarks for feedback
          if (window.drawConnectors && window.drawLandmarks) {
             window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {color: '#10B981', lineWidth: 2});
             window.drawLandmarks(ctx, landmarks, {color: '#EF4444', lineWidth: 1, radius: 2});
          }

          // --- Gesture Logic ---
          // 1. Position: Track Palm Center (Index MCP [9] is stable)
          const x = landmarks[9].x; 
          const y = landmarks[9].y;

          // 2. Fist Detection
          // Compare distance of fingertips to wrist vs MCP to wrist
          // Tips: 8, 12, 16, 20. MCPs: 5, 9, 13, 17. Wrist: 0.
          const wrist = landmarks[0];
          const isFingerFolded = (tipIdx: number, mcpIdx: number) => {
             const tip = landmarks[tipIdx];
             const mcp = landmarks[mcpIdx];
             const distTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
             const distMcp = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);
             // If tip is significantly closer to wrist than mcp is, it's folded
             return distTip < distMcp * 1.1; 
          };

          const indexFolded = isFingerFolded(8, 5);
          const middleFolded = isFingerFolded(12, 9);
          const ringFolded = isFingerFolded(16, 13);
          const pinkyFolded = isFingerFolded(20, 17);

          // Require at least 3 fingers folded for a fist to be robust
          const foldedCount = [indexFolded, middleFolded, ringFolded, pinkyFolded].filter(Boolean).length;
          const isFist = foldedCount >= 3;

          onGesture({
            x: 1 - x, // Mirror horizontal movement
            y: y,
            isFist,
            isDetected: true
          });
          setStatus(isFist ? '检测到：握拳 (炸开)' : '检测到：手掌 (聚合)');
        } else {
          onGesture({ x: 0.5, y: 0.5, isFist: false, isDetected: false });
          setStatus('寻找手势中...');
        }
        ctx.restore();
      }
    };

    const init = async () => {
      if (window.Hands && window.Camera && videoRef.current) {
        hands = new window.Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults(onResults);

        if (videoRef.current) {
          camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current) {
                await hands.send({ image: videoRef.current });
              }
            },
            width: 320,
            height: 240
          });
          
          try {
            await camera.start();
            setIsCameraActive(true);
            setStatus('摄像头已启动');
          } catch (e) {
            console.error(e);
            setStatus('摄像头错误');
          }
        }
      } else {
         setTimeout(init, 500); 
      }
    };

    init();

    return () => {
       if (camera) camera.stop();
       if (hands) hands.close();
    };
  }, [isEnabled, onGesture]);

  return (
    <>
      {/* Floating Camera Toggle Button */}
      {!isEnabled && (
        <button 
          onClick={() => setIsEnabled(true)}
          className="fixed bottom-6 right-6 z-50 bg-white/10 backdrop-blur-md border border-white/20 text-white p-3 rounded-full hover:bg-white/20 transition-all shadow-lg group flex items-center gap-2"
          title="开启手势控制"
        >
          <Camera size={24} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium pr-1">开启手势</span>
        </button>
      )}

      {/* Camera Preview Box */}
      {isEnabled && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-10 duration-500">
           <button 
             onClick={() => setIsEnabled(false)}
             className="bg-black/50 text-white/50 hover:text-white p-1 rounded-full mb-1 hover:bg-red-500/50 transition-colors"
           >
             <CameraOff size={16} />
           </button>
           
           <div className="rounded-xl overflow-hidden shadow-2xl border-2 border-emerald-500/30 bg-black/80 relative group">
            <video ref={videoRef} className="hidden" playsInline />
            <canvas ref={canvasRef} width={320} height={240} className="w-48 h-36 transform -scale-x-100" />
            
            {/* Status Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-emerald-400 font-mono text-center py-1 truncate px-2">
              {status}
            </div>

            {/* Visual Guide Overlay (Commented out as requested) */}
            {/* 
            <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none opacity-80">
               <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur px-2 py-1 rounded-md">
                  <span className="text-sm">✊</span>
                  <span className="text-[10px] text-white font-medium">握拳炸开</span>
               </div>
               <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur px-2 py-1 rounded-md">
                  <span className="text-sm">✋</span>
                  <span className="text-[10px] text-white font-medium">张开聚合</span>
               </div>
               <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur px-2 py-1 rounded-md">
                  <span className="text-sm">↔️</span>
                  <span className="text-[10px] text-white font-medium">移动旋转</span>
               </div>
            </div>
            */}
          </div>
        </div>
      )}
    </>
  );
};

export default GestureHandler;