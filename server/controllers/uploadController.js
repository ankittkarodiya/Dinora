const { cloudinary } = require("../config/cloudinary");

// GET /api/upload/signature?folder=tableturn/menu-items
// The browser calls this first, then uploads the actual file straight to
// Cloudinary using the signature returned here. Your server never touches
// the file itself — this is what makes uploads fast.
const getUploadSignature = async (req, res) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary is not configured. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env",
      });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = req.query.folder || "tableturn/menu-items";

    // only params listed here get signed — the browser must send back
    // exactly these same params, or Cloudinary rejects with "Invalid Signature"
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      success: true,
      signature,
      timestamp,
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUploadSignature };



