const nodemailer = require("nodemailer");

// Created ONCE when this module first loads, not on every email send.
// Nodemailer's transporter can safely handle multiple sendMail calls
// over time — creating a fresh one per request just adds unnecessary
// connection/handshake overhead to every single email.
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
  family: 4,
  pool: true, // ← reuses connections across multiple sends instead of opening a new one each time
  maxConnections: 3,
  maxMessages: 100,
});

module.exports = transporter;