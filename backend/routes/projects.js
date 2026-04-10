const router = require('express').Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const User = require('../models/User');

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
      description: req.body.description || req.body.title
    });
    
    // Update progress (estimated 10 milestones for 100%)
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