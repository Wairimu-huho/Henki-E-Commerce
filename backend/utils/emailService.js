// This is a placeholder for a real email service
// In production, you would use a service like Nodemailer, SendGrid, etc.

/**
 * Send an email
 * @param {string} to Recipient email
 * @param {string} subject Email subject
 * @param {string} text Email body text
 * @param {string} html Email body HTML
 */
const sendEmail = async (to, subject, text, html) => {
    // In development, just log the email
    console.log(`
      ==================================
      SENDING EMAIL:
      To: ${to}
      Subject: ${subject}
      Text: ${text}
      HTML: ${html}
      ==================================
    `);
  
    // In production, you would use something like:
    /*
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html
    });
    */
  
    return true;
  };
  
  /**
   * Send a password reset email
   * @param {string} to Recipient email
   * @param {string} resetUrl Reset URL with token
   */
  const sendPasswordResetEmail = async (to, resetUrl) => {
    const subject = 'Password Reset Request';
    const text = `You requested a password reset. Please go to: ${resetUrl} to reset your password. This link is valid for 10 minutes.`;
    const html = `
      <h1>Password Reset</h1>
      <p>You requested a password reset.</p>
      <p>Please click the following link to reset your password:</p>
      <a href="${resetUrl}" target="_blank">Reset Password</a>
      <p>This link is valid for 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;
  
    return await sendEmail(to, subject, text, html);
  };
  
  module.exports = {
    sendEmail,
    sendPasswordResetEmail
  };
  