"use client";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
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

// Gemstone presets
const GEMSTONE_PRESETS = [
  { name: "Diamond", color: "#ffffff", opacity: 0.9, refractionRatio: 0.98 },
  { name: "Ruby", color: "#e74c3c", opacity: 0.8, refractionRatio: 0.76 },
  { name: "Emerald", color: "#27ae60", opacity: 0.8, refractionRatio: 0.57 },
  { name: "Sapphire", color: "#3498db", opacity: 0.8, refractionRatio: 0.76 },
  { name: "Amethyst", color: "#9b59b6", opacity: 0.8, refractionRatio: 0.54 },
  { name: "Topaz", color: "#f39c12", opacity: 0.8, refractionRatio: 0.61 },
];

// Gemstone cut/shape options
const GEMSTONE_CUTS = [
  { name: "Round", shape: "sphere", icon: "●" },
  { name: "Princess", shape: "box", icon: "■" },
  { name: "Emerald", shape: "emerald", icon: "▬" },
  { name: "Triangle", shape: "triangle", icon: "▲" },
  { name: "Marquise", shape: "marquise", icon: "◊" },
  { name: "Heart", shape: "heart", icon: "♥" },
  { name: "Pear", shape: "pear", icon: "💧" },
  { name: "Oval", shape: "oval", icon: "⬭" },
];

// Lighting presets
const LIGHTING_PRESETS = [
  { name: "Studio", ambient: 0.4, directional: 1.8, point: 0.8, spot: 1.5 },
  { name: "Natural", ambient: 0.6, directional: 1.2, point: 0.5, spot: 1.0 },
  { name: "Dramatic", ambient: 0.2, directional: 2.5, point: 1.2, spot: 2.0 },
  { name: "Soft", ambient: 0.8, directional: 0.8, point: 0.3, spot: 0.8 },
];

// Aging effects
const AGING_EFFECTS = [
  { name: "New", roughness: 0.1, metalness: 0.9, opacity: 1.0 },
  { name: "Worn", roughness: 0.3, metalness: 0.7, opacity: 0.95 },
  { name: "Vintage", roughness: 0.5, metalness: 0.5, opacity: 0.9 },
  { name: "Antique", roughness: 0.7, metalness: 0.3, opacity: 0.85 },
];

// Updated MODEL_URLS to match React Native app
const MODEL_URLS = {
  rings:
    "https://res.cloudinary.com/dkpo8ys7l/image/upload/v1749813481/compressed_1749713357507_ring_oshwwy.glb",
  necklaces:
    "https://res.cloudinary.com/dkpo8ys7l/image/upload/v1748886180/haar_ug2pwb.glb",
  earrings:
    "https://res.cloudinary.com/dkpo8ys7l/image/upload/v1748886308/tops_mqoa35.glb",
  bracelets:
    "https://res.cloudinary.com/dkpo8ys7l/image/upload/v1748886308/tops_mqoa35.glb",
  watches:
    "https://res.cloudinary.com/dkpo8ys7l/image/upload/v1748886308/tops_mqoa35.glb",
  other:
    "https://res.cloudinary.com/dkpo8ys7l/image/upload/v1748886308/tops_mqoa35.glb",
  default:
    "https://res.cloudinary.com/dkpo8ys7l/image/upload/v1748886308/tops_mqoa35.glb",
};

const RING_SIZES = [
  { us: 5, mm: 15.7 },
  { us: 6, mm: 16.5 },
  { us: 7, mm: 17.3 },
  { us: 8, mm: 18.1 },
  { us: 9, mm: 18.9 },
  { us: 10, mm: 19.8 },
  // ...add more
];

// Size options for all jewelry types
const SIZE_OPTIONS = {
  rings: [
    { label: "US 5 (15.7mm)", value: 15.7 },
    { label: "US 6 (16.5mm)", value: 16.5 },
    { label: "US 7 (17.3mm)", value: 17.3 },
    { label: "US 8 (18.1mm)", value: 18.1 },
    { label: "US 9 (18.9mm)", value: 18.9 },
    { label: "US 10 (19.8mm)", value: 19.8 },
  ],
  bracelets: [
    { label: "Small (160mm)", value: 160 },
    { label: "Medium (180mm)", value: 180 },
    { label: "Large (200mm)", value: 200 },
  ],
  necklaces: [
    { label: "Choker (350mm)", value: 350 },
    { label: "Princess (450mm)", value: 450 },
    { label: "Matinee (550mm)", value: 550 },
    { label: "Opera (700mm)", value: 700 },
  ],
};

const DEFAULT_SIZES = {
  rings: 17.3,        // mm (US 7)
  bracelets: 180,     // mm (Medium)
  necklaces: 450,     // mm (Princess)
};

// Function to get URL parameters - Fixed to handle server-side rendering
function getUrlParameter(name) {
  if (typeof window === "undefined") {
    return null; // Return null during server-side rendering
  }
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Create different gemstone shapes
function createGemstoneGeometry(shape, size) {
  switch (shape) {
    case "sphere":
      return new THREE.SphereGeometry(size, 32, 32);
    case "box":
      return new THREE.BoxGeometry(size * 1.2, size * 1.2, size * 0.8);
    case "emerald":
      return new THREE.BoxGeometry(size * 1.4, size * 1.8, size * 0.6);
    case "triangle":
      return new THREE.ConeGeometry(size * 1.2, size * 1.5, 3);
    case "marquise":
      const marquiseShape = new THREE.Shape();
      marquiseShape.moveTo(0, size * 1.5);
      marquiseShape.quadraticCurveTo(size * 0.8, size * 0.8, 0, 0);
      marquiseShape.quadraticCurveTo(-size * 0.8, size * 0.8, 0, size * 1.5);
      return new THREE.ExtrudeGeometry(marquiseShape, {
        depth: size * 0.5,
        bevelEnabled: true,
        bevelSize: 0.02,
      });
    case "heart":
      const heartShape = new THREE.Shape();
      heartShape.moveTo(0, -size * 0.5);
      heartShape.bezierCurveTo(
        0,
        -size * 0.8,
        -size * 0.6,
        -size * 1.2,
        -size * 0.6,
        -size * 0.8
      );
      heartShape.bezierCurveTo(
        -size * 0.6,
        -size * 0.4,
        -size * 0.3,
        -size * 0.2,
        0,
        size * 0.2
      );
      heartShape.bezierCurveTo(
        size * 0.3,
        -size * 0.2,
        size * 0.6,
        -size * 0.4,
        size * 0.6,
        -size * 0.8
      );
      heartShape.bezierCurveTo(
        size * 0.6,
        -size * 1.2,
        0,
        -size * 0.8,
        0,
        -size * 0.5
      );
      return new THREE.ExtrudeGeometry(heartShape, {
        depth: size * 0.4,
        bevelEnabled: true,
        bevelSize: 0.02,
      });
    case "pear":
      const pearShape = new THREE.Shape();
      pearShape.moveTo(0, size * 1.5);
      pearShape.quadraticCurveTo(size * 0.8, size * 0.5, size * 0.6, 0);
      pearShape.quadraticCurveTo(size * 0.6, -size * 0.8, 0, -size * 0.8);
      pearShape.quadraticCurveTo(-size * 0.6, -size * 0.8, -size * 0.6, 0);
      pearShape.quadraticCurveTo(-size * 0.8, size * 0.5, 0, size * 1.5);
      return new THREE.ExtrudeGeometry(pearShape, {
        depth: size * 0.5,
        bevelEnabled: true,
        bevelSize: 0.02,
      });
    case "oval":
      return new THREE.SphereGeometry(size, 32, 16, 0, Math.PI * 2, 0, Math.PI);
    default:
      return new THREE.OctahedronGeometry(size, 2);
  }
}

// OrbitControls wrapper component to manage controls state
function ControlsManager({ isDragMode, children }) {
  const controlsRef = useRef();

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = !isDragMode;
    }
  }, [isDragMode]);

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={!isDragMode}
        minDistance={2}
        maxDistance={10}
        maxPolarAngle={Math.PI / 2}
      />
      {children}
    </>
  );
}

// Draggable Gemstone component
function DraggableGemstone({
  id,
  position,
  size,
  color,
  gemstoneType,
  visible,
  opacity,
  cut,
  onPositionChange,
  isDragMode,
  isSelected,
  onSelect,
  controlsRef,
  camera,
  canvasRef,
}) {
  const meshRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState([0, 0, 0]);

  const gemstoneData =
    GEMSTONE_PRESETS.find((g) => g.name === gemstoneType) ||
    GEMSTONE_PRESETS[0];
  const cutData = GEMSTONE_CUTS.find((c) => c.name === cut) || GEMSTONE_CUTS[0];

  const geometry = useMemo(
    () => createGemstoneGeometry(cutData.shape, size),
    [cutData.shape, size]
  );

  const material = useMemo(() => {
    const baseColor = isSelected
      ? new THREE.Color(color).multiplyScalar(1.5)
      : new THREE.Color(color);
    return new THREE.MeshPhysicalMaterial({
      color: baseColor,
      metalness: 0.0,
      roughness: 0.0,
      transmission: 0.98,
      transparent: true,
      opacity: opacity * gemstoneData.opacity * (isSelected ? 1.2 : 1),
      refractionRatio: gemstoneData.refractionRatio,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      ior: 2.8,
      thickness: 1.5,
      envMapIntensity: isSelected ? 5.0 : 4.0,
      sheen: 1.0,
      sheenRoughness: 0.0,
      iridescence: 0.3,
      iridescenceIOR: 1.3,
    });
  }, [color, gemstoneType, opacity, gemstoneData, isSelected]);

  // Raycaster and plane for smooth drag
  const raycaster = useRef(new THREE.Raycaster());
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const mouse = useRef(new THREE.Vector2());

  // Smooth position state for lerp
  const [smoothPosition, setSmoothPosition] = useState(position);

  // Handle mouse events for dragging
  const handlePointerDown = useCallback(
    (event) => {
      if (!isDragMode) return;
      event.stopPropagation();
      setIsDragging(true);
      onSelect(id);
      if (meshRef.current && camera && canvasRef && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        plane.current.set(new THREE.Vector3(0, 0, 1), -position[2]);
        raycaster.current.setFromCamera(mouse.current, camera);
        const intersect = new THREE.Vector3();
        raycaster.current.ray.intersectPlane(plane.current, intersect);
        setOffset([
          position[0] - intersect.x,
          position[1] - intersect.y,
          0,
        ]);
      }
      if (controlsRef && controlsRef.current) {
        controlsRef.current.enabled = false;
      }
    },
    [isDragMode, id, onSelect, controlsRef, position, camera, canvasRef]
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (!isDragging || !isDragMode) return;
      if (!camera || !canvasRef || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      plane.current.set(new THREE.Vector3(0, 0, 1), -position[2]);
      raycaster.current.setFromCamera(mouse.current, camera);
      const intersect = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(plane.current, intersect);
      let newX = intersect.x + offset[0];
      let newY = intersect.y + offset[1];
      newX = Math.max(-1, Math.min(1, newX));
      newY = Math.max(-1, Math.min(1, newY));
      const newPosition = [newX, newY, position[2]];
      onPositionChange(id, newPosition);
      setSmoothPosition(newPosition);
    },
    [isDragging, isDragMode, position, id, onPositionChange, offset, camera, canvasRef]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    // Re-enable orbit controls
    if (controlsRef && controlsRef.current) {
      controlsRef.current.enabled = !isDragMode;
    }
  }, [isDragging, isDragMode, controlsRef]);

  // Add global event listeners for mouse move and up
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
      return () => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Lerp for smooth movement
  useEffect(() => {
    if (!isDragging) setSmoothPosition(position);
  }, [position, isDragging]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  if (!visible) return null;

  return (
    <group>
      <mesh
        ref={meshRef}
        position={smoothPosition}
        material={material}
        geometry={geometry}
        onPointerDown={handlePointerDown}
        onPointerOver={() =>
          isDragMode && (document.body.style.cursor = "grab")
        }
        onPointerOut={() =>
          isDragMode && (document.body.style.cursor = "default")
        }
      >
        {/* Inner reflection geometry for more sparkle */}
        <mesh scale={[0.8, 0.8, 0.8]}>
          <sphereGeometry args={[size * 0.3, 16, 16]} />
          <meshPhysicalMaterial
            color={color}
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.2}
            envMapIntensity={2.0}
          />
        </mesh>
      </mesh>
    </group>
  );
}

// Gemstones Group Component with drag functionality
function GemstonesGroup({
  jewelryType,
  showGemstones,
  gemstoneColor,
  gemstoneType,
  gemstoneOpacity,
  gemstonePositions,
  gemstoneCut,
  onPositionChange,
  isDragMode,
  selectedGemstone,
  onGemstoneSelect,
  controlsRef,
  camera,
  canvasRef,
}) {
  return (
    <group>
      {gemstonePositions.map((gem, index) => (
        <DraggableGemstone
          key={index}
          id={index}
          position={gem.position}
          size={gem.size}
          color={gemstoneColor}
          gemstoneType={gemstoneType}
          visible={showGemstones && gem.visible}
          opacity={gemstoneOpacity}
          cut={gemstoneCut}
          onPositionChange={onPositionChange}
          isDragMode={isDragMode}
          isSelected={selectedGemstone === index}
          onSelect={onGemstoneSelect}
          controlsRef={controlsRef}
          camera={camera}
          canvasRef={canvasRef}
        />
      ))}
    </group>
  );
}

// Accept a modelUrl prop for flexibility
function Model({
  modelUrl,
  color,
  scale,
  materialType,
  texture,
  showGemstones,
  gemstoneColor,
  gemstoneType,
  customMaterial,
  agingEffect,
  lightingPreset,
  gemstoneOpacity,
  gemstonePositions,
  jewelryType,
  gemstoneCut,
  onGemstonePositionChange,
  isDragMode,
  selectedGemstone,
  onGemstoneSelect,
  controlsRef,
  camera,
  canvasRef,
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
    const aging =
      AGING_EFFECTS.find((a) => a.name === agingEffect) || AGING_EFFECTS[0];

    return {
      color,
      metalness: textureProps.metalness * aging.metalness,
      roughness: Math.max(textureProps.roughness, aging.roughness),
    };
  }, [materialType, texture, color, customMaterial, agingEffect]);

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
        }
      });
    },
    [materialProps]
  );

  useEffect(() => {
    if (modelRef.current) {
      updateMaterials(modelRef.current);
    }
  }, [updateMaterials]);

  return (
    <group>
      <primitive
        ref={modelRef}
        object={gltf.scene}
        scale={[scale, scale, scale]}
        position={[0, -1, 0]}
      />
      <GemstonesGroup
        jewelryType={jewelryType}
        showGemstones={showGemstones}
        gemstoneColor={gemstoneColor}
        gemstoneType={gemstoneType}
        gemstoneOpacity={gemstoneOpacity}
        gemstonePositions={gemstonePositions}
        gemstoneCut={gemstoneCut}
        onPositionChange={onGemstonePositionChange}
        isDragMode={isDragMode}
        selectedGemstone={selectedGemstone}
        onGemstoneSelect={onGemstoneSelect}
        controlsRef={controlsRef}
        camera={camera}
        canvasRef={canvasRef}
      />
    </group>
  );
}

function BlurredBackground({ isCustom }) {
  if (isCustom) {
    return <div className="absolute inset-0 bg-white" />;
  }

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

// Scene component that contains all 3D elements
function Scene({
  modelUrl,
  color,
  scale,
  materialType,
  texture,
  showGemstones,
  gemstoneColor,
  gemstoneType,
  customMaterial,
  agingEffect,
  lightingPreset,
  gemstoneOpacity,
  gemstonePositions,
  jewelryType,
  gemstoneCut,
  onGemstonePositionChange,
  isDragMode,
  selectedGemstone,
  onGemstoneSelect,
  canvasRef,
}) {
  const controlsRef = useRef();
  const currentLighting =
    LIGHTING_PRESETS.find((l) => l.name === lightingPreset) ||
    LIGHTING_PRESETS[0];
  const { camera } = useThree();

  return (
    <>
      <ambientLight intensity={currentLighting.ambient} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={currentLighting.directional}
        castShadow
      />
      <directionalLight
        position={[-5, 3, 2]}
        intensity={currentLighting.directional * 0.7}
      />
      <pointLight position={[0, 10, 0]} intensity={currentLighting.point} />
      <spotLight
        position={[0, 10, 5]}
        intensity={currentLighting.spot}
        angle={0.3}
        penumbra={0.5}
        castShadow
      />

      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={!isDragMode}
        minDistance={2}
        maxDistance={10}
        maxPolarAngle={Math.PI / 2}
      />

      <Model
        modelUrl={modelUrl}
        color={color}
        scale={scale}
        materialType={materialType}
        texture={texture}
        showGemstones={showGemstones}
        gemstoneColor={gemstoneColor}
        gemstoneType={gemstoneType}
        customMaterial={customMaterial}
        agingEffect={agingEffect}
        lightingPreset={lightingPreset}
        gemstoneOpacity={gemstoneOpacity}
        gemstonePositions={gemstonePositions}
        jewelryType={jewelryType}
        gemstoneCut={gemstoneCut}
        onGemstonePositionChange={onGemstonePositionChange}
        isDragMode={isDragMode}
        selectedGemstone={selectedGemstone}
        onGemstoneSelect={onGemstoneSelect}
        controlsRef={controlsRef}
        camera={camera}
        canvasRef={canvasRef}
      />
    </>
  );
}

export default function Home() {
  // Get modelUrl from URL parameter - Now safely handles SSR
  const [urlModelUrl, setUrlModelUrl] = useState(null);

  // State Management
  const [color, setColor] = useState("#ff0000");
  const [scale, setScale] = useState(0.35); // Reduced default size
  const [materialType, setMaterialType] = useState("gold");
  const [texture, setTexture] = useState("Smooth");
  const [showGemstones, setShowGemstones] = useState(false);
  const [gemstoneColor, setGemstoneColor] = useState("#ffffff");
  const [gemstoneType, setGemstoneType] = useState("Diamond");
  const [gemstoneCut, setGemstoneCut] = useState("Round");
  const [gemstoneOpacity, setGemstoneOpacity] = useState(0.9);
  const [modelUrl, setModelUrl] = useState(MODEL_URLS.default);
  const [agingEffect, setAgingEffect] = useState("New");
  const [lightingPreset, setLightingPreset] = useState("Studio");
  const [jewelryType, setJewelryType] = useState("default");

  // Drag and drop states
  const [isDragMode, setIsDragMode] = useState(false);
  const [selectedGemstone, setSelectedGemstone] = useState(null);

  // Gemstone positions state - now dynamic and draggable
  const [gemstonePositions, setGemstonePositions] = useState([
    { position: [0, 0.1, 0], size: 0.2, visible: true },
    { position: [-0.1, 0.05, 0], size: 0.15, visible: true },
    { position: [0.1, 0.05, 0], size: 0.15, visible: true },
    { position: [0, -0.05, 0], size: 0.12, visible: true },
    { position: [-0.15, -0.1, 0], size: 0.1, visible: false },
    { position: [0.15, -0.1, 0], size: 0.1, visible: false },
  ]);

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
  const [isEffectsControlOpen, setIsEffectsControlOpen] = useState(false);

  // Get URL parameter on client-side only
  useEffect(() => {
    const urlParam = getUrlParameter("modelUrl");
    setUrlModelUrl(urlParam);
  }, []);

  // Update modelUrl when URL parameter changes
  useEffect(() => {
    if (urlModelUrl) {
      setModelUrl(urlModelUrl);
      // Determine jewelry type from URL
      const type =
        Object.keys(MODEL_URLS).find(
          (key) => MODEL_URLS[key] === urlModelUrl
        ) || "default";
      setJewelryType(type);
      console.log(
        "Model URL updated from URL parameter:",
        urlModelUrl,
        "Type:",
        type
      );
    }
  }, [urlModelUrl]);

  // Handle gemstone position changes
  const handleGemstonePositionChange = useCallback(
    (gemstoneId, newPosition) => {
      setGemstonePositions((prev) =>
        prev.map((gem, index) =>
          index === gemstoneId ? { ...gem, position: newPosition } : gem
        )
      );
    },
    []
  );

  // Handle gemstone selection
  const handleGemstoneSelect = useCallback((gemstoneId) => {
    setSelectedGemstone(gemstoneId);
  }, []);

  // Toggle gemstone visibility
  const toggleGemstone = useCallback((index) => {
    setGemstonePositions((prev) =>
      prev.map((gem, i) =>
        i === index ? { ...gem, visible: !gem.visible } : gem
      )
    );
  }, []);

  // Add new gemstone
  const addGemstone = useCallback(() => {
    const newGemstone = {
      position: [0, 0, 0],
      size: 0.12,
      visible: true,
    };
    setGemstonePositions((prev) => [...prev, newGemstone]);
  }, []);

  // Remove selected gemstone
  const removeSelectedGemstone = useCallback(() => {
    if (selectedGemstone !== null) {
      setGemstonePositions((prev) =>
        prev.filter((_, index) => index !== selectedGemstone)
      );
      setSelectedGemstone(null);
    }
  }, [selectedGemstone]);

  // Optimized handlers
  const handleScaleChange = useCallback((newScale) => {
    setScale(Math.max(0.1, Math.min(2, newScale)));
  }, []);

  const handleMaterialChange = useCallback((newMaterialType) => {
    setMaterialType(newMaterialType);
    if (newMaterialType !== "custom") {
      const newColor = MATERIAL_PRESETS[newMaterialType].color;
      setColor(newColor);
      console.log("Material changed to:", newMaterialType, "Color:", newColor);
    }
  }, []);

  const handleCustomMaterialChange = useCallback((property, value) => {
    setCustomMaterial((prev) => ({
      ...prev,
      [property]: value,
    }));
  }, []);

  // Close all panels function
  const closeAllPanels = useCallback(() => {
    setIsColorPickerOpen(false);
    setIsSizeControlOpen(false);
    setIsMaterialPanelOpen(false);
    setIsGemstoneControlOpen(false);
    setIsEffectsControlOpen(false);
  }, []);

  // Log current model URL for debugging
  useEffect(() => {
    console.log("Current model URL:", modelUrl, "Jewelry Type:", jewelryType);
  }, [modelUrl, jewelryType]);

  const getActivePresetName = () => {
    const activeCount = gemstonePositions.filter((gem) => gem.visible).length;
    if (activeCount === 1) return "Solitaire";
    if (activeCount === 3) return "Classic";
    if (activeCount === 5) return "Luxury";
    return `${activeCount} Stones`;
  };

  // Download Image Handler
  const handleDownloadImage = useCallback(() => {
    // Find the canvas element rendered by react-three-fiber
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = 'jewelry_design.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const [selectedSize, setSelectedSize] = useState(DEFAULT_SIZES[jewelryType] || 17.3);

  // Update selectedSize and scale when jewelryType changes
  useEffect(() => {
    setSelectedSize(DEFAULT_SIZES[jewelryType] || 17.3);
    setScale(0.35); // Reset scale to default for new type
  }, [jewelryType]);

  // Universal size change handler
  const handleSizeChange = (value) => {
    setSelectedSize(value);
    const defaultSize = DEFAULT_SIZES[jewelryType] || 17.3;
    const scaleFactor = value / defaultSize;
    setScale(0.35 * scaleFactor);
  };

  const canvasRef = useRef();

  return (
    <div className="w-screen h-screen bg-white flex items-center justify-center p-2 md:p-4 relative overflow-hidden">
      <BlurredBackground isCustom={materialType === "custom"} />

      {/* Download Image Button Only */}
      <div className="absolute top-2 right-2 z-30 flex gap-2">
        <button
          onClick={handleDownloadImage}
          className="px-3 py-1.5 rounded bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition"
        >
          Download Image
        </button>
      </div>

      {!materialType === "custom" && (
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
      )}

      <div
        className={`relative w-full max-w-5xl h-full max-h-[700px] backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border-2 z-10 ${
          materialType === "custom"
            ? "bg-white/90 border-gray-300"
            : "bg-black/40 border-gray-600/50"
        }`}
      >
        {/* Compact Mobile Control Panel */}
        <div className="absolute top-2 left-2 md:top-6 md:left-6 z-20 flex flex-wrap gap-2 md:flex-col md:space-y-3">
          {/* Color Control */}
          <button
            onClick={() => {
              closeAllPanels();
              setIsColorPickerOpen(!isColorPickerOpen);
            }}
            className="w-10 h-10 md:w-14 md:h-14 rounded-lg border-2 border-gray-500/70 shadow-lg hover:scale-105 transition-transform duration-200 backdrop-blur-md"
            style={{
              backgroundColor:
                materialType === "custom" ? customMaterial.color : color,
            }}
          />

          {/* Material Control */}
          <button
            onClick={() => {
              closeAllPanels();
              setIsMaterialPanelOpen(!isMaterialPanelOpen);
            }}
            className="w-10 h-10 md:w-14 md:h-14 rounded-lg border-2 border-gray-500/70 shadow-lg hover:scale-105 transition-transform duration-200 bg-gradient-to-br from-yellow-600 to-yellow-800 backdrop-blur-md flex items-center justify-center"
          >
            <svg
              width="16"
              height="16"
              className="md:w-5 md:h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M12 2L2 22h20L12 2z" />
            </svg>
          </button>

          {/* Size Control */}
          <button
            onClick={() => {
              closeAllPanels();
              setIsSizeControlOpen(!isSizeControlOpen);
            }}
            className="w-10 h-10 md:w-14 md:h-14 rounded-lg border-2 border-gray-500/70 shadow-lg hover:scale-105 transition-transform duration-200 bg-gray-800/80 backdrop-blur-md flex items-center justify-center"
          >
            <svg
              width="16"
              height="16"
              className="md:w-5 md:h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>

          {/* Gemstone Control */}
          <button
            onClick={() => {
              closeAllPanels();
              setIsGemstoneControlOpen(!isGemstoneControlOpen);
            }}
            className="w-10 h-10 md:w-14 md:h-14 rounded-lg border-2 border-gray-500/70 shadow-lg hover:scale-105 transition-transform duration-200 bg-gradient-to-br from-blue-600 to-purple-700 backdrop-blur-md flex items-center justify-center"
          >
            <svg
              width="16"
              height="16"
              className="md:w-5 md:h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M6 3h12l4 6-10 13L2 9l4-6z" />
            </svg>
          </button>

          {/* Drag Mode Toggle */}
          <button
            onClick={() => setIsDragMode(!isDragMode)}
            className={`w-10 h-10 md:w-14 md:h-14 rounded-lg border-2 border-gray-500/70 shadow-lg hover:scale-105 transition-transform duration-200 backdrop-blur-md flex items-center justify-center ${
              isDragMode
                ? "bg-gradient-to-br from-green-600 to-green-800"
                : "bg-gradient-to-br from-gray-600 to-gray-800"
            }`}
          >
            <svg
              width="16"
              height="16"
              className="md:w-5 md:h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M9 9l6 6M9 15l6-6M3 12h18M12 3v18" />
            </svg>
          </button>

          {/* Effects Control */}
          <button
            onClick={() => {
              closeAllPanels();
              setIsEffectsControlOpen(!isEffectsControlOpen);
            }}
            className="w-10 h-10 md:w-14 md:h-14 rounded-lg border-2 border-gray-500/70 shadow-lg hover:scale-105 transition-transform duration-200 bg-gradient-to-br from-purple-600 to-pink-700 backdrop-blur-md flex items-center justify-center"
          >
            <svg
              width="16"
              height="16"
              className="md:w-5 md:h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        </div>

        {/* Enhanced Gemstone Control Panel with Drag Features */}
        {isGemstoneControlOpen && (
          <div className="absolute top-14 left-2 md:top-6 md:left-20 z-30 bg-gray-900/95 backdrop-blur-xl p-3 rounded-xl shadow-xl border border-gray-600/50 w-64 md:w-80 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-200 m-0">Gemstones</p>
              <button
                onClick={() => setIsGemstoneControlOpen(false)}
                className="text-gray-400 hover:text-gray-200 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {/* Drag Mode Controls */}
              <div className="bg-gray-800/50 p-2 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Drag Mode</span>
                  <button
                    onClick={() => setIsDragMode(!isDragMode)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      isDragMode ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform absolute top-0.5 ${
                        isDragMode
                          ? "transform translate-x-5"
                          : "transform translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                {isDragMode && (
                  <div className="text-xs text-green-300 bg-green-900/30 p-2 rounded">
                    💡 Click and drag gemstones to reposition them!
                  </div>
                )}
              </div>

              {/* Gemstone Management */}
              <div className="flex gap-2">
                <button
                  onClick={addGemstone}
                  className="flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 border border-blue-600/30"
                >
                  + Add Stone
                </button>
                <button
                  onClick={removeSelectedGemstone}
                  disabled={selectedGemstone === null}
                  className="flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors bg-red-600/20 text-red-300 hover:bg-red-600/40 border border-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Show All</span>
                <button
                  onClick={() => setShowGemstones(!showGemstones)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    showGemstones ? "bg-blue-600" : "bg-gray-600"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform absolute top-0.5 ${
                      showGemstones
                        ? "transform translate-x-5"
                        : "transform translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {showGemstones && (
                <>
                  {/* Gemstone Cut/Shape Selection */}
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">
                      Gemstone Cut
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {GEMSTONE_CUTS.map((cut) => (
                        <button
                          key={cut.name}
                          onClick={() => setGemstoneCut(cut.name)}
                          className={`px-1 py-2 rounded text-xs font-medium transition-colors flex flex-col items-center gap-1 ${
                            gemstoneCut === cut.name
                              ? "bg-purple-600 text-white"
                              : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                          }`}
                        >
                          <span className="text-lg">{cut.icon}</span>
                          <span className="text-xs">{cut.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Individual Gemstone Controls */}
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">
                      Individual Stones ({gemstonePositions.length})
                    </label>
                    <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                      {gemstonePositions.map((gem, index) => (
                        <button
                          key={index}
                          onClick={() => toggleGemstone(index)}
                          className={`px-2 py-2 rounded text-xs font-medium transition-colors flex items-center justify-center relative ${
                            gem.visible
                              ? "bg-blue-600 text-white"
                              : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                          } ${
                            selectedGemstone === index
                              ? "ring-2 ring-green-400"
                              : ""
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full border border-gray-400 mr-1"
                            style={{
                              backgroundColor: gem.visible
                                ? gemstoneColor
                                : "transparent",
                            }}
                          />
                          {index + 1}
                          {selectedGemstone === index && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                      Gemstone Type
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      {GEMSTONE_PRESETS.map((gem) => (
                        <button
                          key={gem.name}
                          onClick={() => {
                            setGemstoneType(gem.name);
                            setGemstoneColor(gem.color);
                          }}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                            gemstoneType === gem.name
                              ? "bg-blue-600 text-white"
                              : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                          }`}
                        >
                          <div
                            className="w-2 h-2 rounded-full border border-gray-400"
                            style={{ backgroundColor: gem.color }}
                          />
                          {gem.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                      Custom Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={gemstoneColor}
                        onChange={(e) => setGemstoneColor(e.target.value)}
                        className="w-6 h-6 rounded border border-gray-600 cursor-pointer"
                      />
                      <span className="text-xs text-gray-400 font-mono">
                        {gemstoneColor.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                      Opacity: {gemstoneOpacity.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={gemstoneOpacity}
                      onChange={(e) =>
                        setGemstoneOpacity(Number.parseFloat(e.target.value))
                      }
                      className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Color Picker Panel */}
        {isColorPickerOpen && (
          <div className="absolute top-14 left-2 md:top-6 md:left-20 z-30 bg-gray-900/95 backdrop-blur-xl p-3 rounded-xl shadow-xl border border-gray-600/50 w-48 md:w-64">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-200 m-0">Color</p>
              <button
                onClick={() => setIsColorPickerOpen(false)}
                className="text-gray-400 hover:text-gray-200 text-lg font-bold"
              >
                ×
              </button>
            </div>
            <div className="mb-3">
              <HexColorPicker
                color={materialType === "custom" ? customMaterial.color : color}
                onChange={(newColor) => {
                  if (materialType === "custom") {
                    handleCustomMaterialChange("color", newColor);
                  } else {
                    setColor(newColor);
                    console.log("Color picker changed to:", newColor);
                  }
                }}
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
          <div className="absolute top-14 left-2 md:top-6 md:left-20 z-30 bg-gray-900/95 backdrop-blur-xl p-3 rounded-xl shadow-xl border border-gray-600/50 w-56 md:w-72 max-h-80 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-200 m-0">Material</p>
              <button
                onClick={() => setIsMaterialPanelOpen(false)}
                className="text-gray-400 hover:text-gray-200 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Type</label>
                <select
                  value={materialType}
                  onChange={(e) => handleMaterialChange(e.target.value)}
                  className="w-full bg-gray-800/50 text-gray-200 border border-gray-600/30 rounded-lg px-2 py-1.5 text-sm"
                >
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                  <option value="platinum">Platinum</option>
                  <option value="copper">Copper</option>
                  <option value="titanium">Titanium</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Finish
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {TEXTURE_OPTIONS.map((textureOption) => (
                    <button
                      key={textureOption.name}
                      onClick={() => setTexture(textureOption.name)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
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

              {materialType === "custom" && (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                      Metal: {customMaterial.metalness.toFixed(1)}
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
                          Number.parseFloat(e.target.value)
                        )
                      }
                      className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                      Rough: {customMaterial.roughness.toFixed(1)}
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
                          Number.parseFloat(e.target.value)
                        )
                      }
                      className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Size Control Panel */}
        {isSizeControlOpen && (
          <div className="absolute top-14 left-2 md:top-6 md:left-20 z-30 bg-gray-900/95 backdrop-blur-xl p-3 rounded-xl shadow-xl border border-gray-600/50 w-48 md:w-64">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-200 m-0">Size</p>
              <button
                onClick={() => setIsSizeControlOpen(false)}
                className="text-gray-400 hover:text-gray-200 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {/* Universal Size Selector */}
              {SIZE_OPTIONS[jewelryType] && (
                <div className="mb-2">
                  <label className="text-xs text-gray-400 mb-1 block">
                    {jewelryType.charAt(0).toUpperCase() + jewelryType.slice(1)} Size
                  </label>
                  <select
                    value={selectedSize}
                    onChange={e => handleSizeChange(Number(e.target.value))}
                    className="w-full bg-gray-800/50 text-gray-200 border border-gray-600/30 rounded-lg px-2 py-1.5 text-sm"
                  >
                    {SIZE_OPTIONS[jewelryType].map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* XS/S/M/L Quick Buttons and Scale Slider (for all types) */}
              <div className="flex gap-1 mt-2">
                {[
                  { label: "XS", value: 0.25 },
                  { label: "S", value: 0.35 },
                  { label: "M", value: 0.5 },
                  { label: "L", value: 0.7 },
                ].map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => setScale(value)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors flex-1 ${
                      Math.abs(scale - value) < 0.05
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div>
                <input
                  type="range"
                  min="0.1"
                  max="1.2"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(Number.parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-center mt-1">
                  <span className="text-xs text-gray-300 font-mono bg-gray-800/50 px-2 py-0.5 rounded">
                    {Math.round(scale * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Effects Control Panel */}
        {isEffectsControlOpen && (
          <div className="absolute top-14 left-2 md:top-6 md:left-20 z-30 bg-gray-900/95 backdrop-blur-xl p-3 rounded-xl shadow-xl border border-gray-600/50 w-56 md:w-72 max-h-80 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-200 m-0">Effects</p>
              <button
                onClick={() => setIsEffectsControlOpen(false)}
                className="text-gray-400 hover:text-gray-200 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Aging
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {AGING_EFFECTS.map((effect) => (
                    <button
                      key={effect.name}
                      onClick={() => setAgingEffect(effect.name)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        agingEffect === effect.name
                          ? "bg-purple-600 text-white"
                          : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                      }`}
                    >
                      {effect.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Lighting
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {LIGHTING_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setLightingPreset(preset.name)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        lightingPreset === preset.name
                          ? "bg-yellow-600 text-white"
                          : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile-optimized Instructions */}
        <div className="absolute top-2 right-2 md:top-6 md:right-6 z-20">
          <div
            className={`backdrop-blur-md p-2 md:p-3 rounded-lg shadow-lg max-w-xs border ${
              materialType === "custom"
                ? "bg-gray-100/90 border-gray-300 text-gray-800"
                : "bg-gray-900/80 border-gray-600/50 text-gray-200"
            }`}
          >
            <p className="text-xs md:text-sm m-0">
        
        
      
            </p>
          </div>
        </div>

        {/* Model URL Display for Debugging */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20 hidden md:block">
          <div
            className={`backdrop-blur-md p-2 rounded-lg shadow-lg max-w-md border ${
              materialType === "custom"
                ? "bg-gray-100/90 border-gray-300 text-gray-800"
                : "bg-gray-900/80 border-gray-600/50 text-gray-300"
            }`}
          >
            <p className="text-xs m-0 text-center">
              {jewelryType.charAt(0).toUpperCase() + jewelryType.slice(1)} •{" "}
              {gemstonePositions.filter((gem) => gem.visible).length}
              {gemstoneCut} stones {isDragMode ? "• DRAG MODE" : ""}
            </p>
          </div>
        </div>

        {/* 3D Canvas with enhanced border */}
        <div className="w-full h-full border-4 border-gray-600/30 rounded-2xl md:rounded-3xl overflow-hidden">
          <Canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{
              background:
                materialType === "custom"
                  ? "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)"
                  : "radial-gradient(circle at center, rgba(30,30,30,0.8) 0%, rgba(0,0,0,0.9) 100%)",
            }}
            camera={{ position: [0, 1, 5], fov: 50 }}
            gl={{ preserveDrawingBuffer: true }}
          >
            <Scene
              modelUrl={modelUrl}
              color={color}
              scale={scale}
              materialType={materialType}
              texture={texture}
              showGemstones={showGemstones}
              gemstoneColor={gemstoneColor}
              gemstoneType={gemstoneType}
              customMaterial={customMaterial}
              agingEffect={agingEffect}
              lightingPreset={lightingPreset}
              gemstoneOpacity={gemstoneOpacity}
              gemstonePositions={gemstonePositions}
              jewelryType={jewelryType}
              gemstoneCut={gemstoneCut}
              onGemstonePositionChange={handleGemstonePositionChange}
              isDragMode={isDragMode}
              selectedGemstone={selectedGemstone}
              onGemstoneSelect={handleGemstoneSelect}
              canvasRef={canvasRef}
            />
          </Canvas>
        </div>

        {/* Enhanced Mobile-friendly Status Bar */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20">
          <div
            className={`backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs border flex items-center gap-2 md:gap-4 ${
              materialType === "custom"
                ? "bg-gray-100/90 border-gray-300 text-gray-800"
                : "bg-gray-900/80 border-gray-600/50 text-gray-200"
            }`}
          >
            <span className="hidden md:inline">
              {materialType.charAt(0).toUpperCase() + materialType.slice(1)}
            </span>
            <span className="hidden md:inline">•</span>
            <span>{Math.round(scale * 100)}%</span>
            <span>•</span>
            <span>
              {showGemstones
                ? `${getActivePresetName()} ${gemstoneCut} ${gemstoneType}`
                : "No Gems"}
            </span>
            {isDragMode && (
              <>
                <span>•</span>
                <span className="text-green-400">DRAG</span>
              </>
            )}
            <span>•</span>
            <span className="hidden sm:inline">{agingEffect}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
