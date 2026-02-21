/**
 * Branded OTP email template aligned with Behalix theme.
 * Brand colors: #FF4D6D (pink), #FF8C42 (orange), #00C9A7 (teal).
 * No logo image – text-only header so it works in all email clients.
 */

const BRAND = {
  pink: '#FF4D6D',
  orange: '#FF8C42',
  teal: '#00C9A7',
  dark: '#1a1a2e',
  gray: '#64748b',
  lightBg: '#f8fafc',
};

export function getOTPEmailHtml(code: string): string {
  const appUrl = (process.env.FRONTEND_URL || process.env.APP_URL || '').replace(/\/$/, '');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your verification code – BeHalix</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.lightBg};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${BRAND.lightBg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
          <!-- Header: BeHalix name in brand gradient (no logo – works everywhere) -->
          <tr>
            <td style="background:linear-gradient(135deg, ${BRAND.pink} 0%, ${BRAND.orange} 50%, ${BRAND.teal} 100%);padding:28px 32px 24px;text-align:center;">
              <span style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">BeHalix</span>
            </td>
          </tr>
          <!-- Welcome body -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${BRAND.dark};line-height:1.3;">
                Welcome to BeHalix
              </h1>
              <p style="margin:0 0 24px;font-size:16px;color:${BRAND.gray};line-height:1.5;">
                We're glad you're here. Use the code below to verify your email and get started. It expires in <strong>10 minutes</strong>.
              </p>
              <!-- OTP box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:20px 0;">
                    <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:8px;color:${BRAND.dark};background:${BRAND.lightBg};border:2px solid #e2e8f0;border-radius:12px;padding:16px 24px;">
                      ${code}
                    </span>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:14px;color:${BRAND.gray};line-height:1.5;">
                If you didn't request this code, you can safely ignore this email.
              </p>

              <!-- Testimonials / social proof -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:28px;background:${BRAND.lightBg};border-radius:12px;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:${BRAND.dark};text-transform:uppercase;letter-spacing:0.05em;">What people say about BeHalix</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
                          <p style="margin:0;font-size:14px;color:${BRAND.dark};line-height:1.5;font-style:italic;">&ldquo;Finally a place to host my community events without the hassle. So easy to use!&rdquo;</p>
                          <p style="margin:6px 0 0;font-size:12px;color:${BRAND.gray};">— Event host</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0 0;">
                          <p style="margin:0;font-size:14px;color:${BRAND.dark};line-height:1.5;font-style:italic;">&ldquo;I found my first meetup in a week. The people here actually show up.&rdquo;</p>
                          <p style="margin:6px 0 0;font-size:12px;color:${BRAND.gray};">— Community member</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;">
                <tr>
                  <td align="center" style="padding:16px 0;">
                    <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:${BRAND.dark};">
                      Verify now and discover events near you →
                    </p>
                    ${appUrl ? `<a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg, ${BRAND.pink}, ${BRAND.orange});color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:999px;">Go to BeHalix</a>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:13px;color:${BRAND.gray};">
                Where interests become meetups.
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">
                © BeHalix
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export function getOTPEmailText(code: string): string {
  return [
    'Welcome to BeHalix!',
    '',
    `Your verification code is: ${code}`,
    'It expires in 10 minutes.',
    '',
    "If you didn't request this code, you can safely ignore this email.",
    '',
    '— BeHalix',
  ].join('\n');
}
