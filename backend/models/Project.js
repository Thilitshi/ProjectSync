const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  completedAt: { type: Date, default: Date.now },
  images: [String] // Optional screenshots
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  stage: {
  type: String,
  enum: ['Ideation', 'Planning', 'MVP', 'Development', 'Testing', 'Launch', 'Post-Launch', 'Completed'],
  default: 'Ideation'
},
  
  // Support needed
  supportNeeded: [{
    type: String,
    enum: ['frontend', 'backend', 'design', 'devops', 'marketing', 'funding', 'mentorship', 'testing']
  }],
  
  // Tech stack tags
  techStack: [String],
  
  // Progress
  milestones: [milestoneSchema],
  progress: { type: Number, default: 0, min: 0, max: 100 },
  
  // Collaboration
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  collaborationRequests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    requestedAt: { type: Date, default: Date.now }
  }],
  
  // Visibility
  isPublic: { type: Boolean, default: true },
  completedAt: Date,
  
  // Engagement
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);


