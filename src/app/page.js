"use client";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { HexColorPicker } from "react-colorful";
import * as THREE from "three";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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
  const safeSize = Number.isFinite(size) && size > 0 ? size : 0.09;
  switch (shape) {
    case "sphere":
      return new THREE.SphereGeometry(safeSize, 32, 32);
    case "box":
      return new THREE.BoxGeometry(safeSize * 1.2, safeSize * 1.2, safeSize * 0.8);
    case "emerald":
      return new THREE.BoxGeometry(safeSize * 1.4, safeSize * 1.8, safeSize * 0.6);
    case "triangle":
      return new THREE.ConeGeometry(safeSize * 1.2, safeSize * 1.5, 3);
    case "marquise":
      const marquiseShape = new THREE.Shape();
      marquiseShape.moveTo(0, safeSize * 1.5);
      marquiseShape.quadraticCurveTo(safeSize * 0.8, safeSize * 0.8, 0, 0);
      marquiseShape.quadraticCurveTo(-safeSize * 0.8, safeSize * 0.8, 0, safeSize * 1.5);
      return new THREE.ExtrudeGeometry(marquiseShape, {
        depth: safeSize * 0.5,
        bevelEnabled: true,
        bevelSize: 0.02,
      });
    case "heart":
      const heartShape = new THREE.Shape();
      heartShape.moveTo(0, -safeSize * 0.5);
      heartShape.bezierCurveTo(
        0,
        -safeSize * 0.8,
        -safeSize * 0.6,
        -safeSize * 1.2,
        -safeSize * 0.6,
        -safeSize * 0.8
      );
      heartShape.bezierCurveTo(
        -safeSize * 0.6,
        -safeSize * 0.4,
        -safeSize * 0.3,
        -safeSize * 0.2,
        0,
        safeSize * 0.2
      );
      heartShape.bezierCurveTo(
        safeSize * 0.3,
        -safeSize * 0.2,
        safeSize * 0.6,
        -safeSize * 0.4,
        safeSize * 0.6,
        -safeSize * 0.8
      );
      heartShape.bezierCurveTo(
        safeSize * 0.6,
        -safeSize * 1.2,
        0,
        -safeSize * 0.8,
        0,
        -safeSize * 0.5
      );
      return new THREE.ExtrudeGeometry(heartShape, {
        depth: safeSize * 0.4,
        bevelEnabled: true,
        bevelSize: 0.02,
      });
    case "pear":
      const pearShape = new THREE.Shape();
      pearShape.moveTo(0, safeSize * 1.5);
      pearShape.quadraticCurveTo(safeSize * 0.8, safeSize * 0.5, safeSize * 0.6, 0);
      pearShape.quadraticCurveTo(safeSize * 0.6, -safeSize * 0.8, 0, -safeSize * 0.8);
      pearShape.quadraticCurveTo(-safeSize * 0.6, -safeSize * 0.8, -safeSize * 0.6, 0);
      pearShape.quadraticCurveTo(-safeSize * 0.8, safeSize * 0.5, 0, safeSize * 1.5);
      return new THREE.ExtrudeGeometry(pearShape, {
        depth: safeSize * 0.5,
        bevelEnabled: true,
        bevelSize: 0.02,
      });
    case "oval":
      return new THREE.SphereGeometry(safeSize, 32, 16, 0, Math.PI * 2, 0, Math.PI);
    default:
      return new THREE.OctahedronGeometry(safeSize, 2);
  }
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
  materialType,
}) {
  const meshRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState([0, 0, 0]);
  const [smoothPosition, setSmoothPosition] = useState(position);
  const [draggedPosition, setDraggedPosition] = useState(null);

  const gemstoneData =
    GEMSTONE_PRESETS.find((g) => g.name === gemstoneType) ||
    GEMSTONE_PRESETS[0];
  const cutData = GEMSTONE_CUTS.find((c) => c.name === cut) || GEMSTONE_CUTS[0];

  const safePosition = Array.isArray(position) && position.length === 3 && position.every(Number.isFinite)
    ? position
    : [0, 0.1, 0];
  const safeSize = Number.isFinite(size) && size > 0 ? size : 0.09;

  const geometry = useMemo(
    () => createGemstoneGeometry(cutData.shape, safeSize),
    [cutData.shape, safeSize]
  );

  // Use materialType for gold/silver look
  const matPreset = MATERIAL_PRESETS[materialType] || MATERIAL_PRESETS.gold;
  const material = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color),
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
  }, [color, opacity, gemstoneData, isSelected]);

  // Raycaster and plane for smooth drag (support touch and mouse)
  const raycaster = useRef(new THREE.Raycaster());
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const mouse = useRef(new THREE.Vector2());

  // Drag logic (mouse and touch)
  const handlePointerDown = useCallback(
    (event) => {
      if (!isDragMode) return;
      event.stopPropagation();
      setIsDragging(true);
      setDraggedPosition(safePosition); // start drag from current position
      if (meshRef.current && camera && canvasRef && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;
        mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        plane.current.set(new THREE.Vector3(0, 0, 1), -safePosition[2]);
        raycaster.current.setFromCamera(mouse.current, camera);
        const intersect = new THREE.Vector3();
        raycaster.current.ray.intersectPlane(plane.current, intersect);
        setOffset([
          safePosition[0] - intersect.x,
          safePosition[1] - intersect.y,
          0,
        ]);
      }
    },
    [isDragMode, safePosition, camera, canvasRef]
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (!isDragging || !isDragMode) return;
      if (!camera || !canvasRef || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;
      mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      plane.current.set(new THREE.Vector3(0, 0, 1), -safePosition[2]);
      raycaster.current.setFromCamera(mouse.current, camera);
      const intersect = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(plane.current, intersect);
      let newX = intersect.x + offset[0];
      let newY = intersect.y + offset[1];
      newX = Math.max(-1, Math.min(1, newX));
      newY = Math.max(-1, Math.min(1, newY));
      const newPosition = [newX, newY, safePosition[2]];
      setSmoothPosition(newPosition);
      setDraggedPosition(newPosition);
    },
    [isDragging, isDragMode, safePosition, offset, camera, canvasRef]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (draggedPosition) {
      onPositionChange(draggedPosition);
    }
    setDraggedPosition(null);
  }, [isDragging, draggedPosition, onPositionChange]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
      document.addEventListener("touchmove", handlePointerMove);
      document.addEventListener("touchend", handlePointerUp);
      return () => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
        document.removeEventListener("touchmove", handlePointerMove);
        document.removeEventListener("touchend", handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Only update smoothPosition when prop changes and not while dragging
  useEffect(() => {
    if (!isDragging &&
        (!Array.isArray(smoothPosition) ||
          smoothPosition[0] !== safePosition[0] ||
          smoothPosition[1] !== safePosition[1] ||
          smoothPosition[2] !== safePosition[2])) {
      setSmoothPosition(safePosition);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePosition[0], safePosition[1], safePosition[2], isDragging]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  // Reset drag state and position when size changes
  useEffect(() => {
    setDraggedPosition(null);
    setSmoothPosition(safePosition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeSize]);

  if (!visible) return null;

  return (
    <group>
      <mesh
        ref={meshRef}
        position={isDragging && draggedPosition ? draggedPosition : smoothPosition}
        material={material}
        geometry={geometry}
        onPointerDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onPointerOver={() =>
          isDragMode && (document.body.style.cursor = "grab")
        }
        onPointerOut={() =>
          isDragMode && (document.body.style.cursor = "default")
        }
      >
        {/* Inner reflection geometry for more sparkle */}
        <mesh scale={[0.8, 0.8, 0.8]}>
          <sphereGeometry args={[safeSize * 0.3, 16, 16]} />
          <meshPhysicalMaterial
            color={color}
            metalness={matPreset.metalness}
            roughness={matPreset.roughness}
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
  showGemstones,
  gemstoneColor,
  gemstoneType,
  gemstoneOpacity,
  gemstonePosition,
  gemstoneSize,
  gemstoneCut,
  onPositionChange,
  isDragMode,
  gemstoneMaterialType,
  controlsRef,
  camera,
  canvasRef,
}) {
  if (!showGemstones) return null;
  return (
    <DraggableGemstone
      id={0}
      position={gemstonePosition}
      size={gemstoneSize}
      color={gemstoneColor}
      gemstoneType={gemstoneType}
      visible={true}
      opacity={gemstoneOpacity}
      cut={gemstoneCut}
      onPositionChange={(_, pos) => onPositionChange(pos)}
      isDragMode={isDragMode}
      isSelected={true}
      onSelect={() => {}}
      controlsRef={controlsRef}
      camera={camera}
      canvasRef={canvasRef}
      materialType={gemstoneMaterialType}
    />
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
  agingEffect,
  lightingPreset,
  gemstoneOpacity,
  gemstonePosition,
  gemstoneSize,
  jewelryType,
  gemstoneCut,
  onGemstonePositionChange,
  isDragMode,
  gemstoneMaterialType,
  controlsRef,
  camera,
  canvasRef,
}) {
  const gltf = useGLTF(modelUrl);
  const modelRef = useRef();
  const materialsCache = useRef(new Map());

  // Memoize material properties for performance
  const materialProps = useMemo(() => {
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
  }, [materialType, texture, color, agingEffect]);

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
        showGemstones={showGemstones}
        gemstoneColor={gemstoneColor}
        gemstoneType={gemstoneType}
        gemstoneOpacity={gemstoneOpacity}
        gemstonePosition={gemstonePosition}
        gemstoneSize={gemstoneSize}
        gemstoneCut={gemstoneCut}
        onPositionChange={onGemstonePositionChange}
        isDragMode={isDragMode}
        gemstoneMaterialType={gemstoneMaterialType}
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
  gemstoneOpacity,
  gemstonePosition,
  jewelryType,
  gemstoneCut,
  onGemstonePositionChange,
  isDragMode,
  gemstoneMaterialType,
  canvasRef,
  lightingPreset,
  agingEffect,
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
        agingEffect={agingEffect}
        lightingPreset={lightingPreset}
        gemstoneOpacity={gemstoneOpacity}
        gemstonePosition={gemstonePosition}
        jewelryType={jewelryType}
        gemstoneCut={gemstoneCut}
        onGemstonePositionChange={onGemstonePositionChange}
        isDragMode={isDragMode}
        gemstoneMaterialType={gemstoneMaterialType}
        controlsRef={controlsRef}
        camera={camera}
        canvasRef={canvasRef}
      />
    </>
  );
}

export default function Home() {
  // Get modelUrl, customerId, and sellerId from URL parameter - Now safely handles SSR
  const [urlModelUrl, setUrlModelUrl] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [sellerId, setSellerId] = useState(null);

  // State Management
  const [color, setColor] = useState("#ffffff");
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

  // Gemstone position state
  const [gemstonePosition, setGemstonePosition] = useState([0, 0.1, 0]);
  const [gemstoneSize, setGemstoneSize] = useState(0.09);

  // Gemstone material type state
  const [gemstoneMaterialType, setGemstoneMaterialType] = useState("gold");

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
    const customerIdParam = getUrlParameter("customerId");
    setCustomerId(customerIdParam);
    const sellerIdParam = getUrlParameter("sellerId");
    setSellerId(sellerIdParam);
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
        type,
        "Customer ID:",
        customerId
      );
    }
  }, [urlModelUrl, customerId]);

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
    console.log("Current model URL:", modelUrl, "Jewelry Type:", jewelryType, "Customer ID:", customerId);
  }, [modelUrl, jewelryType, customerId]);

  const getActivePresetName = () => {
    if (showGemstones) {
      return "Solitaire";
    }
    return "No Gems";
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

  // Order Custom Design Handler
  const handleOrderCustomDesign = async () => {
    if (!customerId) {
      alert("No customer ID found in URL.");
      return;
    }
    if (!sellerId) {
      alert("No seller ID found in URL.");
      return;
    }
    const order = {
      customerId,
      sellerId,
      modelUrl,
      color,
      scale,
      materialType,
      texture,
      showGemstones,
      gemstoneColor,
      gemstoneType,
      gemstoneCut,
      gemstoneOpacity,
      agingEffect,
      lightingPreset,
      jewelryType,
      gemstonePosition,
      gemstoneSize,
      gemstoneMaterialType,
      createdAt: serverTimestamp(),
    };
    try {
      await addDoc(collection(db, "customOrders"), order);
      alert("Order placed successfully!");
    } catch (error) {
      alert("Failed to place order: " + error.message);
    }
  };

  // Update gemstone position
  const handleGemstonePositionChange = useCallback(
    (newPosition) => {
      setGemstonePosition((prev) =>
        Array.isArray(newPosition) &&
        (prev[0] !== newPosition[0] || prev[1] !== newPosition[1] || prev[2] !== newPosition[2])
          ? newPosition
          : prev
      );
    },
    []
  );

  // In Home, define safe defaults
  const safeGemstoneSize = 0.09;
  const safeGemstoneCut = 'Round';
  const safeGemstoneMaterialType = 'gold';
  const safeGemstonePosition = [0, 0.1, 0];

  return (
    <div className="w-screen h-screen bg-white flex items-center justify-center p-2 md:p-4 relative overflow-hidden">
      <BlurredBackground isCustom={materialType === "custom"} />

      <div
        className={`relative w-full max-w-5xl h-full max-h-[700px] backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border-2 z-10 ${
          materialType === "custom"
            ? "bg-white/90 border-gray-300"
            : "bg-black/40 border-gray-600/50"
        }`}
      >
        {/* Unified Control Panel: all buttons in one vertical column */}
        <div className="absolute top-2 left-2 md:top-6 md:left-6 z-20 flex flex-col gap-y-2">
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
          {/* Download Image Button */}
          <button
            onClick={handleDownloadImage}
            className="w-10 h-10 md:w-14 md:h-14 rounded-lg border-2 border-blue-600/70 bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition flex items-center justify-center"
            title="Download Image"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
          </button>
          {/* Order Custom Design Button */}
          <button
            onClick={handleOrderCustomDesign}
            className="w-10 h-10 md:w-14 md:h-14 rounded-lg border-2 border-green-600/70 bg-green-600 text-white font-medium shadow hover:bg-green-700 transition flex items-center justify-center"
            title="Order Custom Design"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"/></svg>
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
              {/* Add/Remove Gemstone Button */}
              {!showGemstones ? (
                <button
                  onClick={() => {
                    setShowGemstones(true);
                    setGemstoneSize(safeGemstoneSize);
                    setGemstoneCut(safeGemstoneCut);
                    setGemstoneMaterialType(safeGemstoneMaterialType);
                    setGemstonePosition(safeGemstonePosition);
                  }}
                  className="w-full px-2 py-2 rounded text-xs font-medium transition-colors bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 border border-blue-600/30"
                >
                  + Add Gemstone
                </button>
              ) : (
                <button
                  onClick={() => setShowGemstones(false)}
                  className="w-full px-2 py-2 rounded text-xs font-medium transition-colors bg-red-600/20 text-red-300 hover:bg-red-600/40 border border-red-600/30"
                >
                  Remove Gemstone
                </button>
              )}

              {/* Only show controls if gemstone is present */}
              {showGemstones && <>
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
                      💡 Click and drag gemstone to reposition it!
                    </div>
                  )}
                </div>

                {/* Gemstone Cut/Shape Selector */}
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">
                    Gemstone Shape
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

                {/* Gemstone Type Selector */}
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

                {/* Gemstone Size Slider */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Gemstone Size: {gemstoneSize.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.03"
                    max="0.2"
                    step="0.01"
                    value={gemstoneSize}
                    onChange={e => setGemstoneSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </>}
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
                    handleCustomMaterialChange(
                      "color",
                      newColor
                    );
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
                      }`}
                    >
                      {effect.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3D Canvas with enhanced border */}
        <div className="w-full h-full border-4 border-gray-600/30 rounded-2xl md:rounded-3xl overflow-hidden">
          <Canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ background: "#fff" }}
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
              agingEffect={agingEffect}
              lightingPreset={lightingPreset}
              gemstoneOpacity={gemstoneOpacity}
              gemstonePosition={gemstonePosition}
              gemstoneSize={gemstoneSize}
              jewelryType={jewelryType}
              gemstoneCut={gemstoneCut}
              onGemstonePositionChange={handleGemstonePositionChange}
              isDragMode={isDragMode}
              gemstoneMaterialType={gemstoneMaterialType}
              canvasRef={canvasRef}
            />
          </Canvas>
        </div>
      </div>
    </div>
  );
}