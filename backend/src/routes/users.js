const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { authenticate, authorize } = require('../middlewares/auth');
const { checkValidation } = require('../validators/authValidators');
const {
  validateUserId,
  validateUpdateUser,
  validateChangePassword,
  validatePagination
} = require('../validators/userValidators');

/**
 * User routes
 * Base path: /api/users
 */

// All routes require authentication
router.use(authenticate);

// User profile routes
router.get('/me', userController.getProfile);
router.put('/me', 
  validateUpdateUser, 
  checkValidation, 
  userController.updateProfile
);
router.put('/change-password', 
  validateChangePassword, 
  checkValidation, 
  userController.changePassword
);

// User management routes - disabled after removing admin role
// These routes are commented out as they were previously admin-only
// If needed in the future, implement appropriate authorization

// router.get('/', 
//   validatePagination, 
//   checkValidation, 
//   userController.getAllUsers
// );

// router.get('/:id', 
//   validateUserId, 
//   checkValidation, 
//   userController.getUserById
// );

// router.put('/:id', 
//   validateUserId, 
//   validateUpdateUser, 
//   checkValidation, 
//   userController.updateUser
// );

// router.delete('/:id', 
//   validateUserId, 
//   checkValidation, 
//   userController.deleteUser
// );

module.exports = router;