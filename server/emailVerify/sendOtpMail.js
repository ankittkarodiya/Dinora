const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpMail = async (email, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Dinora <onboarding@resend.dev>", // ← Resend's shared testing domain, works immediately with no setup
      to: email,
      subject: "Password Reset OTP",
      html: `<p>Your OTP for password reset is: <b>${otp}</b>. It is valid for 10 minutes.</p>`,
    });

    if (error) {
      console.error("🔴 EMAIL SEND FAILED:", error);
      throw new Error(error.message || "Failed to send OTP email");
    }

    console.log("✅ OTP email sent successfully:", data.id);
    return data;
  } catch (err) {
    console.error("🔴 EMAIL SEND FAILED. Full error:", err);
    throw err;
  }
};

module.exports = sendOtpMail;

























// const dns = require("dns").promises;
// const nodemailer = require("nodemailer");

// const sendOtpMail = async (email, otp) => {
//   // Manually resolve smtp.gmail.com to a real IPv4 address FIRST,
//   // then connect directly to that literal IP. Render's environment
//   // keeps choosing IPv6 for smtp.gmail.com regardless of `family: 4`
//   // or dns.setDefaultResultOrder — this sidesteps that entirely by
//   // never giving Node's connection logic a hostname to resolve at all.
//   const addresses = await dns.resolve4("smtp.gmail.com");
//   const ipv4Address = addresses[0];
//   console.log("📧 Resolved Gmail SMTP to IPv4:", ipv4Address);

//   const transporter = nodemailer.createTransport({
//     host: ipv4Address,
//     port: 465,
//     secure: true,
//     tls: {
//       servername: "smtp.gmail.com", // required so Gmail's SSL cert still validates against the real hostname
//     },
//     auth: {
//       user: process.env.MAIL_USER,
//       pass: process.env.MAIL_PASSWORD,
//     },
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


























// // oldest
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