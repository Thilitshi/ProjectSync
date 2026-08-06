const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  completedAt: { type: Date, default: Date.now },
  images: [String]
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerName: { type: String },                    
  
  stage: {
    type: String,
    // Includes both old mapped values AND new frontend raw values
    enum: ['Ideation', 'Planning', 'MVP', 'Development', 'Testing', 'Launch', 'Post-Launch', 'Completed', 'idea', 'planning', 'building', 'launched'],
    default: 'Ideation'
  },
  
  // Support needed
  supportNeeded: [{
    type: String,
    enum: ['frontend', 'backend', 'design', 'devops', 'marketing', 'funding', 'mentorship', 'testing']
  }],
  supportRequired: { type: String },              
  
  // Tech stack tags
  techStack: [String],
  technologies: [{ type: String }],               
  
  // Links
  repoUrl: { type: String },                      
  liveUrl: { type: String },                      
  
  // README / About
  readme: { type: String, default: '' },          
  
  // Documents
  documents: [{                                   
    name: String,
    filename: String,
    path: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Progress
  milestones: [milestoneSchema],
  progress: { type: Number, default: 0, min: 0, max: 100 },
  
  // Completion
  isCompleted: { type: Boolean, default: false }, 
  completedAt: Date,
  
  // Collaboration
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  collaborationRequests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    requestedAt: { type: Date, default: Date.now }
  }],
  
  // Comments
  comments: [{                                    
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    content: String,
    isCollaborationRequest: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Visibility
  isPublic: { type: Boolean, default: true },
  
  // Engagement
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);