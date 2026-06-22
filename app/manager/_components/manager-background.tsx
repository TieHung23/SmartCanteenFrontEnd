"use client";

import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";
import React from "react";

export function ManagerBackground() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ExtendedShaderGradient = ShaderGradient as React.ComponentType<any>;

  return (
    <div className="fixed inset-0 -z-10">
      <ShaderGradientCanvas
        pointerEvents="none"
        style={{ width: "100%", height: "100%" }}
        pixelDensity={1}
        fov={45}
      >
        <ExtendedShaderGradient
          animate="on"
          axesHelper="on"
          bgColor1="#000000"
          bgColor2="#000000"
          brightness={1.5}
          cAzimuthAngle={60}
          cDistance={7.1}
          cPolarAngle={90}
          cameraZoom={15.3}
          color1="#f0ba90"
          color2="#a7d9f2"
          color3="#fffef7"
          destination="onCanvas"
          embedMode="off"
          envPreset="dawn"
          format="gif"
          fov={45}
          frameRate={10}
          gizmoHelper="hide"
          grain="off"
          lightType="3d"
          pixelDensity={1}
          positionX={0}
          positionY={-0.15}
          positionZ={0}
          range="disabled"
          rangeEnd={40}
          rangeStart={0}
          reflection={0.1}
          rotationX={0}
          rotationY={0}
          rotationZ={0}
          shader="defaults"
          type="sphere"
          uAmplitude={1.4}
          uDensity={1.1}
          uFrequency={5.5}
          uSpeed={0.2}
          uStrength={0.4}
          uTime={0}
          wireframe={false}
        />
      </ShaderGradientCanvas>
    </div>
  );
}
