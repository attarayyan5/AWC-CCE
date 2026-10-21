// src/models/Counter.js
// Atomic sequential counter for generating unique IDs

import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: false, versionKey: false }
);

const Counter = mongoose.model('Counter', counterSchema);

export default Counter;
