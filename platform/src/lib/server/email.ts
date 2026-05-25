import { BrevoClient } from '@getbrevo/brevo';
import { BREVO_API_KEY, EMAIL_FROM } from '$env/static/private';

export type EmailResult = { success: boolean; error?: string };

const brevo = new BrevoClient({ apiKey: BREVO_API_KEY });

function parseFrom(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: 'Thalium', email: from };
}

export async function sendInvitationEmail(params: {
  toEmail: string;
  orgName: string;
  inviterEmail: string;
  role: string;
  inviteUrl: string;
}): Promise<EmailResult> {
  try {
    const sender = parseFrom(EMAIL_FROM);
    await brevo.transactionalEmails.sendTransacEmail({
      sender,
      to: [{ email: params.toEmail }],
      subject: `You've been invited to ${params.orgName} on Thalium`,
      htmlContent: `<div style="background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:20px"><div style="background-color:#111111;border:1px solid #1f1f1f;border-radius:8px;padding:40px;max-width:560px;margin:40px auto"><h1 style="font-size:24px;font-weight:600;color:#ffffff;margin-bottom:16px">You've been invited to join ${params.orgName}</h1><p style="font-size:15px;color:#a0a0a0;line-height:1.6">${params.inviterEmail} has invited you to join ${params.orgName} on Thalium as a ${params.role}.</p><p style="font-size:15px;color:#a0a0a0;line-height:1.6">Thalium is a Brain-as-a-Service platform — persistent, trainable intelligence for your applications.</p><div style="margin:32px 0"><a href="${params.inviteUrl}" style="display:inline-block;background-color:#ffffff;color:#0a0a0a;padding:12px 24px;border-radius:6px;font-weight:600;text-decoration:none;font-size:14px">Accept Invitation</a></div><p style="font-size:13px;color:#555555;margin-top:32px">If you did not expect this invitation, you can safely ignore this email.</p></div></div>`,
      textContent: `You've been invited to join ${params.orgName} on Thalium as a ${params.role} by ${params.inviterEmail}.\n\nAccept the invitation at: ${params.inviteUrl}\n\nIf you did not expect this invitation, you can safely ignore this email.`
    });
    return { success: true };
  } catch (error) {
    console.error('sendInvitationEmail failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendWelcomeEmail(params: {
  toEmail: string;
  orgName: string;
  instanceName: string;
}): Promise<EmailResult> {
  try {
    const sender = parseFrom(EMAIL_FROM);
    await brevo.transactionalEmails.sendTransacEmail({
      sender,
      to: [{ email: params.toEmail }],
      subject: 'Welcome to Thalium — your Brain Instance is ready',
      htmlContent: `<div style="background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:20px"><div style="background-color:#111111;border:1px solid #1f1f1f;border-radius:8px;padding:40px;max-width:560px;margin:40px auto"><h1 style="font-size:24px;font-weight:600;color:#ffffff;margin-bottom:16px">Your Brain Instance is ready</h1><p style="font-size:15px;color:#a0a0a0;line-height:1.6">Welcome to Thalium, ${params.orgName}. Your first Brain Instance (${params.instanceName}) has been created and is ready to configure.</p><ul style="margin:24px 0;padding-left:0"><li style="color:#a0a0a0;font-size:15px;line-height:1.8;list-style:none;padding-left:0">Persistent memory — your Brain learns from every invocation</li><li style="color:#a0a0a0;font-size:15px;line-height:1.8;list-style:none;padding-left:0">Structured intelligence — 11 intent types, deterministic classification</li><li style="color:#a0a0a0;font-size:15px;line-height:1.8;list-style:none;padding-left:0">Full control — configure roles, guardrails, and memory from your dashboard</li></ul><div style="margin:32px 0"><a href="https://thalium.io/app/instances" style="display:inline-block;background-color:#ffffff;color:#0a0a0a;padding:12px 24px;border-radius:6px;font-weight:600;text-decoration:none;font-size:14px">Go to your dashboard</a></div><p style="font-size:13px;color:#555555;margin-top:32px">You are receiving this because you signed up at thalium.io</p></div></div>`,
      textContent: `Welcome to Thalium, ${params.orgName}.\n\nYour first Brain Instance (${params.instanceName}) has been created and is ready to configure.\n\n- Persistent memory — your Brain learns from every invocation\n- Structured intelligence — 11 intent types, deterministic classification\n- Full control — configure roles, guardrails, and memory from your dashboard\n\nGo to your dashboard: https://thalium.io/app/instances\n\nYou are receiving this because you signed up at thalium.io`
    });
    return { success: true };
  } catch (error) {
    console.error('sendWelcomeEmail failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}