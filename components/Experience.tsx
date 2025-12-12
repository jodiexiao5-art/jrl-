
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, OrbitControls } from '@react-three/drei';
import { TreeParticles } from './TreeParticles.tsx';
import { Ornaments } from './Ornaments.tsx';
import { PhotoCloud } from './PhotoCloud.tsx';
import { Effects } from './Effects.tsx';
import { CONFIG } from '../constants.ts';
import { TreeState, ExperienceProps } from '../types.ts';
import * as THREE from 'three';
import { easing } from 'maath';

export const Experience: React.FC<ExperienceProps> = ({ 
  treeState, 
  photos, 
  activePhotoId, 
  onPhotoClick, 
  onExitZoom,
  rotation 
}) => {
  const targetStateValue = treeState === TreeState.TREE_SHAPE ? 1 : 0;
  const groupRef = useRef<THREE.Group>(null);
  
  // Ref for smooth rotation
  const rotRef = useRef(0);

  useFrame((state, delta) => {
    // Smoothly damp the rotation based on hand input or auto-rotate
    const targetRot = rotation !== 0 ? rotation : state.clock.elapsedTime * 0.1;
    
    // If user is controlling (rotation != 0), go there. Else spin slowly.
    // Actually, let's just add the hand input to the base rotation
    if (rotation !== 0) {
        easing.damp(groupRef.current!.rotation, 'y', -rotation, 0.5, delta);
    } else {
        groupRef.current!.rotation.y += delta * 0.1;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 28]} fov={45} />
      {/* Disable Orbit Controls when in Photo Zoom to avoid clipping issues */}
      <OrbitControls 
        enabled={treeState !== TreeState.PHOTO_ZOOM}
        enablePan={false} 
        minDistance={10} 
        maxDistance={50} 
        maxPolarAngle={Math.PI / 1.5}
      />

      {/* Lighting: Warm & Festive */}
      <ambientLight intensity={0.3} color={CONFIG.COLOR_MATTE_GREEN} />
      
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={800} 
        color={CONFIG.COLOR_GOLD} 
        castShadow 
      />
      
      <pointLight position={[-10, 5, -10]} intensity={200} color={CONFIG.COLOR_RED} />
      <spotLight position={[0, -10, 5]} intensity={300} color={CONFIG.COLOR_GOLD} />

      <Environment preset="night" background={false} />

      <group ref={groupRef}>
        {/* Core Tree Structure */}
        <TreeParticles targetState={targetStateValue} />

        {/* Standard Ornaments: Gold & Red */}
        <Ornaments 
            count={100} 
            type="SPHERE" 
            color={CONFIG.COLOR_GOLD} 
            targetState={targetStateValue} 
        />
        <Ornaments 
            count={50} 
            type="BOX" 
            color={CONFIG.COLOR_RED} 
            targetState={targetStateValue}
            scaleMultiplier={1.2}
        />
        
        {/* Candy Canes */}
        <Ornaments 
            count={CONFIG.CANDY_COUNT} 
            type="CANDY" 
            color="#ffffff" // White base, material handles metallic look
            targetState={targetStateValue}
            scaleMultiplier={0.8}
        />

        {/* Uploaded Photos */}
        <PhotoCloud 
            photos={photos} 
            treeState={treeState} 
            activePhotoId={activePhotoId}
            onPhotoClick={onPhotoClick}
        />
      </group>

      <Effects />
      
      {/* Background fill */}
      <color attach="background" args={[CONFIG.COLOR_MATTE_GREEN]} />
      <fog attach="fog" args={[CONFIG.COLOR_MATTE_GREEN, 20, 60]} />
    </>
  );
};
