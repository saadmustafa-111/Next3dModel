"use client";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { HexColorPicker } from "react-colorful";
import * as THREE from "three";

function Model({ color }) {
  const gltf = useGLTF(
    "https://res.cloudinary.com/dkpo8ys7l/raw/upload/v1748931256/tops_model.glb"
  );
  const modelRef = useRef();

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
          // Create a new material to avoid affecting other instances
          if (!child.material.isCloned) {
            child.material = child.material.clone();
            child.material.isCloned = true;
          }
          child.material.color = new THREE.Color(color);
          child.material.needsUpdate = true;
        }
      });
    }
  }, [color]);

  return (
    <primitive
      ref={modelRef}
      object={gltf.scene}
      scale={[0.5, 0.5, 0.5]}
      position={[0, -1, 0]}
    />
  );
}

export default function Home() {
  const [color, setColor] = useState("#ff0000");
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  return (
    <div className="w-screen h-screen bg-white relative overflow-hidden">
      {/* Color Picker - Responsive positioning */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
        {/* Color Preview Button */}
        <div className="mb-3">
          <button
            onClick={() => setIsPickerOpen(!isPickerOpen)}
            className="w-12 h-12 md:w-14 md:h-14 rounded-lg border-2 border-gray-300 shadow-lg hover:scale-105 transition-transform duration-200"
            style={{ backgroundColor: color }}
            aria-label="Open color picker"
          />
        </div>

        {/* Color Picker Panel */}
        {isPickerOpen && (
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-xl border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm md:text-base font-medium text-gray-700 m-0">
                Pick Color
              </p>
              <button
                onClick={() => setIsPickerOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-lg font-bold"
                aria-label="Close color picker"
              >
                ×
              </button>
            </div>

            <div className="w-48 md:w-56">
              <HexColorPicker color={color} onChange={setColor} />
            </div>

            {/* Color Value Display */}
            <div className="mt-3 text-center">
              <span className="text-xs md:text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                {color.toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Instructions - Mobile friendly */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg max-w-xs">
          <p className="text-xs md:text-sm text-gray-600 m-0">
            Click the color button to customize your product
          </p>
        </div>
      </div>

      {/* 3D Canvas - Always white background */}
      <Canvas
        className="w-full h-full bg-white"
        camera={{
          position: [0, 1, 5],
          fov: 50,
        }}
      >
        {/* Lighting setup for better product visibility */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-5, 3, 2]} intensity={0.8} />
        <pointLight position={[0, 10, 0]} intensity={0.5} />

        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={10}
          maxPolarAngle={Math.PI / 2}
        />

        {/* The 3D Model */}
        <Model color={color} />
      </Canvas>

      {/* Loading indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black/20 text-white px-3 py-1 rounded-full text-xs md:text-sm backdrop-blur-sm">
          Drag to rotate • Scroll to zoom
        </div>
      </div>
    </div>
  );
}
