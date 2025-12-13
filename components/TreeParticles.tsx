
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONFIG, getConePoint, getSpherePoint } from '../constants';
import { easing } from 'maath';

// --- Custom Shader Material ---
const foliageVertexShader = `
  uniform float uTime;
  uniform float uProgress; // 0.0 = Scattered, 1.0 = Tree
  
  attribute vec3 aTreePos;
  attribute float aSize;
  attribute float aRandom;
  
  varying float vAlpha;
  varying vec3 vColor;

  // Simple noise function
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    // Current positions: interpolate between attribute position (scatter) and target (tree)
    vec3 currentPos = mix(position, aTreePos, uProgress);

    // Add some "breathing" / floating motion based on noise and time
    float breathe = sin(uTime * 1.5 + aRandom * 10.0) * 0.1;
    
    // Twist effect during transition
    float angle = uProgress * 3.14 * 2.0 * (1.0 - aTreePos.y / 15.0);
    float c = cos(angle * (1.0 - uProgress)); // Only twist when morphing
    float s = sin(angle * (1.0 - uProgress));
    // Apply twist primarily to X/Z
    // (Simplification for visual flair: just adding noise to position)
    currentPos.x += breathe;
    currentPos.y += breathe * 0.5;
    currentPos.z += breathe;

    vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
    
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = aSize * (300.0 / -mvPosition.z);

    // Fade in/out logic or color shift
    // Mix between dark emerald and gold based on position tips
    float tipFactor = smoothstep(0.0, 1.0, aTreePos.y / 12.0);
    vec3 emerald = vec3(0.01, 0.2, 0.1);
    vec3 gold = vec3(1.0, 0.8, 0.2);
    
    // If progress is low, more gold/random. If tree, organized gradient.
    vec3 baseColor = mix(emerald, gold, tipFactor * 0.5 * uProgress);
    
    // Sparkle effect
    float sparkle = step(0.98, sin(uTime * 3.0 + aRandom * 100.0));
    vColor = baseColor + (vec3(1.0) * sparkle * 0.5);
    
    vAlpha = 0.8 + 0.2 * sin(uTime + aRandom);
  }
`;

const foliageFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    // Circular particle
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;

    // Soft edge glow
    float glow = 1.0 - (dist * 2.0);
    glow = pow(glow, 1.5);

    gl_FragColor = vec4(vColor * 1.5, vAlpha * glow); // Multiply color for HDR bloom
    
    // Tone mapping helper (simple Reinhard-ish for safety if not using post-proc)
    // gl_FragColor.rgb = gl_FragColor.rgb / (gl_FragColor.rgb + vec3(1.0));
  }
`;

interface Props {
  targetState: number; // 0 or 1
}

export const TreeParticles: React.FC<Props> = ({ targetState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate data once
  const { positions, treePositions, sizes, randoms } = useMemo(() => {
    const count = CONFIG.FOLIAGE_COUNT;
    const pos = new Float32Array(count * 3); // Scatter pos (attribute: position)
    const treePos = new Float32Array(count * 3); // Target pos (attribute: aTreePos)
    const sz = new Float32Array(count);
    const rnd = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Scatter Logic
      const scatter = getSpherePoint(CONFIG.SCATTER_RADIUS);
      pos[i * 3] = scatter.x;
      pos[i * 3 + 1] = scatter.y;
      pos[i * 3 + 2] = scatter.z;

      // Tree Logic
      const tree = getConePoint(CONFIG.TREE_HEIGHT, CONFIG.TREE_RADIUS_BOTTOM, -CONFIG.TREE_HEIGHT / 2);
      treePos[i * 3] = tree.x;
      treePos[i * 3 + 1] = tree.y;
      treePos[i * 3 + 2] = tree.z;

      // Attributes
      sz[i] = Math.random() * 0.15 + 0.05;
      rnd[i] = Math.random();
    }

    return {
      positions: pos,
      treePositions: treePos,
      sizes: sz,
      randoms: rnd
    };
  }, []);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      // Smoothly interpolate uProgress uniform
      easing.damp(
        materialRef.current.uniforms.uProgress,
        'value',
        targetState,
        CONFIG.TRANSITION_DURATION, 
        delta
      );
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTreePos"
          count={treePositions.length / 3}
          array={treePositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={foliageVertexShader}
        fragmentShader={foliageFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uProgress: { value: 0 },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};