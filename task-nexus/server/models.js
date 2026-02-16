const mongoose = require('mongoose');

// --- USER SCHEMA ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  avatar_url: { type: String, default: null },
}, { timestamps: true });

// --- WORKSPACE SCHEMA ---
const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Embedding members is often more efficient in Mongo than a separate join table
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' }
  }]
}, { timestamps: true });

// --- PROJECT SCHEMA ---
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  color: { type: String, default: '#3B82F6' },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true }
}, { timestamps: true });

// --- TASK SCHEMA ---
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['todo', 'in_progress', 'review', 'done'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  due_date: Date,
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', userSchema),
  Workspace: mongoose.model('Workspace', workspaceSchema),
  Project: mongoose.model('Project', projectSchema),
  Task: mongoose.model('Task', taskSchema)
};