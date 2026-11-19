/**
 * Database Seed Script
 * 
 * Creates demo data for immediate project demonstration.
 * Run: npm run seed (from server/ or root)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/project_management_ai';

async function seed(exitOnComplete = true) {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('🌱 Connecting to MongoDB...');
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Connected\n');
    }

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      Activity.deleteMany({}),
    ]);

    // Create Users
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('Demo@123', 12);
    
    const tushar = await User.create({
      name: 'Tushar Gautam',
      email: 'admin@projectai.local',
      passwordHash: hashedPassword,
      role: 'PROJECT_MANAGER',
      skills: ['Project Management', 'Full-Stack', 'Node.js', 'React'],
    });
    const dipti = await User.create({
      name: 'Dipti Saini',
      email: 'developer@projectai.local',
      passwordHash: hashedPassword,
      role: 'DEVELOPER',
      skills: ['React', 'CSS', 'JavaScript', 'UI/UX'],
    });
    const likha = await User.create({
      name: 'Likha Gummiku',
      email: 'likha@projectai.local',
      passwordHash: hashedPassword,
      role: 'DEVELOPER',
      skills: ['Node.js', 'MongoDB', 'Express', 'API'],
    });
    const uma = await User.create({
      name: 'Uma Shankar',
      email: 'uma@projectai.local',
      passwordHash: hashedPassword,
      role: 'DEVELOPER',
      skills: ['Testing', 'QA', 'Node.js', 'Database'],
    });

    const users = [tushar, dipti, likha, uma];
    console.log(`   Created ${users.length} users`);

    // Create Project
    console.log('📋 Creating project...');
    const project = await Project.create({
      name: 'School Management System',
      description: 'A comprehensive school management system with student, teacher, attendance, and payment modules. Built with React frontend and Node.js backend with MongoDB database.',
      owner: tushar._id,
      members: [tushar._id, dipti._id, likha._id, uma._id],
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),  // 60 days from now
      status: 'ACTIVE',
    });
    console.log(`   Created project: ${project.name}`);

    // Create Tasks
    console.log('📝 Creating tasks...');
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // Task 1: Database Design - DONE
    const dbDesign = await Task.create({
      title: 'Database Design',
      description: 'Design complete MongoDB schema for all modules including users, students, teachers, attendance, and payments. Create ER diagrams and data model documentation.',
      projectId: project._id,
      assignedTo: likha._id,
      createdBy: tushar._id,
      status: 'DONE',
      priority: 'HIGH',
      priorityScore: 72,
      businessImpact: 'HIGH',
      complexity: 'HIGH',
      deadline: new Date(now - 10 * day),
      estimatedHours: 12,
      actualHours: 14,
      progress: 100,
      riskLevel: 'LOW',
      tags: ['database', 'architecture', 'mongodb'],
      priorityExplanation: ['Foundation for all modules', 'Completed on schedule'],
    });

    // Task 2: User Authentication - IN_REVIEW
    const authTask = await Task.create({
      title: 'User Authentication System',
      description: 'Implement complete authentication with JWT, bcrypt password hashing, login, registration, role-based authorization for admin, teacher, student roles.',
      projectId: project._id,
      assignedTo: likha._id,
      createdBy: tushar._id,
      status: 'IN_REVIEW',
      priority: 'HIGH',
      priorityScore: 78,
      businessImpact: 'CRITICAL',
      complexity: 'HIGH',
      deadline: new Date(now + 2 * day),
      estimatedHours: 16,
      actualHours: 12,
      progress: 85,
      riskLevel: 'MEDIUM',
      dependencies: [dbDesign._id],
      tags: ['authentication', 'security', 'jwt'],
      priorityExplanation: ['Critical for system security', 'Deadline approaching', 'Blocks other modules'],
    });

    // Task 3: Student Management - IN_PROGRESS
    const studentMgmt = await Task.create({
      title: 'Student Management Module',
      description: 'Complete CRUD for student records including admission, personal details, academic history, parent information. Add search, filter, and export functionality.',
      projectId: project._id,
      assignedTo: dipti._id,
      createdBy: tushar._id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      priorityScore: 68,
      businessImpact: 'HIGH',
      complexity: 'MEDIUM',
      deadline: new Date(now + 7 * day),
      estimatedHours: 20,
      actualHours: 8,
      progress: 40,
      riskLevel: 'MEDIUM',
      dependencies: [dbDesign._id, authTask._id],
      tags: ['crud', 'students', 'frontend'],
      priorityExplanation: ['Core module', 'High business impact', 'Depends on auth system'],
    });

    // Task 4: Teacher Management - TODO
    const teacherMgmt = await Task.create({
      title: 'Teacher Management Module',
      description: 'CRUD operations for teacher profiles, subject assignments, schedule management, and qualification tracking.',
      projectId: project._id,
      assignedTo: dipti._id,
      createdBy: tushar._id,
      status: 'TODO',
      priority: 'MEDIUM',
      priorityScore: 55,
      businessImpact: 'HIGH',
      complexity: 'MEDIUM',
      deadline: new Date(now + 14 * day),
      estimatedHours: 16,
      progress: 0,
      riskLevel: 'LOW',
      dependencies: [dbDesign._id, authTask._id],
      tags: ['crud', 'teachers', 'frontend'],
      priorityExplanation: ['Important module', 'Depends on auth', 'Reasonable deadline'],
    });

    // Task 5: Attendance Module - TODO
    const attendanceModule = await Task.create({
      title: 'Attendance Tracking Module',
      description: 'Daily attendance marking for students and teachers. Generate attendance reports, track patterns, send alerts for low attendance.',
      projectId: project._id,
      assignedTo: uma._id,
      createdBy: tushar._id,
      status: 'TODO',
      priority: 'MEDIUM',
      priorityScore: 48,
      businessImpact: 'MEDIUM',
      complexity: 'MEDIUM',
      deadline: new Date(now + 21 * day),
      estimatedHours: 18,
      progress: 0,
      riskLevel: 'LOW',
      dependencies: [studentMgmt._id, teacherMgmt._id],
      tags: ['attendance', 'reports'],
      priorityExplanation: ['Multiple dependencies', 'Medium urgency'],
    });

    // Task 6: Payment Gateway - BACKLOG (CRITICAL)
    const paymentGateway = await Task.create({
      title: 'Payment Gateway Integration',
      description: 'Integrate payment gateway for fee collection, generate invoices, track payment history, send payment reminders, handle refunds.',
      projectId: project._id,
      assignedTo: likha._id,
      createdBy: tushar._id,
      status: 'BACKLOG',
      priority: 'CRITICAL',
      priorityScore: 91,
      businessImpact: 'CRITICAL',
      complexity: 'HIGH',
      deadline: new Date(now + 3 * day),
      estimatedHours: 24,
      progress: 0,
      riskLevel: 'CRITICAL',
      dependencies: [dbDesign._id, authTask._id, studentMgmt._id],
      tags: ['payment', 'gateway', 'security', 'integration'],
      priorityExplanation: [
        'Deadline is approaching',
        'Business impact is critical',
        'Task blocks multiple tasks',
        'Assigned developer has high workload',
      ],
    });

    // Task 7: Dashboard - BACKLOG
    const dashboard = await Task.create({
      title: 'Admin Dashboard',
      description: 'Create comprehensive admin dashboard with statistics, charts, recent activity, quick actions. Show student count, attendance rates, fee collection status.',
      projectId: project._id,
      assignedTo: dipti._id,
      createdBy: tushar._id,
      status: 'BACKLOG',
      priority: 'HIGH',
      priorityScore: 65,
      businessImpact: 'HIGH',
      complexity: 'MEDIUM',
      deadline: new Date(now + 10 * day),
      estimatedHours: 14,
      progress: 0,
      riskLevel: 'MEDIUM',
      dependencies: [studentMgmt._id, teacherMgmt._id, attendanceModule._id],
      tags: ['dashboard', 'charts', 'analytics'],
      priorityExplanation: ['High business impact', 'Multiple dependencies', 'Deadline approaching'],
    });

    // Task 8: Reports Module - BACKLOG
    const reports = await Task.create({
      title: 'Reports & Analytics Module',
      description: 'Generate PDF reports for attendance, grades, fee statements. Create analytics dashboard with charts and data export functionality.',
      projectId: project._id,
      assignedTo: uma._id,
      createdBy: tushar._id,
      status: 'BACKLOG',
      priority: 'MEDIUM',
      priorityScore: 42,
      businessImpact: 'MEDIUM',
      complexity: 'HIGH',
      deadline: new Date(now + 25 * day),
      estimatedHours: 20,
      progress: 0,
      riskLevel: 'MEDIUM',
      dependencies: [attendanceModule._id, paymentGateway._id],
      tags: ['reports', 'pdf', 'analytics'],
      priorityExplanation: ['Moderate urgency', 'Depends on attendance and payment modules'],
    });

    // Task 9: Notification System - BACKLOG
    const notifications = await Task.create({
      title: 'Notification System',
      description: 'In-app and email notifications for attendance alerts, payment reminders, announcements, and system updates.',
      projectId: project._id,
      assignedTo: null,
      createdBy: tushar._id,
      status: 'BACKLOG',
      priority: 'LOW',
      priorityScore: 32,
      businessImpact: 'LOW',
      complexity: 'MEDIUM',
      deadline: new Date(now + 35 * day),
      estimatedHours: 12,
      progress: 0,
      riskLevel: 'MEDIUM',
      tags: ['notifications', 'email'],
      priorityExplanation: ['Low business impact', 'No developer assigned', 'Far deadline'],
    });

    // Task 10: Testing & QA - TODO
    const testing = await Task.create({
      title: 'Comprehensive Testing',
      description: 'Write unit tests, integration tests, and perform manual QA. Test all API endpoints, frontend flows, edge cases, and security vulnerabilities.',
      projectId: project._id,
      assignedTo: uma._id,
      createdBy: tushar._id,
      status: 'TODO',
      priority: 'HIGH',
      priorityScore: 70,
      businessImpact: 'HIGH',
      complexity: 'HIGH',
      deadline: new Date(now + 5 * day),
      estimatedHours: 20,
      progress: 0,
      riskLevel: 'HIGH',
      dependencies: [authTask._id, studentMgmt._id],
      tags: ['testing', 'qa', 'security'],
      priorityExplanation: ['Approaching deadline', 'High complexity', 'Critical for quality'],
    });

    console.log(`   Created 10 tasks`);

    // Create Activities
    console.log('📊 Creating activity log...');
    const activities = [
      { user: tushar._id, project: project._id, action: 'PROJECT_CREATED', metadata: { projectName: project.name } },
      { user: tushar._id, project: project._id, action: 'MEMBER_ADDED', metadata: { memberName: 'Dipti Saini' } },
      { user: tushar._id, project: project._id, action: 'MEMBER_ADDED', metadata: { memberName: 'Likha Gummiku' } },
      { user: tushar._id, project: project._id, action: 'MEMBER_ADDED', metadata: { memberName: 'Uma Shankar' } },
      { user: tushar._id, project: project._id, task: dbDesign._id, action: 'TASK_CREATED', metadata: { taskTitle: 'Database Design' } },
      { user: tushar._id, project: project._id, task: authTask._id, action: 'TASK_CREATED', metadata: { taskTitle: 'User Authentication System' } },
      { user: likha._id, project: project._id, task: dbDesign._id, action: 'TASK_STATUS_CHANGED', metadata: { from: 'TODO', to: 'DONE' } },
      { user: likha._id, project: project._id, task: authTask._id, action: 'TASK_STATUS_CHANGED', metadata: { from: 'IN_PROGRESS', to: 'IN_REVIEW' } },
      { user: dipti._id, project: project._id, task: studentMgmt._id, action: 'TASK_STATUS_CHANGED', metadata: { from: 'TODO', to: 'IN_PROGRESS' } },
      { user: tushar._id, project: project._id, task: paymentGateway._id, action: 'TASK_PRIORITY_UPDATED', metadata: { score: 91, category: 'CRITICAL' } },
    ];

    await Activity.insertMany(activities);
    console.log(`   Created ${activities.length} activity records`);

    console.log('\n✅ Seed completed successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Demo Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Project Manager:');
    console.log('    Email:    admin@projectai.local');
    console.log('    Password: Demo@123');
    console.log('');
    console.log('  Developer:');
    console.log('    Email:    developer@projectai.local');
    console.log('    Password: Demo@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (exitOnComplete) {
      process.exit(0);
    }
    return true;
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    console.error(error);
    if (exitOnComplete) {
      process.exit(1);
    }
    throw error;
  }
}

if (require.main === module) {
  seed(true);
}

module.exports = seed;
