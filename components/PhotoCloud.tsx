
import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { CONFIG, getConePoint, getSpherePoint } from '../constants';
import { PhotoData, TreeState } from '../types';
import { easing } from 'maath';

interface Props {
  photos: PhotoData[];
  treeState: TreeState;
  activePhotoId: string | null;
  onPhotoClick: (id: string) => void;
}

export const PhotoCloud: React.FC<Props> = ({ photos, treeState, activePhotoId, onPhotoClick }) => {
  const { camera } = useThree();
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);

  // Pre-calculate positions
  const photoPositions = useMemo(() => {
    return photos.map(() => {
      const scatter = getSpherePoint(CONFIG.SCATTER_RADIUS * 0.8);
      const tree = getConePoint(CONFIG.TREE_HEIGHT, CONFIG.TREE_RADIUS_BOTTOM + 1.0, -CONFIG.TREE_HEIGHT / 2);
      return {
        scatter: new THREE.Vector3(scatter.x, scatter.y, scatter.z),
        tree: new THREE.Vector3(tree.x, tree.y, tree.z),
        rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      };
    });
  }, [photos]);

  return (
    <group>
      {photos.map((photo, i) => (
        <PhotoCard 
          key={photo.id}
          photo={photo}
          posData={photoPositions[i]}
          treeState={treeState}
          isActive={photo.id === activePhotoId}
          onClick={() => onPhotoClick(photo.id)}
          textureLoader={textureLoader}
        />
      ))}
    </group>
  );
};

const PhotoCard = ({ photo, posData, treeState, isActive, onClick, textureLoader }: any) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => textureLoader.load(photo.url), [photo.url, textureLoader]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    let targetPos = new THREE.Vector3();
    let targetScale = 1.0;
    let targetRot = new THREE.Euler();

    if (isActive && treeState === TreeState.PHOTO_ZOOM) {
      // Move in front of camera
      const camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion);
      targetPos.copy(state.camera.position).add(camDir.multiplyScalar(6)); // 6 units in front
      targetScale = 3.0;
      targetRot.copy(state.camera.rotation); // Face camera
    } else {
      // Normal state logic
      const isTree = treeState === TreeState.TREE_SHAPE;
      // If photo zoom is active but this isn't the active photo, scatter it
      const targetVec = (isTree && treeState !== TreeState.PHOTO_ZOOM) ? posData.tree : posData.scatter;
      targetPos.copy(targetVec);
      targetScale = 1.0;
      
      // Face outward from center in tree mode, random in scatter
      if (isTree && treeState !== TreeState.PHOTO_ZOOM) {
         meshRef.current.lookAt(0, targetPos.y, 0);
         targetRot.copy(meshRef.current.rotation);
      } else {
         targetRot.copy(posData.rotation);
         // Slowly rotate in scatter
         targetRot.x += state.clock.elapsedTime * 0.05; 
         targetRot.y += state.clock.elapsedTime * 0.05;
      }
    }

    easing.damp3(meshRef.current.position, targetPos, 0.5, delta);
    easing.damp(meshRef.current.scale, 'x', targetScale, 0.5, delta);
    easing.damp(meshRef.current.scale, 'y', targetScale, 0.5, delta);
    easing.dampE(meshRef.current.rotation, targetRot, 0.5, delta);
  });

  return (
    <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} transparent opacity={0.9} />
      <mesh position={[0,0,-0.01]}>
         <planeGeometry args={[1.1, 1.1]} />
         <meshBasicMaterial color={CONFIG.COLOR_GOLD} />
      </mesh>
    </mesh>
  );
};