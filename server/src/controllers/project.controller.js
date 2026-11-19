const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

// GET /api/projects
exports.getProjects = async (req, res, next) => {
  try {
    const query = {};
    
    // Non-PMs only see projects they're a member of or own
    if (req.user.role !== 'PROJECT_MANAGER') {
      query.$or = [
        { owner: req.user._id },
        { members: req.user._id },
      ];
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar role')
      .sort({ updatedAt: -1 });

    // Attach task counts
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { projectId: project._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        
        const counts = { total: 0, BACKLOG: 0, TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
        taskCounts.forEach(tc => {
          counts[tc._id] = tc.count;
          counts.total += tc.count;
        });

        return { ...project.toObject(), taskCounts: counts };
      })
    );

    res.json({ success: true, data: projectsWithCounts });
  } catch (error) {
    next(error);
  }
};

// GET /api/projects/:id
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar role skills');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found', code: 'NOT_FOUND' });
    }

    const taskCounts = await Task.aggregate([
      { $match: { projectId: project._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const counts = { total: 0, BACKLOG: 0, TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
    taskCounts.forEach(tc => {
      counts[tc._id] = tc.count;
      counts.total += tc.count;
    });

    res.json({ success: true, data: { ...project.toObject(), taskCounts: counts } });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects
exports.createProject = async (req, res, next) => {
  try {
    const { name, description, startDate, deadline, status, members } = req.body;

    const project = await Project.create({
      name,
      description,
      startDate,
      deadline,
      status: status || 'PLANNING',
      owner: req.user._id,
      members: members || [],
    });

    await Activity.create({
      user: req.user._id,
      project: project._id,
      action: 'PROJECT_CREATED',
      metadata: { projectName: project.name },
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar role');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// PUT /api/projects/:id
exports.updateProject = async (req, res, next) => {
  try {
    const { name, description, startDate, deadline, status, members } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found', code: 'NOT_FOUND' });
    }

    // Update fields
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (startDate !== undefined) project.startDate = startDate;
    if (deadline !== undefined) project.deadline = deadline;
    if (status !== undefined) project.status = status;
    if (members !== undefined) project.members = members;

    await project.save();

    await Activity.create({
      user: req.user._id,
      project: project._id,
      action: 'PROJECT_UPDATED',
      metadata: { projectName: project.name },
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar role');

    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projects/:id
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found', code: 'NOT_FOUND' });
    }

    // Delete all related tasks
    await Task.deleteMany({ projectId: project._id });
    await project.deleteOne();

    await Activity.create({
      user: req.user._id,
      action: 'PROJECT_DELETED',
      metadata: { projectName: project.name },
    });

    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/:id/members
exports.addMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found', code: 'NOT_FOUND' });
    }

    if (project.members.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User is already a member', code: 'ALREADY_MEMBER' });
    }

    project.members.push(userId);
    await project.save();

    await Activity.create({
      user: req.user._id,
      project: project._id,
      action: 'MEMBER_ADDED',
      metadata: { memberId: userId },
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar role');

    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projects/:id/members/:userId
exports.removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found', code: 'NOT_FOUND' });
    }

    project.members = project.members.filter(m => m.toString() !== req.params.userId);
    await project.save();

    await Activity.create({
      user: req.user._id,
      project: project._id,
      action: 'MEMBER_REMOVED',
      metadata: { memberId: req.params.userId },
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar role');

    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};
