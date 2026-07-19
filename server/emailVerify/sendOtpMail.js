const nodemailer = require("nodemailer");
const fs = require('fs');
const path = require('node:path');
const { fileURLToPath } = require('node:url');
const handlebars = require('handlebars');

const sendOtpMail = async (email, otp) => {

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const mailOptions = {
        from: process.env.MAIL_USER,
        to: email, 
        subject: "Password Reset OTP", 
        html: `<p> Your OTP for password reset is: <b>${otp}</b>. It is valid for 10 minutes.</p>`,
    }

    transporter.sendMail(mailOptions, (err, info) => {
        if(err){
            throw new Error(err);
        }
        else{
         console.log('otp sent');
         console.log(info);
        }
    });
};

module.exports = sendOtpMail;