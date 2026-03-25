const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const nodemailer = require("nodemailer");

const EMAIL = process.env.EMAIL;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

if (!EMAIL || !EMAIL_PASSWORD) {
  console.error("EMAIL or EMAIL_PASSWORD env vars are missing!");
}

// CREATE TRANSPORTER ONCE
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,              
  secure: false,          
  auth: {
    user: EMAIL,
    pass: EMAIL_PASSWORD,
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.log("❌ SMTP ERROR:", err);
  } else {
    console.log("✅ SMTP READY");
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"LOCORA" <${EMAIL}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent:", info.response);
  } catch (error) {
    console.error("❌ EMAIL ERROR:", error);
    throw error;
  }
};

module.exports = sendEmail;