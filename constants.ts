export const CONFIG = {
  // Particle Counts
  FOLIAGE_COUNT: 3500,
  ORNAMENT_COUNT: 120,
  GIFT_COUNT: 30,
  CANDY_COUNT: 40,
  
  // Tree Dimensions
  TREE_HEIGHT: 14,
  TREE_RADIUS_BOTTOM: 5.5,
  SCATTER_RADIUS: 18, 

  // Animation
  TRANSITION_DURATION: 2.0, 

  // Colors
  COLOR_MATTE_GREEN: '#0F281E',
  COLOR_GOLD: '#D4AF37',
  COLOR_RED: '#8a1c1c',
  COLOR_WARM_WHITE: '#FFF5E0',
};

// Helper to get point on cone surface (or volume)
export const getConePoint = (height: number, maxRadius: number, yOffset: number = 0) => {
  const y = Math.random() * height;
  const hNorm = y / height;
  const rAtHeight = maxRadius * (1 - hNorm);
  
  const theta = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * rAtHeight;

  const x = r * Math.cos(theta);
  const z = r * Math.sin(theta);
  
  return { x, y: y + yOffset, z };
};

// Helper for random sphere point
export const getSpherePoint = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius; 
  
  const sinPhi = Math.sin(phi);
  const x = r * sinPhi * Math.cos(theta);
  const y = r * sinPhi * Math.sin(theta);
  const z = r * Math.cos(phi);
  
  return { x, y, z };
};