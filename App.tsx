
import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Experience } from './components/Experience.tsx';
import { TreeState, PhotoData } from './types.ts';
import { HandInput } from './components/HandInput.tsx';

function App() {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.TREE_SHAPE);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [handRotation, setHandRotation] = useState(0);

  const toggleState = useCallback(() => {
    setTreeState(prev => {
        if (prev === TreeState.PHOTO_ZOOM) return TreeState.SCATTERED;
        return prev === TreeState.SCATTERED ? TreeState.TREE_SHAPE : TreeState.SCATTERED;
    });
    // If we toggle out of zoom, reset active photo
    setActivePhotoId(null);
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const newPhotos: PhotoData[] = Array.from(e.target.files).map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            url: URL.createObjectURL(file)
        }));
        setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const handlePhotoClick = (id: string) => {
    setActivePhotoId(id);
    setTreeState(TreeState.PHOTO_ZOOM);
  };

  const exitZoom = () => {
    setActivePhotoId(null);
    setTreeState(TreeState.SCATTERED);
  };

  return (
    <div className="relative w-full h-screen bg-arix-dark overflow-hidden font-serif">
      
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows dpr={[1, 2]} gl={{ antialias: false, toneMappingExposure: 1.2 }}>
          <Experience 
            treeState={treeState} 
            photos={photos}
            activePhotoId={activePhotoId}
            onPhotoClick={handlePhotoClick}
            onExitZoom={exitZoom}
            rotation={handRotation}
          />
        </Canvas>
      </div>

      {/* Hand Tracker (Visible PIP) */}
      <HandInput 
        onToggleState={toggleState} 
        onUpdateRotation={setHandRotation}
      />

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 md:p-12">
        
        {/* Header */}
        <header className="flex justify-between items-start animate-fade-in-down">
          <div>
            <h1 className="text-4xl md:text-5xl text-arix-gold tracking-tighter drop-shadow-xl italic">
              Arix Signature
            </h1>
            <p className="text-white/60 font-sans text-xs tracking-[0.3em] uppercase mt-2 ml-1">
              Gesture Controlled Experience
            </p>
          </div>
          
          {/* Controls Panel */}
          <div className="pointer-events-auto bg-black/30 backdrop-blur-md border border-arix-gold/20 p-4 rounded-lg text-right">
             <label className="cursor-pointer block mb-2">
                <span className="text-xs text-arix-gold uppercase tracking-widest hover:text-white transition-colors">
                   + Add Memory (Photos)
                </span>
                <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
             </label>
             <div className="text-[10px] text-white/40 font-sans mt-2">
                <p>GESTURES:</p>
                <p>🖐️ Move Hand L/R to Rotate</p>
                <p>👌 Pinch to Toggle Tree/Scatter</p>
             </div>
          </div>
        </header>

        {/* Center/Bottom Interaction */}
        <div className="flex flex-col items-center justify-center pb-10 pointer-events-auto">
          
          <div className="mb-6 text-center">
            <h2 className="text-white/90 text-2xl md:text-3xl italic mb-2 drop-shadow-md">
              {treeState === TreeState.SCATTERED && "Scattered Memories"}
              {treeState === TreeState.TREE_SHAPE && "The Grand Collection"}
              {treeState === TreeState.PHOTO_ZOOM && "Cherished Moment"}
            </h2>
            <div className="w-12 h-px bg-arix-gold/50 mx-auto"></div>
          </div>

          <button 
            onClick={treeState === TreeState.PHOTO_ZOOM ? exitZoom : toggleState}
            className={`
              group relative px-8 py-3 overflow-hidden
              border border-arix-gold/30 bg-arix-green/40 backdrop-blur-md
              transition-all duration-500 ease-out
              hover:bg-arix-gold/10 hover:border-arix-gold
              active:scale-95
            `}
          >
            <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-arix-gold transition-all duration-300 group-hover:w-full group-hover:h-full"></span>
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-arix-gold transition-all duration-300 group-hover:w-full group-hover:h-full"></span>
            
            <span className="relative z-10 font-sans text-sm tracking-[0.2em] text-arix-gold-light uppercase group-hover:text-white transition-colors">
              {treeState === TreeState.PHOTO_ZOOM ? "Return" : (treeState === TreeState.SCATTERED ? "Assemble Tree" : "Release Magic")}
            </span>
          </button>
        </div>
      </div>
      
      {/* Cinematic Grain */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

    </div>
  );
}

export default App;
