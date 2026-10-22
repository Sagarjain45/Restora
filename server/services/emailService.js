import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

/**
 * Email Service for Restora Platform
 * Handles transactional emails for:
 * 1. Application Submission (includes Status Tracking Reference ID)
 * 2. Application Approval (Congratulations & Launch credentials)
 * 3. Application Rejection (with compliance feedback)
 */

let cachedTransporter = null;

const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
    return cachedTransporter;
  }

  // Fallback to ethereal / development simulation transporter
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('[EmailService] ⚠️  No SMTP credentials in .env. Using Ethereal test mail account for development simulations.');
    console.log('[EmailService] ℹ️  To deliver real emails to actual inboxes, configure SMTP_HOST, SMTP_USER, and SMTP_PASS in server/.env');
    return cachedTransporter;
  } catch (err) {
    console.warn('[EmailService] Could not connect to Ethereal, falling back to simulated logger mode:', err.message);
    cachedTransporter = {
      sendMail: async (options) => {
        console.log('\n================== [SIMULATED EMAIL DISPATCH] ==================');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`From: ${options.from}`);
        console.log('----------------------------------------------------------------');
        console.log(options.text || '(HTML Email Content Dispatched)');
        console.log('================================================================\n');
        return { messageId: `simulated-${Date.now()}` };
      },
    };
    return cachedTransporter;
  }
};

/**
 * Base email layout wrapper with modern Restora dark glassmorphism styling
 */
const renderEmailLayout = ({ title, preheader, contentHtml }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #090d16;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #090d16;
      padding: 40px 15px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
      padding: 30px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .brand-logo {
      display: inline-block;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #ffffff;
      text-decoration: none;
    }
    .brand-sub {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: 4px;
    }
    .content {
      padding: 35px 30px;
      line-height: 1.6;
    }
    .highlight-card {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 28px;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
      margin: 20px 0;
      text-align: center;
    }
    .btn-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
    }
    .footer {
      background: #090d16;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .footer a {
      color: #818cf8;
      text-decoration: none;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-amber {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .badge-green {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader || title}
  </div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand-logo">🍽️ RESTORA</div>
        <div class="brand-sub">Restaurant Operations Platform</div>
      </div>
      <div class="content">
        ${contentHtml}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px;">Restora Cloud Operating System for Restaurants & Dine-In Establishments</p>
        <p style="margin: 0;">This is an automated system notification. Please do not reply directly to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * 1. Send Registration Submitted Confirmation with Application Tracking ID
 */
export const sendApplicationSubmittedEmail = async ({
  applicantEmail,
  applicantName,
  restaurantName,
  applicationId,
  fssaiNumber,
  city,
  state,
}) => {
  try {
    const transporter = await getTransporter();
    const trackingUrl = `${env.CLIENT_URL}/auth/register?track=${applicationId}`;

    const contentHtml = `
      <div style="margin-bottom: 20px;">
        <span class="badge badge-amber">Application Submitted</span>
      </div>
      <h1 style="font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 12px;">
        Registration Received for ${restaurantName}
      </h1>
      <p style="color: #cbd5e1; font-size: 15px; margin: 0 0 16px;">
        Hi <strong>${applicantName}</strong>,
      </p>
      <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px;">
        Thank you for submitting your restaurant onboarding request on <strong>Restora</strong>. Your application has been logged into our platform and is currently in the review queue for administrator verification.
      </p>

      <div class="highlight-card">
        <div style="font-size: 11px; text-transform: uppercase; color: #818cf8; font-weight: 700; letter-spacing: 0.08em; margin-bottom: 6px;">
          YOUR STATUS TRACKING REFERENCE ID
        </div>
        <div style="font-family: monospace; font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: 0.05em; margin-bottom: 15px;">
          ${applicationId}
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1;">
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Restaurant:</td>
            <td style="padding: 4px 0; font-weight: 600; color: #f1f5f9;">${restaurantName}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Location:</td>
            <td style="padding: 4px 0; color: #f1f5f9;">${city}, ${state}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">FSSAI License:</td>
            <td style="padding: 4px 0; font-family: monospace; color: #34d399; font-weight: 700;">${fssaiNumber || 'Submitted'}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Current Status:</td>
            <td style="padding: 4px 0; color: #fbbf24; font-weight: 700;">PENDING ADMIN VERIFICATION</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center;">
        <a href="${trackingUrl}" class="btn" target="_blank">
          Track Your Approval Status Online
        </a>
      </div>

      <div style="margin-top: 25px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px;">
        <div style="font-size: 13px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">What Happens Next?</div>
        <ol style="font-size: 13px; color: #94a3b8; padding-left: 18px; margin: 0; line-height: 1.6;">
          <li>Our compliance team verifies your FSSAI food safety license and location details.</li>
          <li>Once approved, you will immediately receive a <strong>Congratulations & Access Email</strong>.</li>
          <li>Your restaurant floor and dining tables will be active so you can log in and start operations right away.</li>
        </ol>
      </div>
    `;

    const mailOptions = {
      from: env.EMAIL_FROM,
      to: applicantEmail,
      subject: `🍽️ Application Received: Status Tracking ID for ${restaurantName}`,
      html: renderEmailLayout({
        title: `Application Received - ${restaurantName}`,
        preheader: `Your restaurant application for ${restaurantName} has been submitted. Status Tracking ID: ${applicationId}`,
        contentHtml,
      }),
      text: `Hi ${applicantName},\n\nYour application for ${restaurantName} has been received on Restora.\n\nYour Status Tracking Reference ID: ${applicationId}\nFSSAI License: ${fssaiNumber}\nStatus: PENDING ADMIN VERIFICATION\n\nYou can track your approval status online at: ${trackingUrl}\n\nThank you,\nRestora Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[EmailService] Application submitted email sent to ${applicantEmail}. MessageId: ${info.messageId}`);
    if (previewUrl) {
      console.log(`[EmailService] 🔗 Preview Email Online (Ethereal): ${previewUrl}`);
    }
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error(`[EmailService Error] Failed to send submission email to ${applicantEmail}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * 2. Send Congratulations / Approval Email when Admin Accepts Restaurant
 */
export const sendApplicationApprovedEmail = async ({
  applicantEmail,
  applicantName,
  restaurantName,
  loginEmail,
  subscriptionPlan = 'BASIC',
}) => {
  try {
    const transporter = await getTransporter();
    const loginUrl = `${env.CLIENT_URL}/auth/login`;

    const contentHtml = `
      <div style="margin-bottom: 20px;">
        <span class="badge badge-green">Restaurant Approved & Active</span>
      </div>
      <h1 style="font-size: 24px; font-weight: 800; color: #ffffff; margin: 0 0 12px;">
        🎉 Congratulations! ${restaurantName} is Live!
      </h1>
      <p style="color: #cbd5e1; font-size: 15px; margin: 0 0 16px;">
        Dear <strong>${applicantName}</strong>,
      </p>
      <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px;">
        We are thrilled to let you know that your restaurant <strong>${restaurantName}</strong> has been officially verified and accepted on the <strong>Restora</strong> platform. Your food safety credentials have been validated, your tenant environment is fully provisioned, and your floor operations are ready!
      </p>

      <div class="highlight-card" style="border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.05);">
        <div style="font-size: 11px; text-transform: uppercase; color: #34d399; font-weight: 700; letter-spacing: 0.08em; margin-bottom: 10px;">
          YOUR RESTAURANT PORTAL CREDENTIALS
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Sign-In URL:</td>
            <td style="padding: 6px 0;"><a href="${loginUrl}" style="color: #818cf8; text-decoration: none; font-weight: 600;">${loginUrl}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Login Email:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #ffffff;">${loginEmail || applicantEmail}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Password:</td>
            <td style="padding: 6px 0; color: #cbd5e1;">Your chosen password set during registration</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Plan Assigned:</td>
            <td style="padding: 6px 0; color: #38bdf8; font-weight: 700;">${subscriptionPlan}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Status:</td>
            <td style="padding: 6px 0; color: #34d399; font-weight: 700;">ACTIVE & GOOD TO GO</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center;">
        <a href="${loginUrl}" class="btn btn-success" target="_blank">
          Launch Your Restaurant Operations Portal →
        </a>
      </div>

      <div style="margin-top: 25px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px;">
        <div style="font-size: 13px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">What You Can Do Right Away:</div>
        <ul style="font-size: 13px; color: #94a3b8; padding-left: 18px; margin: 0; line-height: 1.6;">
          <li><strong>Dining Room Tables:</strong> Starter tables (T-01 to T-04) are already created for you. Add or customize more sections anytime.</li>
          <li><strong>Digital Menu:</strong> Populate your categories, signature dishes, and prices.</li>
          <li><strong>POS & Billing:</strong> Take guest orders, split bills, and print settled invoices in real time.</li>
          <li><strong>Staff Management:</strong> Create secure employee logins for your floor waitstaff and kitchen leads.</li>
        </ul>
      </div>
    `;

    const mailOptions = {
      from: env.EMAIL_FROM,
      to: applicantEmail,
      subject: `🎉 Congratulations! ${restaurantName} has been Approved on Restora`,
      html: renderEmailLayout({
        title: `Restaurant Approved - ${restaurantName}`,
        preheader: `Congratulations! ${restaurantName} is approved and active on Restora. Sign in with ${loginEmail || applicantEmail}.`,
        contentHtml,
      }),
      text: `Congratulations ${applicantName}!\n\nYour restaurant ${restaurantName} has been approved by platform administration.\n\nSign in here: ${loginUrl}\nLogin Email: ${loginEmail || applicantEmail}\nPassword: The password you set during registration\nStatus: ACTIVE\n\nWelcome to Restora!\nRestora Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[EmailService] Approval email sent to ${applicantEmail}. MessageId: ${info.messageId}`);
    if (previewUrl) {
      console.log(`[EmailService] 🔗 Preview Email Online (Ethereal): ${previewUrl}`);
    }
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error(`[EmailService Error] Failed to send approval email to ${applicantEmail}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * 3. Send Rejection Email with feedback (if application could not be verified)
 */
export const sendApplicationRejectedEmail = async ({
  applicantEmail,
  applicantName,
  restaurantName,
  rejectionReason,
}) => {
  try {
    const transporter = await getTransporter();
    const applyUrl = `${env.CLIENT_URL}/auth/register`;

    const contentHtml = `
      <div style="margin-bottom: 20px;">
        <span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);">
          Application Status Update
        </span>
      </div>
      <h1 style="font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 12px;">
        Onboarding Update for ${restaurantName}
      </h1>
      <p style="color: #cbd5e1; font-size: 15px; margin: 0 0 16px;">
        Hi <strong>${applicantName}</strong>,
      </p>
      <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px;">
        Thank you for your interest in joining Restora. Our platform administration team has reviewed the onboarding details submitted for <strong>${restaurantName}</strong>. At this time, we are unable to approve this application.
      </p>

      <div class="highlight-card" style="border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.08);">
        <div style="font-size: 11px; text-transform: uppercase; color: #f87171; font-weight: 700; letter-spacing: 0.08em; margin-bottom: 6px;">
          REASON FOR REJECTION
        </div>
        <div style="font-size: 14px; color: #fecaca; line-height: 1.5;">
          ${rejectionReason || 'The submitted restaurant details or FSSAI license credentials could not be validated.'}
        </div>
      </div>

      <p style="color: #94a3b8; font-size: 14px;">
        If you have corrected the details or have valid documentation, you are welcome to submit an updated application.
      </p>

      <div style="text-align: center;">
        <a href="${applyUrl}" class="btn" target="_blank">
          Submit Updated Application
        </a>
      </div>
    `;

    const mailOptions = {
      from: env.EMAIL_FROM,
      to: applicantEmail,
      subject: `Update regarding your restaurant application for ${restaurantName}`,
      html: renderEmailLayout({
        title: `Application Update - ${restaurantName}`,
        preheader: `Update regarding your onboarding application for ${restaurantName}.`,
        contentHtml,
      }),
      text: `Hi ${applicantName},\n\nYour application for ${restaurantName} could not be approved at this time.\n\nReason: ${rejectionReason}\n\nYou can re-apply with updated details at: ${applyUrl}\n\nRestora Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[EmailService] Rejection email sent to ${applicantEmail}. MessageId: ${info.messageId}`);
    if (previewUrl) {
      console.log(`[EmailService] 🔗 Preview Email Online (Ethereal): ${previewUrl}`);
    }
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error(`[EmailService Error] Failed to send rejection email to ${applicantEmail}:`, err.message);
    return { success: false, error: err.message };
  }
};
