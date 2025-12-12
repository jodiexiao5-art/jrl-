import React from 'react';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export const Effects: React.FC = () => {
  return (
    <EffectComposer enableNormalPass={false}>
      <Bloom 
        luminanceThreshold={0.8} // Only very bright things glow
        luminanceSmoothing={0.2} 
        height={300} 
        intensity={2.0} // Strong cinematic glow
        blendFunction={BlendFunction.ADD}
      />
      <Noise opacity={0.05} />
      <Vignette eskil={false} offset={0.1} darkness={0.6} />
    </EffectComposer>
  );
};