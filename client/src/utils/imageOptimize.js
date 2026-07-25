// Inserts Cloudinary optimization parameters into any existing image URL.
// Works on already-uploaded images without needing to re-upload anything —
// Cloudinary generates and caches the resized/compressed version on first request.
// Non-Cloudinary URLs (including local blob: preview URLs) pass through untouched.
export const optimizeImage = (url, width = 400) => {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_fill/`);
};