// const nodemailer = require("nodemailer");
// require("dotenv").config();

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// const sendEmail = async (to, subject, html) => {
//   try {
//     await transporter.sendMail({
//       from: `"HTAAQ Admin" <${process.env.EMAIL_USER}>`,
//       to,
//       subject,
//       html,
//     });
//     console.log("Email sent to:", to);
//   } catch (err) {
//     console.error("Email error:", err);
//   }
// };

// module.exports = { sendEmail };

const sgMail = require("@sendgrid/mail");
require("dotenv").config();

// Set API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, html) => {
  try {
    const msg = {
      to: to,
      from: {
        email: process.env.SENDER_EMAIL,
        name: "HTAAQ Admin",
      },
      subject: subject,
      html: html,
    };

    const response = await sgMail.send(msg);
    console.log("Email sent successfully to:", to);
    console.log("SendGrid Response:", response[0].statusCode);

    return { success: true, messageId: response[0].headers["x-message-id"] };
  } catch (err) {
    console.error("Email sending failed:");
    console.error("Error:", err.message);

    if (err.response) {
      console.error("SendGrid Error Body:", err.response.body);
    }

    return { success: false, error: err.message };
  }
};

module.exports = { sendEmail };
