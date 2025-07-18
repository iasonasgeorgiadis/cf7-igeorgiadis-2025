const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');
const { authenticate } = require('../middlewares/auth');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateRefreshToken,
  checkValidation
} = require('../validators/authValidators');

/**
 * Authentication routes
 * Base path: /api/auth
 */

// Public routes
router.post('/register', 
  validateRegister, 
  checkValidation, 
  authController.register
);

router.post('/login', 
  validateLogin, 
  checkValidation, 
  authController.login
);

router.post('/forgot-password', 
  validateForgotPassword, 
  checkValidation, 
  authController.forgotPassword
);

router.post('/reset-password', 
  validateResetPassword, 
  checkValidation, 
  authController.resetPassword
);

router.post('/refresh', 
  authController.refreshToken
);

// Protected routes
router.post('/logout', 
  authenticate, 
  authController.logout
);

router.get('/me', 
  authenticate, 
  authController.getCurrentUser
);

module.exports = router;