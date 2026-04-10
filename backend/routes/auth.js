const router = require('express').Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email or username' });
    }
    
    const user = new User({ username, email, password });
    await user.save();
    
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
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
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
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
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot Password - WITH EMAIL SENDING
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ error: 'No account with that email exists' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    
    console.log('\n🔐 ===== PASSWORD RESET LINK =====');
    console.log(`Reset URL: ${resetUrl}`);
    console.log('🔐 ================================\n');

    // ✅ SEND REAL EMAIL (if configured)
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;
    
    if (emailUser && emailPass && emailUser !== 'your-email@gmail.com') {
      try {
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPass
          }
        });
        
        const mailOptions = {
          from: `"ProjectSync" <${emailUser}>`,
          to: user.email,
          subject: '🔐 Password Reset - ProjectSync',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1f2937; color: white; padding: 20px; border-radius: 10px;">
              <h2 style="color: #22c55e;">🔐 Password Reset Request</h2>
              <p>Hello ${user.username},</p>
              <p>You requested to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
              </div>
              <p style="color: #9ca3af; font-size: 12px;">This link will expire in 1 hour.</p>
              <p style="color: #9ca3af; font-size: 12px;">If you didn't request this, please ignore this email.</p>
              <hr style="border-color: #374151;">
              <p style="color: #6b7280; font-size: 11px;">ProjectSync - Build in Public Platform</p>
            </div>
          `
        };
        
        await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully to:', user.email);
        res.json({ message: 'Password reset email sent! Check your inbox.' });
        
      } catch (emailErr) {
        console.log('❌ Email failed to send:', emailErr.message);
        console.log('✅ Reset link available in console above');
        res.json({ message: 'Password reset link generated (check console for link)' });
      }
    } else {
      console.log('⚠️ Email not configured. Add EMAIL_USER and EMAIL_PASSWORD to .env');
      console.log('✅ Reset link available in console above');
      res.json({ message: 'Password reset link generated (check server console for link)' });
    }
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Verify reset token
router.get('/reset-password/:token', async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    res.json({ valid: true, message: 'Token is valid' });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.json({ message: 'Password reset successful! Please login with your new password.' });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;