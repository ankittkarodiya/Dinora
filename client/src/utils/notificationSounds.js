const playTone = (ctx, freq, startTime, duration, volume = 0.3) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
};

export const SOUND_PRESETS = [
  {
    id: "chime",
    label: "Chime",
    play: (ctx) => {
      const now = ctx.currentTime;
      playTone(ctx, 880, now, 0.15);
      playTone(ctx, 660, now + 0.15, 0.2);
    },
  },
  {
    id: "ding",
    label: "Ding",
    play: (ctx) => {
      const now = ctx.currentTime;
      playTone(ctx, 1046, now, 0.3);
    },
  },
  {
    id: "alert",
    label: "Alert",
    play: (ctx) => {
      const now = ctx.currentTime;
      playTone(ctx, 660, now, 0.1);
      playTone(ctx, 780, now + 0.12, 0.1);
      playTone(ctx, 900, now + 0.24, 0.15);
    },
  },
  {
    id: "bell",
    label: "Bell",
    play: (ctx) => {
      const now = ctx.currentTime;
      playTone(ctx, 523, now, 0.6, 0.25);
      playTone(ctx, 1046, now, 0.6, 0.12);
    },
  },
];

// ← THE FIX: ONE shared AudioContext, created once and reused forever,
// instead of a fresh one on every call. Browsers only let an AudioContext
// actually produce sound if it was created/resumed during a real user
// gesture (a click/tap) — a context created inside a background timer
// (like our 10-second poll) starts permanently "suspended" and stays
// silent. By creating it once here and explicitly resuming it the first
// time the page registers ANY click, it's already "unlocked" and running
// by the time a background poll needs to use it later.
let sharedCtx = null;

const getContext = () => {
  if (!sharedCtx) {
    sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return sharedCtx;
};

// Call this once, from a real click handler, as early as possible —
// see unlockAudio() below and where it's wired in Orders.jsx.
// export const unlockAudio = () => {
//   const ctx = getContext();
//   if (ctx.state === "suspended") {
//     ctx.resume().catch(() => {});
//   }
// };
export const unlockAudio = () => {
  const ctx = getContext();
  console.log("🔓 unlockAudio called. Context state:", ctx.state);
  if (ctx.state === "suspended") {
    ctx.resume().then(() => console.log("🔓 Context resumed. New state:", ctx.state));
  }
};


// export const playSound = (soundId) => {
//   try {
//     const preset = SOUND_PRESETS.find((s) => s.id === soundId) || SOUND_PRESETS[0];
//     const ctx = getContext();
//     if (ctx.state === "suspended") {
//       ctx.resume().catch(() => {});
//     }
//     preset.play(ctx);
//   } catch {
//     // Web Audio API unsupported or blocked — fails silently
//   }
// };

// export const playSound = (soundId) => {
//   try {
//     const preset = SOUND_PRESETS.find((s) => s.id === soundId) || SOUND_PRESETS[0];
//     const ctx = getContext();
//     console.log("🔊 playSound called. Context state:", ctx.state, "| sound:", soundId);
//     if (ctx.state === "suspended") {
//       ctx.resume().catch(() => {});
//     }
//     preset.play(ctx);
//   } catch (err) {
//     console.log("🔊 playSound threw an error:", err);
//   }
// };

export const playSound = async (soundId) => {
  try {
    const preset = SOUND_PRESETS.find((s) => s.id === soundId) || SOUND_PRESETS[0];
    const ctx = getContext();
    // ← THE FIX: wait for resume() to genuinely finish before scheduling
    // any tones. Firing resume() and immediately playing regardless was
    // scheduling sound against a context that wasn't actually running yet
    // — which is exactly what caused the noticeable delay.
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    preset.play(ctx);
  } catch {
    // Web Audio API unsupported or blocked — fails silently
  }
};




















// // Each preset is a small function that plays a distinct tone pattern via
// // the Web Audio API — no audio files needed, works identically everywhere.
// const playTone = (ctx, freq, startTime, duration, volume = 0.3) => {
//   const osc = ctx.createOscillator();
//   const gain = ctx.createGain();
//   osc.connect(gain);
//   gain.connect(ctx.destination);
//   osc.type = "sine";
//   osc.frequency.value = freq;
//   gain.gain.setValueAtTime(volume, startTime);
//   gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
//   osc.start(startTime);
//   osc.stop(startTime + duration);
// };

// export const SOUND_PRESETS = [
//   {
//     id: "chime",
//     label: "Chime",
//     play: (ctx) => {
//       const now = ctx.currentTime;
//       playTone(ctx, 880, now, 0.15);
//       playTone(ctx, 660, now + 0.15, 0.2);
//     },
//   },
//   {
//     id: "ding",
//     label: "Ding",
//     play: (ctx) => {
//       const now = ctx.currentTime;
//       playTone(ctx, 1046, now, 0.3);
//     },
//   },
//   {
//     id: "alert",
//     label: "Alert",
//     play: (ctx) => {
//       const now = ctx.currentTime;
//       playTone(ctx, 660, now, 0.1);
//       playTone(ctx, 780, now + 0.12, 0.1);
//       playTone(ctx, 900, now + 0.24, 0.15);
//     },
//   },
//   {
//     id: "bell",
//     label: "Bell",
//     play: (ctx) => {
//       const now = ctx.currentTime;
//       playTone(ctx, 523, now, 0.6, 0.25);
//       playTone(ctx, 1046, now, 0.6, 0.12);
//     },
//   },
// ];

// export const playSound = (soundId) => {
//   try {
//     const preset = SOUND_PRESETS.find((s) => s.id === soundId) || SOUND_PRESETS[0];
//     const ctx = new (window.AudioContext || window.webkitAudioContext)();
//     preset.play(ctx);
//   } catch {
//     // Web Audio API unsupported or blocked — fails silently
//   }
// };