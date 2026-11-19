const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false, // Never return password by default
  },
  role: {
    type: String,
    enum: ['PROJECT_MANAGER', 'DEVELOPER', 'VIEWER'],
    default: 'DEVELOPER',
  },
  avatar: {
    type: String,
    default: '',
  },
  skills: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  // Skip if already a bcrypt hash (from seed script)
  if (this.passwordHash.startsWith('$2a$') || this.passwordHash.startsWith('$2b$')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Generate initials for avatar fallback
userSchema.virtual('initials').get(function() {
  return this.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

module.exports = mongoose.model('User', userSchema);
