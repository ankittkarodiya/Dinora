const dns = require("dns");
const nodemailer = require("nodemailer");

// Force Node's DNS resolver to prefer IPv4 first, globally for this process.
// Render's outbound network doesn't properly support IPv6, causing
// ENETUNREACH/ESOCKET errors when connecting to Gmail's dual-stack servers.
dns.setDefaultResultOrder("ipv4first");

const sendOtpMail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
    family: 4,
  });

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "Password Reset OTP",
    html: `<p>Your OTP for password reset is: <b>${otp}</b>. It is valid for 10 minutes.</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ OTP email sent successfully:", info.messageId);
    return info;
  } catch (err) {
    console.error("🔴 EMAIL SEND FAILED. Full error:", err);
    console.error("🔴 Error code:", err.code);
    throw err;
  }
};

module.exports = sendOtpMail;

























// const transporter = require("../config/mailer");

// const sendOtpMail = async (email, otp) => {
//   const mailOptions = {
//     from: process.env.MAIL_USER,
//     to: email,
//     subject: "Password Reset OTP",
//     html: `<p>Your OTP for password reset is: <b>${otp}</b>. It is valid for 10 minutes.</p>`,
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log("✅ OTP email sent successfully:", info.messageId);
//     return info;
//   } catch (err) {
//     console.error("🔴 EMAIL SEND FAILED. Full error:", err);
//     console.error("🔴 Error code:", err.code);
//     throw err;
//   }
// };

// module.exports = sendOtpMail;

























// const nodemailer = require("nodemailer");

// const sendOtpMail = async (email, otp) => {
//   const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 465,
//     secure: true,
//     auth: {
//       user: process.env.MAIL_USER,
//       pass: process.env.MAIL_PASSWORD,
//     },
//     // ← THE FIX: force IPv4, since Render's outbound network doesn't
//     // properly support IPv6, causing ENETUNREACH errors on connect
//     family: 4,
//   });

//   const mailOptions = {
//     from: process.env.MAIL_USER,
//     to: email,
//     subject: "Password Reset OTP",
//     html: `<p>Your OTP for password reset is: <b>${otp}</b>. It is valid for 10 minutes.</p>`,
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log("✅ OTP email sent successfully:", info.messageId);
//     return info;
//   } catch (err) {
//     console.error("🔴 EMAIL SEND FAILED. Full error:", err);
//     console.error("🔴 Error code:", err.code);
//     throw err;
//   }
// };

// module.exports = sendOtpMail;






















// oldest
// const nodemailer = require("nodemailer");
// const fs = require('fs');
// const path = require('node:path');
// const { fileURLToPath } = require('node:url');
// const handlebars = require('handlebars');

// const sendOtpMail = async (email, otp) => {

//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.MAIL_USER,
//       pass: process.env.MAIL_PASSWORD,
//     },
//   });

//   const mailOptions = {
//         from: process.env.MAIL_USER,
//         to: email, 
//         subject: "Password Reset OTP", 
//         html: `<p> Your OTP for password reset is: <b>${otp}</b>. It is valid for 10 minutes.</p>`,
//     }

//     transporter.sendMail(mailOptions, (err, info) => {
//         if(err){
//             throw new Error(err);
//         }
//         else{
//          console.log('otp sent');
//          console.log(info);
//         }
//     });
// };

// module.exports = sendOtpMail;