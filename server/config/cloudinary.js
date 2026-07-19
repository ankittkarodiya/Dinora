const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = { cloudinary };





















// const cloudinary = require("cloudinary").v2;
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const multer = require("multer");

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Still used ONLY by the restaurant logo upload (unchanged, multer-based).
// // Menu items no longer use this — they upload directly from the browser to
// // Cloudinary via a signed request, which is what Part 1 below fixes.
// const restaurantLogoStorage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "tableturn/restaurant-logos",
//     allowed_formats: ["jpg", "jpeg", "png", "webp"],
//     transformation: [{ width: 300, height: 300, crop: "fill", quality: "auto" }],
//   },
// });

// const uploadRestaurantLogo = multer({ storage: restaurantLogoStorage });

// module.exports = { cloudinary, uploadRestaurantLogo };




















// const cloudinary = require("cloudinary").v2;
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const multer = require("multer");

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const menuItemStorage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "tableturn/menu-items",
//     allowed_formats: ["jpg", "jpeg", "png", "webp"],
//     transformation: [{ width: 600, height: 600, crop: "fill", quality: "auto" }],
//   },
// });

// const categoryStorage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "tableturn/categories",
//     allowed_formats: ["jpg", "jpeg", "png", "webp"],
//     transformation: [{ width: 400, height: 400, crop: "fill", quality: "auto" }],
//   },
// });

// // NEW — restaurant logo storage
// const restaurantLogoStorage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "tableturn/restaurant-logos",
//     allowed_formats: ["jpg", "jpeg", "png", "webp"],
//     transformation: [{ width: 300, height: 300, crop: "fill", quality: "auto" }],
//   },
// });

// const uploadMenuItemImage = multer({ storage: menuItemStorage });
// const uploadCategoryImage = multer({ storage: categoryStorage });
// const uploadRestaurantLogo = multer({ storage: restaurantLogoStorage });

// module.exports = { cloudinary, uploadMenuItemImage, uploadCategoryImage, uploadRestaurantLogo };