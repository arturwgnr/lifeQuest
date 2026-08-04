// Short, synthesized UI tones for the Oracle chat (no audio asset files, generated
// on the fly via the Web Audio API). Kept deliberately quiet and simple, consistent
// with the app's restrained, non-gamey tone. There's no sound settings/mute toggle
// anywhere in the app yet, so volume is just kept low by default here; a mute
// toggle would be a reasonable future addition once more sounds exist elsewhere.
const DEFAULT_VOLUME = 0.05;

let sharedContext = null;

function getContext() {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedContext) sharedContext = new Ctx();
  if (sharedContext.state === "suspended") sharedContext.resume();
  return sharedContext;
}

// Plays one tone with a quick attack and an exponential decay tail so it reads
// as a soft "blip" rather than a harsh beep.
function playTone(ctx, { freq, start, duration, type = "sine", peak = DEFAULT_VOLUME }) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, start);

  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playNotes(notes) {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  notes.forEach(note => playTone(ctx, { ...note, start: now + (note.offset || 0) }));
}

export function playMessageSent() {
  playNotes([{ freq: 620, duration: 0.07, type: "sine", peak: 0.045 }]);
}

export function playMessageReceived() {
  playNotes([{ freq: 480, duration: 0.09, type: "sine", peak: 0.045 }]);
}

// Distinct from a plain reply: a short two-note upward chime, since a proposed
// quest is actionable, not just conversational.
export function playQuestProposed() {
  playNotes([
    { freq: 660, duration: 0.09, type: "triangle", peak: 0.05 },
    { freq: 880, duration: 0.12, type: "triangle", peak: 0.05, offset: 0.09 }
  ]);
}

// Positive, affirming: a brighter ascending interval.
export function playApprove() {
  playNotes([
    { freq: 523, duration: 0.08, type: "sine", peak: 0.05 },
    { freq: 659, duration: 0.14, type: "sine", peak: 0.05, offset: 0.08 }
  ]);
}

// Neutral/negative but not harsh: a single short, low, quickly-decaying tone.
export function playReject() {
  playNotes([{ freq: 300, duration: 0.1, type: "sine", peak: 0.04 }]);
}

// Task marked Done: a brighter, slightly fuller ascending chime than playApprove
// so completing a quest reads as a small reward.
export function playTaskCompleted() {
  playNotes([
    { freq: 523, duration: 0.08, type: "sine", peak: 0.055 },
    { freq: 659, duration: 0.1, type: "sine", peak: 0.055, offset: 0.08 },
    { freq: 784, duration: 0.16, type: "sine", peak: 0.05, offset: 0.16 }
  ]);
}

// Task marked Blocked: a short descending two-note dip, distinct from playReject
// so it reads as "stalled" rather than "rejected".
export function playTaskBlocked() {
  playNotes([
    { freq: 320, duration: 0.09, type: "sine", peak: 0.045 },
    { freq: 220, duration: 0.16, type: "sine", peak: 0.045, offset: 0.08 }
  ]);
}
