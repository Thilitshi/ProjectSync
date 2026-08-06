const router = require('express').Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const transporter = require('../config/email');
const User = require('../models/User');

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  'http://localhost:3000';


// =====================================================
// REGISTER
// =====================================================

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Username, email and password are required'
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists with this email or username'
      });
    }

    const user = new User({
      username,
      email: email.toLowerCase(),
      password
    });

    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Register error:', error);

    res.status(500).json({
      error: error.message
    });
  }
});


// =====================================================
// LOGIN
// =====================================================

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      error: error.message
    });
  }
});


// =====================================================
// GET CURRENT USER
// =====================================================

router.get(
  '/me',
  require('../middleware/auth'),
  async (req, res) => {
    try {
      const user = await User.findById(req.userId)
        .select('-password');

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json(user);

    } catch (error) {
      console.error('Get current user error:', error);

      res.status(500).json({
        error: error.message
      });
    }
  }
);


// =====================================================
// FORGOT PASSWORD
// =====================================================

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    // Don't reveal whether the email exists
    if (!user) {
      return res.json({
        message:
          'If an account exists, a reset link has been sent.'
      });
    }


    // -------------------------------------------------
    // Generate secure reset token
    // -------------------------------------------------

    const resetToken = crypto
      .randomBytes(32)
      .toString('hex');


    // -------------------------------------------------
    // Hash token before storing it in MongoDB
    // -------------------------------------------------

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');


    // -------------------------------------------------
    // Save token + expiry
    // -------------------------------------------------

    user.resetPasswordToken = resetPasswordToken;

    user.resetPasswordExpires =
      Date.now() + 3600000; // 1 hour

    await user.save();


    // -------------------------------------------------
    // Create password reset URL
    // -------------------------------------------------

    const resetUrl =
      `${FRONTEND_URL}/reset-password/${resetToken}`;


    console.log('');
    console.log('==========================================');
    console.log('🔐 PASSWORD RESET LINK');
    console.log('==========================================');
    console.log(resetUrl);
    console.log('==========================================');
    console.log('');


    // -------------------------------------------------
    // Send email
    // -------------------------------------------------

    await transporter.sendMail({
      from: `"ProjectSync" <${process.env.EMAIL_USER}>`,

      to: user.email,

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

          <h2 style="
            color: #22c55e;
            margin-bottom: 20px;
          ">
            Password Reset Request
          </h2>

          <p>
            Hello ${user.username},
          </p>

          <p>
            You requested to reset your
            ProjectSync password.
          </p>

          <p>
            Click the button below to create
            a new password:
          </p>

          <div style="
            text-align: center;
            margin: 30px 0;
          ">

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

          <p style="
            color: #9ca3af;
            font-size: 12px;
          ">
            This link will expire in 1 hour.
          </p>

          <p style="
            color: #9ca3af;
            font-size: 12px;
          ">
            If you did not request this password reset,
            you can safely ignore this email.
          </p>

        </div>
      `
    });


    console.log(
      '✅ Password reset email sent to:',
      user.email
    );


    return res.json({
      message:
        'Password reset email sent! Check your inbox.'
    });


  } catch (error) {

    console.error(
      '❌ Forgot password error:',
      error
    );

    return res.status(500).json({
      error: 'Failed to send password reset email'
    });
  }
});


// =====================================================
// VERIFY RESET TOKEN
// =====================================================

router.get(
  '/reset-password/:token',
  async (req, res) => {

    try {

      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');


      const user = await User.findOne({
        resetPasswordToken,

        resetPasswordExpires: {
          $gt: Date.now()
        }
      });


      if (!user) {

        return res.status(400).json({
          error: 'Invalid or expired token'
        });

      }


      res.json({
        valid: true,
        message: 'Token is valid'
      });


    } catch (error) {

      console.error(
        'Verify reset token error:',
        error
      );

      res.status(500).json({
        error: error.message
      });
    }
  }
);


// =====================================================
// RESET PASSWORD
// =====================================================

router.post(
  '/reset-password/:token',
  async (req, res) => {

    try {

      const { password } = req.body;


      // -------------------------------------------------
      // Validate password
      // -------------------------------------------------

      if (!password || password.length < 6) {

        return res.status(400).json({
          error:
            'Password must be at least 6 characters'
        });

      }


      // -------------------------------------------------
      // Hash token from URL
      // -------------------------------------------------

      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');


      // -------------------------------------------------
      // Find user with valid token
      // -------------------------------------------------

      const user = await User.findOne({

        resetPasswordToken,

        resetPasswordExpires: {
          $gt: Date.now()
        }

      });


      if (!user) {

        return res.status(400).json({
          error: 'Invalid or expired token'
        });

      }


      // -------------------------------------------------
      // Update password
      //
      // Your User model hashes the password
      // automatically before saving.
      // -------------------------------------------------

      user.password = password;

      user.resetPasswordToken = undefined;

      user.resetPasswordExpires = undefined;


      await user.save();


      // -------------------------------------------------
      // Success
      // -------------------------------------------------

      res.json({
        message:
          'Password reset successful! Please login with your new password.'
      });


    } catch (error) {

      console.error(
        'Reset password error:',
        error
      );

      res.status(500).json({
        error: error.message
      });
    }
  }
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;