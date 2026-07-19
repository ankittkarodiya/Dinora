import axiosInstance from "../api/axiosInstance";

export const uploadToCloudinary = async (file, folder = "tableturn/menu-items") => {
  const sigRes = await axiosInstance.get(`/upload/signature?folder=${encodeURIComponent(folder)}`);
  const { signature, timestamp, apiKey, cloudName, folder: signedFolder } = sigRes.data;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  // use signedFolder (echoed back from the server), not the local variable —
  // it must match EXACTLY what was signed or Cloudinary rejects the upload
  formData.append("folder", signedFolder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(errBody?.error?.message || "Image upload failed");
  }

  const data = await res.json();
  return data.secure_url;
};

























// import axiosInstance from "../api/axiosInstance";

// // signed upload — faster than the unsigned-preset approach because
// // it skips Cloudinary's preset-lookup step, and this endpoint returns instantly
// // once Cloudinary has *received* the file, without waiting for resizing to finish
// export const uploadToCloudinary = async (file, folder = "tableturn/menu-items") => {
//   const sigRes = await axiosInstance.get(`/upload/signature?folder=${folder}`);
//   const { signature, timestamp, apiKey, cloudName } = sigRes.data;

//   const formData = new FormData();
//   formData.append("file", file);
//   formData.append("api_key", apiKey);
//   formData.append("timestamp", timestamp);
//   formData.append("signature", signature);
//   formData.append("folder", folder);

//   const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
//     method: "POST",
//     body: formData,
//   });

//   if (!res.ok) throw new Error("Image upload failed");

//   const data = await res.json();
//   return data.secure_url;
// };