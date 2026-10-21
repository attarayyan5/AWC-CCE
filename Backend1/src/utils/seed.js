// src/utils/seed.js
// Seed script - creates a default ADMIN user if none exists

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Member from '../models/Member.js';
import { config } from '../config/index.js';
import { generateStudentId } from './studentId.js';
import logger from './logger.js';

const seedAdmin = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('Connected to MongoDB for seeding');

    const existingAdmin = await User.findOne({ role: 'ADMIN' });
    if (existingAdmin) {
      logger.info('Admin user already exists. Skipping seed.');
      await mongoose.disconnect();
      return;
    }

    const passwordHash = await bcrypt.hash('Admin@123', config.security.saltRounds);

    // Create admin member profile
    const studentId = await generateStudentId();
    const member = await Member.create({
      studentId,
      fullName: 'AWS Club Admin',
      email: 'admin@awsclub.edu',
      department: 'Administration',
      academicYear: '2026-2027',
      status: 'ACTIVE',
      joinedAt: new Date(),
    });

    // Create admin user account
    const admin = await User.create({
      email: 'admin@awsclub.edu',
      passwordHash,
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      memberId: member._id,
    });

    // Link member to user
    await Member.findByIdAndUpdate(member._id, { userId: admin._id });

    logger.info('Default admin user created:');
    logger.info('  Email: admin@awsclub.edu');
    logger.info('  Password: Admin@123');
    logger.info(`  Student ID: ${studentId}`);
    logger.info('  ⚠️  Change this password immediately in production!');

    await mongoose.disconnect();
    logger.info('Seed completed.');
  } catch (error) {
    logger.error('Seed failed:', { message: error.message });
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmin();
