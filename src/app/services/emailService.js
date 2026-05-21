import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendPasswordResetEmail = async (email, resetToken, firstName) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  await resend.emails.send({
    from: 'Safaraa <onboarding@resend.dev>',
    to: email,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #1e88e5;">Safaraa</h2>
        <p>Hi ${firstName},</p>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 0.8rem 1.5rem; background-color: #1e88e5; color: white; border-radius: 8px; text-decoration: none; margin: 1rem 0;">
          Reset Password
        </a>
        <p style="color: #a0aec0; font-size: 0.85rem;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

const sendVerificationEmail = async (email, verificationToken, firstName) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  await resend.emails.send({
    from: 'Safaraa <onboarding@resend.dev>',
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #1e88e5;">Jewel Fleet</h2>
        <p>Hi ${firstName},</p>
        <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 0.8rem 1.5rem; background-color: #1e88e5; color: white; border-radius: 8px; text-decoration: none; margin: 1rem 0;">
          Verify Email
        </a>
        <p style="color: #a0aec0; font-size: 0.85rem;">If you didn't create an account, ignore this email.</p>
      </div>
    `,
  });
};

export { sendPasswordResetEmail, sendVerificationEmail };