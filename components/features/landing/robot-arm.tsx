"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Reusable Bowl component
function Bowl({ isHeld = false }: { isHeld?: boolean }) {
  return (
    <group>
      {/* Bowl body (White) */}
      <mesh position={[0, isHeld ? 0 : 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.35, 0.5, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Lid (Orange) */}
      <mesh position={[0, isHeld ? 0.3 : 0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.52, 0.52, 0.1, 32]} />
        <meshStandardMaterial color="#ff6600" roughness={0.3} metalness={0.2} />
      </mesh>
    </group>
  );
}

function RobotArmModel() {
  const groupRef = useRef<THREE.Group>(null);
  const robotBaseRef = useRef<THREE.Group>(null);
  const shoulderRef = useRef<THREE.Group>(null);
  const elbowRef = useRef<THREE.Group>(null);
  const wristRef = useRef<THREE.Group>(null);
  const leftFingerRef = useRef<THREE.Group>(null);
  const rightFingerRef = useRef<THREE.Group>(null);

  // References for bowls
  const trayBowlRef = useRef<THREE.Group>(null);
  const handBowlRef = useRef<THREE.Group>(null);
  const conveyorBowlRef = useRef<THREE.Group>(null);

  const damp = (current: number, target: number, lambda: number, delta: number) =>
    THREE.MathUtils.damp(current, target, lambda, delta);

  const smoothStep = (value: number) => {
    const clamped = THREE.MathUtils.clamp(value, 0, 1);
    return clamped * clamped * (3 - 2 * clamped);
  };

  // Animation logic
  useFrame((state, delta) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();

      // Floating base
      groupRef.current.position.y = Math.sin(time * 1.5) * 0.05 - 4;

      // A deliberately slow, time-based cycle keeps the pick-and-place motion cinematic.
      const t = (state.clock.elapsedTime * 0.42) % 12;

      let targetRotY = 0;
      let sZ = 0;
      let eZ = 0;
      let wZ = 0;
      let fingersOpen = true;

      const phase = (from: number, to: number) => smoothStep((t - from) / (to - from));

      // Phase 1: settle and rotate toward the tray.
      if (t < 2.6) {
        targetRotY = Math.PI; // Base faces Right
        sZ = 0;
        eZ = -Math.PI / 4;
        wZ = Math.PI / 4;
        fingersOpen = true;
      }
      // Phase 2: approach the bowl with the gripper open, then close progressively.
      else if (t < 4.8) {
        targetRotY = Math.PI;
        const reach = phase(2.6, 3.8);
        sZ = THREE.MathUtils.lerp(0, Math.PI / 8, reach);
        eZ = THREE.MathUtils.lerp(-Math.PI / 4, Math.PI * 0.95, reach);
        wZ = THREE.MathUtils.lerp(Math.PI / 4, -Math.PI / 1.74, reach);
        fingersOpen = t < 4.05;
      }
      // Phase 3: pause with the load secure, then lift and transfer left.
      else if (t < 7.2) {
        targetRotY = 0; // Base faces Left
        sZ = 0;
        eZ = -Math.PI / 4;
        wZ = Math.PI / 4;
        fingersOpen = false;
      }
      // Phase 4: lower toward the conveyor and open the gripper after a soft settle.
      else if (t < 9.4) {
        targetRotY = 0;
        const place = phase(7.2, 8.7);
        sZ = THREE.MathUtils.lerp(0, Math.PI / 8, place);
        eZ = THREE.MathUtils.lerp(-Math.PI / 4, Math.PI * 0.95, place);
        wZ = THREE.MathUtils.lerp(Math.PI / 4, -Math.PI / 1.74, place);
        fingersOpen = t > 8.65;
      }
      // Phase 5: retract and wait for the bowl to travel down the belt.
      else {
        targetRotY = 0;
        sZ = 0;
        eZ = -Math.PI / 4;
        wZ = Math.PI / 4;
        fingersOpen = true;
      }

      // Smooth rotations for arm joints
      if (robotBaseRef.current) {
        // Fast lerp so it snaps to position before drop
        robotBaseRef.current.rotation.y = damp(
          robotBaseRef.current.rotation.y,
          targetRotY,
          5,
          delta,
        );
      }
      if (shoulderRef.current && elbowRef.current && wristRef.current) {
        shoulderRef.current.rotation.z = damp(shoulderRef.current.rotation.z, sZ, 6, delta);
        elbowRef.current.rotation.z = damp(elbowRef.current.rotation.z, eZ, 7, delta);
        wristRef.current.rotation.z = damp(wristRef.current.rotation.z, wZ, 8, delta);
      }

      // Smooth fingers
      if (leftFingerRef.current && rightFingerRef.current) {
        const targetOpen = fingersOpen ? 0.18 : 0.02;
        leftFingerRef.current.position.x = damp(
          leftFingerRef.current.position.x,
          -0.4 - targetOpen,
          12,
          delta,
        );
        rightFingerRef.current.position.x = damp(
          rightFingerRef.current.position.x,
          0.4 + targetOpen,
          12,
          delta,
        );
      }

      // Handle visibility and position of the bowls based on phase
      if (trayBowlRef.current && handBowlRef.current && conveyorBowlRef.current) {
        if (t < 4.05) {
          // Bowl on tray
          trayBowlRef.current.visible = true;
          handBowlRef.current.visible = false;
          conveyorBowlRef.current.visible = false;
        } else if (t >= 4.05 && t < 8.9) {
          // Bowl in hand
          trayBowlRef.current.visible = false;
          handBowlRef.current.visible = true;
          conveyorBowlRef.current.visible = false;
        } else {
          // Bowl placed on conveyor and sliding visually forward/down
          trayBowlRef.current.visible = false;
          handBowlRef.current.visible = false;
          conveyorBowlRef.current.visible = true;

          // Slide down vertically to match the CSS conveyor belt (matches 0.5s CSS animation speed)
          const slideProgress = t - 8.9; // 0 to 3.1
          conveyorBowlRef.current.position.y = 2.0 - slideProgress * 2.8;

          // Counteract 3D perspective distortion so it moves perfectly straight down on screen
          conveyorBowlRef.current.position.x = -5.5 - slideProgress * 0.162;

          // Counteract perspective shrinking as it moves away
          const bowlScale = 1.0 + slideProgress * 0.035;
          conveyorBowlRef.current.scale.set(bowlScale, bowlScale, bowlScale);

          conveyorBowlRef.current.position.z = 0;

          // Fade out only at the very end of the 10-second loop (last 0.5 seconds)
          let opacity = 1;
          if (slideProgress > 2.55) {
            opacity = Math.max(0, 1 - (slideProgress - 2.55) * 2);
          }
          conveyorBowlRef.current.children.forEach((child) => {
            if (child instanceof THREE.Mesh && child.material) {
              child.material.opacity = opacity;
              child.material.transparent = true;
            }
          });
        }

        // Dynamically rotate the bowl in hand to always stay upright
        if (shoulderRef.current && elbowRef.current && wristRef.current) {
          const globalZ =
            shoulderRef.current.rotation.z +
            elbowRef.current.rotation.z +
            wristRef.current.rotation.z;
          handBowlRef.current.rotation.z = -globalZ;
        }
      }
    }
  });

  // Materials
  const wMat = new THREE.MeshStandardMaterial({ color: "#f8f9fa", roughness: 0.1, metalness: 0.1 });
  const rMat = new THREE.MeshStandardMaterial({ color: "#ff6600", roughness: 0.3, metalness: 0.2 });
  const sMat = new THREE.MeshStandardMaterial({ color: "#bdc3c7", roughness: 0.4, metalness: 0.8 });
  const dMat = new THREE.MeshStandardMaterial({ color: "#2c3e50", roughness: 0.7, metalness: 0.3 });
  const yMat = new THREE.MeshStandardMaterial({ color: "#f1c40f", roughness: 0.4, metalness: 0.1 });

  return (
    <group ref={groupRef} position={[0, -4, 0]} scale={[0.8, 0.8, 0.8]}>
      {/* ---------------- SCENERY ---------------- */}

      {/* Tray on the Right */}
      <group position={[5.5, 2.0, 0]}>
        <mesh castShadow receiveShadow position={[0, -0.2, 0]}>
          <boxGeometry args={[4, 0.2, 3]} />
          <meshStandardMaterial color="#a0a0a0" metalness={0.5} roughness={0.2} />
        </mesh>

        {/* The Bowl on the Tray (Appears and disappears) */}
        <group ref={trayBowlRef}>
          <Bowl />
        </group>

        {/* Some extra static bowls on the tray for aesthetics */}
        <group position={[1.2, 0, 0.8]}>
          <Bowl />
        </group>
        <group position={[-1.2, 0, -0.8]}>
          <Bowl />
        </group>
      </group>

      {/* The Bowl sliding on the Conveyor (Left) */}
      <group ref={conveyorBowlRef} position={[-5.5, 2.0, 0]}>
        <Bowl />
      </group>

      {/* ---------------- ROBOT ARM ---------------- */}

      <group ref={robotBaseRef}>
        {/* Base */}
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.0, 1.5, 1, 32]} />
          <primitive object={wMat} attach="material" />
        </mesh>
        <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.8, 1.0, 0.8, 32]} />
          <primitive object={wMat} attach="material" />
        </mesh>

        {/* Shoulder pan */}
        <group position={[0, 1.8, 0]}>
          {/* Shoulder lift */}
          <group ref={shoulderRef} rotation={[0, 0, Math.PI / 3.5]}>
            {/* Joint 1 (Red Ring) */}
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.9, 0.9, 1.4, 32]} />
              <primitive object={rMat} attach="material" />
            </mesh>

            {/* Upper Arm */}
            <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.55, 0.55, 5, 32]} />
              <primitive object={wMat} attach="material" />
            </mesh>

            {/* Elbow */}
            <group ref={elbowRef} position={[0, 5, 0]} rotation={[0, 0, -Math.PI / 1.6]}>
              {/* Joint 2 (Red Ring) */}
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.7, 0.7, 1.2, 32]} />
                <primitive object={rMat} attach="material" />
              </mesh>

              {/* Lower Arm */}
              <mesh position={[0, 2, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.45, 0.45, 4, 32]} />
                <primitive object={wMat} attach="material" />
              </mesh>

              {/* Wrist 1 */}
              <group ref={wristRef} position={[0, 4, 0]} rotation={[0, 0, Math.PI / 2.5]}>
                {/* Joint 3 (Red Ring) */}
                <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                  <cylinderGeometry args={[0.55, 0.55, 1.0, 32]} />
                  <primitive object={rMat} attach="material" />
                </mesh>

                {/* Wrist Link */}
                <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
                  <cylinderGeometry args={[0.4, 0.4, 2, 32]} />
                  <primitive object={wMat} attach="material" />
                </mesh>

                {/* Wrist 2 / End Effector Base */}
                <group position={[0, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
                  {/* Joint 4 (Red Ring) */}
                  <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.45, 0.45, 0.8, 32]} />
                    <primitive object={rMat} attach="material" />
                  </mesh>

                  {/* Gripper Silver Base */}
                  <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.35, 0.4, 0.6, 32]} />
                    <primitive object={sMat} attach="material" />
                  </mesh>
                  {/* Gripper Actuator Body */}
                  <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.6, 1.0, 0.5]} />
                    <primitive object={dMat} attach="material" />
                  </mesh>

                  {/* Left Finger */}
                  <group ref={leftFingerRef} position={[-0.4, 0, 0]}>
                    <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
                      <boxGeometry args={[0.3, 0.15, 0.25]} />
                      <primitive object={yMat} attach="material" />
                    </mesh>
                    <mesh position={[-0.075, 2.3, 0]} castShadow receiveShadow>
                      <boxGeometry args={[0.15, 1.2, 0.25]} />
                      <primitive object={yMat} attach="material" />
                    </mesh>
                  </group>

                  {/* Right Finger */}
                  <group ref={rightFingerRef} position={[0.4, 0, 0]}>
                    <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
                      <boxGeometry args={[0.3, 0.15, 0.25]} />
                      <primitive object={yMat} attach="material" />
                    </mesh>
                    <mesh position={[0.075, 2.3, 0]} castShadow receiveShadow>
                      <boxGeometry args={[0.15, 1.2, 0.25]} />
                      <primitive object={yMat} attach="material" />
                    </mesh>
                  </group>

                  {/* Bowl In Hand */}
                  <group ref={handBowlRef} position={[0, 2.6, 0]}>
                    <Bowl isHeld={true} />
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

export default function RobotArm3D() {
  return (
    <div className="w-full h-full relative group overflow-hidden rounded-[3rem]">
      <Canvas camera={{ position: [0, 5, 18], fov: 45 }} shadows className="w-full h-full">
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-10, 5, -5]} intensity={0.5} />
        <pointLight position={[0, 5, 10]} intensity={0.8} />

        <RobotArmModel />
      </Canvas>
    </div>
  );
}
