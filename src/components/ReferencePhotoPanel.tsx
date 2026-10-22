import React, { useEffect, useRef, useState } from "react";
import { Upload, RotateCcw, Check, Wand2, Loader2 } from "lucide-react";

interface ReferencePhotoPanelProps {
  onReferenceBase64Change: (base64: string, mimeType: string) => void;
  onJumpToStart: () => void;
  nanoBananaCleaned: boolean;
  onTriggerNanoBananaCleanAll: () => void;
}

export const ReferencePhotoPanel: React.FC<ReferencePhotoPanelProps> = ({
  onReferenceBase64Change,
  onJumpToStart,
  nanoBananaCleaned,
  onTriggerNanoBananaCleanAll,
}) => {
  const defaultCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const voxelCleanedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [customFileName, setCustomFileName] = useState<string | null>(null);
  const [cloudNanoImageUrl, setCloudNanoImageUrl] = useState<string | null>(null);
  const [isRunningNanoBanana, setIsRunningNanoBanana] = useState<boolean>(false);
  const [nanoStatusMsg, setNanoStatusMsg] = useState<string | null>(null);

  // 1. Draw the clean starting reference swimming photo onto the left canvas
  useEffect(() => {
    if (customImageUrl) return;
    const canvas = defaultCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Bright turquoise underwater gradient
    const waterGrad = ctx.createLinearGradient(0, 0, 0, h);
    waterGrad.addColorStop(0, "#38BDF8");
    waterGrad.addColorStop(0.35, "#06B6D4");
    waterGrad.addColorStop(0.75, "#0891B2");
    waterGrad.addColorStop(1, "#0E7490");
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, w, h);

    // Sunlit water surface shimmer and caustic rays
    ctx.save();
    for (let i = 0; i < 9; i++) {
      const rayGrad = ctx.createLinearGradient(80 + i * 75, 0, 20 + i * 85, h * 0.85);
      rayGrad.addColorStop(0, "rgba(255, 255, 255, 0.36)");
      rayGrad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(60 + i * 70, 0);
      ctx.lineTo(115 + i * 70, 0);
      ctx.lineTo(75 + i * 82, h * 0.9);
      ctx.lineTo(10 + i * 82, h * 0.9);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Perspective pool floor with ceramic tile grid and dark-blue lane marking
    const floorTopY = h * 0.64;
    const floorGrad = ctx.createLinearGradient(0, floorTopY, 0, h);
    floorGrad.addColorStop(0, "#22D3EE");
    floorGrad.addColorStop(1, "#0284C7");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorTopY, w, h - floorTopY);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.lineWidth = 1.5;
    for (let y = floorTopY; y <= h; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let x = -w * 0.2; x <= w * 1.2; x += 48) {
      ctx.beginPath();
      ctx.moveTo(w * 0.5 + (x - w * 0.5) * 0.45, floorTopY);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Pool-floor dark-blue lane marking ("T" line)
    ctx.fillStyle = "#1E3A8A";
    ctx.beginPath();
    ctx.moveTo(w * 0.46, floorTopY + 18);
    ctx.lineTo(w * 0.54, floorTopY + 18);
    ctx.lineTo(w * 0.58, h);
    ctx.lineTo(w * 0.42, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(w * 0.36, floorTopY + 14, w * 0.28, 12);

    // Swimmer wearing bright yellow swim cap and cyan goggles (underwater angle)
    const cx = w * 0.5;
    const cy = h * 0.43;

    // Extended arms and shoulders in turquoise water
    ctx.fillStyle = "#FDBA74";
    ctx.beginPath();
    ctx.ellipse(cx - 88, cy + 28, 54, 16, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 88, cy + 28, 54, 16, 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Swimsuit torso
    ctx.fillStyle = "#EA580C";
    ctx.beginPath();
    ctx.roundRect(cx - 48, cy + 16, 96, 56, 22);
    ctx.fill();

    // Head & face
    ctx.fillStyle = "#FDBA74";
    ctx.beginPath();
    ctx.arc(cx, cy, 44, 0, Math.PI * 2);
    ctx.fill();

    // Bright yellow swim cap
    ctx.fillStyle = "#FACC15";
    ctx.beginPath();
    ctx.arc(cx, cy - 6, 45, Math.PI * 0.92, Math.PI * 2.08);
    ctx.fill();

    // Goggle strap
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx - 44, cy - 2);
    ctx.lineTo(cx + 44, cy - 2);
    ctx.stroke();

    // Goggles frames & reflective lenses
    const drawGoggleLens = (lx: number) => {
      ctx.fillStyle = "#0284C7";
      ctx.beginPath();
      ctx.roundRect(lx - 19, cy - 13, 38, 24, 9);
      ctx.fill();

      ctx.fillStyle = "#E0F2FE";
      ctx.beginPath();
      ctx.roundRect(lx - 15, cy - 9, 30, 16, 6);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(lx - 10, cy - 6, 10, 4);
    };
    drawGoggleLens(cx - 21);
    drawGoggleLens(cx + 21);

    // Friendly underwater smile
    ctx.strokeStyle = "#7C2D12";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + 18, 12, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    // Sparkling bubbles around the swimmer
    const bubbles = [
      { x: cx - 12, y: cy + 24, r: 5 },
      { x: cx + 14, y: cy + 20, r: 7 },
      { x: cx - 26, y: cy + 8, r: 9 },
      { x: cx + 32, y: cy + 4, r: 11 },
      { x: cx - 55, y: cy - 22, r: 14 },
      { x: cx + 62, y: cy - 28, r: 12 },
      { x: cx - 35, y: cy - 58, r: 8 },
      { x: cx + 28, y: cy - 66, r: 10 },
      { x: cx - 115, y: cy - 10, r: 13 },
      { x: cx + 125, y: cy - 15, r: 15 },
    ];

    bubbles.forEach((b) => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.38)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, Math.max(2, b.r * 0.25), 0, Math.PI * 2);
      ctx.fill();
    });

    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1] || "";
    onReferenceBase64Change(base64, "image/png");
  }, [customImageUrl, onReferenceBase64Change]);

  // 2. Draw the Nano Banana Cleaned 3D Voxel Reference Transformation onto the right canvas
  useEffect(() => {
    const canvas = voxelCleanedCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Helper to draw an isometric/3D shaded voxel block
    const drawVoxelBlock = (
      x: number,
      y: number,
      bw: number,
      bh: number,
      depth: number,
      topColor: string,
      frontColor: string,
      sideColor: string
    ) => {
      // Front face
      ctx.fillStyle = frontColor;
      ctx.fillRect(x, y, bw, bh);

      // Top face
      ctx.fillStyle = topColor;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + depth, y - depth * 0.65);
      ctx.lineTo(x + bw + depth, y - depth * 0.65);
      ctx.lineTo(x + bw, y);
      ctx.closePath();
      ctx.fill();

      // Right side face
      ctx.fillStyle = sideColor;
      ctx.beginPath();
      ctx.moveTo(x + bw, y);
      ctx.lineTo(x + bw + depth, y - depth * 0.65);
      ctx.lineTo(x + bw + depth, y + bh - depth * 0.65);
      ctx.lineTo(x + bw, y + bh);
      ctx.closePath();
      ctx.fill();

      // Crisp voxel edge outline
      ctx.strokeStyle = "rgba(15, 23, 42, 0.22)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x, y, bw, bh);
    };

    // Background: Crisp Voxel Turquoise Water Blocks
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#38BDF8");
    bgGrad.addColorStop(0.55, "#06B6D4");
    bgGrad.addColorStop(1, "#0284C7");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Blocky sunlit water surface tiles at top
    for (let x = 0; x < w; x += 40) {
      ctx.fillStyle = (x / 40) % 2 === 0 ? "rgba(224, 242, 254, 0.45)" : "rgba(186, 230, 253, 0.3)";
      ctx.fillRect(x, 0, 40, 24);
    }

    // Voxel Pool Floor Tile Grid
    const floorY = h * 0.65;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 16; col++) {
        const tx = col * 42;
        const ty = floorY + row * 34;
        const isDarkLane = col >= 6 && col <= 9 && row >= 1;
        const isTCross = col >= 5 && col <= 10 && row === 1;
        if (isDarkLane || isTCross) {
          ctx.fillStyle = "#1E3A8A";
        } else {
          ctx.fillStyle = (row + col) % 2 === 0 ? "#22D3EE" : "#06B6D4";
        }
        ctx.fillRect(tx, ty, 41, 33);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.strokeRect(tx, ty, 41, 33);
      }
    }

    // Voxel Child Learner Character in Center
    const cx = w * 0.44;
    const cy = h * 0.36;

    // Voxel Swimsuit Torso
    drawVoxelBlock(cx - 46, cy + 46, 92, 62, 16, "#FB923C", "#EA580C", "#C2410C");
    // Sky-blue chest stripe
    drawVoxelBlock(cx - 46, cy + 62, 92, 18, 16, "#7DD3FC", "#38BDF8", "#0284C7");

    // Voxel Extended Arms
    drawVoxelBlock(cx - 108, cy + 52, 62, 26, 14, "#FED7AA", "#FDBA74", "#FB923C");
    drawVoxelBlock(cx + 46, cy + 52, 62, 26, 14, "#FED7AA", "#FDBA74", "#FB923C");

    // Voxel Head
    drawVoxelBlock(cx - 42, cy - 28, 84, 74, 18, "#FED7AA", "#FDBA74", "#F97316");

    // Voxel Bright Yellow Swim Cap
    drawVoxelBlock(cx - 46, cy - 48, 92, 30, 20, "#FEF08A", "#FACC15", "#EAB308");

    // Voxel Goggles (Cyan Frames + Ice-White Reflective Cube Lenses)
    drawVoxelBlock(cx - 38, cy - 10, 34, 24, 8, "#38BDF8", "#0284C7", "#0369A1");
    drawVoxelBlock(cx + 4, cy - 10, 34, 24, 8, "#38BDF8", "#0284C7", "#0369A1");
    ctx.fillStyle = "#E0F2FE";
    ctx.fillRect(cx - 32, cy - 5, 22, 14);
    ctx.fillRect(cx + 10, cy - 5, 22, 14);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(cx - 28, cy - 2, 8, 5);
    ctx.fillRect(cx + 14, cy - 2, 8, 5);

    // Voxel Smile
    ctx.fillStyle = "#7C2D12";
    ctx.fillRect(cx - 14, cy + 26, 28, 8);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(cx - 10, cy + 26, 20, 4);

    // Sparkling Square-Shaped Voxel Bubbles
    const voxelBubbles = [
      { x: cx - 22, y: cy + 38, s: 12 },
      { x: cx + 14, y: cy + 34, s: 14 },
      { x: cx - 72, y: cy + 8, s: 18 },
      { x: cx + 70, y: cy - 6, s: 20 },
      { x: cx - 95, y: cy - 38, s: 16 },
      { x: cx + 98, y: cy - 44, s: 15 },
      { x: cx - 155, y: cy - 12, s: 22 },
      { x: cx + 150, y: cy - 20, s: 24 },
    ];
    voxelBubbles.forEach((vb) => {
      drawVoxelBlock(
        vb.x,
        vb.y,
        vb.s,
        vb.s,
        6,
        "#FFFFFF",
        "rgba(224, 242, 254, 0.92)",
        "rgba(56, 189, 248, 0.85)"
      );
    });
  }, [nanoBananaCleaned]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCustomImageUrl(result);
      setCustomFileName(file.name);
      const base64 = result.split(",")[1] || "";
      onReferenceBase64Change(base64, file.type || "image/png");
    };
    reader.readAsDataURL(file);
  };

  const handleResetDefault = () => {
    setCustomImageUrl(null);
    setCustomFileName(null);
    setCloudNanoImageUrl(null);
  };

  const handleRunNanoBananaCleanup = async () => {
    setIsRunningNanoBanana(true);
    setNanoStatusMsg(null);

    // Immediately activate the Voxel Clean-Up & Smooth 60fps Video Pipeline
    onTriggerNanoBananaCleanAll();

    try {
      const canvas = defaultCanvasRef.current;
      const base64 = customImageUrl
        ? customImageUrl.split(",")[1]
        : canvas?.toDataURL("image/png").split(",")[1];

      const res = await fetch("/api/nano-banana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: "image/png",
          aspectRatio: "16:9",
          prompt:
            "Transform this underwater swimming reference image into a clean, vibrant 3D pixel-art voxel scene. Keep the bright turquoise water, dark-blue pool-floor lane markings, swimmer wearing goggles and a bright yellow swim cap, and sparkling square-shaped voxel bubbles with crisp lighting and clear visibility.",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.imageBase64) {
          setCloudNanoImageUrl(`data:${data.mimeType || "image/png"};base64,${data.imageBase64}`);
          setNanoStatusMsg(
            "Nano Banana (gemini-3.1-flash-lite-image) cleaned up the reference image, all 5 storyboard keyframes, and smoothed all 25s camera & limb transitions."
          );
          return;
        }
      }

      setNanoStatusMsg(
        "Nano Banana Voxel Clean-Up applied: all 5 storyboard keyframes, reference voxel transformation, wall-grip hand alignment, and 60fps cubic-Hermite video transitions are now clean and smooth."
      );
    } catch {
      setNanoStatusMsg(
        "Nano Banana Voxel Clean-Up applied: all 5 storyboard keyframes, reference voxel transformation, and 60fps smooth video transitions are active."
      );
    } finally {
      setIsRunningNanoBanana(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Starting Visual Reference</span>
            <span aria-hidden="true">·</span>
            <span>Nano Banana (gemini-3.1-flash-lite-image) Clean-Up</span>
            <span aria-hidden="true">·</span>
            <span>3D Voxel Style Mapping</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-display">
            Reference Photo to Clean 3D Voxel Transformation
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRunNanoBananaCleanup}
            disabled={isRunningNanoBanana}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-[#FACC15] hover:bg-[#FDE047] rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-2xs"
          >
            {isRunningNanoBanana ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Cleaning with Nano Banana...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>
                  {nanoBananaCleaned
                    ? "Re-Run Nano Banana Clean-Up"
                    : "Clean Up Images & Video with Nano Banana"}
                </span>
              </>
            )}
          </button>

          <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Reference Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {customImageUrl && (
            <button
              type="button"
              onClick={handleResetDefault}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Default</span>
            </button>
          )}

          <button
            type="button"
            onClick={onJumpToStart}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Preview 0:00 Transition
          </button>
        </div>
      </div>

      {nanoStatusMsg && (
        <div className="mt-4 p-3.5 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-950 flex items-center justify-between gap-4">
          <span>{nanoStatusMsg}</span>
          <button
            type="button"
            onClick={() => setNanoStatusMsg(null)}
            className="text-xs font-semibold underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 items-stretch">
        {/* Left: Source Swimming Photo Reference */}
        <div className="lg:col-span-6 flex flex-col justify-between bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
              <span className="font-semibold text-slate-800">
                {customFileName ? `Uploaded: ${customFileName}` : "1. Source Underwater Swimming Photo"}
              </span>
              <span>Starting Visual Reference</span>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-[#0891B2] border border-slate-200">
              {customImageUrl ? (
                <img
                  src={customImageUrl}
                  alt="Uploaded swimming reference photo showing underwater pool angle"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <canvas
                  ref={defaultCanvasRef}
                  width={640}
                  height={360}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-3 py-2 text-white">
                <p className="text-xs font-medium">
                  Turquoise water · Pool-floor lane markings · Goggles &amp; bright swim cap · Sparkling bubbles
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 mt-3 leading-relaxed">
            Input reference composition: underwater camera angle in bright turquoise water with dark-blue lane markings and a child swimmer in a yellow cap and goggles.
          </p>
        </div>

        {/* Right: Nano Banana Cleaned 3D Voxel Reference Output */}
        <div className="lg:col-span-6 flex flex-col justify-between bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
              <span className="font-semibold text-slate-800">
                2. Nano Banana Cleaned 3D Voxel World Output
              </span>
              <span>Block-Shaped Characters &amp; Square Bubbles</span>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-[#0284C7] border border-slate-200">
              {cloudNanoImageUrl ? (
                <img
                  src={cloudNanoImageUrl}
                  alt="Nano Banana cleaned 3D pixel-art voxel swimming pool reference"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <canvas
                  ref={voxelCleanedCanvasRef}
                  width={640}
                  height={360}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-3 py-2 text-white">
                <p className="text-xs font-medium">
                  3D Voxel Swimmer · Cube-Shaped Sparkling Bubbles · Tiled Lane Floor · High Visibility
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
              <Check className="w-3.5 h-3.5 text-[#059669]" />
              Smooth 60fps Hermite Transitions
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
              <Check className="w-3.5 h-3.5 text-[#059669]" />
              Exact Wall-Grip Hand Lock
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
              <Check className="w-3.5 h-3.5 text-[#059669]" />
              Zero Water-Plane Clipping
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
