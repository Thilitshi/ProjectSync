const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const User = require('../models/User');

// Ensure uploads folder exists
const fs = require('fs');
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Create new project
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, stage, supportRequired, technologies, repoUrl, liveUrl } = req.body;
    
    const project = new Project({
      title,
      description,
      stage,
      supportRequired,
      technologies: technologies || [],
      repoUrl,
      liveUrl,
      owner: req.userId,
      ownerName: req.user.username
    });
    
    await project.save();
    
    const io = req.app.get('io');
    io.to('feed').emit('project-created', {
      type: 'NEW_PROJECT',
      data: {
        id: project._id,
        title: project.title,
        ownerName: req.user.username
      },
      timestamp: new Date()
    });
    
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get feed (all public projects)
router.get('/feed', async (req, res) => {
  try {
    const projects = await Project.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('owner', 'username avatar');
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's projects
router.get('/my-projects', auth, async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.userId })
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH - Update stage or readme
router.patch('/:id', auth, async (req, res) => {
  try {
    const updates = {};
    if (req.body.stage) updates.stage = req.body.stage;
    if (req.body.readme !== undefined) updates.readme = req.body.readme;

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { $set: updates },
      { new: true }
    );

    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add milestone
router.post('/:id/milestone', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only project owner can add milestones' });
    }
    
    project.milestones.push({
      title: req.body.title,
      description: req.body.description || req.body.title,
      completedAt: new Date()
    });
    
    const estimatedTotal = 10;
    const completedCount = project.milestones.length;
    project.progress = Math.min(100, Math.round((completedCount / estimatedTotal) * 100));
    
    await project.save();
    
    const io = req.app.get('io');
    io.to('feed').emit('progress-update', {
      type: 'MILESTONE_ACHIEVED',
      data: {
        projectId: project._id,
        projectTitle: project.title,
        milestone: req.body.title,
        progress: project.progress,
        ownerName: req.user.username
      },
      timestamp: new Date()
    });
    
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Upload document
router.post('/:id/documents', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const doc = {
      name: req.file.originalname,
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size,
      uploadedAt: new Date()
    };

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { $push: { documents: doc } },
      { new: true }
    );

    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete document
router.delete('/:id/documents/:docId', auth, async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { $pull: { documents: { _id: req.params.docId } } },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    project.comments.push({
      user: req.userId,
      userName: req.user.username,
      content: req.body.content,
      isCollaborationRequest: req.body.isCollaborationRequest || false
    });
    
    await project.save();
    
    const io = req.app.get('io');
    io.to('feed').emit('new-comment', {
      type: req.body.isCollaborationRequest ? 'COLLABORATION_REQUEST' : 'NEW_COMMENT',
      data: {
        projectId: project._id,
        projectTitle: project.title,
        comment: req.body.content,
        userName: req.user.username
      },
      timestamp: new Date()
    });
    
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Like project
router.post('/:id/like', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const likeIndex = project.likes.indexOf(req.userId);
    
    if (likeIndex === -1) {
      project.likes.push(req.userId);
    } else {
      project.likes.splice(likeIndex, 1);
    }
    
    await project.save();
    res.json({ likes: project.likes.length, liked: likeIndex === -1 });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Complete project
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only project owner can complete the project' });
    }
    
    project.isCompleted = true;
    project.completedAt = new Date();
    project.stage = 'Completed';
    project.progress = 100;
    await project.save();
    
    await User.findByIdAndUpdate(req.userId, {
      $addToSet: { completedProjects: project._id }
    });
    
    const io = req.app.get('io');
    io.to('feed').emit('project-completed', {
      type: 'PROJECT_COMPLETED',
      data: {
        projectId: project._id,
        projectTitle: project.title,
        ownerName: req.user.username
      },
      timestamp: new Date()
    });
    
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Celebration Wall - Get completed projects
router.get('/celebration-wall', async (req, res) => {
  try {
    const completedProjects = await Project.find({ isCompleted: true, isPublic: true })
      .sort({ completedAt: -1 })
      .limit(100)
      .populate('owner', 'username avatar');
    
    res.json(completedProjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;