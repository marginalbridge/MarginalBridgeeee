import type { PublicUser } from "@/types/user";

const ADMIN_NOTIFY_EMAIL =
  process.env.ADMIN_NOTIFY_EMAIL?.trim() || "marginalbridgee@gmail.com";

export function getEmailConfigStatus() {
  const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const hasSmtp = Boolean(smtpUser && smtpPass);

  return {
    adminNotifyEmail: ADMIN_NOTIFY_EMAIL,
    resend: hasResend,
    smtp: hasSmtp,
    smtpUser: smtpUser ? `${smtpUser.slice(0, 3)}***` : null,
    configured: hasResend || hasSmtp,
    hint: hasResend || hasSmtp
      ? "OK"
      : "Vercel env: SMTP_USER + SMTP_PASS veya RESEND_API_KEY ekleyin, sonra redeploy.",
  };
}

function buildRegistrationEmail(user: PublicUser) {
  const providerLabel =
    user.authProvider === "email"
      ? "E-posta / Şifre"
      : user.authProvider === "google"
        ? "Google"
        : user.authProvider === "apple"
          ? "Apple"
          : user.authProvider;

  const subject = `MarginalBridge — Yeni kayıt: ${user.name}`;
  const text = [
    "MarginalBridge'e yeni bir kullanıcı kayıt oldu.",
    "",
    `Ad: ${user.name}`,
    `E-posta: ${user.email}`,
    `Şirket: ${user.company}`,
    `Giriş yöntemi: ${providerLabel}`,
    `Kayıt zamanı: ${new Date(user.createdAt).toLocaleString("tr-TR")}`,
    "",
    "Yönetici paneli: https://www.marginalbridge.com/admin",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;color:#111">
      <h2 style="color:#0d9488;margin:0 0 16px">Yeni kullanıcı kaydı</h2>
      <p>MarginalBridge'e yeni bir kullanıcı kayıt oldu.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;color:#666">Ad</td><td><strong>${escapeHtml(user.name)}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#666">E-posta</td><td>${escapeHtml(user.email)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Şirket</td><td>${escapeHtml(user.company)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Giriş</td><td>${escapeHtml(providerLabel)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Kayıt</td><td>${escapeHtml(new Date(user.createdAt).toLocaleString("tr-TR"))}</td></tr>
      </table>
      <p style="color:#666;font-size:13px">Yönetici paneli: <a href="https://www.marginalbridge.com/admin">marginalbridge.com/admin</a></p>
    </div>
  `;

  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendViaResend(payload: {
  subject: string;
  text: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  const from =
    process.env.EMAIL_FROM?.trim() || "MarginalBridge <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [ADMIN_NOTIFY_EMAIL],
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("[notify-admin] Resend hata:", detail.slice(0, 300));
    return false;
  }

  return true;
}

async function sendViaSmtp(payload: {
  subject: string;
  text: string;
  html: string;
}): Promise<boolean> {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim().replace(/\s/g, "");
  if (!user || !pass) return false;

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });

  const from =
    process.env.EMAIL_FROM?.trim() || `MarginalBridge <${user}>`;

  await transporter.sendMail({
    from,
    to: ADMIN_NOTIFY_EMAIL,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });

  return true;
}

/**
 * Yeni kayıt bildirimi — e-posta / Google / Apple kayıtlarında çağrılır.
 * Kayıt akışını bozmaz; başarılıysa true döner.
 */
export async function notifyAdminNewUser(user: PublicUser): Promise<boolean> {
  try {
    const status = getEmailConfigStatus();
    if (!status.configured) {
      console.warn(
        "[notify-admin] E-posta yapılandırması yok. Yeni kayıt:",
        user.email
      );
      return false;
    }

    const payload = buildRegistrationEmail(user);

    if (await sendViaResend(payload)) {
      console.info("[notify-admin] Resend ile gönderildi:", user.email);
      return true;
    }

    if (await sendViaSmtp(payload)) {
      console.info("[notify-admin] SMTP ile gönderildi:", user.email);
      return true;
    }

    console.error("[notify-admin] Gönderim başarısız:", user.email);
    return false;
  } catch (error) {
    console.error("[notify-admin] Bildirim hatası:", error);
    return false;
  }
}
