import * as THREE from 'three';

export enum TreeState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE',
  PHOTO_ZOOM = 'PHOTO_ZOOM'
}

export interface DualPosition {
  scatter: THREE.Vector3;
  tree: THREE.Vector3;
  scale: number;
  rotationSpeed: THREE.Vector3;
}

export interface PhotoData {
  id: string;
  url: string;
  texture?: THREE.Texture;
}

export interface ExperienceProps {
  treeState: TreeState;
  photos: PhotoData[];
  onPhotoClick: (id: string) => void;
  onExitZoom: () => void;
  activePhotoId: string | null;
  rotation: number; // Controlled by hand or mouse
}