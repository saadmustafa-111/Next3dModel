"use client";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { HexColorPicker } from "react-colorful";
import * as THREE from "three";

function Model({ color, scale }) {
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
      scale={[scale, scale, scale]}
      position={[0, -1, 0]}
    />
  );
}

export default function Home() {
  const [color, setColor] = useState("#ff0000");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [scale, setScale] = useState(0.5);
  const [isSizeControlOpen, setIsSizeControlOpen] = useState(false);

  const handleScaleChange = (newScale) => {
    setScale(Math.max(0.1, Math.min(2, newScale))); // Clamp between 0.1 and 2
  };

  return (
    <div className="w-screen h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Main Container - Centered Frame */}
      <div className="relative w-full max-w-4xl h-full max-h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Color Picker - Positioned inside the frame */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 space-y-3">
          {/* Color Preview Button */}
          <div>
            <button
              onClick={() => setIsPickerOpen(!isPickerOpen)}
              className="w-12 h-12 md:w-14 md:h-14 rounded-lg border-2 border-gray-300 shadow-lg hover:scale-105 transition-transform duration-200"
              style={{ backgroundColor: color }}
              aria-label="Open color picker"
            />
          </div>

          {/* Size Control Button */}
          <div>
            <button
              onClick={() => setIsSizeControlOpen(!isSizeControlOpen)}
              className="w-12 h-12 md:w-14 md:h-14 rounded-lg border-2 border-gray-300 shadow-lg hover:scale-105 transition-transform duration-200 bg-white flex items-center justify-center"
              aria-label="Open size controls"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </button>
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

          {/* Size Control Panel */}
          {isSizeControlOpen && (
            <div className="bg-white p-3 md:p-4 rounded-xl shadow-xl border border-gray-200 w-64">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm md:text-base font-medium text-gray-700 m-0">
                  Adjust Size
                </p>
                <button
                  onClick={() => setIsSizeControlOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-lg font-bold"
                  aria-label="Close size controls"
                >
                  ×
                </button>
              </div>

              {/* Size Buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => handleScaleChange(0.3)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    Math.abs(scale - 0.3) < 0.05
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Small
                </button>
                <button
                  onClick={() => handleScaleChange(0.5)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    Math.abs(scale - 0.5) < 0.05
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Medium
                </button>
                <button
                  onClick={() => handleScaleChange(0.8)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    Math.abs(scale - 0.8) < 0.05
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Large
                </button>
              </div>

              {/* Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Small</span>
                  <span>Large</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="text-center">
                  <span className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                    {Math.round(scale * 100)}%
                  </span>
                </div>
              </div>

              {/* Quick Reset */}
              <button
                onClick={() => setScale(0.5)}
                className="w-full mt-3 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs rounded-lg transition-colors"
              >
                Reset to Default
              </button>
            </div>
          )}
        </div>

        {/* Instructions - Positioned inside the frame */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
          <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg max-w-xs">
            <p className="text-xs md:text-sm text-gray-600 m-0">
              Customize color & size • Drag to rotate • Scroll to zoom
            </p>
          </div>
        </div>

        {/* 3D Canvas - Contained within the frame */}
        <Canvas
          className="w-full h-full bg-gradient-to-br from-gray-50 to-white"
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
          <Model color={color} scale={scale} />
        </Canvas>

        {/* Controls indicator - Positioned at bottom of frame */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-black/20 text-white px-3 py-1 rounded-full text-xs md:text-sm backdrop-blur-sm">
            Size: {Math.round(scale * 100)}% • Drag to rotate • Scroll to zoom
          </div>
        </div>
      </div>
    </div>
  );
}
