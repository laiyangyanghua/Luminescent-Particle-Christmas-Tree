export interface ParticleData {
  initialPositions: Float32Array;
  targetPositions: Float32Array;
  colors: Float32Array;
}

export interface TreeControlsProps {
  isExploded: boolean;
  toggleExplosion: () => void;
}

export interface GestureState {
  x: number;
  y: number;
  active: boolean;
}
