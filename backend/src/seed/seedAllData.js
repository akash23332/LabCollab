import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import User from '../models/User.js';
import Equipment from '../models/Equipment.js';
import Booking from '../models/Booking.js';
import Availability from '../models/Availability.js';
import UsageLog from '../models/UsageLog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/labcollab';

// Fast CSV row parser handling quoted commas and quotes
function parseCsvRow(row) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

async function seedAllData() {
  const startTime = Date.now();
  console.log(`Connecting to MongoDB: ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);
  console.log('[MongoDB] Connected successfully.');

  console.log('Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Equipment.deleteMany({}),
    Booking.deleteMany({}),
    Availability.deleteMany({}),
    UsageLog.deleteMany({}),
  ]);
  console.log('Collections cleared.');

  // 1. Seed Users
  console.log('Seeding Users...');
  const adminUser = await User.create({
    name: 'Nikhil Palyal',
    email: 'nikhilpalyal6@gmail.com',
    password: 'Nikhil@123',
    role: 'admin',
    institution: 'Chitkara University',
    department: 'Central Instrumentation Facility / Admin',
    avatar: 'NP',
  });

  const studentUser = await User.create({
    name: 'Rahul Sharma',
    email: 'rahul.sharma@student.chitkara.edu.in',
    password: 'Student@123',
    role: 'student',
    institution: 'Chitkara University',
    department: 'Electronics & Communication',
    avatar: 'RS',
  });

  const studentUser2 = await User.create({
    name: 'Demo Student',
    email: 'student@example.com',
    password: 'Student@123',
    role: 'student',
    institution: 'Tufts University',
    department: 'Biomedical Engineering',
    avatar: 'DS',
  });

  const technicianUser = await User.create({
    name: 'Amit Kumar',
    email: 'amit.technician@chitkara.edu.in',
    password: 'Technician@123',
    role: 'technician',
    institution: 'Chitkara University',
    department: 'CIF Lab Ops',
    avatar: 'AK',
  });

  console.log(`Users created: Admin (${adminUser.email}), Students, Technician.`);

  // 2. Load AI Demand Predictions from CSV
  console.log('Loading AI Demand Predictions from CSV...');
  const demandMap = new Map();
  const demandCsvPath = path.resolve(
    __dirname,
    '../../../ai-models/demand-prediction/data/demand_predictions.csv'
  );

  if (fs.existsSync(demandCsvPath)) {
    const demandLines = fs.readFileSync(demandCsvPath, 'utf-8').split(/\r?\n/).filter((l) => l.trim().length > 0);
    for (let i = 1; i < demandLines.length; i++) {
      const parts = parseCsvRow(demandLines[i]);
      if (parts.length >= 5) {
        const [eqId, date, predBookings, demandLevel, histAvg] = parts;
        demandMap.set(eqId, {
          predictedBookings: parseFloat(predBookings) || 0,
          demandLevel: demandLevel || 'LOW',
          historicalAverage: parseFloat(histAvg) || 0,
          predictionDate: date,
          lastSyncedAt: new Date(),
        });
      }
    }
    console.log(`Loaded ${demandMap.size} AI demand predictions.`);
  }

  // 3. Load ALL 5,000 equipment from semantic-search/data/equipment.csv
  const equipmentCsvPath = path.resolve(
    __dirname,
    '../../../ai-models/semantic-search/data/equipment.csv'
  );

  if (!fs.existsSync(equipmentCsvPath)) {
    throw new Error('equipment.csv not found at ' + equipmentCsvPath);
  }

  console.log('Reading full equipment.csv...');
  const content = fs.readFileSync(equipmentCsvPath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  console.log(`Total lines in CSV: ${lines.length} (including header)`);

  const equipmentBatch = [];
  const availabilityBatch = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvRow(lines[i]);
    if (cols.length >= 17) {
      const [
        equipment_id,
        equipment_name,
        category,
        description,
        capabilities,
        applications,
        experiment_types,
        sample_types,
        measurements,
        specifications,
        keywords,
        college_name,
        lab_name,
        building,
        room_number,
        status,
        condition,
      ] = cols;

      const normStatus = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Available';
      const validStatus = ['Available', 'Booked', 'Maintenance', 'Inactive'].includes(normStatus)
        ? normStatus
        : 'Available';

      const normCondition = condition ? condition.charAt(0).toUpperCase() + condition.slice(1).toLowerCase() : 'Good';
      const validCondition = ['Excellent', 'Good', 'Fair', 'Poor'].includes(normCondition)
        ? normCondition
        : 'Good';

      // Attach AI demand prediction if exists, or generate sensible default
      const aiDemand = demandMap.get(equipment_id) || {
        predictedBookings: parseFloat((Math.random() * 3 + 0.5).toFixed(2)),
        demandLevel: 'MEDIUM',
        historicalAverage: parseFloat((Math.random() * 5 + 2).toFixed(2)),
        predictionDate: '2026-09-20',
        lastSyncedAt: new Date(),
      };

      equipmentBatch.push({
        equipmentId: equipment_id,
        equipmentNumber: equipment_id,
        equipmentName: equipment_name,
        category: category || 'General Laboratory',
        description: description || '',
        capabilities: capabilities ? capabilities.split(',').map((s) => s.trim()).filter(Boolean) : [],
        applications: applications ? applications.split(',').map((s) => s.trim()).filter(Boolean) : [],
        experimentTypes: experiment_types ? experiment_types.split(',').map((s) => s.trim()).filter(Boolean) : [],
        sampleTypes: sample_types ? sample_types.split(',').map((s) => s.trim()).filter(Boolean) : [],
        measurements: measurements ? measurements.split(',').map((s) => s.trim()).filter(Boolean) : [],
        specifications: specifications || '',
        keywords: keywords ? keywords.split(',').map((s) => s.trim()).filter(Boolean) : [],
        collegeId: college_name || 'Chitkara University',
        collegeName: college_name || 'Chitkara University',
        labName: lab_name || 'General Research Lab',
        building: building || 'Block A',
        roomNumber: room_number || '101',
        status: validStatus,
        availability: validStatus,
        condition: validCondition,
        maintenanceStatus: 'Up to Date',
        activeSessions: validStatus === 'Booked' ? 1 : 0,
        capacity: '4 / 6 stations',
        demandPrediction: aiDemand,
      });

      // Template availability for every equipment
      availabilityBatch.push({
        equipmentId: equipment_id,
        weeklyTemplate: {
          default: [{ start: 8 * 60, end: 20 * 60, status: 'available' }],
        },
        exceptions: [],
      });
    }
  }

  console.log(`Parsed ${equipmentBatch.length} equipment records. Inserting in bulk chunks of 1000...`);

  // Insert in chunks of 1000 for high speed and memory efficiency
  const CHUNK_SIZE = 1000;
  for (let i = 0; i < equipmentBatch.length; i += CHUNK_SIZE) {
    const chunk = equipmentBatch.slice(i, i + CHUNK_SIZE);
    await Equipment.insertMany(chunk, { ordered: false });
    console.log(`Inserted equipment ${i + 1} to ${Math.min(i + CHUNK_SIZE, equipmentBatch.length)}`);
  }

  // Insert availability in chunks
  console.log('Inserting availability templates...');
  for (let i = 0; i < availabilityBatch.length; i += CHUNK_SIZE) {
    const chunk = availabilityBatch.slice(i, i + CHUNK_SIZE);
    await Availability.insertMany(chunk, { ordered: false });
  }

  // 4. Seed sample Bookings
  console.log('Seeding Bookings...');
  const sampleBookings = [
    {
      bookingId: 'BR-1024',
      equipmentId: 'EQ00001',
      equipmentName: 'Digital Microscope',
      equipmentCategory: 'Microscopy',
      student: {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@student.chitkara.edu.in',
        avatar: 'RS',
        institution: 'Chitkara University',
        userId: studentUser._id,
      },
      lab: 'Electronics Lab',
      college: 'Chitkara University',
      building: 'Block B',
      room: '215',
      date: '2026-09-20',
      startTime: '10:00',
      endTime: '12:00',
      purpose: 'High magnification specimen inspection',
      status: 'Pending',
      requestedAt: new Date(),
    },
    {
      bookingId: 'BR-1023',
      equipmentId: 'EQ00002',
      equipmentName: 'Oscilloscope',
      equipmentCategory: 'Electronics',
      student: {
        name: 'Priya Singh',
        email: 'priya.singh@student.chitkara.edu.in',
        avatar: 'PS',
        institution: 'Punjab Engineering College',
      },
      lab: 'Mechanical Lab',
      college: 'Punjab Engineering College',
      building: 'Block A',
      room: '116',
      date: '2026-09-20',
      startTime: '14:00',
      endTime: '16:00',
      purpose: 'Voltage waveform transient analysis',
      status: 'Approved',
      approvedBy: 'Nikhil Palyal',
      approvedAt: new Date(),
      requestedAt: new Date(Date.now() - 3600000 * 3),
    },
    {
      bookingId: 'BR-1022',
      equipmentId: 'EQ00009',
      equipmentName: '3D Printer',
      equipmentCategory: 'Manufacturing',
      student: {
        name: 'Arjun Mehta',
        email: 'arjun.mehta@student.chitkara.edu.in',
        avatar: 'AM',
        institution: 'Punjab Engineering College',
      },
      lab: 'Computer Lab',
      college: 'Punjab Engineering College',
      building: 'Block A',
      room: '295',
      date: '2026-09-21',
      startTime: '11:00',
      endTime: '13:00',
      purpose: 'Functional prototype rapid printing',
      status: 'Pending',
      requestedAt: new Date(Date.now() - 3600000 * 5),
    },
  ];
  await Booking.insertMany(sampleBookings);
  console.log(`Seeded ${sampleBookings.length} bookings.`);

  // 5. Seed sample Usage Logs
  console.log('Seeding Usage Logs...');
  const sampleLogs = [
    {
      logId: 'UL-1024',
      bookingId: 'BR-1023',
      equipment: {
        equipmentId: 'EQ00002',
        name: 'Oscilloscope',
        category: 'Electronics',
      },
      student: {
        name: 'Priya Singh',
        email: 'priya.singh@student.chitkara.edu.in',
      },
      lab: 'Mechanical Lab',
      college: 'Punjab Engineering College',
      building: 'Block A',
      room: '116',
      date: '2026-09-20',
      scheduledStart: '14:00',
      scheduledEnd: '16:00',
      actualStart: '14:00',
      actualEnd: '',
      durationMinutes: 60,
      purpose: 'Voltage waveform analysis',
      status: 'Active',
      technician: 'Amit Kumar',
      notes: 'Active measurement underway. Probe impedance calibrated.',
    },
    {
      logId: 'UL-1023',
      bookingId: 'BR-1020',
      equipment: {
        equipmentId: 'EQ00001',
        name: 'Digital Microscope',
        category: 'Microscopy',
      },
      student: {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@student.chitkara.edu.in',
      },
      lab: 'Electronics Lab',
      college: 'Chitkara University',
      building: 'Block B',
      room: '215',
      date: '2026-09-19',
      scheduledStart: '10:00',
      scheduledEnd: '12:00',
      actualStart: '10:05',
      actualEnd: '11:55',
      durationMinutes: 110,
      purpose: 'High magnification sample imaging',
      status: 'Completed',
      technician: 'Amit Kumar',
      notes: 'Imaging concluded successfully. Raw TIFF captures saved.',
    },
  ];
  await UsageLog.insertMany(sampleLogs);
  console.log(`Seeded ${sampleLogs.length} usage logs.`);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('========================================================');
  console.log(`ALL DATA INSERTED INTO MONGODB IN ${durationSec}s!`);
  console.log(`Total Equipment in DB : ${equipmentBatch.length}`);
  console.log(`AI Demand Predictions : ${demandMap.size} linked`);
  console.log(`Database Name         : labcollab`);
  console.log(`MongoDB URI           : ${MONGO_URI}`);
  console.log('========================================================');
  process.exit(0);
}

seedAllData().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
