require("dotenv").config();
const sendEmail = require("./sendEmail");

(async () => {
  try {
    await sendEmail("jaiswalkavya7676@gmail.com", "Test OTP", "<h1>Hello OTP</h1>");
    console.log("Test email sent successfully!");
  } catch (err) {
    console.error("Test email failed:", err);
  }
})();