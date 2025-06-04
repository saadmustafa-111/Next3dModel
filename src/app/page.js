"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useSearchParams } from "next/navigation";

function Model() {
  const searchParams = useSearchParams();
  const modelUrl =
    searchParams.get("modelUrl") ||
    "https://res.cloudinary.com/dkpo8ys7l/raw/upload/v1748931256/tops_model.glb";
  const gltf = useGLTF(modelUrl);

  return (
    <primitive
      object={gltf.scene}
      scale={[0.5, 0.5, 0.5]}
      position={[0, -1, 0]}
    />
  );
}

export default function Home() {
  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0 }}>
      <Canvas camera={{ position: [0, 1, 5], fov: 50 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[2, 2, 2]} />
        <OrbitControls />
        <Model />
      </Canvas>
    </div>
  );
}
