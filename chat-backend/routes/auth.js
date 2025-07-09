const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyEmail, resendVerificationEmail } = require('../controllers/authController');
const { forgotPassword, resetPassword, resendResetPasswordEmail, changePassword, verifyResetToken  } = require('../controllers/passwordController');
const authenticate = require('../middleware/authenticate');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify-email', verifyEmail);
router.get('/verify-reset-token', verifyResetToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/resend-verification', resendVerificationEmail);
router.post('/resend-reset-password', resendResetPasswordEmail);
router.patch('/change-password', authenticate, changePassword);

module.exports = router;