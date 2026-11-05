import nodemailer from "nodemailer";

const sendEmail = async (
  to,
  subject,
  text,
  attachments = [],
  html = ""
) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = String(
    process.env.EMAIL_PASS || ""
  ).trim();

  console.log("EMAIL_USER:", emailUser);
  console.log(
    "EMAIL_PASS exists:",
    !!emailPass
  );
  console.log(
    "EMAIL_PASS length:",
    emailPass.length
  );

  const transporter =
    nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

  await transporter.verify();

  const mailOptions = {
    from: `"Conquest Techno Solutions" <${emailUser}>`,
    to,
    subject,
    text,
    attachments
  };

  if (html) {
    mailOptions.html = html;
  }

  await transporter.sendMail(
    mailOptions
  );
};

export default sendEmail;