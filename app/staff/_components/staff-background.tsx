"use client";

import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";
import React from "react";

type SafeShaderGradientProps = React.ComponentProps<typeof ShaderGradient> & {
  fov?: number;
  pixelDensity?: number;
};

export function StaffBackground() {
  const ExtendedShaderGradient = ShaderGradient as React.ComponentType<SafeShaderGradientProps>;

  return (
    <div className="fixed inset-0 -z-10">
      <ShaderGradientCanvas
        pointerEvents="none"
        style={{ width: "100%", height: "100%" }}
        pixelDensity={0.5}
        fov={45}
      >
        <ExtendedShaderGradient
          control="props"
          animate="on"
          brightness={1.2}
          cAzimuthAngle={183}
          cDistance={2.9}
          cPolarAngle={88}
          cameraZoom={1}
          color1="#fff3ed"
          color2="#f8f2f1"
          color3="#edfcff"
          grain="off"
          lightType="3d"
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
          fov={45}
          pixelDensity={1}
        />
      </ShaderGradientCanvas>
    </div>
  );
}
