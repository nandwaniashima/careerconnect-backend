

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // Secure port
  secure: true,
  auth: {
    user: "ashimanandwani5@gmail.com", // Your Gmail address
    pass: "vrmgtbobohzjyejl", // Your App Password
  },
});

async function sendMail(to, subject, html) {
  try {
    console.log("Preparing to send email...");
    console.log("Recipient:", to);
    console.log("Subject:", subject);

    const info = await transporter.sendMail({
      from: 'ashimanandwani5@gmail.com', // Sender address
      to: to, // List of recipients
      subject: subject, // Email subject
      html: html, // HTML content
    });

    console.log("Email sent successfully:", info.response);
  } catch (error) {
    console.error("Error occurred while sending email:", error.message);
    console.error("Error details:", error);
  }
}

export default sendMail;
