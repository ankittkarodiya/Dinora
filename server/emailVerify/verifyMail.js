const { Resend } = require("resend");
const fs = require('fs');
const path = require('node:path');
const handlebars = require('handlebars');

const resend = new Resend(process.env.RESEND_API_KEY);

const verifyMail = async (token, email) => {
  const emailTemplateSource = fs.readFileSync(
    path.join(__dirname, "template.hbs"),
    "utf-8"
  )
  const template = handlebars.compile(emailTemplateSource);
  const htmlToSend = template({ token: encodeURIComponent(token) });

  try {
    const { data, error } = await resend.emails.send({
      from: "Dinora <onboarding@resend.dev>",
      to: email,
      subject: "Email Verification",
      html: htmlToSend,
    });

    if (error) {
      console.error("🔴 VERIFICATION EMAIL SEND FAILED:", error);
      throw new Error(error.message || "Failed to send verification email");
    }

    console.log("✅ Verification email sent successfully:", data.id);
    return data;
  } catch (err) {
    console.error("🔴 VERIFICATION EMAIL SEND FAILED. Full error:", err);
    throw err;
  }
};

module.exports = verifyMail;

























// const dns = require("dns").promises;
// const nodemailer = require("nodemailer");
// const fs = require('fs');
// const path = require('node:path');
// const handlebars = require('handlebars');

// const verifyMail = async (token, email) => {
//   const emailTemplateSource = fs.readFileSync(
//     path.join(__dirname, "template.hbs"),
//     "utf-8"
//   )
//   const template = handlebars.compile(emailTemplateSource);
//   const htmlToSend = template({token: encodeURIComponent(token)});

//   const addresses = await dns.resolve4("smtp.gmail.com");
//   const ipv4Address = addresses[0];
//   console.log("📧 Resolved Gmail SMTP to IPv4:", ipv4Address);

//   const transporter = nodemailer.createTransport({
//     host: ipv4Address,
//     port: 465,
//     secure: true,
//     tls: {
//       servername: "smtp.gmail.com",
//     },
//     auth: {
//       user: process.env.MAIL_USER,
//       pass: process.env.MAIL_PASSWORD,
//     },
//   });

//   const mailConfigurations = {
//     from: process.env.MAIL_USER,
//     to: email,
//     subject: "Email Verification",
//     html: htmlToSend,
//   }

//   try {
//     const info = await transporter.sendMail(mailConfigurations);
//     console.log("✅ Verification email sent successfully:", info.messageId);
//     return info;
//   } catch (err) {
//     console.error("🔴 VERIFICATION EMAIL SEND FAILED. Full error:", err);
//     console.error("🔴 Error code:", err.code);
//     throw err;
//   }
// };

// module.exports = verifyMail;

























// oldest
// const nodemailer = require("nodemailer");
// // const dotenv = require('dotenv');
// const fs = require('fs');
// const path = require('node:path');
// const { fileURLToPath } = require('node:url');
// const handlebars = require('handlebars');

// // const __filename = fileURLToPath(import.meta.url);
// // const __dirname = path.dirname(__filename);

// // dotenv.config();

// const verifyMail = async (token, email) => {

//   const emailTemplateSource = fs.readFileSync(
//     path.join(__dirname, "template.hbs"),
//     "utf-8"
//   )

//   const template = handlebars.compile(emailTemplateSource);
//   const htmlToSend = template({token: encodeURIComponent(token)});

//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.MAIL_USER,
//       pass: process.env.MAIL_PASSWORD,
//     },
//   });

//   const mailConfigurations = {
//         from: process.env.MAIL_USER,
//         to: email, 
//         subject: "Email Verification", 
//         html: htmlToSend,
//     }

//     transporter.sendMail(mailConfigurations, (err, info) => {
//         if(err){
//             throw new Error(err);
//         }
//         else{
//          console.log('mail sent');
//          console.log(info);
//         }
//     });
// };

// module.exports = verifyMail;