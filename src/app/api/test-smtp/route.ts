import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  const host = process.env.EMAIL_SERVER_HOST;
  const port = Number(process.env.EMAIL_SERVER_PORT || 587);
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;
  const from = process.env.EMAIL_FROM;

  if (!host || !user || !pass) {
    return NextResponse.json({ error: "Missing EMAIL env vars", host, port, user: !!user, pass: !!pass });
  }

  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transport.verify();

    // Send a real test email
    await transport.sendMail({
      from: from || `Daftar <${user}>`,
      to: user, // send to self
      subject: "SMTP Test from Daftar",
      text: "If you see this, SMTP works from Vercel!",
    });

    return NextResponse.json({ ok: true, message: "SMTP verified and test email sent", host, port });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg, host, port });
  }
}
