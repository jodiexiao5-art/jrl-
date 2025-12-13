
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONFIG, getConePoint, getSpherePoint } from '../constants';
import { DualPosition } from '../types';
import { easing } from 'maath';

interface OrnamentProps {
  count: number;
  type: 'SPHERE' | 'BOX' | 'CANDY';
  color: string;
  targetState: number; // 0 (Scatter) or 1 (Tree)
  scaleMultiplier?: number;
}

const tempObj = new THREE.Object3D();
const vec3Helper = new THREE.Vector3();

export const Ornaments: React.FC<OrnamentProps> = ({ 
  count, 
  type, 
  color, 
  targetState,
  scaleMultiplier = 1 
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Create data for all instances
  const data = useMemo(() => {
    const items: DualPosition[] = [];
    for (let i = 0; i < count; i++) {
      const scatter = getSpherePoint(CONFIG.SCATTER_RADIUS);
      // Slightly different radii for variety
      const rMod = type === 'CANDY' ? 1.0 : 0.0;
      const treeP = getConePoint(CONFIG.TREE_HEIGHT, CONFIG.TREE_RADIUS_BOTTOM + rMod, -CONFIG.TREE_HEIGHT / 2);
      
      items.push({
        scatter: new THREE.Vector3(scatter.x, scatter.y, scatter.z),
        tree: new THREE.Vector3(treeP.x, treeP.y, treeP.z),
        scale: (Math.random() * 0.3 + 0.2) * scaleMultiplier,
        rotationSpeed: new THREE.Vector3(
          Math.random() * 0.02, 
          Math.random() * 0.02, 
          Math.random() * 0.02
        )
      });
    }
    return items;
  }, [count, scaleMultiplier, type]);

  const animState = useRef({ progress: 0 });

  useLayoutEffect(() => {
    if (meshRef.current) {
        data.forEach((d, i) => {
            tempObj.position.copy(d.scatter);
            tempObj.scale.setScalar(d.scale);
            tempObj.updateMatrix();
            meshRef.current!.setMatrixAt(i, tempObj.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [data]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    easing.damp(animState.current, 'progress', targetState, CONFIG.TRANSITION_DURATION, delta);
    const p = animState.current.progress;

    for (let i = 0; i < count; i++) {
      const d = data[i];

      vec3Helper.lerpVectors(d.scatter, d.tree, p);

      const floatX = Math.sin(state.clock.elapsedTime + i) * 0.02 * (1 - p);
      const floatY = Math.cos(state.clock.elapsedTime * 0.5 + i) * 0.02 * (1 - p);
      
      tempObj.position.set(
        vec3Helper.x + floatX,
        vec3Helper.y + floatY,
        vec3Helper.z
      );

      tempObj.rotation.x += d.rotationSpeed.x;
      tempObj.rotation.y += d.rotationSpeed.y;
      
      // Candy canes are cylinders, need to be taller
      if (type === 'CANDY') {
         tempObj.scale.set(d.scale * 0.3, d.scale * 3, d.scale * 0.3);
      } else {
         tempObj.scale.setScalar(d.scale);
      }

      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObj.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      {type === 'SPHERE' && <sphereGeometry args={[1, 16, 16]} />}
      {type === 'BOX' && <boxGeometry args={[1, 1, 1]} />}
      {type === 'CANDY' && <cylinderGeometry args={[1, 1, 1, 8]} />}
      
      <meshStandardMaterial 
        color={color}
        metalness={type === 'CANDY' ? 0.3 : 0.9}
        roughness={type === 'CANDY' ? 0.4 : 0.15}
        emissive={color}
        emissiveIntensity={0.1}
      />
    </instancedMesh>
  );
};