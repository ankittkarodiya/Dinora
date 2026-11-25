// Admin login sessions are stored PER RESTAURANT (by its name in the URL),
// not in one shared box. So tab 1 can be "pizza-hub" and tab 2 "cafe-mocha"
// at the same time without overwriting each other.

const TOKEN_KEY = (slug) => `dinora_token:${slug}`;
const USER_KEY = (slug) => `dinora_user:${slug}`;

// URL names that belong to the app itself. A restaurant can never use these.
// Keep this list identical to RESERVED_SLUGS on the server.
// export const RESERVED_SEGMENTS = [
//   "login", "register", "register-verification", "verification",
//   "forgot-password", "verify-email", "change-password", "menu",
//   "customer", "superadmin", "restaurant", "setup", "api", "admin",
//   "dashboard", "settings", "orders", "tables", "analytics", "reviews",
//   "categories", "counter", "about", "pricing", "contact", "terms",
//   "privacy", "help", "support", "assets", "static", "new", "www",
// ];

// new
export const RESERVED_SEGMENTS = [
  "login", "register", "register-verification", "verification",
  "forgot-password", "verify-email", "change-password", "menu",
  "customer", "superadmin", "restaurant", "setup", "api", "admin",
  "dashboard", "settings", "orders", "tables", "analytics", "reviews",
  "categories", "counter", "about", "pricing", "contact", "terms",
  "privacy", "help", "support", "assets", "static", "new", "www",
  "app", "privacy-policy", "terms-and-conditions", "refund-policy",
];



// "/pizza-hub/orders" -> "pizza-hub"   ("/setup" -> "setup")
export const getAdminSlug = () => window.location.pathname.split("/")[1] || "";

// builds "/pizza-hub/orders" for whichever restaurant this tab is on
export const adminPath = (page = "dashboard", slug = getAdminSlug()) => `/${slug}/${page}`;

// true for "/pizza-hub/..." and "/setup", false for login, menu, landing...
// export const isAdminPath = (pathname) => {
//   const seg = pathname.split("/")[1];
//   if (!seg) return false;
//   return seg === "setup" || !RESERVED_SEGMENTS.includes(seg);
// };


// new
export const isAdminPath = (pathname) => {
  const parts = pathname.split("/");
  const seg = parts[1];
  if (!seg) return false;
  if (parts[2] === "menu" && parts.length > 3) return false; // customer menu: /restro/menu/<table>
  return seg === "setup" || !RESERVED_SEGMENTS.includes(seg);
};



export const getToken = (slug = getAdminSlug()) =>
  slug ? localStorage.getItem(TOKEN_KEY(slug)) : null;

export const getUser = (slug = getAdminSlug()) => {
  try {
    return slug ? JSON.parse(localStorage.getItem(USER_KEY(slug)) || "null") : null;
  } catch {
    return null;
  }
};

export const saveSession = (slug, token, user) => {
  localStorage.setItem(TOKEN_KEY(slug), token);
  localStorage.setItem(USER_KEY(slug), JSON.stringify(user));
};

export const clearSession = (slug = getAdminSlug()) => {
  if (!slug) return;
  localStorage.removeItem(TOKEN_KEY(slug));
  localStorage.removeItem(USER_KEY(slug));
};

// ── Right after login we don't know the restaurant name yet. This in-memory
// (per-tab) session is used for the first few API calls until we do. ──
let pending = { token: null, user: null };
export const setPendingSession = (token, user) => { pending = { token, user }; };
export const getPendingToken = () => pending.token;
export const clearPendingSession = () => { pending = { token: null, user: null }; };

// ── "/setup" has no restaurant name yet, so its session lives under "setup" ──
export const copySessionToSetup = () => {
  const token = getToken() || pending.token;
  const user = getUser() || pending.user;
  if (token && user) saveSession("setup", token, user);
};

// once the restaurant exists, move the "setup" session under its real name
export const promoteSetupSession = (slug) => {
  const token = getToken("setup");
  const user = getUser("setup");
  if (token && user) saveSession(slug, token, user);
  clearSession("setup");
};



// new
// ── remembers the restaurant used last, so the installed app can reopen it ──
const LAST_KEY = "dinora_last_slug";

export const rememberSlug = (slug) => {
  if (slug && slug !== "setup" && slug !== "superadmin") localStorage.setItem(LAST_KEY, slug);
};

export const findStartSlug = () => {
  const last = localStorage.getItem(LAST_KEY);
  if (last && getToken(last) && getUser(last)) return last;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("dinora_token:")) {
      const s = k.slice("dinora_token:".length);
      if (s !== "setup" && s !== "superadmin" && getUser(s)) return s;
    }
  }
  return null;
};