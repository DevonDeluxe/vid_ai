import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Subtitles,
  Download,
  SkipBack,
  SkipForward,
  CheckCircle2,
  ShieldCheck,
  Wand2,
} from "lucide-react";
import {
  STORYBOARD_SCENES,
  TOTAL_DURATION,
  SAFETY_CONSTRAINTS,
} from "./data/storyboardData";
import { VoxelPoolCanvas } from "./components/VoxelPoolCanvas";
import { ReferencePhotoPanel } from "./components/ReferencePhotoPanel";
import { FlowStudioPanel } from "./components/FlowStudioPanel";
import { soundEngine } from "./utils/soundEngine";

export default function App() {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loopEnabled, setLoopEnabled] = useState<boolean>(true);
  const [pixelResolutionMode, setPixelResolutionMode] = useState<"voxel-hd" | "pixel-retro">("voxel-hd");
  const [subtitlesEnabled, setSubtitlesEnabled] = useState<boolean>(true);
  const [nanoBananaCleaned, setNanoBananaCleaned] = useState<boolean>(true);

  // Audio channel toggles
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [narrationOn, setNarrationOn] = useState<boolean>(true);
  const [musicOn, setMusicOn] = useState<boolean>(true);
  const [sfxOn, setSfxOn] = useState<boolean>(true);

  // Reference image base64 for Google Flow / Omni & Nano Banana pipeline
  const [referenceBase64, setReferenceBase64] = useState<string>("");
  const [referenceMimeType, setReferenceMimeType] = useState<string>("image/png");

  // WebM 25-second video recorder state
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const [isExportingWebM, setIsExportingWebM] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const lastFrameTimestampRef = useRef<number | null>(null);

  const activeScene =
    STORYBOARD_SCENES.find(
      (s) => currentTime >= s.startTime && currentTime < s.endTime
    ) || STORYBOARD_SCENES[STORYBOARD_SCENES.length - 1];

  // Preload Gemini TTS narration for scenes on mount
  useEffect(() => {
    STORYBOARD_SCENES.forEach((scene) => {
      soundEngine.preloadSceneTTS(scene.id, scene.voiceOver).catch(() => {});
    });
  }, []);

  // Main 25-second playback clock
  useEffect(() => {
    if (!isPlaying) {
      lastFrameTimestampRef.current = null;
      return;
    }

    let frameId: number;
    const step = (timestamp: number) => {
      if (lastFrameTimestampRef.current === null) {
        lastFrameTimestampRef.current = timestamp;
      }
      const deltaSeconds = (timestamp - lastFrameTimestampRef.current) / 1000;
      lastFrameTimestampRef.current = timestamp;

      setCurrentTime((prev) => {
        const next = prev + deltaSeconds;
        if (next >= TOTAL_DURATION) {
          if (isExportingWebM && mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
            setIsPlaying(false);
            return TOTAL_DURATION;
          }
          if (loopEnabled) {
            soundEngine.resetTimelineTracking();
            return 0;
          } else {
            setIsPlaying(false);
            return TOTAL_DURATION;
          }
        }
        if (isExportingWebM) {
          setExportProgress((next / TOTAL_DURATION) * 100);
        }
        soundEngine.updateTimelineAudio(next, true);
        return next;
      });

      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, loopEnabled, isExportingWebM]);

  const handleTogglePlay = () => {
    if (!isPlaying) {
      if (currentTime >= TOTAL_DURATION - 0.1) {
        soundEngine.resetTimelineTracking();
        setCurrentTime(0);
      }
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      soundEngine.stopNarration();
    }
  };

  const handleRestart = () => {
    soundEngine.resetTimelineTracking();
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleSeek = (newTime: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_DURATION, newTime));
    soundEngine.resetTimelineTracking();
    setCurrentTime(clamped);
    if (isPlaying) {
      soundEngine.updateTimelineAudio(clamped, true);
    }
  };

  const handleStepScene = (direction: -1 | 1) => {
    const targetIndex = Math.max(
      1,
      Math.min(STORYBOARD_SCENES.length, activeScene.index + direction)
    );
    const targetScene = STORYBOARD_SCENES.find((s) => s.index === targetIndex);
    if (targetScene) {
      handleSeek(targetScene.startTime + 0.02);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
  };

  const handleToggleNarration = () => {
    const next = !narrationOn;
    setNarrationOn(next);
    soundEngine.setNarrationEnabled(next);
  };

  const handleToggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    soundEngine.setMusicEnabled(next);
  };

  const handleToggleSfx = () => {
    const next = !sfxOn;
    setSfxOn(next);
    soundEngine.setSfxEnabled(next);
  };

  const handleReferenceChange = useCallback((base64: string, mimeType: string) => {
    setReferenceBase64(base64);
    setReferenceMimeType(mimeType);
  }, []);

  const handleExport25sWebM = () => {
    const canvas = canvasElementRef.current;
    if (!canvas || isExportingWebM) return;

    try {
      const stream = canvas.captureStream(60);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "pixel-pool-bubble-and-kick-clean-25s.webm";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExportingWebM(false);
        setExportProgress(0);
      };

      mediaRecorderRef.current = recorder;
      setIsExportingWebM(true);
      setExportProgress(0);
      soundEngine.resetTimelineTracking();
      setCurrentTime(0);
      recorder.start(200);
      setIsPlaying(true);
    } catch {
      setIsExportingWebM(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const whole = Math.floor(sec);
    const tenths = Math.floor((sec - whole) * 10);
    return `0:${whole.toString().padStart(2, "0")}.${tenths}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-8">
        <a
          href="#player"
          className="text-lg font-extrabold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
        >
          Pixel Pool: Bubble &amp; Kick!
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a
            href="#player"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Animation Player
          </a>
          <a
            href="#reference"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Nano Banana Clean-Up
          </a>
          <a
            href="#storyboard"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Storyboard Keyframes
          </a>
          <a
            href="#safety"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Safety Checklist
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {isPlaying ? "Pause 25s Tutorial" : "Play 25s Tutorial"}
          </button>
        </div>
      </header>

      {/* Main Content Container (1440px max-w) */}
      <main className="flex-1 w-full max-w-[1380px] mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Section 1: Two-Zone Interactive 3D Voxel Animation Player & Control Deck */}
        <section id="player" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                <span>Google Flow + Nano Banana Refined</span>
                <span aria-hidden="true">·</span>
                <span>60fps Smooth Hermite Camera &amp; Limb Interpolation</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">25.0s Runtime</span>
              </div>
              <h1
                className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight"
                style={{ textWrap: "balance" }}
              >
                Pixel Pool: Bubble &amp; Kick!
              </h1>
            </div>

            {/* Interactive Resolution & Nano Banana Clean-Up Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setNanoBananaCleaned(!nanoBananaCleaned)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  nanoBananaCleaned
                    ? "bg-amber-50 border-amber-300 text-amber-950"
                    : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Nano Banana Clean Edges: {nanoBananaCleaned ? "Active" : "Off"}</span>
              </button>

              <div className="flex items-center gap-1 p-1 bg-slate-200/75 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPixelResolutionMode("voxel-hd")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    pixelResolutionMode === "voxel-hd"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  3D Voxel HD
                </button>
                <button
                  type="button"
                  onClick={() => setPixelResolutionMode("pixel-retro")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    pixelResolutionMode === "pixel-retro"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Retro Pixel Shader
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  subtitlesEnabled
                    ? "bg-white border-[#0284C7] text-[#0284C7]"
                    : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                <Subtitles className="w-3.5 h-3.5" />
                <span>Subtitles: {subtitlesEnabled ? "On" : "Off"}</span>
              </button>
            </div>
          </div>

          {/* Two-Zone Sandbox Split: Left 3D Voxel Viewport (7 cols) + Right Control & Concept Deck (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Zone: 3D Voxel Stage & Timeline Controls */}
            <div className="lg:col-span-7 flex flex-col justify-between bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
              <VoxelPoolCanvas
                currentTime={currentTime}
                isPlaying={isPlaying}
                pixelResolutionMode={pixelResolutionMode}
                subtitlesEnabled={subtitlesEnabled}
                nanoBananaCleaned={nanoBananaCleaned}
                onCanvasReady={(canvas) => {
                  canvasElementRef.current = canvas;
                }}
              />

              {/* 25-Second Storyboard Timeline Scrubber */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">
                      Scene {activeScene.index}: {activeScene.title}
                    </span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {formatSeconds(currentTime)} / 0:25.0
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={TOTAL_DURATION}
                    step={0.02}
                    value={currentTime}
                    onChange={(e) => handleSeek(parseFloat(e.target.value))}
                    aria-label="25-second tutorial timeline scrubber"
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0284C7]"
                  />

                  {/* Clickable Storyboard Scene Markers */}
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {STORYBOARD_SCENES.map((scene) => {
                      const isCurrent = scene.id === activeScene.id;
                      return (
                        <button
                          key={scene.id}
                          type="button"
                          onClick={() => handleSeek(scene.startTime + 0.02)}
                          className={`text-left px-2.5 py-1.5 rounded-lg border transition-colors ${
                            isCurrent
                              ? "bg-sky-50 border-[#0284C7] text-slate-900"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <div className="text-[10px] font-mono font-semibold text-[#0284C7] tabular-nums truncate">
                            {scene.startTime}–{scene.endTime}s
                          </div>
                          <div className="text-xs font-semibold truncate">
                            {scene.index}. {scene.title}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Transport & Sound Mixer Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Play</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleRestart}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restart</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStepScene(-1)}
                      title="Previous Scene"
                      className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStepScene(1)}
                      title="Next Scene"
                      className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setLoopEnabled(!loopEnabled)}
                      className={`px-2.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                        loopEnabled
                          ? "bg-sky-50 border-sky-200 text-[#0284C7]"
                          : "bg-white border-slate-200 text-slate-500"
                      }`}
                    >
                      Loop: {loopEnabled ? "On" : "Off"}
                    </button>
                  </div>

                  {/* Multi-Track Audio Controls */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      {isMuted ? (
                        <VolumeX className="w-3.5 h-3.5 text-red-600" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-[#0284C7]" />
                      )}
                      <span>{isMuted ? "Muted" : "Audio On"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleNarration}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                        narrationOn && !isMuted
                          ? "bg-sky-50 border-sky-200 text-[#0369A1]"
                          : "bg-white border-slate-200 text-slate-400"
                      }`}
                    >
                      Voice-Over
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleMusic}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                        musicOn && !isMuted
                          ? "bg-sky-50 border-sky-200 text-[#0369A1]"
                          : "bg-white border-slate-200 text-slate-400"
                      }`}
                    >
                      Game Music
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleSfx}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                        sfxOn && !isMuted
                          ? "bg-sky-50 border-sky-200 text-[#0369A1]"
                          : "bg-white border-slate-200 text-slate-400"
                      }`}
                    >
                      Bubbles &amp; Splash SFX
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Zone: Active Scene Director & Video Inspection Diagnostics */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-slate-200 rounded-xl p-5 space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="text-xs text-slate-500">
                      Active Storyboard Segment ·{" "}
                      <span className="font-mono tabular-nums">{activeScene.timeRangeLabel}</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 font-display mt-0.5">
                      0{activeScene.index}. {activeScene.title}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={handleExport25sWebM}
                    disabled={isExportingWebM}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExportingWebM ? `${Math.round(exportProgress)}%` : "Export 60fps .webm"}</span>
                  </button>
                </div>

                {/* On-Screen Text & Voice-Over Readout */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">
                      On-Screen Text Overlay
                    </div>
                    <div className="text-base font-extrabold text-slate-900 font-display mt-0.5">
                      “{activeScene.onScreenText}”
                    </div>
                    {activeScene.subText && (
                      <div className="text-xs text-slate-600 mt-0.5">
                        “{activeScene.subText}”
                      </div>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-200">
                    <div className="text-[11px] font-medium text-slate-500">
                      Warm English Voice-Over &amp; Subtitle
                    </div>
                    <div className="text-sm font-semibold text-[#0284C7] mt-0.5">
                      “{activeScene.voiceOver}”
                    </div>
                  </div>
                </div>

                {/* Camera, Learner & Coach Action Details */}
                <div className="space-y-2.5 text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="font-semibold text-slate-900 mb-0.5">
                      Camera &amp; Smooth Motion Path
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {activeScene.cameraAngle}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="font-semibold text-slate-900 mb-0.5">
                      Child Learner Biomechanics
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {activeScene.learnerAction}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="font-semibold text-slate-900 mb-0.5">
                      Video Inspection &amp; Nano Banana Fixes Applied
                    </div>
                    <ul className="text-slate-600 space-y-1 mt-1">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                        <span>Cubic-Hermite camera &amp; pose blending (no scene cut jumps)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                        <span>Dynamic arm pitch keeps hands locked on yellow wall grip</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                        <span>Non-clipping water meniscus for split water-level close-up</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Active Safety & Constraint Indicator */}
              <div className="pt-3 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Safety Constraint Active: </span>
                  <span>{activeScene.safetyFocus}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Reference Image Transformation & Nano Banana Clean-Up */}
        <section id="reference">
          <ReferencePhotoPanel
            onReferenceBase64Change={handleReferenceChange}
            onJumpToStart={() => {
              handleSeek(0);
              setIsPlaying(true);
            }}
            nanoBananaCleaned={nanoBananaCleaned}
            onTriggerNanoBananaCleanAll={() => setNanoBananaCleaned(true)}
          />
        </section>

        {/* Section 3: 25-Second Storyboard Keyframes & Google Flow Studio */}
        <section id="storyboard">
          <FlowStudioPanel
            referenceBase64={referenceBase64}
            referenceMimeType={referenceMimeType}
            activeSceneId={activeScene.id}
            nanoBananaCleaned={nanoBananaCleaned}
            onSelectScene={(startTime) => {
              handleSeek(startTime + 0.02);
              setIsPlaying(true);
            }}
            onExport25sWebM={handleExport25sWebM}
            isExportingWebM={isExportingWebM}
            exportProgress={exportProgress}
          />
        </section>

        {/* Section 4: Animation & Water-Safety Compliance Verification */}
        <section id="safety" className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Instructional &amp; Water-Safety Standards</span>
              <span aria-hidden="true">·</span>
              <span>Beginner Shallow Teaching Area</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-display">
              Animation &amp; Water-Safety Constraints
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
            {SAFETY_CONSTRAINTS.map((item) => (
              <div
                key={item.title}
                className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1.5"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                  <span>{item.title}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500">
        <div className="max-w-[1380px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Pixel Pool: Bubble &amp; Kick! · 25-Second 3D Voxel Swimming Tutorial</span>
          <span>A fun reminder—not a substitute for formal swim lessons or adult supervision.</span>
        </div>
      </footer>
    </div>
  );
}
