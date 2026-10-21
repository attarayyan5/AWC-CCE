// src/utils/studentId.js
// Atomic unique student ID generation using Counter collection

import Counter from '../models/Counter.js';
import { config } from '../config/index.js';

/**
 * Generate the next unique student ID atomically.
 * Format: {PREFIX}{YEAR}{SEQ padded to 3 digits}
 * Example: AWS2026001
 */
export const generateStudentId = async () => {
  const year = new Date().getFullYear();
  const counterName = `studentId_${year}`;

  // Atomic increment - safe for concurrent requests
  const counter = await Counter.findOneAndUpdate(
    { name: counterName },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  const prefix = config.studentId.prefix;
  const seq = String(counter.seq).padStart(3, '0');

  return `${prefix}${year}${seq}`;
};

/**
 * Generate an activity code atomically.
 * Format: CCA{SEQ padded to 4 digits}
 * Example: CCA0001
 */
export const generateActivityCode = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: 'activityCode' },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  const seq = String(counter.seq).padStart(4, '0');
  return `CCA${seq}`;
};
