const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.user_email,
    pass: process.env.user_pass,
  },
});

const sendmail = async (to, subject, html) => {
  await transporter.sendmail({
    from: process.env.user_email,
    to,
    subject,
    html,
  });
};
module.exports = sendmail;
