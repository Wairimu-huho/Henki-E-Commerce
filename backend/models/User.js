const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['customer', 'seller', 'admin'],
    default: 'customer'
  },
  addresses: [
    {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      isDefault: {
        type: Boolean,
        default: false
      }
    }
  ],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  profilePicture: {
    url: {
      type: String,
      default: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/default-profile.png'
    },
    publicId: {
      type: String
    }
  },
});

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Index for email queries (unique, used in login/registration)
userSchema.index({ email: 1 }, { unique: true });

// Index for role-based queries (used in admin panels)
userSchema.index({ role: 1 });

// Compound index for addresses (for faster address lookups)
userSchema.index({ 'addresses.isDefault': 1 });

module.exports = mongoose.model('User', userSchema);