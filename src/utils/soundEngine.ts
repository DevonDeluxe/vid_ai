import { STORYBOARD_SCENES } from "../data/storyboardData";

class PixelPoolAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicEnabled: boolean = true;
  private sfxEnabled: boolean = true;
  private narrationEnabled: boolean = true;

  private lastSpokenSceneId: string | null = null;
  private lastMusicBeat: number = -1;
  private lastBubbleTrigger: number = -1;
  private lastKickTrigger: number = -1;
  private chimePlayedForLoop: boolean = false;

  private wavAudioCache = new Map<string, string>();
  private activeAudioElement: HTMLAudioElement | null = null;
  private ttsApiAvailable: boolean = true;

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopNarration();
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  public setNarrationEnabled(enabled: boolean) {
    this.narrationEnabled = enabled;
    if (!enabled) {
      this.stopNarration();
    }
  }

  public resetTimelineTracking() {
    this.lastSpokenSceneId = null;
    this.lastMusicBeat = -1;
    this.lastBubbleTrigger = -1;
    this.lastKickTrigger = -1;
    this.chimePlayedForLoop = false;
    this.stopNarration();
  }

  public stopNarration() {
    if (this.activeAudioElement) {
      this.activeAudioElement.pause();
      this.activeAudioElement = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  public async preloadSceneTTS(sceneId: string, text: string): Promise<boolean> {
    if (this.wavAudioCache.has(sceneId)) return true;
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneId, text, voice: "Kore" }),
      });
      if (!res.ok) {
        this.ttsApiAvailable = false;
        return false;
      }
      const data = await res.json();
      if (data.audioBase64) {
        const mime = data.mimeType || "audio/wav";
        this.wavAudioCache.set(sceneId, `data:${mime};base64,${data.audioBase64}`);
        return true;
      }
      return false;
    } catch {
      this.ttsApiAvailable = false;
      return false;
    }
  }

  public speakSceneNarration(sceneId: string, text: string) {
    if (this.isMuted || !this.narrationEnabled) return;
    if (this.lastSpokenSceneId === sceneId) return;
    this.lastSpokenSceneId = sceneId;

    this.stopNarration();

    const cachedDataUrl = this.wavAudioCache.get(sceneId);
    if (cachedDataUrl) {
      const audio = new Audio(cachedDataUrl);
      audio.volume = 0.95;
      this.activeAudioElement = audio;
      audio.play().catch(() => {
        this.speakWithBrowserSynthesis(text);
      });
      return;
    }

    if (this.ttsApiAvailable) {
      // Attempt non-blocking fetch; if slow or unavailable, use Web Speech API immediately
      this.preloadSceneTTS(sceneId, text).then((ok) => {
        if (ok && this.lastSpokenSceneId === sceneId && !this.isMuted && this.narrationEnabled) {
          const url = this.wavAudioCache.get(sceneId);
          if (url && !window.speechSynthesis?.speaking) {
            const audio = new Audio(url);
            audio.volume = 0.95;
            this.activeAudioElement = audio;
            audio.play().catch(() => {});
          }
        }
      });
    }

    this.speakWithBrowserSynthesis(text);
  }

  private speakWithBrowserSynthesis(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.08;
      utterance.volume = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Google") ||
              v.name.includes("Samantha") ||
              v.name.includes("Natural") ||
              v.name.includes("Victoria"))
        ) || voices.find((v) => v.lang.startsWith("en"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore synthesis errors
    }
  }

  // Play a single chiptune marimba note
  private playChiptuneNote(freq: number, duration: number, volume = 0.035) {
    if (this.isMuted || !this.musicEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // Play sparkling square-bubble pop sound
  public playBubbleSound() {
    if (this.isMuted || !this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseFreq = 420 + Math.random() * 280;
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.9, now + 0.09);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  // Play soft water splash / flutter kick ripple
  public playWaterSplash(intensity = 0.03) {
    if (this.isMuted || !this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.14);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(680, now);
    filter.Q.setValueAtTime(1.8, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
  }

  // Play gentle 8-bit achievement chime at celebration
  public playAchievementChime() {
    if (this.isMuted || !this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
    notes.forEach((freq, idx) => {
      const startOffset = idx * 0.085;
      const now = ctx.currentTime + startOffset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.038, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.34);
    });
  }

  // Called every animation frame with currentTime (0..25s)
  public updateTimelineAudio(currentTime: number, isPlaying: boolean) {
    if (!isPlaying || this.isMuted) return;

    // 1. Trigger scene voice-over narration
    const activeScene = STORYBOARD_SCENES.find(
      (s) => currentTime >= s.startTime && currentTime < s.endTime
    );
    if (activeScene && this.lastSpokenSceneId !== activeScene.id) {
      this.speakSceneNarration(activeScene.id, activeScene.voiceOver);
    }

    // 2. Cheerful playful video-game melody (quarter-second steps)
    const melodyNotes = [
      261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 392.0,
      349.23, 440.0, 523.25, 440.0, 392.0, 329.63, 293.66, 261.63,
    ];
    const beatIndex = Math.floor(currentTime * 3.5);
    if (beatIndex !== this.lastMusicBeat) {
      this.lastMusicBeat = beatIndex;
      const note = melodyNotes[beatIndex % melodyNotes.length];
      this.playChiptuneNote(note, 0.22, 0.025);
    }

    // 3. Bubble sound effects during underwater intro (0-2.2s), Blow Bubbles (6.7-9.6s), and Repeat (18.2-20.1s)
    const inBubbleWindow =
      (currentTime >= 0.1 && currentTime <= 2.2) ||
      (currentTime >= 6.7 && currentTime <= 9.6) ||
      (currentTime >= 18.2 && currentTime <= 20.1);

    if (inBubbleWindow) {
      const bubbleStep = Math.floor(currentTime * 5);
      if (bubbleStep !== this.lastBubbleTrigger) {
        this.lastBubbleTrigger = bubbleStep;
        this.playBubbleSound();
      }
    }

    // 4. Soft water splashes during step entry (2.5-4.2s), Little Kicks (11.3-17.7s), and Repeat Kicks (18.4-20.0s)
    const inKickWindow =
      (currentTime >= 2.6 && currentTime <= 4.2) ||
      (currentTime >= 11.3 && currentTime <= 17.7) ||
      (currentTime >= 18.4 && currentTime <= 20.0);

    if (inKickWindow) {
      const kickStep = Math.floor(currentTime * 2.5);
      if (kickStep !== this.lastKickTrigger) {
        this.lastKickTrigger = kickStep;
        this.playWaterSplash(0.026);
      }
    }

    // 5. Gentle achievement chime at 20.2s when pixel stars appear above water
    if (currentTime >= 20.2 && currentTime < 21.0 && !this.chimePlayedForLoop) {
      this.chimePlayedForLoop = true;
      this.playAchievementChime();
    }
    if (currentTime < 1.0) {
      this.chimePlayedForLoop = false;
    }
  }
}

export const soundEngine = new PixelPoolAudioEngine();
