const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmail = async (email, otp) => {
  try {
    console.log("Sending email to:", email);
    
    const response = await resend.emails.send({
      from: "Locora <noreply@locora.co.in>", 
      to: email,
      subject: "Verify your email - Locora",
      html: `
        <div style="font-family: Arial; text-align: center;">
          <h2>Your OTP is:</h2>
          <h1 style="letter-spacing: 5px;">${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
        </div>
      `,
    });

    console.log("EMAIL RESPONSE:", response); 

  } catch (err) {
    console.error("Email error FULL:", err);
    throw err;
  }
};

module.exports = sendOTPEmail;