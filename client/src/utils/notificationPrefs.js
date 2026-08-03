const ENABLED_KEY = "dinora_orderNotificationsEnabled";
const SOUND_KEY = "dinora_orderNotificationSound";

export const isNotificationSoundEnabled = () => {
  const stored = localStorage.getItem(ENABLED_KEY);
  return stored === null ? true : stored === "true";
};

export const setNotificationSoundEnabled = (enabled) => {
  localStorage.setItem(ENABLED_KEY, String(enabled));
};

export const getSelectedSound = () => {
  return localStorage.getItem(SOUND_KEY) || "chime"; // defaults to "chime"
};

export const setSelectedSound = (soundId) => {
  localStorage.setItem(SOUND_KEY, soundId);
};



// ── Feature-gating flag ──────────────────────────────────────────────
// Single source of truth for whether notification sound requires Pro.
// Flip this ONE value to change it everywhere the feature is gated —
// nothing else in the codebase needs to be touched, found, or re-added.
export const NOTIFICATION_SOUND_REQUIRES_PRO = false; // ← set back to true to restore Pro-only
// export const NOTIFICATION_SOUND_REQUIRES_PRO = true;

// Call this instead of checking restaurantIsPro directly, anywhere the
// notification sound feature needs to check access — keeps every gate
// in the app perfectly consistent with the single flag above.
export const canUseNotificationSound = (restaurantIsPro) => {
  return !NOTIFICATION_SOUND_REQUIRES_PRO || restaurantIsPro;
};

























// const KEY = "dinora_orderNotificationsEnabled";

// export const isNotificationSoundEnabled = () => {
//   const stored = localStorage.getItem(KEY);
//   return stored === null ? true : stored === "true"; // defaults to ON
// };

// export const setNotificationSoundEnabled = (enabled) => {
//   localStorage.setItem(KEY, String(enabled));
// };