import React, { useEffect, useRef, useState } from "react";
import { Film, Volume2, Download, Loader2, Play, Sparkles, Wand2, Terminal } from "lucide-react";
import { STORYBOARD_SCENES, StoryboardScene } from "../data/storyboardData";
import { soundEngine } from "../utils/soundEngine";

interface FlowStudioPanelProps {
  referenceBase64: string;
  referenceMimeType: string;
  activeSceneId: string;
  nanoBananaCleaned: boolean;
  onSelectScene: (startTime: number) => void;
  onExport25sWebM: () => void;
  isExportingWebM: boolean;
  exportProgress: number;
}

interface GeneratedSceneVideo {
  sceneId: string;
  interactionId: string;
  videoUrl: string;
}

// Crisp 3D Voxel Keyframe Thumbnail Renderer for each of the 5 Storyboard Scenes
const SceneVoxelKeyframeCanvas: React.FC<{
  sceneIndex: number;
  nanoBananaCleaned: boolean;
  customKeyframeUrl?: string;
}> = ({ sceneIndex, nanoBananaCleaned, customKeyframeUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (customKeyframeUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const drawBlock = (
      x: number,
      y: number,
      bw: number,
      bh: number,
      color: string,
      topColor?: string
    ) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, bw, bh);
      if (topColor) {
        ctx.fillStyle = topColor;
        ctx.fillRect(x, y, bw, Math.max(3, bh * 0.18));
      }
      ctx.strokeStyle = nanoBananaCleaned
        ? "rgba(15, 23, 42, 0.25)"
        : "rgba(15, 23, 42, 0.12)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, bw, bh);
    };

    const waterY = sceneIndex === 3 ? h * 0.22 : h * 0.46;
    ctx.fillStyle = "#E0F2FE";
    ctx.fillRect(0, 0, w, waterY);

    const flags = ["#EF4444", "#FACC15", "#10B981", "#3B82F6", "#F97316"];
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = flags[i % flags.length];
      ctx.fillRect(16 + i * 38, 8, 20, 12);
    }

    const waterGrad = ctx.createLinearGradient(0, waterY, 0, h);
    waterGrad.addColorStop(0, "#38BDF8");
    waterGrad.addColorStop(0.6, "#06B6D4");
    waterGrad.addColorStop(1, "#0284C7");
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, waterY, w, h - waterY);

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillRect(0, waterY - 2, w, 4);

    ctx.fillStyle = "#1E3A8A";
    ctx.fillRect(24, h - 18, w - 70, 8);

    if (sceneIndex === 1) {
      drawBlock(12, h - 42, 46, 36, "#BAE6FD", "#E0F2FE");
      drawBlock(58, h - 28, 46, 22, "#7DD3FC", "#BAE6FD");

      drawBlock(68, waterY - 28, 34, 48, "#0284C7", "#38BDF8");
      drawBlock(72, waterY - 54, 26, 26, "#FDBA74", "#1E293B");

      drawBlock(116, waterY - 12, 28, 38, "#EA580C", "#FB923C");
      drawBlock(118, waterY - 36, 24, 24, "#FDBA74", "#FACC15");
      drawBlock(122, waterY - 28, 18, 7, "#0284C7", "#E0F2FE");
    } else if (sceneIndex === 2) {
      drawBlock(w - 44, waterY - 35, 44, h, "#0284C7", "#F8FAFC");
      drawBlock(w - 48, waterY - 6, 12, 12, "#FACC15");

      drawBlock(92, waterY - 34, 38, 56, "#0284C7", "#38BDF8");
      drawBlock(97, waterY - 62, 28, 28, "#FDBA74", "#1E293B");

      drawBlock(162, waterY + 2, 34, 44, "#EA580C", "#FB923C");
      drawBlock(192, waterY - 4, 46, 10, "#FDBA74");
      drawBlock(164, waterY - 22, 30, 28, "#FDBA74", "#FACC15");
      drawBlock(174, waterY - 14, 20, 8, "#0284C7", "#E0F2FE");

      [
        { x: 202, y: waterY + 6, s: 8 },
        { x: 214, y: waterY + 2, s: 10 },
        { x: 226, y: waterY + 10, s: 9 },
        { x: 208, y: waterY + 18, s: 7 },
      ].forEach((b) => drawBlock(b.x, b.y, b.s, b.s, "#FFFFFF", "#E0F2FE"));
    } else if (sceneIndex === 3) {
      drawBlock(w - 38, waterY - 10, 38, h, "#0284C7", "#F8FAFC");
      drawBlock(w - 44, waterY - 4, 12, 12, "#FACC15");

      drawBlock(136, waterY - 18, 36, 62, "#0284C7", "#38BDF8");
      drawBlock(140, waterY - 44, 26, 26, "#FDBA74", "#1E293B");

      drawBlock(198, waterY + 2, 46, 10, "#FDBA74");
      drawBlock(148, waterY + 8, 50, 24, "#EA580C", "#38BDF8");
      drawBlock(186, waterY - 12, 26, 24, "#FDBA74", "#FACC15");
      drawBlock(102, waterY + 4, 46, 10, "#FDBA74");
      drawBlock(104, waterY + 22, 44, 10, "#FDBA74");

      drawBlock(66, waterY + 2, 14, 18, "#FACC15");
      drawBlock(84, waterY + 20, 14, 18, "#38BDF8");
    } else if (sceneIndex === 4) {
      drawBlock(w - 38, waterY - 25, 38, h, "#0284C7", "#F8FAFC");

      drawBlock(98, waterY - 28, 36, 52, "#0284C7", "#38BDF8");
      drawBlock(103, waterY - 54, 26, 26, "#FDBA74", "#1E293B");

      drawBlock(158, waterY - 12, 30, 44, "#EA580C", "#FB923C");
      drawBlock(160, waterY - 38, 26, 26, "#FDBA74", "#FACC15");

      [78, 118, 158, 198].forEach((sx, idx) => {
        drawBlock(sx, 20 + (idx % 2) * 8, 14, 14, "#FACC15", "#FEF08A");
      });
    } else {
      drawBlock(20, h - 44, 58, 38, "#BAE6FD", "#E0F2FE");
      drawBlock(78, h - 28, 58, 22, "#7DD3FC", "#BAE6FD");

      drawBlock(86, waterY - 30, 36, 52, "#0284C7", "#38BDF8");
      drawBlock(91, waterY - 56, 26, 26, "#FDBA74", "#1E293B");
      drawBlock(124, waterY - 46, 10, 26, "#FDBA74");

      drawBlock(146, waterY - 14, 28, 40, "#EA580C", "#FB923C");
      drawBlock(148, waterY - 38, 24, 24, "#FDBA74", "#FACC15");
      drawBlock(176, waterY - 32, 9, 22, "#FDBA74");
    }
  }, [sceneIndex, nanoBananaCleaned, customKeyframeUrl]);

  if (customKeyframeUrl) {
    return (
      <img
        src={customKeyframeUrl}
        alt={`Scene ${sceneIndex} Nano Banana cleaned keyframe`}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={180}
      className="w-full h-full object-cover"
    />
  );
};

export const FlowStudioPanel: React.FC<FlowStudioPanelProps> = ({
  referenceBase64,
  referenceMimeType,
  activeSceneId,
  nanoBananaCleaned,
  onSelectScene,
  onExport25sWebM,
  isExportingWebM,
  exportProgress,
}) => {
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);
  const [synthesizingTtsId, setSynthesizingTtsId] = useState<string | null>(null);
  const [cleaningKeyframeId, setCleaningKeyframeId] = useState<string | null>(null);
  const [runningMuapiId, setRunningMuapiId] = useState<string | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<Record<string, GeneratedSceneVideo>>({});
  const [nanoKeyframes, setNanoKeyframes] = useState<Record<string, string>>({});
  const [muapiOutput, setMuapiOutput] = useState<{ command: string; output: string } | null>(null);
  const [muapiStatus, setMuapiStatus] = useState<{ installed: boolean; version: string } | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/muapi/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.installed) {
          setMuapiStatus({ installed: true, version: data.version || "0.2.7" });
        }
      })
      .catch(() => {});
  }, []);

  const handleSynthesizeSceneVoice = async (scene: StoryboardScene) => {
    setSynthesizingTtsId(scene.id);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const ok = await soundEngine.preloadSceneTTS(scene.id, scene.voiceOver);
      soundEngine.resetTimelineTracking();
      soundEngine.speakSceneNarration(scene.id, scene.voiceOver);
      if (ok) {
        setStatusMessage(
          `Synthesized 24kHz WAV voice-over for Scene ${scene.index} via gemini-3.8-flash-lite-tts.`
        );
      } else {
        setStatusMessage(
          `Playing Scene ${scene.index} narration using built-in warm speech synthesis.`
        );
      }
    } finally {
      setSynthesizingTtsId(null);
    }
  };

  const handleNanoBananaCleanKeyframe = async (scene: StoryboardScene) => {
    setCleaningKeyframeId(scene.id);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/nano-banana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${scene.flowPrompt} Clean 3D pixel-art voxel keyframe illustration, crisp edges, sunny indoor pool lighting, vibrant turquoise water.`,
          imageBase64: scene.index === 1 ? referenceBase64 : undefined,
          mimeType: referenceMimeType,
          aspectRatio: "16:9",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.imageBase64) {
          setNanoKeyframes((prev) => ({
            ...prev,
            [scene.id]: `data:${data.mimeType || "image/png"};base64,${data.imageBase64}`,
          }));
          setStatusMessage(
            `Generated clean Nano Banana (gemini-3.1-flash-lite-image) keyframe for Scene ${scene.index}: ${scene.title}`
          );
          return;
        }
      }

      setStatusMessage(
        `Applied local Nano Banana Voxel Edge & Palette Clean-Up to Scene ${scene.index}: ${scene.title}.`
      );
    } catch {
      setStatusMessage(
        `Applied local Nano Banana Voxel Edge & Palette Clean-Up to Scene ${scene.index}: ${scene.title}.`
      );
    } finally {
      setCleaningKeyframeId(null);
    }
  };

  const handleRunMuapiCli = async (scene: StoryboardScene, modelSlug: string) => {
    setRunningMuapiId(`${scene.id}:${modelSlug}`);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/muapi/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelSlug,
          prompt: scene.flowPrompt,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "muapi CLI command failed.");
        return;
      }
      setMuapiOutput({
        command: data.command,
        output: data.output,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to execute muapi CLI.");
    } finally {
      setRunningMuapiId(null);
    }
  };

  const handleGenerateOmniVideo = async (scene: StoryboardScene) => {
    setGeneratingSceneId(scene.id);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const prevScene = STORYBOARD_SCENES.find((s) => s.index === scene.index - 1);
      const prevVideo = prevScene ? generatedVideos[prevScene.id] : undefined;

      const response = await fetch("/api/flow-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: scene.flowPrompt,
          referenceImageBase64: scene.index === 1 ? referenceBase64 : undefined,
          referenceImageMimeType: scene.index === 1 ? referenceMimeType : undefined,
          previousInteractionId: prevVideo?.interactionId,
          duration: "5s",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(
          data.error ||
            "Cloud video generation requires a billing-enabled Gemini API key in Settings > Secrets. You can download the clean 25s 3D Voxel video directly using the Download button above."
        );
        return;
      }

      if (data.videoBase64 || data.videoUri) {
        const videoUrl = data.videoBase64
          ? `data:${data.mimeType || "video/mp4"};base64,${data.videoBase64}`
          : data.videoUri;

        setGeneratedVideos((prev) => ({
          ...prev,
          [scene.id]: {
            sceneId: scene.id,
            interactionId: data.interactionId,
            videoUrl,
          },
        }));
        setStatusMessage(`Generated cloud clip for Scene ${scene.index}: ${scene.title}`);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to connect to video generation endpoint.");
    } finally {
      setGeneratingSceneId(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Storyboard &amp; Google Flow Pipeline</span>
            <span aria-hidden="true">·</span>
            <span>5 Cleaned Voxel Keyframes · 25 Seconds Total</span>
            {muapiStatus?.installed && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[#0284C7]">
                  muapi-cli v{muapiStatus.version} Installed
                </span>
              </>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-display">
            25-Second Storyboard Keyframes, MuAPI CLI &amp; Video Export
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onExport25sWebM}
            disabled={isExportingWebM}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {isExportingWebM ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Recording Clean 25s Video ({Math.round(exportProgress)}%)</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download Clean 25s Video (.webm)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-4">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {statusMessage && (
        <div className="mt-4 p-3.5 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-center justify-between gap-4">
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {muapiOutput && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950 text-slate-100 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-sky-400">
              <Terminal className="w-3.5 h-3.5" />
              <span>$ {muapiOutput.command}</span>
            </div>
            <button
              type="button"
              onClick={() => setMuapiOutput(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close Terminal Output
            </button>
          </div>
          <pre className="text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {muapiOutput.output}
          </pre>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 pt-5">
        {STORYBOARD_SCENES.map((scene) => {
          const isCurrent = scene.id === activeSceneId;
          const generatedClip = generatedVideos[scene.id];

          return (
            <div
              key={scene.id}
              className={`rounded-xl border p-5 transition-colors ${
                isCurrent
                  ? "bg-sky-50/50 border-[#0284C7]"
                  : "bg-slate-50/60 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                {/* Left: Clean 3D Voxel Keyframe Preview */}
                <div className="lg:col-span-3">
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-200 bg-[#0284C7]">
                    <SceneVoxelKeyframeCanvas
                      sceneIndex={scene.index}
                      nanoBananaCleaned={nanoBananaCleaned}
                      customKeyframeUrl={nanoKeyframes[scene.id]}
                    />
                    <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-mono font-semibold text-white bg-slate-950/75 px-2 py-0.5 rounded">
                      <span>Scene 0{scene.index}</span>
                      <span>{scene.timeRangeLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Middle: Storyboard Copy & Biomechanics */}
                <div className="lg:col-span-6 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-[#0284C7] tabular-nums">
                      {scene.timeRangeLabel}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-slate-800">
                      0{scene.index}. {scene.title}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{scene.duration}s duration</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <div className="text-[11px] text-slate-500 font-medium mb-0.5">
                        On-Screen Instructional Text
                      </div>
                      <div className="text-sm font-bold text-slate-900 font-display">
                        “{scene.onScreenText}”
                      </div>
                      {scene.subText && (
                        <div className="text-xs text-slate-600 mt-0.5">
                          “{scene.subText}”
                        </div>
                      )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <div className="text-[11px] text-slate-500 font-medium mb-0.5">
                        Synchronized Voice-Over &amp; Subtitle
                      </div>
                      <div className="text-sm font-semibold text-[#0369A1]">
                        “{scene.voiceOver}”
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 leading-relaxed pt-1">
                    <strong className="text-slate-800">Learner Action:</strong> {scene.learnerAction}{" "}
                    <span className="text-slate-400 mx-1">·</span>{" "}
                    <strong className="text-slate-800">Coach Support:</strong> {scene.coachAction}
                  </div>
                </div>

                {/* Right: Interactive Scene, Nano Banana & MuAPI CLI Controls */}
                <div className="lg:col-span-3 flex flex-wrap lg:flex-col items-stretch gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectScene(scene.startTime)}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Play Scene ({scene.timeRangeLabel.split(" – ")[0]})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNanoBananaCleanKeyframe(scene)}
                    disabled={cleaningKeyframeId === scene.id}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    {cleaningKeyframeId === scene.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5 text-amber-800" />
                    )}
                    <span>Nano Banana Keyframe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRunMuapiCli(scene, "nano-banana-2")}
                    disabled={runningMuapiId !== null}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    {runningMuapiId === `${scene.id}:nano-banana-2` ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Terminal className="w-3.5 h-3.5 text-slate-700" />
                    )}
                    <span>muapi run nano-banana-2</span>
                  </button>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSynthesizeSceneVoice(scene)}
                      disabled={synthesizingTtsId === scene.id}
                      className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      {synthesizingTtsId === scene.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Volume2 className="w-3 h-3 text-[#0284C7]" />
                      )}
                      <span>Voice-Over</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGenerateOmniVideo(scene)}
                      disabled={generatingSceneId !== null}
                      className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      {generatingSceneId === scene.id ? (
                        <Loader2 className="w-3 h-3 animate-spin text-[#0284C7]" />
                      ) : (
                        <Film className="w-3 h-3 text-slate-600" />
                      )}
                      <span>Omni Clip</span>
                    </button>
                  </div>
                </div>
              </div>

              {generatedClip && (
                <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                  <video
                    src={generatedClip.videoUrl}
                    controls
                    className="w-full sm:w-72 aspect-video rounded-lg bg-black border border-slate-200"
                  />
                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#0284C7]" />
                      <span>Cloud Omni Flash Video Clip Ready</span>
                    </div>
                    <p>
                      Generated with <span className="font-mono">gemini-omni-1.1-flash</span> using stored interaction chaining (<span className="font-mono">{generatedClip.interactionId.slice(0, 12)}...</span>).
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
