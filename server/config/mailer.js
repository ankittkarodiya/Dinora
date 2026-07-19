const dns = require("dns");
// ← THE ADDITIONAL FIX: force Node's own DNS resolver to prefer IPv4
// results first, globally, for this entire process. This is a more
// forceful fix than the transport-level `family: 4` option alone,
// which apparently isn't being fully honored by Nodemailer's pooled
// connections in this specific Render environment.
dns.setDefaultResultOrder("ipv4first");

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
  family: 4,
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
});

module.exports = transporter;

























// const nodemailer = require("nodemailer");

// // Created ONCE when this module first loads, not on every email send.
// // Nodemailer's transporter can safely handle multiple sendMail calls
// // over time — creating a fresh one per request just adds unnecessary
// // connection/handshake overhead to every single email.
// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.MAIL_USER,
//     pass: process.env.MAIL_PASSWORD,
//   },
//   family: 4,
//   pool: true, // ← reuses connections across multiple sends instead of opening a new one each time
//   maxConnections: 3,
//   maxMessages: 100,
// });

// module.exports = transporter;