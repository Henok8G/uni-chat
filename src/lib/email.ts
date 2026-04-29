import nodemailer from "nodemailer";

type VerificationEmailParams = {
  to: string;
  verifyUrl: string;
};

export async function sendVerificationEmail({ to, verifyUrl }: VerificationEmailParams) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  
  if (!host || !user || !pass) {
    console.log("----------------------------------------------------------------");
    console.warn("[Email] ⚠️ SMTP credentials missing in .env!");
    console.log("[Email] To: ", to);
    console.log("[Email] Link: ", verifyUrl);
    console.log("----------------------------------------------------------------");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  // If OVERRIDE_EMAIL_TO is set, intercept the email and send it to the override
  const overrideEmail = process.env.OVERRIDE_EMAIL_TO;
  const targetEmail = (overrideEmail && overrideEmail.includes('@')) ? overrideEmail : to;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Ethi Uni Chat" <noreply@ethiunichat.com>',
    to: targetEmail,
    subject: "Verify your university email",
    html: `
      <h2>Welcome to Ethi Uni Chat!</h2>
      <p>Click the link below to verify your email address:</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:10px 20px;background:#B0C4DE;color:white;text-decoration:none;border-radius:5px;">
        Verify Email
      </a>
      <p>Or paste this link into your browser:<br/>${verifyUrl}</p>
      <hr/>
      <small>Note: This email was intended for ${to}</small>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("[Email] Verification email sent: %s", info.messageId);
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
  }
}
