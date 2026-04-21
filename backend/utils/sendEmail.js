import nodemailer from "nodemailer";

const sendEmail = async (to, subject, text) => {
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"CRM Support" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text
  });
};

export default sendEmail;