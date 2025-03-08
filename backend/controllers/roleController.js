const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Admin
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  
  // Validate role
  const allowedRoles = ['customer', 'seller', 'admin'];
  if (!allowedRoles.includes(role)) {
    res.status(400);
    throw new Error(`Role must be one of: ${allowedRoles.join(', ')}`);
  }
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Prevent admins from downgrading themselves
  if (req.user._id.toString() === user._id.toString() && 
      req.user.role === 'admin' && 
      role !== 'admin') {
    res.status(400);
    throw new Error('Admins cannot downgrade their own role');
  }
  
  user.role = role;
  await user.save();
  
  res.json({
    message: `User role updated to ${role}`,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (user) {
    // Prevent admins from deleting themselves
    if (req.user._id.toString() === user._id.toString()) {
      res.status(400);
      throw new Error('Admins cannot delete their own account');
    }
    
    await user.remove();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = {
  updateUserRole,
  getUsers,
  getUserById,
  deleteUser
};