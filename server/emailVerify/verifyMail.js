const nodemailer = require("nodemailer");
// const dotenv = require('dotenv');
const fs = require('fs');
const path = require('node:path');
const { fileURLToPath } = require('node:url');
const handlebars = require('handlebars');

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// dotenv.config();

const verifyMail = async (token, email) => {

  const emailTemplateSource = fs.readFileSync(
    path.join(__dirname, "template.hbs"),
    "utf-8"
  )

  const template = handlebars.compile(emailTemplateSource);
  const htmlToSend = template({token: encodeURIComponent(token)});

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const mailConfigurations = {
        from: process.env.MAIL_USER,
        to: email, 
        subject: "Email Verification", 
        html: htmlToSend,
    }

    transporter.sendMail(mailConfigurations, (err, info) => {
        if(err){
            throw new Error(err);
        }
        else{
         console.log('mail sent');
         console.log(info);
        }
    });
};

module.exports = verifyMail;