"use client";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { HexColorPicker } from "react-colorful";
import * as THREE from "three";

// Material presets for performance optimization
const MATERIAL_PRESETS = {
  gold: { color: "#FFD700", metalness: 0.9, roughness: 0.1 },
  silver: { color: "#C0C0C0", metalness: 0.95, roughness: 0.05 },
  platinum: { color: "#E5E4E2", metalness: 0.98, roughness: 0.02 },
  copper: { color: "#B87333", metalness: 0.8, roughness: 0.2 },
  titanium: { color: "#878681", metalness: 0.7, roughness: 0.3 },
  custom: { color: "#ff0000", metalness: 0.5, roughness: 0.5 },
};

const TEXTURE_OPTIONS = [
  { name: "Smooth", roughness: 0.1, metalness: 0.9 },
  { name: "Brushed", roughness: 0.3, metalness: 0.8 },
  { name: "Matte", roughness: 0.8, metalness: 0.2 },
  { name: "Polished", roughness: 0.05, metalness: 0.95 },
  { name: "Satin", roughness: 0.4, metalness: 0.7 },
];

// Map category to model URL
const MODEL_URLS = {
  Necklaces: "https://res.cloudinary.com/dkpo8ys7l/raw/upload/v1749025757/rings_model.glb",
  Earrings: "https://res.cloudinary.com/dkpo8ys7l/raw/upload/v1748931256/tops_model.glb",
  default: "https://res.cloudinary.com/dkpo8ys7l/raw/upload/v1748931256/tops_model.glb",
};

// Accept a modelUrl prop for flexibility
function Model({
  modelUrl,
  color,
  scale,
  materialType,
  texture,
  showGemstones,
  gemstoneColor,
  customMaterial,
}) {
  const gltf = useGLTF(modelUrl);
  const modelRef = useRef();
  const materialsCache = useRef(new Map());

  // Memoize material properties for performance
  const materialProps = useMemo(() => {
    if (materialType === "custom") {
      return {
        color: customMaterial.color,
        metalness: customMaterial.metalness,
        roughness: customMaterial.roughness,
      };
    }

    const preset = MATERIAL_PRESETS[materialType] || MATERIAL_PRESETS.gold;
    const textureProps =
      TEXTURE_OPTIONS.find((t) => t.name === texture) || TEXTURE_OPTIONS[0];

    return {
      color: materialType === "custom" ? color : preset.color,
      metalness: textureProps.metalness,
      roughness: textureProps.roughness,
    };
  }, [materialType, texture, color, customMaterial]);

  // Optimized material update function
  const updateMaterials = useCallback(
    (object) => {
      object.traverse((child) => {
        if (child.isMesh && child.material) {
          const materialKey = `${child.material.uuid}_${materialProps.color}_${materialProps.metalness}_${materialProps.roughness}`;

          // Check cache first for performance
          if (!materialsCache.current.has(materialKey)) {
            const newMaterial = child.material.clone();
            newMaterial.color = new THREE.Color(materialProps.color);
            newMaterial.metalness = materialProps.metalness;
            newMaterial.roughness = materialProps.roughness;
            newMaterial.needsUpdate = true;
            materialsCache.current.set(materialKey, newMaterial);
          }

          child.material = materialsCache.current.get(materialKey);

          // Handle gemstones conditionally
          if (child.name && child.name.toLowerCase().includes("gem")) {
            child.visible = showGemstones;
            if (showGemstones && child.material) {
              child.material.color = new THREE.Color(gemstoneColor);
              child.material.metalness = 0.1;
              child.material.roughness = 0.0;
              child.material.transparent = true;
              child.material.opacity = 0.9;
            }
          }

          // Handle other conditional elements
          if (child.name && child.name.toLowerCase().includes("stone")) {
            child.visible = showGemstones;
          }
        }
      });
    },
    [materialProps, showGemstones, gemstoneColor]
  );

  useEffect(() => {
    if (modelRef.current) {
      updateMaterials(modelRef.current);
    }
  }, [updateMaterials]);

  return (
    <primitive
      ref={modelRef}
      object={gltf.scene}
      scale={[scale, scale, scale]}
      position={[0, -1, 0]}
    />
  );
}

function BlurredBackground() {
  return (
    <div
      className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black opacity-60"
      style={{
        backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(255, 204, 112, 0.3) 0%, transparent 50%)
          `,
        filter: "blur(60px)",
        transform: "scale(1.1)",
      }}
    />
  );
}

export default function Home({ productCategory = "Necklaces" }) {
  // Add productCategory prop or get from state/route/etc.
  // You can get this prop from your routing or global state

  // State Management
  const [color, setColor] = useState("#ff0000");
  const [scale, setScale] = useState(0.5);
  const [materialType, setMaterialType] = useState("gold");
  const [texture, setTexture] = useState("Smooth");
  const [showGemstones, setShowGemstones] = useState(true);
  const [gemstoneColor, setGemstoneColor] = useState("#0066ff");

  // Custom material state
  const [customMaterial, setCustomMaterial] = useState({
    color: "#ff0000",
    metalness: 0.5,
    roughness: 0.5,
  });

  // UI Panel states
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isSizeControlOpen, setIsSizeControlOpen] = useState(false);
  const [isMaterialPanelOpen, setIsMaterialPanelOpen] = useState(false);
  const [isGemstoneControlOpen, setIsGemstoneControlOpen] = useState(false);

  // Optimized handlers
  const handleScaleChange = useCallback((newScale) => {
    setScale(Math.max(0.1, Math.min(2, newScale)));
  }, []);

  const handleMaterialChange = useCallback((newMaterialType) => {
    setMaterialType(newMaterialType);
    if (newMaterialType !== "custom") {
      setColor(MATERIAL_PRESETS[newMaterialType].color);
    }
  }, []);

  const handleCustomMaterialChange = useCallback((property, value) => {
    setCustomMaterial((prev) => ({
      ...prev,
      [property]: value,
    }));
  }, []);

  // Decide model URL based on category
  const modelUrl =
    MODEL_URLS[productCategory] || MODEL_URLS.default;

  return (
    <div className="w-screen h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      <BlurredBackground />

      <div
        className="absolute inset-0 opacity-20 bg-gradient-to-br from-transparent via-gray-600 to-transparent"
        style={{
          backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)
            `,
          filter: "blur(100px)",
        }}
      />

      <div className="relative w-full max-w-5xl h-full max-h-[700px] bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-gray-700/50 z-10">
        {/* Left Control Panel */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20 space-y-3 max-w-xs">
          {/* Color Control */}
          <div>
            <button
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              className="w-12 h-12 md:w-14 md:h-14 rounded-lg border-2 border-gray-600/50 shadow-lg hover:scale-105 transition-transform duration-200 backdrop-blur-md"
              style={{
                backgroundColor:
                  materialType === "custom" ? customMaterial.color : color,
              }}
              aria-label="Open color picker"
            />
          </div>

          {/* Material Control */}
          <div>
            <button
              onClick={() => setIsMaterialPanelOpen(!isMaterialPanelOpen)}
              className="w-12 h-12 md:w-14 md:h-14 rounded-lg border-2 border-gray-600/50 shadow-lg hover:scale-105 transition-transform duration-200 bg-gradient-to-br from-yellow-600 to-yellow-800 backdrop-blur-md flex items-center justify-center"
              aria-label="Open material controls"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M12 2L2 22h20L12 2z" />
              </svg>
            </button>
          </div>

          {/* Size Control */}
          <div>
            <button
              onClick={() => setIsSizeControlOpen(!isSizeControlOpen)}
              className="w-12 h-12 md:w-14 md:h-14 rounded-lg border-2 border-gray-600/50 shadow-lg hover:scale-105 transition-transform duration-200 bg-gray-800/80 backdrop-blur-md flex items-center justify-center"
              aria-label="Open size controls"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </button>
          </div>

          {/* Gemstone Control */}
          <div>
            <button
              onClick={() => setIsGemstoneControlOpen(!isGemstoneControlOpen)}
              className="w-12 h-12 md:w-14 md:h-14 rounded-lg border-2 border-gray-600/50 shadow-lg hover:scale-105 transition-transform duration-200 bg-gradient-to-br from-blue-600 to-purple-700 backdrop-blur-md flex items-center justify-center"
              aria-label="Open gemstone controls"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M6 3h12l4 6-10 13L2 9l4-6z" />
              </svg>
            </button>
          </div>

          {/* Color Picker Panel */}
          {isColorPickerOpen && (
            <div className="bg-gray-900/90 backdrop-blur-xl p-4 rounded-xl shadow-xl border border-gray-600/30 w-64">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-200 m-0">
                  Pick Color
                </p>
                <button
                  onClick={() => setIsColorPickerOpen(false)}
                  className="text-gray-400 hover:text-gray-200 text-lg font-bold"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                <HexColorPicker
                  color={
                    materialType === "custom" ? customMaterial.color : color
                  }
                  onChange={
                    materialType === "custom"
                      ? (color) => handleCustomMaterialChange("color", color)
                      : setColor
                  }
                />
              </div>

              <div className="text-center">
                <span className="text-xs text-gray-300 font-mono bg-gray-800/50 px-2 py-1 rounded">
                  {(materialType === "custom"
                    ? customMaterial.color
                    : color
                  ).toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Material Panel */}
          {isMaterialPanelOpen && (
            <div className="bg-gray-900/90 backdrop-blur-xl p-4 rounded-xl shadow-xl border border-gray-600/30 w-72">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-200 m-0">
                  Material & Texture
                </p>
                <button
                  onClick={() => setIsMaterialPanelOpen(false)}
                  className="text-gray-400 hover:text-gray-200 text-lg font-bold"
                >
                  ×
                </button>
              </div>

              {/* Material Type */}
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block">
                  Material Type
                </label>
                <select
                  value={materialType}
                  onChange={(e) => handleMaterialChange(e.target.value)}
                  className="w-full bg-gray-800/50 text-gray-200 border border-gray-600/30 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                  <option value="platinum">Platinum</option>
                  <option value="copper">Copper</option>
                  <option value="titanium">Titanium</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Texture */}
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block">
                  Surface Finish
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TEXTURE_OPTIONS.map((textureOption) => (
                    <button
                      key={textureOption.name}
                      onClick={() => setTexture(textureOption.name)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        texture === textureOption.name
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                      }`}
                    >
                      {textureOption.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Material Controls */}
              {materialType === "custom" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                      Metalness: {customMaterial.metalness}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={customMaterial.metalness}
                      onChange={(e) =>
                        handleCustomMaterialChange(
                          "metalness",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                      Roughness: {customMaterial.roughness}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={customMaterial.roughness}
                      onChange={(e) =>
                        handleCustomMaterialChange(
                          "roughness",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Size Control Panel */}
          {isSizeControlOpen && (
            <div className="bg-gray-900/90 backdrop-blur-xl p-4 rounded-xl shadow-xl border border-gray-600/30 w-64">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-200 m-0">
                  Adjust Size
                </p>
                <button
                  onClick={() => setIsSizeControlOpen(false)}
                  className="text-gray-400 hover:text-gray-200 text-lg font-bold"
                >
                  ×
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                {[
                  { label: "Small", value: 0.3 },
                  { label: "Medium", value: 0.5 },
                  { label: "Large", value: 0.8 },
                ].map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => handleScaleChange(value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      Math.abs(scale - value) < 0.05
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-center">
                  <span className="text-xs text-gray-300 font-mono bg-gray-800/50 px-2 py-1 rounded">
                    {Math.round(scale * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Gemstone Control Panel */}
          {isGemstoneControlOpen && (
            <div className="bg-gray-900/90 backdrop-blur-xl p-4 rounded-xl shadow-xl border border-gray-600/30 w-64">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-200 m-0">
                  Gemstones
                </p>
                <button
                  onClick={() => setIsGemstoneControlOpen(false)}
                  className="text-gray-400 hover:text-gray-200 text-lg font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Show Gemstones</span>
                  <button
                    onClick={() => setShowGemstones(!showGemstones)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      showGemstones ? "bg-blue-600" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        showGemstones
                          ? "transform translate-x-6"
                          : "transform translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {showGemstones && (
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">
                      Gemstone Color
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        className="w-8 h-8 rounded border-2 border-gray-600"
                        style={{ backgroundColor: gemstoneColor }}
                      />
                      <input
                        type="color"
                        value={gemstoneColor}
                        onChange={(e) => setGemstoneColor(e.target.value)}
                        className="opacity-0 absolute w-8 h-8"
                      />
                      <span className="text-xs text-gray-400 font-mono">
                        {gemstoneColor.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20">
          <div className="bg-gray-900/70 backdrop-blur-md p-3 rounded-lg shadow-lg max-w-xs border border-gray-600/30">
            <p className="text-xs md:text-sm text-gray-200 m-0">
              Customize material, color & size • Toggle gemstones • Drag to
              rotate
            </p>
          </div>
        </div>

        {/* 3D Canvas */}
        <Canvas
          className="w-full h-full"
          style={{
            background:
              "radial-gradient(circle at center, rgba(30,30,30,0.8) 0%, rgba(0,0,0,0.9) 100%)",
          }}
          camera={{ position: [0, 1, 5], fov: 50 }}
        >
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 5, 5]} intensity={1.8} castShadow />
          <directionalLight position={[-5, 3, 2]} intensity={1.2} />
          <pointLight position={[0, 10, 0]} intensity={0.8} />
          <spotLight
            position={[0, 10, 5]}
            intensity={1.5}
            angle={0.3}
            penumbra={0.5}
            castShadow
          />

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={10}
            maxPolarAngle={Math.PI / 2}
          />

          {/* Pass modelUrl */}
          <Model
            modelUrl={modelUrl}
            color={color}
            scale={scale}
            materialType={materialType}
            texture={texture}
            showGemstones={showGemstones}
            gemstoneColor={gemstoneColor}
            customMaterial={customMaterial}
          />
        </Canvas>

        {/* Status Bar */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-gray-900/60 backdrop-blur-md text-gray-200 px-4 py-2 rounded-full text-xs border border-gray-600/30 flex items-center gap-4">
            <span>
              Material:{" "}
              {materialType.charAt(0).toUpperCase() + materialType.slice(1)}
            </span>
            <span>•</span>
            <span>Size: {Math.round(scale * 100)}%</span>
            <span>•</span>
            <span>Gems: {showGemstones ? "On" : "Off"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}