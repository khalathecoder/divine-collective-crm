import nodemailer from "nodemailer";

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const host = process.env.PRIVATE_EMAIL_SMTP_HOST;
  const port = Number(process.env.PRIVATE_EMAIL_SMTP_PORT);
  const secure = process.env.PRIVATE_EMAIL_SMTP_SECURE === "true";
  const user = process.env.PRIVATE_EMAIL_SMTP_USER;
  const pass = process.env.PRIVATE_EMAIL_SMTP_PASSWORD;

  if (!host || !port || !user || !pass) {
    throw new Error(
      "Email is not configured. Set PRIVATE_EMAIL_SMTP_HOST/PORT/SECURE/USER/PASSWORD."
    );
  }

  transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  return transporter;
}

export async function sendEmail(message: OutgoingEmail): Promise<void> {
  const from = process.env.PRIVATE_EMAIL_FROM;
  if (!from) throw new Error("PRIVATE_EMAIL_FROM is not set");

  await getTransporter().sendMail({
    from,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text ?? htmlToText(message.html),
  });
}

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}
