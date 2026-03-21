// Invitation email helper using Resend
// Requires RESEND_API_KEY environment variable

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type SendInvitationEmailParams = {
  to: string;
  orgName: string;
  role: string;
  token: string;
  inviterName?: string;
};

export async function sendInvitationEmail({
  to,
  orgName,
  role,
  token,
  inviterName,
}: SendInvitationEmailParams) {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping invitation email to", to);
    return;
  }

  const acceptUrl = `${APP_URL}/accept-invitation/${token}`;
  const inviterLine = inviterName
    ? `${inviterName} has invited you`
    : "You've been invited";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Rainmaker <noreply@rainmaker.app>",
      to,
      subject: `You're invited to join ${orgName} on Rainmaker`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
          <h2 style="color: #282B2B;">Join ${orgName}</h2>
          <p>${inviterLine} to join <strong>${orgName}</strong> as <strong>${role}</strong> on Rainmaker.</p>
          <a href="${acceptUrl}" style="display: inline-block; padding: 12px 24px; background: #EE6C29; color: #fff; text-decoration: none; border-radius: 9999px; font-weight: 600;">Accept invitation</a>
          <p style="margin-top: 24px; font-size: 13px; color: #666;">This invitation expires in 7 days. If you didn't expect this email, you can ignore it.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("[email] Failed to send invitation email:", body);
  }
}
