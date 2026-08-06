const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendResetEmail = async ({ to, username, resetUrl }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'ProjectSync <onboarding@resend.dev>',
      to: [to],
      subject: 'Password Reset - ProjectSync',
      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          background: #1f2937;
          color: white;
          padding: 30px;
          border-radius: 10px;
        ">
          <h2 style="color: #22c55e; margin-bottom: 20px;">
            Password Reset Request
          </h2>

          <p>Hello ${username},</p>

          <p>
            You requested to reset your ProjectSync password.
          </p>

          <p>
            Click the button below to create a new password:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a
              href="${resetUrl}"
              style="
                display: inline-block;
                padding: 12px 24px;
                background-color: #22c55e;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
              "
            >
              Reset Password
            </a>
          </div>

          <p style="color: #9ca3af; font-size: 12px;">
            This link will expire in 1 hour.
          </p>

          <p style="color: #9ca3af; font-size: 12px;">
            If you did not request this password reset,
            you can safely ignore this email.
          </p>
        </div>
      `
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log(
      '✅ Password reset email sent:',
      data?.id
    );

    return data;

  } catch (err) {
    console.error(
      '❌ Email send failed:',
      err
    );

    throw err;
  }
};

module.exports = { sendResetEmail };