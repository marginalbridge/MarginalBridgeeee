import { getEmailConfigStatus } from "@/lib/email/notify-admin";
import { NextResponse } from "next/server";

export async function GET() {
  const email = getEmailConfigStatus();
  return NextResponse.json({
    email,
    steps: [
      "Vercel → Settings → Environment Variables",
      "SMTP_USER=marginalbridgee@gmail.com",
      "SMTP_PASS=Gmail uygulama şifresi (boşluksuz 16 karakter)",
      "ADMIN_NOTIFY_EMAIL=marginalbridgee@gmail.com",
      "Kaydet → Redeploy",
      "Test: yeni kullanıcı kaydı yapın",
    ],
  });
}
