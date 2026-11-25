const DemoRequest = require("../models/DemoRequest");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const esc = (s) =>
  String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// POST /api/demo-requests  (public — anyone on the landing page can send one)
const createDemoRequest = async (req, res) => {
  try {
    const { name, restaurantName, phone, email, city, message, website } = req.body;

    // honeypot: a real visitor never fills this hidden field. Pretend it worked.
    if (website) return res.status(201).json({ success: true });

    const cleanPhone = String(phone || "").replace(/\D/g, "").slice(-10);
    if (!name?.trim() || !restaurantName?.trim()) {
      return res.status(400).json({ success: false, message: "Name and restaurant name are required" });
    }
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: "Enter a valid 10-digit phone number" });
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address" });
    }

    const request = await DemoRequest.create({
      name,
      restaurantName,
      phone: cleanPhone,
      email: email || "",
      city: city || "",
      message: message || "",
    });

    // Tell the owner by email. Never fail the request if the email fails —
    // the demo request is already safely saved.
    const notifyTo = process.env.DEMO_NOTIFY_EMAIL;
    if (notifyTo && process.env.RESEND_API_KEY) {
      resend.emails
        .send({
          from: "Dinora <noreply@dinora.in>",
          to: notifyTo,
          subject: `New demo request: ${request.restaurantName}`,
          html: `
            <h3>New demo request</h3>
            <p><b>Name:</b> ${esc(request.name)}</p>
            <p><b>Restaurant:</b> ${esc(request.restaurantName)}</p>
            <p><b>Phone:</b> ${esc(request.phone)}</p>
            <p><b>Email:</b> ${esc(request.email) || "-"}</p>
            <p><b>City:</b> ${esc(request.city) || "-"}</p>
            <p><b>Message:</b> ${esc(request.message) || "-"}</p>
          `,
        })
        .catch((err) => console.error("Demo notification email failed:", err));
    }

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("DEMO REQUEST ERROR:", error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message,
    });
  }
};

module.exports = { createDemoRequest };