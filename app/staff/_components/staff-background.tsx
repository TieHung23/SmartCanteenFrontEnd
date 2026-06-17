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
          axesHelper="off"
          brightness={1.2}
          cAzimuthAngle={183}
          cDistance={2.9}
          cPolarAngle={88}
          cameraZoom={1}
          color1="#fff3ed"
          color2="#f8f2f1"
          color3="#edfcff"
          destination="onCanvas"
          embedMode="off"
          envPreset="city"
          format="gif"
          fov={45}
          frameRate={10}
          gizmoHelper="hide"
          grain="off"
          lightType="3d"
          pixelDensity={1}
          positionX={0}
          positionY={1.8}
          positionZ={0}
          range="disabled"
          rangeEnd={40}
          rangeStart={0}
          reflection={0.1}
          rotationX={0}
          rotationY={0}
          rotationZ={-90}
          shader="defaults"
          type="waterPlane"
          uAmplitude={0}
          uDensity={1}
          uFrequency={5.5}
          uSpeed={0.3}
          uStrength={3}
          uTime={0.2}
          wireframe={false}
        />
      </ShaderGradientCanvas>
    </div>
  );
}
