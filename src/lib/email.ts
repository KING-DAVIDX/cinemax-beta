import nodemailer from 'nodemailer'
import { CINEMAX_EMAIL, WHATSAPP_CHANNEL_URL } from '@/lib/site'

const WELCOME_SUBJECT = 'WELCOME MESSAGE'
const NEWSLETTER_SUBJECT = 'NEWSLETTER'

type EmailRecipient = {
  email: string
  name?: string
}

type NewsletterResult = {
  sent: number
  failed: number
}

function getTransporter() {
  const user = process.env.SMTP_USER || CINEMAX_EMAIL
  const pass = process.env.SMTP_PASS

  if (!pass) {
    throw new Error('SMTP_PASS is not configured.')
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  })
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function contentToHtml(content: string) {
  return escapeHtml(content)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim().replace(/\n/g, '<br />'))
    .filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 18px;color:#d8d0c1;font-size:15px;line-height:1.7;">${paragraph}</p>`)
    .join('')
}

function buildEmailShell({
  preheader,
  title,
  intro,
  body,
  ctaLabel,
}: {
  preheader: string
  title: string
  intro: string
  body: string
  ctaLabel: string
}) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#111009;padding:0;font-family:Inter,Arial,sans-serif;color:#ede8dc;">
    <span style="display:none!important;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111009;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border:1px solid #4a4034;border-radius:18px;overflow:hidden;background:#211e19;">
            <tr>
              <td style="background:#1a1814;padding:30px 30px 24px;border-bottom:1px solid #4a4034;">
                <div style="display:inline-block;border:1px solid rgba(201,168,76,0.35);border-radius:999px;padding:7px 12px;color:#c9a84c;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Cinemax</div>
                <h1 style="margin:22px 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.08;color:#ffffff;">${escapeHtml(title)}</h1>
                <p style="margin:0;color:#bdb4a5;font-size:15px;line-height:1.7;">${escapeHtml(intro)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:30px;">
                ${body}
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:26px;">
                  <tr>
                    <td>
                      <a href="${WHATSAPP_CHANNEL_URL}" style="display:inline-block;border-radius:10px;background:#c9a84c;color:#111009;font-size:14px;font-weight:800;text-decoration:none;padding:13px 18px;">${escapeHtml(ctaLabel)}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#1a1814;border-top:1px solid #4a4034;padding:22px 30px;">
                <p style="margin:0 0 8px;color:#a89f90;font-size:12px;line-height:1.6;">You are receiving this because you signed in to Cinemax. Please do not reply to this email.</p>
                <p style="margin:0;color:#6f6252;font-size:12px;line-height:1.6;">Cinemax updates are sent from ${CINEMAX_EMAIL}.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function welcomeHtml(name: string) {
  return buildEmailShell({
    preheader: 'Welcome to Cinemax. You will receive Cinemax newsletters from this email.',
    title: 'Welcome to Cinemax',
    intro: `Hi ${name}, your Cinemax account is ready.`,
    ctaLabel: 'Join the WhatsApp Channel',
    body: `
      <p style="margin:0 0 18px;color:#d8d0c1;font-size:15px;line-height:1.7;">Thanks for joining Cinemax. We will use this email to send newsletters, platform updates, and important announcements about what is new on Cinemax.</p>
      <p style="margin:0 0 18px;color:#d8d0c1;font-size:15px;line-height:1.7;">Please do not reply to this address. For quick updates and community announcements, join the Cinemax WhatsApp channel using the button below.</p>
    `,
  })
}

function welcomeText(name: string) {
  return [
    `Hi ${name}, welcome to Cinemax.`,
    '',
    'You will receive Cinemax newsletters, platform updates, and important announcements from this email address.',
    'Please do not reply to this email.',
    '',
    `Join the Cinemax WhatsApp channel: ${WHATSAPP_CHANNEL_URL}`,
  ].join('\n')
}

function newsletterHtml(content: string) {
  return buildEmailShell({
    preheader: 'A new Cinemax newsletter update is available.',
    title: 'Cinemax Newsletter',
    intro: 'Here is the latest update from Cinemax.',
    ctaLabel: 'Open the WhatsApp Channel',
    body: contentToHtml(content),
  })
}

function newsletterText(content: string) {
  return [
    'Cinemax Newsletter',
    '',
    content.trim(),
    '',
    `Join the Cinemax WhatsApp channel: ${WHATSAPP_CHANNEL_URL}`,
    '',
    'Please do not reply to this email.',
  ].join('\n')
}

export async function sendWelcomeEmail(recipient: EmailRecipient) {
  const transporter = getTransporter()
  const name = recipient.name?.trim() || 'Cinemax User'

  await transporter.sendMail({
    from: `"Cinemax" <${process.env.SMTP_USER || CINEMAX_EMAIL}>`,
    to: recipient.email,
    subject: WELCOME_SUBJECT,
    text: welcomeText(name),
    html: welcomeHtml(name),
  })
}

export async function sendNewsletter(recipients: EmailRecipient[], content: string): Promise<NewsletterResult> {
  const transporter = getTransporter()
  let sent = 0
  let failed = 0

  for (const recipient of recipients) {
    try {
      await transporter.sendMail({
        from: `"Cinemax" <${process.env.SMTP_USER || CINEMAX_EMAIL}>`,
        to: recipient.email,
        subject: NEWSLETTER_SUBJECT,
        text: newsletterText(content),
        html: newsletterHtml(content),
      })
      sent += 1
    } catch {
      failed += 1
    }
  }

  return { sent, failed }
}
