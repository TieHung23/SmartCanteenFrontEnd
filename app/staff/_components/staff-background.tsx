"use client";

import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

export function StaffBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <ShaderGradientCanvas
        pointerEvents="none"
        style={{ width: "100%", height: "100%" }}
        pixelDensity={0.5}
        fov={45}
      >
        <ShaderGradient
          animate="on"
          brightness={1.5}
          cAzimuthAngle={180}
          cDistance={3.6}
          cPolarAngle={90}
          cameraZoom={1}
          color1="#bdf4ff"
          color2="#d4bcdb"
          color3="#e1c2bd"
          envPreset="city"
          grain="off"
          lightType="3d"
          positionX={-1.4}
          positionY={0}
          positionZ={0}
          range="disabled"
          rangeEnd={40}
          rangeStart={2}
          reflection={0.1}
          rotationX={0}
          rotationY={10}
          rotationZ={50}
          shader="defaults"
          type="plane"
          uAmplitude={1}
          uDensity={1.3}
          uFrequency={5.5}
          uSpeed={0.3}
          uStrength={4}
          uTime={2}
          wireframe={false}
          zoomOut={false}
        />
      </ShaderGradientCanvas>
    </div>
  );
}
