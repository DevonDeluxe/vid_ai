import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STORYBOARD_SCENES } from "../data/storyboardData";

interface VoxelPoolCanvasProps {
  currentTime: number;
  isPlaying: boolean;
  pixelResolutionMode: "voxel-hd" | "pixel-retro";
  subtitlesEnabled: boolean;
  nanoBananaCleaned: boolean;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

// Smooth Hermite interpolation (0..1)
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Create a clean voxel box with optional subtle edge highlight for crisp Nano Banana clarity
function createVoxelBox(
  w: number,
  h: number,
  d: number,
  color: number | string,
  roughness = 0.28,
  opacity = 1,
  withCrispEdges = false
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.04,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity === 1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = opacity === 1;
  mesh.receiveShadow = opacity === 1;

  if (withCrispEdges && opacity === 1) {
    const edgesGeo = new THREE.EdgesGeometry(geo);
    const edgesMat = new THREE.LineBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.14,
    });
    const line = new THREE.LineSegments(edgesGeo, edgesMat);
    mesh.add(line);
  }
  return mesh;
}

// Build a clean 3D voxel directional arrow (up or down) for the Little Kicks scene
function createVoxelArrow(color: number): THREE.Group {
  const group = new THREE.Group();
  const shaft = createVoxelBox(0.11, 0.34, 0.11, color, 0.18, 1, true);
  group.add(shaft);

  const headWide = createVoxelBox(0.3, 0.09, 0.11, color, 0.18, 1, true);
  headWide.position.y = 0.19;
  group.add(headWide);

  const headMid = createVoxelBox(0.2, 0.09, 0.11, color, 0.18, 1, true);
  headMid.position.y = 0.27;
  group.add(headMid);

  const headTip = createVoxelBox(0.1, 0.09, 0.11, color, 0.18, 1, true);
  headTip.position.y = 0.35;
  group.add(headTip);

  return group;
}

// Build a 3D golden pixel star for the celebration scene
function createPixelStar(): THREE.Group {
  const star = new THREE.Group();
  const core = createVoxelBox(0.26, 0.26, 0.11, 0xfacc15, 0.15, 1, true);
  const vert = createVoxelBox(0.11, 0.44, 0.11, 0xfde047, 0.15);
  const horiz = createVoxelBox(0.44, 0.11, 0.11, 0xfde047, 0.15);
  const centerGem = createVoxelBox(0.12, 0.12, 0.14, 0xffffff, 0.1);
  star.add(core, vert, horiz, centerGem);
  return star;
}

export const VoxelPoolCanvas: React.FC<VoxelPoolCanvasProps> = ({
  currentTime,
  pixelResolutionMode,
  subtitlesEnabled,
  nanoBananaCleaned,
  onCanvasReady,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const timeRef = useRef<number>(currentTime);
  const [webglLost, setWebglLost] = useState(false);

  timeRef.current = currentTime;

  const activeScene =
    STORYBOARD_SCENES.find(
      (s) => currentTime >= s.startTime && currentTime < s.endTime
    ) || STORYBOARD_SCENES[STORYBOARD_SCENES.length - 1];

  const getActionPhaseBadge = (t: number): string => {
    if (t < 1.8) return "Underwater Reference Framing → Smooth Voxel Pool Rise";
    if (t < 5.0) return "Calm Shallow Pool Step Entry Beside Coach";
    if (t < 6.8) return "Both Hands on Wall · Breathe In Calmly Above Water";
    if (t < 9.4) return "Both Hands on Wall · Lower Mouth & Blow Square Bubbles";
    if (t < 11.0) return "Lift Mouth Clear of Water Before Taking Next Breath";
    if (t < 18.0) return "Hands on Wall · Coach Supports Torso · Alternating Hip Kicks";
    if (t < 20.1) return "Supported Practice: Gentle Bubbles + Small Hip Kicks";
    if (t < 22.0) return "Feet Flat on Pool Floor · Smile at Coach · Pixel Stars!";
    return "Shallow Pool Steps · Wave Together with Grown-Up";
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0ea5e9);

    const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 80);

    const renderer = new THREE.WebGLRenderer({
      antialias: pixelResolutionMode === "voxel-hd",
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = nanoBananaCleaned ? 1.12 : 1.04;
    rendererRef.current = renderer;

    const domCanvas = renderer.domElement;
    domCanvas.className = `w-full h-full block object-cover ${
      pixelResolutionMode === "pixel-retro" ? "pixelated-canvas" : ""
    }`;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglLost(true);
    };
    const handleContextRestored = () => {
      setWebglLost(false);
    };
    domCanvas.addEventListener("webglcontextlost", handleContextLost);
    domCanvas.addEventListener("webglcontextrestored", handleContextRestored);

    container.innerHTML = "";
    container.appendChild(domCanvas);

    if (onCanvasReady) {
      onCanvasReady(domCanvas);
    }

    // Studio three-point lighting for bright, sunny, inviting water
    const ambientLight = new THREE.AmbientLight(0xf0f9ff, 1.55);
    scene.add(ambientLight);

    const keySunLight = new THREE.DirectionalLight(0xfffbeb, 1.85);
    keySunLight.position.set(4.5, 9.5, 6.5);
    keySunLight.castShadow = true;
    keySunLight.shadow.mapSize.width = 2048;
    keySunLight.shadow.mapSize.height = 2048;
    keySunLight.shadow.bias = -0.0005;
    scene.add(keySunLight);

    const aquaFillLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    aquaFillLight.position.set(-5, -4, 4);
    scene.add(aquaFillLight);

    // =========================================================================
    // 1. SWIMMING SCHOOL POOL ENVIRONMENT (VOXEL TILES, MOSAICS, FLAGS, STEPS)
    // =========================================================================
    const envGroup = new THREE.Group();
    scene.add(envGroup);

    // Shallow pool floor (y = -1.55) with vibrant turquoise tiles
    const poolFloor = createVoxelBox(11.0, 0.3, 7.5, 0x06b6d4, 0.35);
    poolFloor.position.set(0, -1.7, 0);
    envGroup.add(poolFloor);

    // Animated caustic & tile grid squares on the pool floor
    const causticTiles: THREE.Mesh[] = [];
    for (let x = -4.5; x <= 3.5; x += 0.9) {
      for (let z = -2.4; z <= 2.4; z += 0.9) {
        const isEven = (Math.round(x * 1.1) + Math.round(z * 1.1)) % 2 === 0;
        const tile = createVoxelBox(
          0.84,
          0.03,
          0.84,
          isEven ? 0x22d3ee : 0x0891b2,
          0.3
        );
        tile.position.set(x, -1.54, z);
        envGroup.add(tile);
        if (isEven) causticTiles.push(tile);
      }
    }

    // Dark-blue pool-floor lane markings ("T" line from reference image)
    const laneLineMain = createVoxelBox(5.2, 0.045, 0.36, 0x1e3a8a, 0.35);
    laneLineMain.position.set(-0.3, -1.525, 0.15);
    envGroup.add(laneLineMain);

    const laneLineCross = createVoxelBox(0.36, 0.045, 1.35, 0x1e3a8a, 0.35);
    laneLineCross.position.set(2.1, -1.525, 0.15);
    envGroup.add(laneLineCross);

    // Right Pool Practice Wall (x = 2.95) where the child holds the wall
    const rightWall = createVoxelBox(0.8, 3.4, 7.5, 0x0284c7, 0.3, 1, true);
    rightWall.position.set(3.05, -0.35, 0);
    envGroup.add(rightWall);

    // Crisp White Pool Coping Ledge + Sunny Yellow Hand-Grip Bar at x = 2.58, y = 0.06
    const rightWallCoping = createVoxelBox(0.92, 0.22, 7.5, 0xf8fafc, 0.22, 1, true);
    rightWallCoping.position.set(2.98, 0.12, 0);
    envGroup.add(rightWallCoping);

    const gripBar = createVoxelBox(0.16, 0.12, 7.5, 0xfacc15, 0.2, 1, true);
    gripBar.position.set(2.54, 0.05, 0);
    envGroup.add(gripBar);

    // Back Swimming School Wall (z = -3.1) with cheerful tiles & sea-creature mosaics
    const backWallLower = createVoxelBox(11.5, 2.2, 0.45, 0x0284c7, 0.35);
    backWallLower.position.set(0, -0.7, -3.15);
    envGroup.add(backWallLower);

    const backWallCoping = createVoxelBox(11.5, 0.24, 0.6, 0xf8fafc, 0.25, 1, true);
    backWallCoping.position.set(0, 0.14, -3.1);
    envGroup.add(backWallCoping);

    const backWallUpper = createVoxelBox(11.5, 3.5, 0.45, 0xf0f9ff, 0.4);
    backWallUpper.position.set(0, 1.95, -3.2);
    envGroup.add(backWallUpper);

    // Decorative tile band across upper wall
    const wallTileBand = createVoxelBox(11.5, 0.24, 0.5, 0x38bdf8, 0.28);
    wallTileBand.position.set(0, 0.62, -3.16);
    envGroup.add(wallTileBand);

    // Smiling Sea-Creature Mosaics on the Back Wall
    // 1. Smiling Voxel Crab Mosaic (left-center)
    const crabGroup = new THREE.Group();
    crabGroup.position.set(-1.35, 1.28, -2.92);
    const crabBody = createVoxelBox(0.62, 0.4, 0.1, 0xf97316, 0.25, 1, true);
    const crabEyeL = createVoxelBox(0.1, 0.13, 0.13, 0x0f172a, 0.15);
    crabEyeL.position.set(-0.15, 0.21, 0.04);
    const crabEyeR = createVoxelBox(0.1, 0.13, 0.13, 0x0f172a, 0.15);
    crabEyeR.position.set(0.15, 0.21, 0.04);
    const crabSmile = createVoxelBox(0.26, 0.07, 0.13, 0xffffff, 0.15);
    crabSmile.position.set(0, -0.05, 0.04);
    const crabClawL = createVoxelBox(0.18, 0.2, 0.1, 0xef4444, 0.25, 1, true);
    crabClawL.position.set(-0.44, 0.16, 0);
    const crabClawR = createVoxelBox(0.18, 0.2, 0.1, 0xef4444, 0.25, 1, true);
    crabClawR.position.set(0.44, 0.16, 0);
    crabGroup.add(crabBody, crabEyeL, crabEyeR, crabSmile, crabClawL, crabClawR);
    envGroup.add(crabGroup);

    // 2. Smiling Voxel Starfish Mosaic (center)
    const starfishGroup = new THREE.Group();
    starfishGroup.position.set(-0.05, 1.32, -2.92);
    const starCenter = createVoxelBox(0.32, 0.32, 0.1, 0xfacc15, 0.25, 1, true);
    const starArmV = createVoxelBox(0.14, 0.56, 0.1, 0xfde047, 0.25);
    const starArmH = createVoxelBox(0.56, 0.14, 0.1, 0xfde047, 0.25);
    const starSmile = createVoxelBox(0.16, 0.05, 0.13, 0x0f172a, 0.2);
    starSmile.position.set(0, -0.04, 0.03);
    starfishGroup.add(starCenter, starArmV, starArmH, starSmile);
    envGroup.add(starfishGroup);

    // 3. Smiling Voxel Sea Turtle Mosaic (right-center)
    const turtleGroup = new THREE.Group();
    turtleGroup.position.set(1.25, 1.28, -2.92);
    const turtleShell = createVoxelBox(0.64, 0.44, 0.1, 0x10b981, 0.25, 1, true);
    const turtleHead = createVoxelBox(0.28, 0.26, 0.12, 0x34d399, 0.25, 1, true);
    turtleHead.position.set(0.42, 0.06, 0.02);
    const turtleEye = createVoxelBox(0.08, 0.08, 0.15, 0x0f172a, 0.15);
    turtleEye.position.set(0.48, 0.12, 0.05);
    const turtleSmile = createVoxelBox(0.15, 0.05, 0.15, 0xffffff, 0.15);
    turtleSmile.position.set(0.46, -0.02, 0.05);
    turtleGroup.add(turtleShell, turtleHead, turtleEye, turtleSmile);
    envGroup.add(turtleGroup);

    // 4. Overhead Pixel Flags
    const flagColors = [0xef4444, 0xfacc15, 0x10b981, 0x3b82f6, 0xf97316, 0xec4899];
    const ropeLine = createVoxelBox(10.0, 0.04, 0.04, 0x94a3b8, 0.35);
    ropeLine.position.set(0, 2.38, -2.0);
    envGroup.add(ropeLine);

    for (let i = 0; i < 12; i++) {
      const fx = -3.85 + i * 0.7;
      const color = flagColors[i % flagColors.length];
      const flagTop = createVoxelBox(0.32, 0.2, 0.07, color, 0.25, 1, true);
      flagTop.position.set(fx, 2.24, -2.0);
      const flagTip = createVoxelBox(0.16, 0.14, 0.07, color, 0.25, 1, true);
      flagTip.position.set(fx, 2.08, -2.0);
      envGroup.add(flagTop, flagTip);
    }

    // 5. Shallow Pool Steps on the Left (x = -3.2 to -1.3)
    const stepsGroup = new THREE.Group();
    const stepConfigs = [
      { x: -3.1, y: -0.22, w: 0.75 },
      { x: -2.5, y: -0.58, w: 0.75 },
      { x: -1.9, y: -0.94, w: 0.75 },
      { x: -1.3, y: -1.28, w: 0.75 },
    ];
    stepConfigs.forEach((sc, idx) => {
      const stepBlock = createVoxelBox(
        sc.w,
        Math.abs(-1.6 - sc.y),
        2.5,
        idx % 2 === 0 ? 0xe0f2fe : 0xbae6fd,
        0.3,
        1,
        true
      );
      stepBlock.position.set(sc.x, (sc.y + -1.6) / 2, 0);
      stepsGroup.add(stepBlock);

      const edgeStrip = createVoxelBox(0.1, 0.045, 2.5, 0xfacc15, 0.25);
      edgeStrip.position.set(sc.x + sc.w / 2 - 0.05, sc.y + 0.02, 0);
      stepsGroup.add(edgeStrip);
    });
    envGroup.add(stepsGroup);

    // =========================================================================
    // 2. NON-CLIPPING TURQUOISE WATER SURFACE & FRONT WATER-LEVEL MENISCUS
    // =========================================================================
    // Positioned cleanly so it never intersects the camera near plane
    const waterSurface = createVoxelBox(8.8, 0.025, 4.2, 0x38bdf8, 0.12, 0.34);
    waterSurface.position.set(-0.6, 0.0, -0.8);
    scene.add(waterSurface);

    // Crisp water-line ribbon right in front of the characters for split water-level clarity
    const waterMeniscus = createVoxelBox(8.8, 0.028, 0.06, 0xe0f2fe, 0.1, 0.88);
    waterMeniscus.position.set(-0.6, 0.0, 0.78);
    scene.add(waterMeniscus);

    // =========================================================================
    // 3. CHILD LEARNER VOXEL CHARACTER (BRIGHT YELLOW SWIM CAP + GOGGLES)
    // =========================================================================
    const learnerGroup = new THREE.Group();
    scene.add(learnerGroup);

    const learnerTorsoPivot = new THREE.Group();
    learnerGroup.add(learnerTorsoPivot);

    // Coral-orange & sky-blue voxel swimsuit torso
    const learnerTorso = createVoxelBox(0.42, 0.54, 0.34, 0xea580c, 0.28, 1, true);
    learnerTorsoPivot.add(learnerTorso);

    const learnerSuitBand = createVoxelBox(0.44, 0.13, 0.36, 0x38bdf8, 0.28, 1, true);
    learnerSuitBand.position.set(0, 0.08, 0);
    learnerTorsoPivot.add(learnerSuitBand);

    // Head Pivot
    const learnerHeadPivot = new THREE.Group();
    learnerHeadPivot.position.set(0, 0.46, 0);
    learnerTorsoPivot.add(learnerHeadPivot);

    const learnerHead = createVoxelBox(0.44, 0.42, 0.42, 0xfdba74, 0.28, 1, true);
    learnerHeadPivot.add(learnerHead);

    // Bright Yellow Voxel Swim Cap
    const swimCapTop = createVoxelBox(0.48, 0.22, 0.46, 0xfacc15, 0.2, 1, true);
    swimCapTop.position.set(0, 0.14, 0);
    const swimCapBack = createVoxelBox(0.46, 0.32, 0.18, 0xfacc15, 0.2, 1, true);
    swimCapBack.position.set(-0.04, 0.02, -0.15);
    learnerHeadPivot.add(swimCapTop, swimCapBack);

    // Goggle Strap & Dual Front/Side Goggles
    const goggleStrap = createVoxelBox(0.49, 0.07, 0.45, 0x0f172a, 0.25);
    goggleStrap.position.set(0, 0.04, 0);
    learnerHeadPivot.add(goggleStrap);

    // Front goggles
    const goggleFrameFront = createVoxelBox(0.38, 0.14, 0.07, 0x0284c7, 0.18, 1, true);
    goggleFrameFront.position.set(0.04, 0.04, 0.21);
    const goggleLensL = createVoxelBox(0.13, 0.08, 0.09, 0xe0f2fe, 0.08);
    goggleLensL.position.set(-0.05, 0.04, 0.21);
    const goggleLensR = createVoxelBox(0.13, 0.08, 0.09, 0xe0f2fe, 0.08);
    goggleLensR.position.set(0.13, 0.04, 0.21);

    // Profile goggles (+X side facing pool wall)
    const goggleSideFrame = createVoxelBox(0.08, 0.15, 0.32, 0x0284c7, 0.18, 1, true);
    goggleSideFrame.position.set(0.21, 0.04, 0);
    const goggleSideLens = createVoxelBox(0.1, 0.09, 0.24, 0xe0f2fe, 0.08);
    goggleSideLens.position.set(0.21, 0.04, 0);

    learnerHeadPivot.add(
      goggleFrameFront,
      goggleLensL,
      goggleLensR,
      goggleSideFrame,
      goggleSideLens
    );

    // Expressive Voxel Mouth
    const learnerMouth = createVoxelBox(0.11, 0.06, 0.14, 0x7c2d12, 0.25);
    learnerMouth.position.set(0.2, -0.11, 0.1);
    learnerHeadPivot.add(learnerMouth);

    // Articulated Left & Right Arms with Distinct Hands
    const learnerLeftArm = new THREE.Group();
    learnerLeftArm.position.set(0.04, 0.2, 0.22);
    const leftArmMesh = createVoxelBox(0.14, 0.5, 0.14, 0xfdba74, 0.28, 1, true);
    leftArmMesh.position.set(0, -0.21, 0);
    const leftHandMesh = createVoxelBox(0.16, 0.14, 0.16, 0xfed7aa, 0.25, 1, true);
    leftHandMesh.position.set(0.02, -0.46, 0);
    learnerLeftArm.add(leftArmMesh, leftHandMesh);
    learnerTorsoPivot.add(learnerLeftArm);

    const learnerRightArm = new THREE.Group();
    learnerRightArm.position.set(0.04, 0.2, -0.22);
    const rightArmMesh = createVoxelBox(0.14, 0.5, 0.14, 0xfdba74, 0.28, 1, true);
    rightArmMesh.position.set(0, -0.21, 0);
    const rightHandMesh = createVoxelBox(0.16, 0.14, 0.16, 0xfed7aa, 0.25, 1, true);
    rightHandMesh.position.set(0.02, -0.46, 0);
    learnerRightArm.add(rightArmMesh, rightHandMesh);
    learnerTorsoPivot.add(learnerRightArm);

    // Articulated Left & Right Legs (Hip -> Thigh -> Relaxed Knee -> Shin -> Foot)
    const learnerLeftHip = new THREE.Group();
    learnerLeftHip.position.set(0, -0.26, 0.11);
    const leftThigh = createVoxelBox(0.16, 0.32, 0.16, 0xfdba74, 0.28, 1, true);
    leftThigh.position.set(0, -0.15, 0);
    const leftKnee = new THREE.Group();
    leftKnee.position.set(0, -0.3, 0);
    const leftShin = createVoxelBox(0.14, 0.28, 0.14, 0xfdba74, 0.28, 1, true);
    leftShin.position.set(0, -0.13, 0);
    const leftFoot = createVoxelBox(0.22, 0.09, 0.15, 0xfed7aa, 0.28, 1, true);
    leftFoot.position.set(0.04, -0.26, 0);
    leftKnee.add(leftShin, leftFoot);
    learnerLeftHip.add(leftThigh, leftKnee);
    learnerTorsoPivot.add(learnerLeftHip);

    const learnerRightHip = new THREE.Group();
    learnerRightHip.position.set(0, -0.26, -0.11);
    const rightThigh = createVoxelBox(0.16, 0.32, 0.16, 0xfdba74, 0.28, 1, true);
    rightThigh.position.set(0, -0.15, 0);
    const rightKnee = new THREE.Group();
    rightKnee.position.set(0, -0.3, 0);
    const rightShin = createVoxelBox(0.14, 0.28, 0.14, 0xfdba74, 0.28, 1, true);
    rightShin.position.set(0, -0.13, 0);
    const rightFoot = createVoxelBox(0.22, 0.09, 0.15, 0xfed7aa, 0.28, 1, true);
    rightFoot.position.set(0.04, -0.26, 0);
    rightKnee.add(rightShin, rightFoot);
    learnerRightHip.add(rightThigh, rightKnee);
    learnerTorsoPivot.add(learnerRightHip);

    // =========================================================================
    // 4. FRIENDLY ADULT SWIMMING COACH VOXEL CHARACTER
    // =========================================================================
    const coachGroup = new THREE.Group();
    scene.add(coachGroup);

    const coachTorso = createVoxelBox(0.58, 0.82, 0.4, 0x0284c7, 0.28, 1, true);
    coachGroup.add(coachTorso);

    const coachChestBand = createVoxelBox(0.6, 0.18, 0.42, 0xf8fafc, 0.25, 1, true);
    coachChestBand.position.set(0, 0.14, 0);
    coachGroup.add(coachChestBand);

    const coachWhistle = createVoxelBox(0.09, 0.16, 0.44, 0xef4444, 0.25);
    coachWhistle.position.set(0, 0.25, 0);
    coachGroup.add(coachWhistle);

    const coachHead = createVoxelBox(0.48, 0.48, 0.46, 0xfdba74, 0.28, 1, true);
    coachHead.position.set(0, 0.68, 0);
    coachGroup.add(coachHead);

    const coachHair = createVoxelBox(0.52, 0.18, 0.5, 0x1e293b, 0.35, 1, true);
    coachHair.position.set(0, 0.88, -0.02);
    coachGroup.add(coachHair);

    const coachEyeL = createVoxelBox(0.07, 0.07, 0.06, 0x0f172a, 0.15);
    coachEyeL.position.set(-0.11, 0.72, 0.23);
    const coachEyeR = createVoxelBox(0.07, 0.07, 0.06, 0x0f172a, 0.15);
    coachEyeR.position.set(0.11, 0.72, 0.23);
    const coachSmile = createVoxelBox(0.18, 0.06, 0.06, 0xffffff, 0.15);
    coachSmile.position.set(0, 0.58, 0.23);
    coachGroup.add(coachEyeL, coachEyeR, coachSmile);

    const coachLeftArm = new THREE.Group();
    coachLeftArm.position.set(-0.36, 0.32, 0.14);
    const coachLeftArmMesh = createVoxelBox(0.18, 0.6, 0.18, 0xfdba74, 0.28, 1, true);
    coachLeftArmMesh.position.set(0, -0.24, 0);
    coachLeftArm.add(coachLeftArmMesh);
    coachGroup.add(coachLeftArm);

    const coachRightArm = new THREE.Group();
    coachRightArm.position.set(0.36, 0.32, 0.14);
    const coachRightArmMesh = createVoxelBox(0.18, 0.6, 0.18, 0xfdba74, 0.28, 1, true);
    coachRightArmMesh.position.set(0, -0.24, 0);
    coachRightArm.add(coachRightArmMesh);
    coachGroup.add(coachRightArm);

    const coachShorts = createVoxelBox(0.56, 0.3, 0.38, 0x1e3a8a, 0.35, 1, true);
    coachShorts.position.set(0, -0.52, 0);
    coachGroup.add(coachShorts);

    const coachLegL = createVoxelBox(0.2, 0.58, 0.2, 0xfdba74, 0.28, 1, true);
    coachLegL.position.set(-0.15, -0.9, 0);
    const coachLegR = createVoxelBox(0.2, 0.58, 0.2, 0xfdba74, 0.28, 1, true);
    coachLegR.position.set(0.15, -0.9, 0);
    coachGroup.add(coachLegL, coachLegR);

    // =========================================================================
    // 5. SPARKLING SQUARE-SHAPED VOXEL BUBBLES, KICK ARROWS & PIXEL STARS
    // =========================================================================
    const bubblesGroup = new THREE.Group();
    scene.add(bubblesGroup);

    const squareBubbles: {
      mesh: THREE.Mesh;
      offset: number;
      speed: number;
      spreadX: number;
      spreadZ: number;
    }[] = [];

    for (let i = 0; i < 40; i++) {
      const size = 0.06 + (i % 4) * 0.024;
      const bMesh = createVoxelBox(
        size,
        size,
        size,
        i % 3 === 0 ? 0xffffff : 0xe0f2fe,
        0.08,
        0.9,
        true
      );
      bubblesGroup.add(bMesh);
      squareBubbles.push({
        mesh: bMesh,
        offset: (i / 40) * Math.PI * 2,
        speed: 0.75 + (i % 5) * 0.16,
        spreadX: ((i % 7) - 3) * 0.065,
        spreadZ: ((i % 5) - 2) * 0.065,
      });
    }

    // 3D Voxel Directional Arrows for Scene 3 (11-18s: Little Kicks)
    const kickArrowsGroup = new THREE.Group();
    const upArrow = createVoxelArrow(0xfacc15);
    const downArrow = createVoxelArrow(0x38bdf8);
    downArrow.rotation.z = Math.PI;
    kickArrowsGroup.add(upArrow, downArrow);
    scene.add(kickArrowsGroup);

    // 3D Golden Pixel Stars for Scene 4 (18-22s: Celebrate)
    const starsGroup = new THREE.Group();
    const starMeshes: THREE.Group[] = [];
    for (let i = 0; i < 7; i++) {
      const s = createPixelStar();
      starsGroup.add(s);
      starMeshes.push(s);
    }
    scene.add(starsGroup);

    // Responsive sizing
    const updateSize = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const width = Math.max(320, rect.width);
      const height = Math.max(180, rect.height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      if (pixelResolutionMode === "pixel-retro") {
        renderer.setPixelRatio(1);
        renderer.setSize(Math.floor(width / 3.0), Math.floor(height / 3.0), false);
      } else {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height, false);
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    // =========================================================================
    // 6. ULTRA-SMOOTH 25-SECOND CHOREOGRAPHY LOOP (ZERO HARD CUTS)
    // =========================================================================
    let animFrameId: number;
    const desiredCamPos = new THREE.Vector3(0, 0, 3);
    const desiredCamTarget = new THREE.Vector3(0, 0, 0);
    const currentCamPos = new THREE.Vector3(-0.3, -0.6, 2.3);
    const currentCamTarget = new THREE.Vector3(-0.2, -0.5, 0);
    let prevT = timeRef.current;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const t = timeRef.current;
      const timeJump = Math.abs(t - prevT);
      prevT = t;

      // Gentle water surface shimmer & floor caustics pulse
      const waveOffset = Math.sin(t * 2.4) * 0.012;
      waterSurface.position.y = waveOffset;
      waterMeniscus.position.y = waveOffset;

      causticTiles.forEach((tile, idx) => {
        const s = 0.94 + Math.sin(t * 2.2 + idx * 0.7) * 0.05;
        tile.scale.set(s, 1, s);
      });

      // Reset default limb rotations before blending
      kickArrowsGroup.visible = false;
      starsGroup.visible = false;
      learnerTorsoPivot.rotation.set(0, 0, 0);
      learnerHeadPivot.rotation.set(0, 0, 0);
      learnerHeadPivot.position.set(0, 0.46, 0);
      learnerLeftArm.rotation.set(0, 0, 0);
      learnerRightArm.rotation.set(0, 0, 0);
      learnerLeftHip.rotation.set(0, 0, 0);
      learnerRightHip.rotation.set(0, 0, 0);
      leftKnee.rotation.set(0, 0, 0);
      rightKnee.rotation.set(0, 0, 0);
      coachLeftArm.rotation.set(0, 0, 0);
      coachRightArm.rotation.set(0, 0, 0);

      // -----------------------------------------------------------------------
      // SCENE 1 (0.0s – 5.0s): WELCOME AND SAFETY + SMOOTH GLIDE TO WALL
      // -----------------------------------------------------------------------
      if (t < 5.0) {
        if (t < 1.8) {
          // 0.0s - 1.8s: Underwater reference composition rising smoothly
          const u = smoothstep(0.0, 1.8, t);
          learnerGroup.position.set(lerp(-0.35, -2.15, u), lerp(-0.62, -0.35, u), 0.25);
          learnerGroup.rotation.set(0, lerp(-Math.PI * 0.38, 0.15, u), 0);
          learnerTorsoPivot.rotation.z = lerp(-0.32, 0, u);
          learnerLeftArm.rotation.z = lerp(1.05, 0.25, u);
          learnerRightArm.rotation.z = lerp(1.05, -0.2, u);

          coachGroup.position.set(-2.55, -0.18, -0.25);
          coachGroup.rotation.set(0, 0.25, 0);
          coachRightArm.rotation.x = -0.45;

          desiredCamPos.set(lerp(-0.35, -2.05, u), lerp(-0.58, 0.45, u), lerp(2.15, 3.45, u));
          desiredCamTarget.set(lerp(-0.35, -2.15, u), lerp(-0.48, -0.05, u), 0);

          squareBubbles.forEach((b, i) => {
            b.mesh.visible = true;
            const cycle = ((t * b.speed + b.offset) % 1.2) / 1.2;
            b.mesh.position.set(
              learnerGroup.position.x + Math.sin(i * 1.7) * 0.9,
              -1.15 + cycle * 1.1,
              0.25 + Math.cos(i * 2.1) * 0.45
            );
            b.mesh.rotation.y = t * 2 + i;
          });
        } else {
          // 1.8s - 5.0s: Enter calmly down the shallow pool steps together and glide smoothly toward the right practice wall
          const stepU = smoothstep(1.8, 3.8, t);
          const toWallU = smoothstep(3.6, 5.0, t);

          const baseX = lerp(-2.15, -0.95, stepU);
          const finalX = lerp(baseX, 2.02, toWallU);
          const baseY = lerp(-0.35, -0.52, stepU);
          const finalY = lerp(baseY, -0.34, toWallU);

          learnerGroup.position.set(finalX, finalY, 0.22);
          learnerGroup.rotation.set(0, lerp(0.15, 0, toWallU), 0);

          const walkSwing = Math.sin(t * 5.2) * 0.26 * (1 - toWallU);
          learnerLeftHip.rotation.z = walkSwing;
          learnerRightHip.rotation.z = -walkSwing;

          // Smoothly raise hands onto the pool wall coping ledge as learner arrives at wall (4.0s - 5.0s)
          learnerLeftArm.rotation.z = lerp(0.25, 1.54, toWallU);
          learnerRightArm.rotation.z = lerp(-0.2, 1.54, toWallU);

          coachGroup.position.set(lerp(-2.55, 1.68, smoothstep(1.8, 5.0, t)), lerp(-0.18, -0.18, stepU), -0.45);
          coachGroup.rotation.set(0, 0.3, 0);
          coachRightArm.rotation.x = -0.5;

          desiredCamPos.set(lerp(-2.05, 1.95, toWallU), lerp(0.45, 0.04, toWallU), lerp(3.45, 2.25, toWallU));
          desiredCamTarget.set(lerp(-1.85, 2.18, toWallU), lerp(-0.05, -0.02, toWallU), 0.05);

          squareBubbles.forEach((b, i) => {
            b.mesh.visible = i < 12;
            const cycle = (t * 0.55 + b.offset) % 1.0;
            b.mesh.position.set(
              finalX + (i - 6) * 0.16,
              -0.48 + cycle * 0.42,
              0.3 + Math.sin(i) * 0.2
            );
          });
        }
      }
      // -----------------------------------------------------------------------
      // SCENE 2 (5.0s – 11.0s): BLOW BUBBLES (SPLIT WATER-LEVEL CLOSE-UP)
      // -----------------------------------------------------------------------
      else if (t < 11.0) {
        // Learner holds the yellow/white pool wall grip bar at x = 2.54, y = 0.05
        // Smoothly dip mouth into water during 6.8s - 9.4s while keeping hands locked to the wall!
        const dipIn = smoothstep(6.6, 7.2, t);
        const liftOut = smoothstep(9.2, 9.8, t);
        const submergeAmount = dipIn * (1 - liftOut); // 0 above water, 1 when blowing bubbles

        const torsoY = lerp(-0.34, -0.48, submergeAmount);
        learnerGroup.position.set(2.02, torsoY, 0.22);
        learnerGroup.rotation.set(0, 0, 0);

        // Adjust arm pitch dynamically so hands stay locked on the grip bar (y = 0.05) even as torso dips
        const armAngleForGrip = lerp(1.54, 1.82, submergeAmount);
        learnerLeftArm.rotation.z = armAngleForGrip;
        learnerRightArm.rotation.z = armAngleForGrip;

        // Head tilts slightly up when breathing in above water, and level when blowing bubbles
        learnerHeadPivot.position.y = lerp(0.48, 0.43, submergeAmount);
        learnerHeadPivot.rotation.z = lerp(0.14, -0.05, submergeAmount);

        // Coach stands right beside the learner within arm's reach
        coachGroup.position.set(1.68, -0.18, -0.45);
        coachGroup.rotation.set(0, 0.32, 0);
        coachRightArm.rotation.x = -0.55;

        desiredCamPos.set(1.95, 0.03, 2.22);
        desiredCamTarget.set(2.18, -0.02, 0.05);

        const blowingBubbles = t >= 6.85 && t <= 9.5;
        squareBubbles.forEach((b, i) => {
          if (blowingBubbles && i < 28) {
            b.mesh.visible = true;
            const localT = (t - 6.85) * b.speed * 1.35 + b.offset;
            const progress = localT % 1.0;
            b.mesh.position.set(
              2.22 + progress * 0.26 + b.spreadX * 0.5,
              -0.14 + progress * 0.16,
              0.22 + b.spreadZ * 0.5
            );
            b.mesh.rotation.x = t * 3 + i;
            b.mesh.rotation.y = t * 2 + i;
          } else {
            b.mesh.visible = false;
          }
        });
      }
      // -----------------------------------------------------------------------
      // SCENE 3 (11.0s – 18.0s): LITTLE KICKS (UNDERWATER SIDE VIEW + ARROWS)
      // -----------------------------------------------------------------------
      else if (t < 18.0) {
        // Smooth transition from upright wall-hold into comfortable horizontal prone kick position (11.0s - 11.7s)
        const proneU = smoothstep(11.0, 11.7, t);

        learnerGroup.position.set(lerp(2.02, 1.62, proneU), lerp(-0.34, -0.14, proneU), 0.22);
        learnerGroup.rotation.set(0, 0, 0);

        // Torso pitches smoothly to horizontal prone (-1.32 rad)
        learnerTorsoPivot.rotation.z = lerp(0, -1.32, proneU);
        learnerHeadPivot.rotation.z = lerp(0.14, 1.15, proneU);

        // Arms extend forward so both hands stay visibly connected to the pool wall grip bar at x = 2.54
        learnerLeftArm.rotation.z = lerp(1.54, 2.86, proneU);
        learnerRightArm.rotation.z = lerp(1.54, 2.86, proneU);

        // Slow, copyable alternating flutter kicks moving from the hips with relaxed knees and feet
        const kickPhase = (t - 11.0) * 3.5;
        const kickAmp = 0.28 * proneU;
        const leftHipAngle = Math.sin(kickPhase) * kickAmp;
        const rightHipAngle = -Math.sin(kickPhase) * kickAmp;

        learnerLeftHip.rotation.z = leftHipAngle;
        learnerRightHip.rotation.z = rightHipAngle;

        leftKnee.rotation.z = Math.max(-0.2, Math.cos(kickPhase) * 0.15 - 0.05) * proneU;
        rightKnee.rotation.z = Math.max(-0.2, -Math.cos(kickPhase) * 0.15 - 0.05) * proneU;

        // Coach stands right beside the learner supporting their torso
        coachGroup.position.set(lerp(1.68, 1.52, proneU), -0.2, -0.45);
        coachGroup.rotation.set(0, 0.14, 0);
        coachLeftArm.rotation.x = lerp(0, -1.12, proneU);
        coachRightArm.rotation.x = lerp(-0.55, -1.12, proneU);

        // 3D directional arrows beside the legs moving up and down in sync with the kicks
        kickArrowsGroup.visible = proneU > 0.4;
        kickArrowsGroup.position.set(0.58, -0.32, 0.48);
        upArrow.position.set(-0.2, 0.16 + Math.sin(kickPhase) * 0.11, 0);
        downArrow.position.set(0.2, -0.16 - Math.sin(kickPhase) * 0.11, 0);

        desiredCamPos.set(lerp(1.95, 1.5, proneU), lerp(0.03, -0.24, proneU), lerp(2.22, 2.95, proneU));
        desiredCamTarget.set(lerp(2.18, 1.58, proneU), lerp(-0.02, -0.22, proneU), 0.05);

        squareBubbles.forEach((b, i) => {
          if (i < 22 && proneU > 0.5) {
            b.mesh.visible = true;
            const cycle = (t * b.speed * 1.15 + b.offset) % 1.0;
            b.mesh.position.set(
              0.82 - cycle * 0.6,
              -0.36 + Math.sin(kickPhase + i) * 0.16 + cycle * 0.32,
              0.22 + b.spreadZ
            );
          } else {
            b.mesh.visible = false;
          }
        });
      }
      // -----------------------------------------------------------------------
      // SCENE 4 (18.0s – 22.0s): REPEAT AND CELEBRATE
      // -----------------------------------------------------------------------
      else if (t < 22.0) {
        // 18.0s - 20.0s: Short supported practice (bubbles + kicks), then 20.0s - 22.0s: stand & celebrate with pixel stars!
        const standU = smoothstep(19.9, 20.6, t);

        learnerGroup.position.set(lerp(1.62, 1.78, standU), lerp(-0.14, -0.5, standU), 0.22);
        learnerGroup.rotation.set(0, lerp(0, -0.32, standU), 0);
        learnerTorsoPivot.rotation.z = lerp(-1.26, 0, standU);
        learnerHeadPivot.rotation.z = lerp(1.02, 0.12, standU);

        // Hands stay on wall during repeat (18-20s), then raise in celebration as feet plant on floor
        learnerLeftArm.rotation.z = lerp(2.84, 2.45, standU);
        learnerRightArm.rotation.z = lerp(2.84, 1.35, standU);

        const kickPhase = (t - 18.0) * 3.8;
        const kickActive = 1 - standU;
        learnerLeftHip.rotation.z = Math.sin(kickPhase) * 0.24 * kickActive;
        learnerRightHip.rotation.z = -Math.sin(kickPhase) * 0.24 * kickActive;

        coachGroup.position.set(lerp(1.52, 1.18, standU), -0.2, -0.38);
        coachGroup.rotation.set(0, lerp(0.14, 0.42, standU), 0);
        coachLeftArm.rotation.x = lerp(-1.12, 0, standU);
        coachRightArm.rotation.x = lerp(-1.12, 0, standU);
        coachLeftArm.rotation.z = (-0.55 + Math.sin(t * 7.5) * 0.14) * standU;
        coachRightArm.rotation.z = (0.55 - Math.sin(t * 7.5) * 0.14) * standU;

        if (standU < 0.5) {
          squareBubbles.forEach((b, i) => {
            b.mesh.visible = i < 28;
            const cycle = (t * 1.35 + b.offset) % 1.0;
            if (i % 2 === 0) {
              b.mesh.position.set(2.18 + cycle * 0.22, -0.12 + cycle * 0.16, 0.22 + b.spreadZ * 0.5);
            } else {
              b.mesh.position.set(0.85 - cycle * 0.48, -0.34 + cycle * 0.28, 0.22 + b.spreadZ * 0.5);
            }
          });
        } else {
          squareBubbles.forEach((b) => {
            b.mesh.visible = false;
          });
        }

        // Golden pixel stars pop and sparkle above the water surface
        if (t >= 20.0) {
          starsGroup.visible = true;
          const starPop = smoothstep(20.0, 20.5, t);
          starMeshes.forEach((star, idx) => {
            const angle = (idx / starMeshes.length) * Math.PI - Math.PI * 0.08;
            star.scale.setScalar(starPop);
            star.position.set(
              1.48 + Math.cos(angle) * 1.1,
              0.66 + Math.sin(angle) * 0.42 + Math.sin(t * 3.8 + idx) * 0.05,
              0.1
            );
            star.rotation.y = t * 2.0 + idx;
          });
        }

        desiredCamPos.set(lerp(1.5, 1.48, standU), lerp(-0.24, 0.34, standU), lerp(2.95, 3.15, standU));
        desiredCamTarget.set(lerp(1.58, 1.48, standU), lerp(-0.22, 0.16, standU), 0.05);
      }
      // -----------------------------------------------------------------------
      // SCENE 5 (22.0s – 25.0s): SAFETY END CARD (SMOOTH GLIDE TO SHALLOW STEPS)
      // -----------------------------------------------------------------------
      else {
        const endU = smoothstep(22.0, 22.75, t);

        learnerGroup.position.set(lerp(1.78, -1.75, endU), lerp(-0.5, -0.32, endU), 0.22);
        learnerGroup.rotation.set(0, lerp(-0.32, 0.24, endU), 0);
        learnerLeftArm.rotation.z = 2.48 + Math.sin(t * 7.2) * 0.3 * endU;
        learnerRightArm.rotation.z = -0.18;

        coachGroup.position.set(lerp(1.18, -2.42, endU), lerp(-0.2, -0.06, endU), -0.05);
        coachGroup.rotation.set(0, lerp(0.42, 0.2, endU), 0);
        coachRightArm.rotation.z = -2.42 + Math.sin(t * 7.2 + 0.4) * 0.26 * endU;
        coachLeftArm.rotation.z = 0.18;

        squareBubbles.forEach((b, i) => {
          b.mesh.visible = i < 10;
          const cycle = (t * 0.4 + b.offset) % 1.0;
          b.mesh.position.set(
            learnerGroup.position.x + (i - 5) * 0.32,
            -0.48 + cycle * 0.42,
            0.55
          );
        });

        desiredCamPos.set(lerp(1.48, -2.05, endU), lerp(0.34, 0.44, endU), lerp(3.15, 3.25, endU));
        desiredCamTarget.set(lerp(1.48, -2.08, endU), lerp(0.16, 0.1, endU), 0);
      }

      // Apply smooth camera damping during normal playback, or instant snap if user scrubbed across timeline
      if (timeJump > 0.25) {
        currentCamPos.copy(desiredCamPos);
        currentCamTarget.copy(desiredCamTarget);
      } else {
        currentCamPos.lerp(desiredCamPos, 0.16);
        currentCamTarget.lerp(desiredCamTarget, 0.16);
      }

      camera.position.copy(currentCamPos);
      camera.lookAt(currentCamTarget);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      domCanvas.removeEventListener("webglcontextlost", handleContextLost);
      domCanvas.removeEventListener("webglcontextrestored", handleContextRestored);
      renderer.dispose();
    };
  }, [pixelResolutionMode, nanoBananaCleaned, onCanvasReady]);

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#0284C7] border border-slate-200 shadow-xs select-none">
      {/* 3D Voxel WebGL Viewport */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Graceful Fallback if WebGL context is lost */}
      {webglLost && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0284C7] text-white p-6 text-center z-20">
          <p className="text-lg font-bold font-display mb-1">{activeScene.onScreenText}</p>
          <p className="text-sm opacity-90 max-w-md">{activeScene.voiceOver}</p>
        </div>
      )}

      {/* Semantic DOM Overlay: Top Instructional Card & Step Progress */}
      <div className="absolute top-4 inset-x-4 flex items-start justify-between gap-4 pointer-events-none z-10">
        <div className="bg-slate-950/75 backdrop-blur-md border border-white/15 rounded-xl px-4 py-3 text-white shadow-sm max-w-md">
          <div className="flex items-center gap-2 text-[11px] font-medium text-sky-300 mb-0.5">
            <span>Scene {activeScene.index} of 5</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{activeScene.timeRangeLabel}</span>
            {nanoBananaCleaned && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-300 font-semibold">Nano Banana Cleaned</span>
              </>
            )}
          </div>
          <div className="text-lg sm:text-xl font-extrabold font-display tracking-tight text-amber-300 leading-snug">
            {activeScene.onScreenText}
          </div>
          {activeScene.subText && (
            <div className="text-xs text-slate-200 mt-1 font-medium">
              {activeScene.subText}
            </div>
          )}
        </div>

        {/* Live Action Phase Callout */}
        <div className="hidden sm:block bg-slate-950/70 backdrop-blur-md border border-white/15 rounded-lg px-3.5 py-2 text-right text-white">
          <div className="text-[11px] text-sky-300 font-medium">
            Shallow Teaching Area · Coach Within Arm’s Reach
          </div>
          <div className="text-xs font-semibold text-white mt-0.5">
            {getActionPhaseBadge(currentTime)}
          </div>
        </div>
      </div>

      {/* Split Water-Level Indicator during Scene 2 (5-11s: Blow Bubbles) */}
      {currentTime >= 5.0 && currentTime < 11.0 && (
        <div className="absolute inset-x-0 top-[51%] flex items-center justify-between px-4 pointer-events-none z-10">
          <span className="text-[11px] font-mono font-semibold text-white bg-sky-900/80 px-2.5 py-0.5 rounded border border-sky-300/30">
            ▲ ABOVE WATER: Breathe In Calmly
          </span>
          <div className="flex-1 border-t border-dashed border-white/75 mx-3" />
          <span className="text-[11px] font-mono font-semibold text-amber-200 bg-sky-950/85 px-2.5 py-0.5 rounded border border-amber-300/30">
            ▼ UNDERWATER: Blow Square Bubbles
          </span>
        </div>
      )}

      {/* Kick Direction Indicator during Scene 3 (11-18s: Little Kicks) */}
      {currentTime >= 11.0 && currentTime < 18.0 && (
        <div className="absolute left-5 top-1/2 -translate-y-1/2 bg-slate-950/75 backdrop-blur-sm border border-white/15 rounded-lg px-3 py-2 text-white pointer-events-none z-10">
          <div className="text-[11px] font-semibold text-amber-300">
            ↑ ↓ Alternating Hip Kicks
          </div>
          <div className="text-[11px] text-slate-200 mt-0.5">
            Hands on wall · Relaxed knees &amp; feet
          </div>
        </div>
      )}

      {/* Measured Bottom Scrim & Synchronized Voice-Over Subtitles */}
      {subtitlesEnabled && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent pt-8 pb-4 px-6 pointer-events-none z-10 flex flex-col items-center text-center">
          <div className="inline-block bg-slate-950/80 backdrop-blur-xs border border-white/15 rounded-lg px-4 py-2 max-w-2xl">
            <p className="text-sm sm:text-base font-semibold text-white tracking-wide">
              “{activeScene.voiceOver}”
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
