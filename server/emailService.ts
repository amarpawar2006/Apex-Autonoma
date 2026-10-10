import nodemailer from 'nodemailer';
import { TransactionalEmailConfig } from '../src/types/auth.js';

export interface SendInviteParams {
  toEmail: string;
  toName: string;
  companyName: string;
  inviterName: string;
  role: 'COMPANY_ADMIN' | 'MEMBER';
  inviteLink: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
  previewOnly?: boolean;
  inviteStatus?: 'SENT' | 'FAILED' | 'PREVIEW_ONLY';
  provider: 'resend' | 'smtp' | 'system_preview';
}

export function isMaskedSecret(value?: string): boolean {
  if (!value) return false;
  return value.includes('••••') ||
         value.includes('(Server Secret)') ||
         value.includes('SERVER_SECRET');
}

export class TransactionalEmailService {
  private config: TransactionalEmailConfig = {
    provider: 'system',
    status: 'CONFIGURED'
  };

  constructor(initialConfig?: TransactionalEmailConfig) {
    if (initialConfig) {
      this.setConfig(initialConfig);
    }
  }

  public setConfig(cfg: TransactionalEmailConfig) {
    const cleanCfg: TransactionalEmailConfig = { ...cfg };
    if (isMaskedSecret(cleanCfg.resendApiKey)) {
      delete cleanCfg.resendApiKey;
    }
    if (isMaskedSecret(cleanCfg.smtpPass)) {
      delete cleanCfg.smtpPass;
    }
    this.config = { ...this.config, ...cleanCfg };
    // Defensively ensure internal config never retains masked strings
    if (isMaskedSecret(this.config.resendApiKey)) {
      delete this.config.resendApiKey;
    }
    if (isMaskedSecret(this.config.smtpPass)) {
      delete this.config.smtpPass;
    }
  }

  public getConfig(): TransactionalEmailConfig {
    const hasResendSecret = Boolean(process.env.RESEND_API_KEY);
    const hasWorkspaceKey = Boolean(this.config.resendApiKey && !isMaskedSecret(this.config.resendApiKey));
    const isConfigured = hasWorkspaceKey || hasResendSecret || Boolean(this.config.smtpHost);
    const source: 'server_secret' | 'workspace_override' | 'unconfigured' = hasWorkspaceKey
      ? 'workspace_override'
      : hasResendSecret
      ? 'server_secret'
      : 'unconfigured';

    const effectiveFrom =
      this.config.smtpFrom ||
      process.env.SMTP_FROM ||
      'Autonoma <onboarding@apex-engineering.co.in>';

    return {
      ...this.config,
      provider: this.config.provider === 'system' && (hasWorkspaceKey || hasResendSecret) ? 'resend' : this.config.provider,
      status: isConfigured ? 'CONFIGURED' : 'UNCONFIGURED',
      source,
      smtpFrom: effectiveFrom,
      // Mask credentials for client security
      resendApiKey: hasWorkspaceKey
        ? `re_••••${this.config.resendApiKey!.slice(-4)}`
        : hasResendSecret
        ? '•••••••• (Server Secret)'
        : undefined,
      hasResendKey: Boolean(hasWorkspaceKey || hasResendSecret),
      smtpPass: this.config.smtpPass ? '••••••••' : undefined,
      hasSmtpPass: Boolean(this.config.smtpPass || process.env.SMTP_PASS)
    };
  }

  public getRawConfig(): TransactionalEmailConfig {
    return this.config;
  }

  /**
   * Dispatches a branded workspace invitation email
   */
  public async sendWorkspaceInvite(params: SendInviteParams): Promise<EmailDeliveryResult> {
    const { toEmail, toName, companyName, inviterName, role, inviteLink } = params;
    const roleLabel = role === 'COMPANY_ADMIN' ? 'Company Administrator' : 'Team Member';

    const subject = `You've been invited to join ${companyName} on Autonoma`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0B0E; color: #E5E7EB; margin: 0; padding: 40px 20px; }
    .container { max-width: 560px; margin: 0 auto; background-color: #14161B; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 36px; }
    .header { margin-bottom: 24px; text-align: center; }
    .brand { display: inline-block; font-size: 14px; font-weight: 800; letter-spacing: 0.12em; color: #FFFFFF; }
    .badge { display: inline-block; padding: 4px 10px; background-color: rgba(255, 69, 0, 0.12); color: #FF4500; font-size: 11px; font-weight: 700; border-radius: 9999px; margin-bottom: 12px; }
    h1 { font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 0 0 16px 0; line-height: 1.3; text-align: center; }
    p { font-size: 14px; line-height: 1.6; color: #9CA3AF; margin: 0 0 16px 0; }
    .cta-container { text-align: center; margin: 32px 0; }
    .cta-btn { display: inline-block; background-color: #FF4500; color: #FFFFFF !important; font-size: 14px; font-weight: 600; padding: 12px 28px; text-decoration: none; border-radius: 12px; }
    .card { background-color: #0D0E12; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 16px; margin: 24px 0; }
    .card-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; }
    .card-label { color: #6B7280; }
    .card-val { color: #F3F4F6; font-weight: 600; }
    .footer { border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; font-size: 11px; color: #6B7280; text-align: center; }
    .raw-link { word-break: break-all; color: #FF4500; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">AUTONOMA WORKSPACE INVITATION</div>
      <div class="brand">APEX AUTONOMA</div>
    </div>
    <h1>Join ${companyName}</h1>
    <p>Hello <strong>${toName || toEmail}</strong>,</p>
    <p><strong>${inviterName || 'A workspace administrator'}</strong> has invited you to collaborate in the <strong>${companyName}</strong> workspace on Autonoma as a <strong>${roleLabel}</strong>.</p>
    
    <div class="card">
      <div class="card-row"><span class="card-label">Workspace:</span><span class="card-val">${companyName}</span></div>
      <div class="card-row"><span class="card-label">Assigned Role:</span><span class="card-val">${roleLabel}</span></div>
      <div class="card-row" style="margin-bottom:0;"><span class="card-label">Invited Email:</span><span class="card-val">${toEmail}</span></div>
    </div>

    <div class="cta-container">
      <a href="${inviteLink}" class="cta-btn">Accept Invitation & Join Workspace</a>
    </div>

    <p style="font-size: 12px; color: #6B7280;">If the button above does not work, copy and paste this link into your browser:</p>
    <p class="raw-link">${inviteLink}</p>

    <div class="footer">
      Sent with care by Apex Autonoma · Autonomous Creative & Multi-Tenant Social Engine
    </div>
  </div>
</body>
</html>
    `;

    return this.dispatchEmail({
      to: toEmail,
      subject,
      html,
      text: `Hello ${toName},\n\nYou have been invited to join ${companyName} as a ${roleLabel} on Autonoma.\n\nAccept your invitation: ${inviteLink}\n`
    });
  }

  /**
   * Internal dispatcher routing to Resend, SMTP, or System Preview.
   * NEVER marks preview generation as real delivery success.
   */
  public async dispatchEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<EmailDeliveryResult> {
    const workspaceKey =
      this.config.resendApiKey && !isMaskedSecret(this.config.resendApiKey)
        ? this.config.resendApiKey
        : undefined;
    const resendKey = workspaceKey || process.env.RESEND_API_KEY;
    const smtpHost = this.config.smtpHost || process.env.SMTP_HOST;

    // 1. Priority 1: RESEND API if configured
    if (this.config.provider === 'resend' || (resendKey && this.config.provider !== 'smtp')) {
      try {
        const normalizedRecipient = options.to.trim().toLowerCase();
        console.log(`[Email Service] Dispatching via Resend to ${normalizedRecipient}...`);
        const fromAddress =
          this.config.smtpFrom ||
          process.env.SMTP_FROM ||
          'Autonoma <onboarding@apex-engineering.co.in>';

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [normalizedRecipient],
            subject: options.subject,
            html: options.html,
            text: options.text
          })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const errMsg = data?.message || `Resend API failed with status ${res.status}`;
          console.warn('[Email Service] Resend delivery failed:', errMsg);
          return {
            success: false,
            inviteStatus: 'FAILED',
            provider: 'resend',
            error: errMsg
          };
        }

        console.log(`[Email Service] Resend dispatch successful, id: ${data.id}`);
        return {
          success: true,
          inviteStatus: 'SENT',
          provider: 'resend',
          messageId: data.id
        };
      } catch (err: any) {
        console.warn('[Email Service] Resend dispatch error:', err?.message);
        return {
          success: false,
          inviteStatus: 'FAILED',
          provider: 'resend',
          error: `Resend delivery failed: ${err?.message || 'Network error'}`
        };
      }
    }

    // 2. Priority 2: Standard SMTP Transport if configured
    if (smtpHost) {
      try {
        console.log(`[Email Service] Dispatching via SMTP (${smtpHost}) to ${options.to}...`);
        const pass =
          (this.config.smtpPass && !isMaskedSecret(this.config.smtpPass) ? this.config.smtpPass : undefined) ||
          process.env.SMTP_PASS ||
          '';
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(this.config.smtpPort || process.env.SMTP_PORT || 587),
          secure: Boolean(this.config.smtpSecure || process.env.SMTP_SECURE === 'true'),
          auth: {
            user: this.config.smtpUser || process.env.SMTP_USER || '',
            pass
          }
        });

        const fromAddress =
          this.config.smtpFrom ||
          process.env.SMTP_FROM ||
          'Autonoma <onboarding@apex-engineering.co.in>';

        const info = await transporter.sendMail({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text
        });

        console.log(`[Email Service] SMTP dispatch successful, messageId: ${info.messageId}`);
        return {
          success: true,
          inviteStatus: 'SENT',
          provider: 'smtp',
          messageId: info.messageId
        };
      } catch (err: any) {
        console.warn('[Email Service] SMTP delivery error:', err?.message);
        return {
          success: false,
          inviteStatus: 'FAILED',
          provider: 'smtp',
          error: `SMTP delivery failed: ${err?.message || 'SMTP connection failed'}`
        };
      }
    }

    // 3. Fallback: Ethereal test transporter for local preview generation ONLY.
    // Explicitly returned with success=false, previewOnly=true per production release gate.
    try {
      console.log(`[Email Service] No live SMTP/Resend configured. Generating preview for ${options.to}...`);
      const testAccount = await nodemailer.createTestAccount();
      const testTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      const info = await testTransporter.sendMail({
        from: '"Autonoma Invites" <invites@autonoma.internal>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      });

      const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
      console.log(`[Email Service] Preview generated (NOT real delivery). Preview URL: ${previewUrl}`);

      return {
        success: false,
        previewOnly: true,
        inviteStatus: 'PREVIEW_ONLY',
        provider: 'system_preview',
        messageId: info.messageId,
        previewUrl,
        error: 'Automatic invitation email was not delivered. Access has been provisioned. Please share the invite link manually.'
      };
    } catch (fallbackErr: any) {
      console.error('[Email Service] System preview delivery error:', fallbackErr?.message);
      return {
        success: false,
        previewOnly: true,
        inviteStatus: 'FAILED',
        provider: 'system_preview',
        error: 'Automatic invitation email was not delivered. Access has been provisioned. Please share the invite link manually.'
      };
    }
  }

  /**
   * Tests connection for current or provided configuration
   */
  public async testConnection(targetEmail: string, testCfg?: TransactionalEmailConfig): Promise<{
    success: boolean;
    provider: string;
    message: string;
    latencyMs?: number;
  }> {
    const startTime = Date.now();
    const cfgToUse = testCfg || this.config;

    try {
      if (cfgToUse.provider === 'resend') {
        const providedKey =
          cfgToUse.resendApiKey && !isMaskedSecret(cfgToUse.resendApiKey)
            ? cfgToUse.resendApiKey
            : undefined;

        const workspaceKey =
          this.config.resendApiKey && !isMaskedSecret(this.config.resendApiKey)
            ? this.config.resendApiKey
            : undefined;

        const key =
          providedKey ||
          workspaceKey ||
          process.env.RESEND_API_KEY;

        if (!key) throw new Error('Resend API key is not configured');

        const from =
          cfgToUse.smtpFrom ||
          this.config.smtpFrom ||
          process.env.SMTP_FROM ||
          'Autonoma <onboarding@resend.dev>';

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from,
            to: [targetEmail],
            subject: 'Autonoma Email Delivery Test',
            html: '<p>This is a test email confirming transactional email delivery is functioning.</p>'
          })
        });
        const latencyMs = Date.now() - startTime;
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || `Resend API HTTP ${res.status}`);
        }
        return {
          success: true,
          provider: 'resend',
          message: 'Resend transactional email sent successfully!',
          latencyMs
        };
      }

      if (cfgToUse.provider === 'smtp') {
        const host = cfgToUse.smtpHost || this.config.smtpHost || process.env.SMTP_HOST;
        if (!host) throw new Error('SMTP Host is required');
        const pass =
          (cfgToUse.smtpPass && !isMaskedSecret(cfgToUse.smtpPass) ? cfgToUse.smtpPass : undefined) ||
          (this.config.smtpPass && !isMaskedSecret(this.config.smtpPass) ? this.config.smtpPass : undefined) ||
          process.env.SMTP_PASS ||
          '';
        const transporter = nodemailer.createTransport({
          host,
          port: Number(cfgToUse.smtpPort || 587),
          secure: Boolean(cfgToUse.smtpSecure),
          auth: {
            user: cfgToUse.smtpUser || this.config.smtpUser || '',
            pass
          }
        });
        await transporter.verify();
        const latencyMs = Date.now() - startTime;
        return {
          success: true,
          provider: 'smtp',
          message: `Connected to SMTP server (${host}) successfully!`,
          latencyMs
        };
      }

      // Default System Test
      const testAccount = await nodemailer.createTestAccount();
      const latencyMs = Date.now() - startTime;
      return {
        success: true,
        provider: 'system_preview',
        message: `System test email account generated (${testAccount.user}). Transactional delivery operational!`,
        latencyMs
      };
    } catch (err: any) {
      return {
        success: false,
        provider: cfgToUse.provider,
        message: err?.message || 'Connection test failed'
      };
    }
  }
}

export const emailService = new TransactionalEmailService();
