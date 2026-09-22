const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const User = require('../models/User');
const Equipment = require('../models/Equipment');
const Booking = require('../models/Booking');
const Availability = require('../models/Availability');
const UsageLog = require('../models/UsageLog');
const Institution = require('../models/Institution');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/labcollab';

const seedDatabase = async () => {
  try {
    console.log(`Connecting to MongoDB: ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('[MongoDB] Connected successfully.');

    // Clear existing data
    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Equipment.deleteMany({}),
      Booking.deleteMany({}),
      Availability.deleteMany({}),
      UsageLog.deleteMany({}),
      Institution.deleteMany({}),
    ]);
    await mongoose.connection.db.collection('usagelogs').dropIndexes().catch(() => {});
    console.log('Collections cleared.');

    // Seed Institutions
    console.log('Seeding Institutions...');
    const institutionsData = await Institution.insertMany([
      {
        institutionId: 'inst-1',
        name: 'Chitkara University',
        code: 'CU',
        city: 'Chandigarh',
        state: 'Punjab',
        type: 'university',
        isVerified: true,
      },
      {
        institutionId: 'inst-2',
        name: 'Punjab Engineering College (PEC)',
        code: 'PEC',
        city: 'Chandigarh',
        state: 'Chandigarh',
        type: 'university',
        isVerified: true,
      },
      {
        institutionId: 'inst-3',
        name: 'IIT Ropar',
        code: 'IITRPR',
        city: 'Rupnagar',
        state: 'Punjab',
        type: 'university',
        isVerified: true,
      },
    ]);
    console.log(`${institutionsData.length} Institutions seeded.`);

    // 1. Seed Users
    console.log('Seeding Users...');
    const adminUser = await User.create({
      name: 'Akash Sharma',
      email: 'akak9781189@gmail.com',
      password: 'Akash@123',
      role: 'admin',
      institution: 'Chitkara University',
      department: 'Central Instrumentation Facility / Admin',
      avatar: 'AS',
    });

    const adminUser2 = await User.create({
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
      department: 'Electronics Engineering',
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
      department: 'Central Instrumentation Facility',
      avatar: 'AK',
    });
    console.log(`Users seeded: Admin (${adminUser.email}), Students, Technician.`);

    // 2. Read Demand Predictions from AI Model CSV
    console.log('Reading AI Demand Predictions...');
    const demandPredictionsMap = new Map();
    const demandCsvPath = path.resolve(
      __dirname,
      '../../../ai-models/demand-prediction/data/demand_predictions.csv'
    );
    if (fs.existsSync(demandCsvPath)) {
      const demandLines = fs.readFileSync(demandCsvPath, 'utf-8').split('\n').filter((l) => l.trim().length > 0);
      for (let i = 1; i < demandLines.length; i++) {
        const parts = demandLines[i].split(',').map((p) => p.trim());
        if (parts.length >= 5) {
          const [eqId, date, predBookings, demandLevel, histAvg] = parts;
          demandPredictionsMap.set(eqId, {
            predictedBookings: parseFloat(predBookings) || 0,
            demandLevel: demandLevel || 'LOW',
            historicalAverage: parseFloat(histAvg) || 0,
            predictionDate: date,
          });
        }
      }
      console.log(`Loaded ${demandPredictionsMap.size} demand predictions.`);
    }

    // 3. Seed Primary Equipment (harmonized with adminMockData & AI dataset)
    console.log('Seeding Equipment...');
    const primaryEquipment = [
      {
        equipmentId: 'EQ-OSC-001',
        equipmentNumber: 'EQ-OSC-001',
        equipmentName: 'Digital Storage Oscilloscope',
        category: 'Electronics',
        description: 'High-performance digital storage oscilloscope with 4 channels, 1 GHz bandwidth, and 5 GS/s sample rate. Ideal for advanced electronics research and debugging.',
        capabilities: ['4-channel acquisition', '1 GHz bandwidth', '5 GS/s sample rate', 'Advanced triggering', 'FFT analysis', 'Protocol decoding'],
        applications: ['Circuit debugging', 'Signal integrity analysis', 'Power electronics testing', 'Embedded systems development'],
        experimentTypes: ['Transient analysis', 'Frequency response', 'Power supply ripple', 'Digital signal timing'],
        sampleTypes: ['Electronic signals', 'Power waveforms', 'Digital buses', 'RF signals'],
        measurements: ['Voltage', 'Current', 'Frequency', 'Phase', 'Rise/fall time', 'Duty cycle'],
        specifications: {
          bandwidth: '1 GHz',
          channels: 4,
          sampleRate: '5 GS/s',
          memoryDepth: '250 Mpts',
          verticalResolution: '12-bit',
          triggerTypes: ['Edge', 'Pulse', 'Video', 'Pattern', 'Protocol'],
        },
        keywords: ['oscilloscope', 'electronics', 'debugging', 'signal analysis', 'test equipment'],
        collegeId: 'Chitkara University',
        collegeName: 'Chitkara University',
        labName: 'Electronics Lab 2',
        building: 'Block C',
        roomNumber: 'C-204',
        availability: 'Available',
        status: 'Available',
        condition: 'Excellent',
        maintenanceStatus: 'Up to Date',
        activeSessions: 3,
        capacity: '12 / 16 stations',
        demandPrediction: {
          predictedBookings: 4.59,
          demandLevel: 'HIGH',
          historicalAverage: 9.61,
          predictionDate: '2026-09-20',
        },
      },
      {
        equipmentId: 'EQ-3DP-001',
        equipmentNumber: 'EQ-3DP-001',
        equipmentName: '3D Printer - Industrial FDM',
        category: 'Fabrication',
        description: 'Industrial-grade FDM 3D printer with heated chamber, dual extrusion, and 300x300x400mm build volume. Supports engineering-grade materials.',
        capabilities: ['Dual extrusion', 'Heated chamber (80°C)', '300x300x400mm build volume', 'Auto bed leveling', 'Filament runout detection', 'Power loss recovery'],
        applications: ['Functional prototyping', 'Tooling and fixtures', 'End-use parts', 'Mechanical engineering projects'],
        experimentTypes: ['Material testing', 'Dimensional accuracy studies', 'Thermal property analysis', 'Structural validation'],
        sampleTypes: ['PLA', 'ABS', 'PETG', 'Nylon', 'Polycarbonate', 'Carbon fiber composites'],
        measurements: ['Dimensional accuracy', 'Layer adhesion', 'Surface finish', 'Print time', 'Material usage'],
        specifications: {
          technology: 'FDM',
          buildVolume: '300 x 300 x 400 mm',
          layerResolution: '50-300 microns',
          maxNozzleTemp: '300°C',
          maxBedTemp: '120°C',
        },
        keywords: ['3d printer', 'fdm', 'prototyping', 'fabrication', 'additive manufacturing'],
        collegeId: 'Chitkara University',
        collegeName: 'Chitkara University',
        labName: 'Fabrication Lab',
        building: 'Block B',
        roomNumber: 'B-102',
        availability: 'Booked',
        status: 'Booked',
        condition: 'Good',
        maintenanceStatus: 'Up to Date',
        activeSessions: 4,
        capacity: '6 / 8 stations',
        demandPrediction: {
          predictedBookings: 4.38,
          demandLevel: 'HIGH',
          historicalAverage: 9.3,
          predictionDate: '2026-09-20',
        },
      },
      {
        equipmentId: 'EQ-MIC-001',
        equipmentNumber: 'EQ-MIC-001',
        equipmentName: 'Digital Microscope - High Resolution',
        category: 'Imaging',
        description: 'Research-grade digital microscope with 1000x optical magnification, motorized stage, and integrated camera for documentation.',
        capabilities: ['1000x optical magnification', 'Motorized XY stage', 'Z-stacking', '5MP camera', 'LED ring light'],
        applications: ['Materials science', 'Biological sample imaging', 'Surface defect analysis', 'Microelectronics inspection'],
        experimentTypes: ['Particle size analysis', 'Surface morphology', 'Coating thickness', 'Failure analysis'],
        sampleTypes: ['Metals', 'Polymers', 'Biological tissues', 'Semiconductors', 'Ceramics'],
        measurements: ['Length', 'Area', 'Particle count', 'Surface roughness', 'Layer thickness'],
        specifications: {
          magnification: '10x - 1000x (optical), up to 5000x (digital)',
          camera: '5MP CMOS',
          objectives: ['4x', '10x', '40x', '100x (oil)'],
        },
        keywords: ['microscope', 'imaging', 'materials science', 'inspection', 'metrology'],
        collegeId: 'Chitkara University',
        collegeName: 'Chitkara University',
        labName: 'Materials Lab',
        building: 'Block A',
        roomNumber: 'A-301',
        availability: 'Available',
        status: 'Available',
        condition: 'Excellent',
        maintenanceStatus: 'Due Soon',
        activeSessions: 2,
        capacity: '4 / 6 stations',
        demandPrediction: {
          predictedBookings: 3.12,
          demandLevel: 'MEDIUM',
          historicalAverage: 7.2,
          predictionDate: '2026-09-20',
        },
      },
      {
        equipmentId: 'EQ-FG-001',
        equipmentNumber: 'EQ-FG-001',
        equipmentName: 'Function Generator - Arbitrary Waveform',
        category: 'Electronics',
        description: 'Dual-channel arbitrary waveform generator with 60 MHz bandwidth, 14-bit resolution, and 1.25 GS/s sample rate.',
        capabilities: ['Dual channel', '60 MHz bandwidth', '1.25 GS/s sample rate', '14-bit vertical resolution', 'Arbitrary waveform generation'],
        applications: ['Circuit simulation', 'Sensor simulation', 'Communication system testing', 'Control system validation'],
        experimentTypes: ['Frequency response', 'Transient response', 'Modulation analysis'],
        sampleTypes: ['Analog waveforms', 'Digital patterns', 'Modulated signals'],
        measurements: ['Frequency', 'Amplitude', 'Phase', 'Distortion'],
        specifications: {
          channels: 2,
          bandwidth: '60 MHz',
          sampleRate: '1.25 GS/s',
        },
        keywords: ['function generator', 'signal generator', 'electronics', 'simulation'],
        collegeId: 'Chitkara University',
        collegeName: 'Chitkara University',
        labName: 'Electronics Lab 1',
        building: 'Block C',
        roomNumber: 'C-101',
        availability: 'Maintenance',
        status: 'Maintenance',
        condition: 'Fair',
        maintenanceStatus: 'Under Maintenance',
        activeSessions: 0,
        capacity: '8 / 10 stations',
        demandPrediction: {
          predictedBookings: 1.85,
          demandLevel: 'LOW',
          historicalAverage: 4.1,
          predictionDate: '2026-09-20',
        },
      },
      {
        equipmentId: 'EQ-CNC-001',
        equipmentNumber: 'EQ-CNC-001',
        equipmentName: 'CNC Milling Machine - 5 Axis',
        category: 'Fabrication',
        description: '5-axis CNC milling machine with 24-tool changer, high-speed spindle, and advanced probing for precision machining.',
        capabilities: ['5-axis simultaneous', '24-tool ATC', '24,000 RPM spindle', 'Renishaw probing'],
        applications: ['Complex part machining', 'Mold making', 'Aerospace components', 'Medical device manufacturing'],
        experimentTypes: ['Surface finish studies', 'Tool wear analysis', 'Dimensional accuracy'],
        sampleTypes: ['Aluminum', 'Steel', 'Titanium', 'Composites', 'Plastics'],
        measurements: ['Dimensional accuracy', 'Surface roughness', 'Tool life', 'Cycle time'],
        specifications: {
          axes: '5 (X, Y, Z, A, C)',
          travel: 'X: 800mm, Y: 600mm, Z: 500mm',
          spindleSpeed: '24,000 RPM',
        },
        keywords: ['cnc', 'milling', '5-axis', 'machining', 'precision'],
        collegeId: 'Chitkara University',
        collegeName: 'Chitkara University',
        labName: 'Advanced Manufacturing Lab',
        building: 'Block D',
        roomNumber: 'D-001',
        availability: 'Available',
        status: 'Available',
        condition: 'Good',
        maintenanceStatus: 'Up to Date',
        activeSessions: 1,
        capacity: '2 / 4 stations',
        demandPrediction: {
          predictedBookings: 2.9,
          demandLevel: 'MEDIUM',
          historicalAverage: 5.4,
          predictionDate: '2026-09-20',
        },
      },
      {
        equipmentId: 'EQ-SA-001',
        equipmentNumber: 'EQ-SA-001',
        equipmentName: 'Spectrum Analyzer - Real-Time',
        category: 'RF & Communications',
        description: 'Real-time spectrum analyzer with 9 kHz - 6.5 GHz range, 40 MHz real-time bandwidth, and advanced signal analysis.',
        capabilities: ['9 kHz - 6.5 GHz', '40 MHz real-time bandwidth', '160 MHz analysis bandwidth', 'Phase noise measurement'],
        applications: ['RF design validation', 'EMI/EMC testing', 'Wireless protocol analysis', 'Interference hunting'],
        experimentTypes: ['Spectrum monitoring', 'Transient capture', 'Modulation analysis'],
        sampleTypes: ['RF signals', 'Modulated carriers', 'Pulsed signals'],
        measurements: ['Frequency', 'Power', 'Bandwidth', 'Phase noise'],
        specifications: {
          frequencyRange: '9 kHz - 6.5 GHz',
          realTimeBandwidth: '40 MHz',
        },
        keywords: ['spectrum analyzer', 'rf', 'communications', 'wireless'],
        collegeId: 'Chitkara University',
        collegeName: 'Chitkara University',
        labName: 'RF & Communications Lab',
        building: 'Block C',
        roomNumber: 'C-305',
        availability: 'Available',
        status: 'Available',
        condition: 'Excellent',
        maintenanceStatus: 'Up to Date',
        activeSessions: 1,
        capacity: '4 / 6 stations',
        price: 600,
        priceLabel: '₹600',
        rating: 4.8,
        operator: 'Self-Operated (Trained)',
        location: 'Punjab',
        state: 'Punjab',
        tags: ['Spectrum', 'RF', '9 kHz - 6.5 GHz'],
        visualType: 'generic',
        demandPrediction: {
          predictedBookings: 1.45,
          demandLevel: 'LOW',
          historicalAverage: 3.2,
          predictionDate: '2026-09-20',
        },
      },
      {
        equipmentId: 'inst-1',
        equipmentNumber: 'inst-1',
        equipmentName: 'Zeiss LSM 980 Confocal Microscope',
        category: 'life-sciences',
        description: 'Airyscan 2 super-resolution (120nm lateral), 4 laser lines (405, 488, 561, 633nm), incubation chamber for live-cell kinetics.',
        capabilities: ['Airyscan 2 super-resolution', 'Live-cell imaging', 'Multiplex mode', '4 laser lines', 'Spectral detection'],
        applications: ['Live cell imaging', 'Fluorescence microscopy', 'Deep tissue sectioning', 'Protein localization'],
        experimentTypes: ['Live kinetics', 'FRAP', 'FRET', 'Colocalization analysis'],
        sampleTypes: ['Mammalian cells', 'Tissue sections', 'Organoids', 'Fixed specimens'],
        measurements: ['Fluorescence intensity', '3D spatial resolution', 'Fluorophore lifetime'],
        specifications: {
          laserLines: '405, 488, 561, 633 nm',
          detector: 'Airyscan 2 Multiplex',
          resolution: '120 nm lateral, 350 nm axial',
          objective: '63x / 1.4 Oil Plan-Apo'
        },
        keywords: ['confocal', 'microscope', 'zeiss', 'airyscan', 'fluorescence', 'imaging'],
        collegeId: 'IIT Delhi',
        collegeName: 'IIT Delhi',
        labName: 'Central Advanced Imaging Facility',
        building: 'Block 4',
        roomNumber: 'LSM-101',
        location: 'New Delhi',
        state: 'Delhi',
        price: 1200,
        priceLabel: '₹1,200',
        rating: 4.9,
        operator: 'Operator Included',
        availability: 'Available',
        status: 'Available',
        condition: 'Excellent',
        maintenanceStatus: 'Up to Date',
        visualType: 'microscope',
        tags: ['Confocal', 'High Resolution', 'Live Cell Imaging'],
        slotsToday: ['14:00 - 16:00', '16:30 - 18:30'],
        demandPrediction: {
          predictedBookings: 4.57,
          demandLevel: 'HIGH',
          historicalAverage: 8.8,
          predictionDate: '2026-09-20'
        }
      },
      {
        equipmentId: 'inst-2',
        equipmentNumber: 'inst-2',
        equipmentName: 'Thermo Scientific SEM (Quattro S)',
        category: 'analytical',
        description: 'Field Emission Environmental SEM, high-resolution secondary electron detector, Oxford Instruments Ultim Max EDX detector.',
        capabilities: ['Field Emission gun', 'Environmental mode', 'High vacuum and low vacuum', 'EDX elemental mapping'],
        applications: ['Nanostructure surface characterization', 'Failure analysis', 'Elemental composition', 'Biological samples without coating'],
        experimentTypes: ['Surface topography', 'EDX spectrometry', 'In-situ heating experiments'],
        sampleTypes: ['Metals', 'Ceramics', 'Polymers', 'Hydrated biological samples'],
        measurements: ['Particle size', 'Surface morphology', 'Elemental weight %'],
        specifications: {
          resolution: '1.0 nm at 30 kV',
          accelerationVoltage: '200 V to 30 kV',
          detector: 'Ultim Max 100 EDX',
        },
        keywords: ['sem', 'electron microscope', 'edx', 'surface analysis', 'nanotechnology'],
        collegeId: 'BITS Pilani',
        collegeName: 'BITS Pilani',
        labName: 'Materials & Characterization Lab',
        building: 'Nano Science Center',
        roomNumber: 'SEM-02',
        location: 'Rajasthan',
        state: 'Rajasthan',
        price: 1500,
        priceLabel: '₹1,500',
        rating: 4.8,
        operator: 'Assisted or Self-Operated',
        availability: 'Available',
        status: 'Available',
        condition: 'Excellent',
        maintenanceStatus: 'Up to Date',
        visualType: 'sem',
        tags: ['Scanning Electron', 'High Magnification', 'EDX'],
        slotsToday: ['11:00 - 13:00'],
        demandPrediction: {
          predictedBookings: 3.8,
          demandLevel: 'MEDIUM',
          historicalAverage: 6.5,
          predictionDate: '2026-09-20'
        }
      },
      {
        equipmentId: 'inst-3',
        equipmentNumber: 'inst-3',
        equipmentName: 'Formlabs Form 3+ SLA Printer',
        category: 'mechanical',
        description: 'Low Force Stereolithography (LFS), 25-micron laser spot size, biocompatible and engineering resin support.',
        capabilities: ['LFS printing', '25-micron laser spot', 'Automated resin handling', 'Heated resin tank'],
        applications: ['High precision prototypes', 'Dental models', 'Microfluidics masters', 'End-use components'],
        experimentTypes: ['Additive manufacturing validation', 'Fluidic channel fabrication'],
        sampleTypes: ['Standard resin', 'Clear resin', 'Tough resin', 'Flexible resin'],
        measurements: ['Dimensional accuracy', 'Layer fidelity'],
        specifications: {
          buildVolume: '145 x 145 x 185 mm',
          layerThickness: '25 - 300 microns',
          laserPower: '250 mW'
        },
        keywords: ['sla', '3d printer', 'formlabs', 'additive manufacturing', 'rapid prototyping'],
        collegeId: 'Chitkara University',
        collegeName: 'Chitkara University',
        labName: 'Fabrication & Prototyping Center',
        building: 'Block B',
        roomNumber: 'B-105',
        location: 'Punjab',
        state: 'Punjab',
        price: 200,
        priceLabel: '₹200',
        rating: 4.7,
        operator: 'Self-Operated (Trained)',
        availability: 'Available',
        status: 'Available',
        condition: 'Good',
        maintenanceStatus: 'Up to Date',
        visualType: 'printer',
        tags: ['SLA', 'High Precision', 'Prototyping'],
        slotsToday: ['09:00 - 12:00', '13:00 - 16:00'],
        demandPrediction: {
          predictedBookings: 2.9,
          demandLevel: 'MEDIUM',
          historicalAverage: 5.1,
          predictionDate: '2026-09-20'
        }
      },
      {
        equipmentId: 'inst-4',
        equipmentNumber: 'inst-4',
        equipmentName: 'Bio-Rad T100 Thermal Cycler',
        category: 'life-sciences',
        description: '96-well fast reaction module, dynamic thermal gradient spanning 1-25°C across block, intuitive touchscreen UI.',
        capabilities: ['Thermal gradient 1-25°C', '96-well block', 'Fast ramp rates (4°C/sec)', 'Heated lid'],
        applications: ['PCR amplification', 'Genotyping', 'Cloning', 'Sequencing prep'],
        experimentTypes: ['Gene amplification', 'Annealing temperature optimization'],
        sampleTypes: ['DNA', 'cDNA', 'RNA primers'],
        measurements: ['Cycle threshold', 'Amplicon size'],
        specifications: {
          thermalRange: '4 - 100°C',
          gradientRange: '30 - 100°C',
          wellFormat: '96 x 0.2 mL'
        },
        keywords: ['pcr', 'thermal cycler', 'bio-rad', 'genomics', 'dna amplification'],
        collegeId: 'Amity University',
        collegeName: 'Amity University',
        labName: 'Molecular Biology Lab',
        building: 'Life Sciences Wing',
        roomNumber: 'PCR-302',
        location: 'Noida',
        state: 'Uttar Pradesh',
        price: 300,
        priceLabel: '₹300',
        rating: 4.9,
        operator: 'Self-Operated',
        availability: 'Available',
        status: 'Available',
        condition: 'Excellent',
        maintenanceStatus: 'Up to Date',
        visualType: 'cycler',
        tags: ['PCR', '96 Wells', 'Thermal Gradient'],
        slotsToday: ['10:00 - 11:30', '15:00 - 16:30'],
        demandPrediction: {
          predictedBookings: 4.38,
          demandLevel: 'HIGH',
          historicalAverage: 7.9,
          predictionDate: '2026-09-20'
        }
      },
      {
        equipmentId: 'inst-5',
        equipmentNumber: 'inst-5',
        equipmentName: 'Bruker D8 Advance XRD',
        category: 'analytical',
        description: 'Cu Ka source (40kV, 40mA), LYNXEYE XE-T energy-dispersive detector, high-temperature Anton Paar chamber up to 1200°C.',
        capabilities: ['LYNXEYE XE-T detector', 'Powder and thin film diffraction', 'High temperature chamber (1200°C)', 'Phase identification'],
        applications: ['Crystallography', 'Thin film analysis', 'Residual stress', 'Phase composition'],
        experimentTypes: ['Powder diffraction', 'Grazing incidence XRD', 'In-situ thermal phase transition'],
        sampleTypes: ['Polycrystalline powders', 'Thin films', 'Bulk crystalline solids'],
        measurements: ['2θ diffraction angles', 'Lattice parameters', 'Crystallite size', 'Microstrain'],
        specifications: {
          xraySource: 'Cu Ka (λ = 1.5406 Å)',
          goniometerRadius: '280 mm',
          angularRange: '-110° to 168° 2θ'
        },
        keywords: ['xrd', 'bruker', 'x-ray diffraction', 'crystallography', 'materials characterization'],
        collegeId: 'Tufts University',
        collegeName: 'Tufts University',
        labName: 'X-Ray Diffraction Facility',
        building: 'Science & Engineering Complex',
        roomNumber: 'XRD-104',
        location: 'Boston / Global Grid',
        state: 'International',
        price: 850,
        priceLabel: '₹850',
        rating: 4.9,
        operator: 'Operator Included',
        availability: 'Available',
        status: 'Available',
        condition: 'Excellent',
        maintenanceStatus: 'Up to Date',
        visualType: 'xrd',
        tags: ['Powder XRD', 'Thin Film', 'LYNXEYE XE-T'],
        slotsToday: ['14:00 - 16:00'],
        demandPrediction: {
          predictedBookings: 3.5,
          demandLevel: 'MEDIUM',
          historicalAverage: 6.2,
          predictionDate: '2026-09-20'
        }
      },
      {
        equipmentId: 'inst-6',
        equipmentNumber: 'inst-6',
        equipmentName: 'Tektronix MSO54B Oscilloscope',
        category: 'electronics',
        description: '2 GHz bandwidth, 6.25 GS/s sample rate, 4 FlexChannel inputs, 16-bit high-res mode, integrated spectrum analyzer.',
        capabilities: ['4 FlexChannels', '2 GHz bandwidth', '6.25 GS/s real-time sample rate', '16-bit resolution', 'Digital phosphor display'],
        applications: ['Transient response testing', 'Embedded bus decoding (I2C, SPI, CAN)', 'Power integrity', 'RF signal debugging'],
        experimentTypes: ['Waveform analysis', 'Rise-time measurement', 'Jitter analysis', 'FFT spectrum analysis'],
        sampleTypes: ['Analog circuits', 'Digital logic', 'Switch-mode power supplies', 'Microcontroller buses'],
        measurements: ['Voltage peak-to-peak', 'Frequency', 'Rise time', 'Phase skew', 'Harmonic distortion'],
        specifications: {
          bandwidth: '2 GHz',
          channels: 4,
          sampleRate: '6.25 GS/s',
          recordLength: '62.5 Mpoints'
        },
        keywords: ['oscilloscope', 'tektronix', 'mso54b', 'transient testing', 'waveform analysis', 'electronics'],
        collegeId: 'UMass Lowell',
        collegeName: 'UMass Lowell',
        labName: 'VLSI & High-Speed Circuits Lab',
        building: 'Engineering Building',
        roomNumber: 'EE-412',
        location: 'Lowell, MA',
        state: 'International',
        price: 450,
        priceLabel: '₹450',
        rating: 4.8,
        operator: 'Self-Operated (Trained)',
        availability: 'Available',
        status: 'Available',
        condition: 'Excellent',
        maintenanceStatus: 'Up to Date',
        visualType: 'oscilloscope',
        tags: ['2 GHz', '4 FlexChannels', 'High Resolution'],
        slotsToday: ['09:00 - 11:00', '13:00 - 15:00', '16:00 - 18:00'],
        demandPrediction: {
          predictedBookings: 4.59,
          demandLevel: 'HIGH',
          historicalAverage: 9.6,
          predictionDate: '2026-09-20'
        }
      },
      {
        equipmentId: 'inst-7',
        equipmentNumber: 'inst-7',
        equipmentName: 'Agilent 8890 GC-MS System',
        category: 'chemical',
        description: 'Gas chromatography single quadrupole mass spectrometer, 7693A autosampler, inert EI source, MassHunter workstation.',
        capabilities: ['Single quad MS', '7693A 150-vial autosampler', 'Inert Extractor EI source', 'Retention time locking'],
        applications: ['Volatile organic compound (VOC) testing', 'Environmental trace analysis', 'Forensic screening', 'Pesticide residue testing'],
        experimentTypes: ['Chromatographic separation', 'Mass spectral fragmentation', 'Quantitative SIM mode'],
        sampleTypes: ['Organic solvents', 'Environmental water extracts', 'Biological fluids', 'Plant essential oils'],
        measurements: ['m/z ratio', 'Retention time', 'Peak area quantification', 'Mass spectrum matching'],
        specifications: {
          massRange: '1.2 - 1050 u',
          ovenTempRange: '4°C to 450°C',
          carrierGas: 'Helium / Hydrogen'
        },
        keywords: ['gcms', 'agilent', 'chromatography', 'mass spectrometry', 'chemical analysis'],
        collegeId: 'Northeastern University',
        collegeName: 'Northeastern University',
        labName: 'Analytical Chemistry Core',
        building: 'Hurtig Hall',
        roomNumber: 'CH-220',
        location: 'Boston, MA',
        state: 'International',
        price: 1800,
        priceLabel: '₹1,800',
        rating: 4.9,
        operator: 'Operator Included',
        availability: 'Available',
        status: 'Available',
        condition: 'Excellent',
        maintenanceStatus: 'Up to Date',
        visualType: 'gcms',
        tags: ['Gas Chromatography', 'Mass Spec', 'Autosampler'],
        slotsToday: ['13:30 - 16:30'],
        demandPrediction: {
          predictedBookings: 4.02,
          demandLevel: 'HIGH',
          historicalAverage: 7.5,
          predictionDate: '2026-09-20'
        }
      },
      {
        equipmentId: 'inst-8',
        equipmentNumber: 'inst-8',
        equipmentName: 'Malvern Zetasizer Ultra',
        category: 'analytical',
        description: 'Multi-angle dynamic light scattering (MADLS) particle size (0.3nm - 10µm), particle concentration and zeta potential measurement.',
        capabilities: ['MADLS technology', 'Zeta potential measurement', 'Particle concentration measurement', 'Adaptive correlation'],
        applications: ['Nanoparticle size distribution', 'Colloidal stability', 'Protein aggregation', 'Polymer molecular weight'],
        experimentTypes: ['DLS sizing', 'Electrophoretic mobility', 'Thermal ramp stability'],
        sampleTypes: ['Nanoparticle suspensions', 'Liposomes', 'Proteins', 'Emulsions'],
        measurements: ['Hydrodynamic diameter', 'Polydispersity index (PDI)', 'Zeta potential (mV)', 'Particles/mL'],
        specifications: {
          sizeRange: '0.3 nm - 10 µm',
          zetaRange: '> +/- 500 mV',
          sampleVolume: '3 µL - 1 mL'
        },
        keywords: ['zetasizer', 'malvern', 'dls', 'zeta potential', 'nanoparticles', 'colloid'],
        collegeId: 'Punjab Engineering College',
        collegeName: 'Punjab Engineering College',
        labName: 'Nanomaterials Characterization Lab',
        building: 'Mechanical & Materials Block',
        roomNumber: 'NM-112',
        location: 'Chandigarh',
        state: 'Punjab',
        price: 950,
        priceLabel: '₹950',
        rating: 4.8,
        operator: 'Operator Included',
        availability: 'Available',
        status: 'Available',
        condition: 'Excellent',
        maintenanceStatus: 'Up to Date',
        visualType: 'zetasizer',
        tags: ['DLS', 'Zeta Potential', 'Sub-Nanometer'],
        slotsToday: ['10:00 - 12:00', '14:30 - 16:30'],
        demandPrediction: {
          predictedBookings: 2.8,
          demandLevel: 'MEDIUM',
          historicalAverage: 5.2,
          predictionDate: '2026-09-20'
        }
      }
    ];

    const insertedEquipment = await Equipment.insertMany(primaryEquipment);
    console.log(`Total ${insertedEquipment.length} equipment seeded in MongoDB.`);

    // 4. Seed Availability
    console.log('Seeding Availability Templates & Exceptions...');
    const availDocs = insertedEquipment.map((eq) => ({
      equipmentId: eq.equipmentId,
      weeklyTemplate: {
        default: [{ start: 8 * 60, end: 20 * 60, status: 'available' }],
      },
      exceptions: [
        {
          id: `exc-${eq.equipmentId}-1`,
          date: '2026-09-21',
          start: 13 * 60,
          end: 15 * 60,
          status: 'blocked',
          reason: 'Scheduled sensor calibration and inspection',
        },
      ],
    }));
    await Availability.insertMany(availDocs);
    console.log('Availability seeded.');

    // 5. Seed Bookings
    console.log('Seeding Bookings...');
    const bookingsData = [
      {
        bookingId: 'BR-1024',
        equipmentId: 'EQ-OSC-001',
        equipmentName: 'Digital Storage Oscilloscope',
        equipmentCategory: 'Electronics',
        student: {
          name: 'Rahul Sharma',
          email: 'rahul.sharma@student.chitkara.edu.in',
          avatar: 'RS',
          institution: 'Chitkara University',
          userId: studentUser._id,
        },
        lab: 'Electronics Lab 2',
        college: 'Chitkara University',
        building: 'Block C',
        room: 'C-204',
        date: '2026-09-20',
        startTime: '10:00',
        endTime: '12:00',
        purpose: 'Signal integrity analysis and power electronics testing',
        status: 'Pending',
        requestedAt: new Date(Date.now() - 3600000 * 2),
      },
      {
        bookingId: 'BR-1023',
        equipmentId: 'EQ-3DP-001',
        equipmentName: '3D Printer - Industrial FDM',
        equipmentCategory: 'Fabrication',
        student: {
          name: 'Priya Singh',
          email: 'priya.singh@student.chitkara.edu.in',
          avatar: 'PS',
          institution: 'Chitkara University',
        },
        lab: 'Fabrication Lab',
        college: 'Chitkara University',
        building: 'Block B',
        room: 'B-102',
        date: '2026-09-20',
        startTime: '14:00',
        endTime: '16:00',
        purpose: 'Drone chassis prototype 3D printing',
        status: 'Approved',
        approvedBy: 'Nikhil Palyal',
        approvedAt: new Date(Date.now() - 3600000 * 5),
        requestedAt: new Date(Date.now() - 3600000 * 8),
      },
      {
        bookingId: 'BR-1022',
        equipmentId: 'EQ-MIC-001',
        equipmentName: 'Digital Microscope - High Resolution',
        equipmentCategory: 'Imaging',
        student: {
          name: 'Arjun Mehta',
          email: 'arjun.mehta@student.chitkara.edu.in',
          avatar: 'AM',
          institution: 'Chitkara University',
        },
        lab: 'Materials Lab',
        college: 'Chitkara University',
        building: 'Block A',
        room: 'A-301',
        date: '2026-09-21',
        startTime: '11:00',
        endTime: '13:00',
        purpose: 'Surface morphology of composite polymers',
        status: 'Pending',
        requestedAt: new Date(Date.now() - 3600000 * 12),
      },
      {
        bookingId: 'BR-1021',
        equipmentId: 'EQ-FG-001',
        equipmentName: 'Function Generator - Arbitrary Waveform',
        equipmentCategory: 'Electronics',
        student: {
          name: 'Ananya Gupta',
          email: 'ananya.gupta@student.chitkara.edu.in',
          avatar: 'AG',
          institution: 'Chitkara University',
        },
        lab: 'Electronics Lab 1',
        college: 'Chitkara University',
        building: 'Block C',
        room: 'C-101',
        date: '2026-09-21',
        startTime: '15:00',
        endTime: '17:00',
        purpose: 'Frequency response analysis',
        status: 'Rejected',
        rejectionReason: 'Equipment scheduled for routine maintenance.',
        approvedBy: 'Nikhil Palyal',
        requestedAt: new Date(Date.now() - 3600000 * 20),
      },
      {
        bookingId: 'BR-1020',
        equipmentId: 'EQ-CNC-001',
        equipmentName: 'CNC Milling Machine - 5 Axis',
        equipmentCategory: 'Fabrication',
        student: {
          name: 'Vikram Singh',
          email: 'vikram.singh@student.chitkara.edu.in',
          avatar: 'VS',
          institution: 'Chitkara University',
        },
        lab: 'Advanced Manufacturing Lab',
        college: 'Chitkara University',
        building: 'Block D',
        room: 'D-001',
        date: '2026-09-22',
        startTime: '09:00',
        endTime: '12:00',
        purpose: 'Turbine blade precision machining',
        status: 'Approved',
        approvedBy: 'Nikhil Palyal',
        approvedAt: new Date(Date.now() - 3600000 * 10),
        requestedAt: new Date(Date.now() - 3600000 * 24),
      },
    ];
    await Booking.insertMany(bookingsData);
    console.log(`${bookingsData.length} Recent Bookings seeded.`);

    // 5b. Seed Synthetic Historical Bookings for AI Demand Prediction
    console.log('Generating synthetic historical bookings for AI Demand Prediction...');
    const historicalBookings = [];
    const historicalPurposes = [
      'Material surface characterization',
      'Spectroscopy data collection',
      'Nano-particle sizing session',
      'Structural diffraction analysis',
      'Composite material stress testing',
      'Thin film deposition measurement',
      'Polymer crystallization experiment',
      'Biological sample imaging',
      'RF signal integrity testing',
      'Circuit board prototyping',
    ];

    const nowTime = Date.now();
    let histCounter = 100;

    for (const eq of insertedEquipment) {
      const eqTitle = eq.equipmentName || eq.name || '';
      const isHighDemand = ['Zeiss LSM 980 Confocal Microscope', 'Thermo Scientific SEM (Quattro S)', 'Agilent 8890 GC-MS System', 'Digital Storage Oscilloscope', '3D Printer - Industrial FDM'].some((name) => eqTitle.includes(name));
      const isMediumDemand = ['Bruker D8 Advance XRD', 'Malvern Zetasizer Ultra', 'Formlabs Form 3+ SLA Printer', 'Bio-Rad T100 Thermal Cycler'].some((name) => eqTitle.includes(name));
      const bookingCount = isHighDemand ? 14 : isMediumDemand ? 7 : 3;

      for (let k = 0; k < bookingCount; k++) {
        histCounter++;
        const daysAgo = Math.floor(Math.random() * 45) + 1;
        const pastDate = new Date(nowTime - daysAgo * 24 * 3600 * 1000);
        const dateStr = pastDate.toISOString().split('T')[0];
        const startH = 9 + (k % 8);
        const startStr = `${startH.toString().padStart(2, '0')}:00`;
        const endStr = `${(startH + 2).toString().padStart(2, '0')}:00`;

        historicalBookings.push({
          bookingId: `HIST-${histCounter}`,
          equipmentId: eq.equipmentId,
          equipmentName: eqTitle,
          equipmentCategory: eq.category,
          equipment: eq._id,
          student: {
            name: `Synthetic Researcher ${histCounter % 8 + 1}`,
            email: `synthetic.researcher${histCounter % 8 + 1}@synthetic.labcollab.edu`,
            avatar: `SR`,
            institution: eq.collegeName || 'Chitkara University',
          },
          college: eq.collegeName || 'Chitkara University',
          lab: eq.labName || 'Central Research Lab',
          building: eq.building || 'Block A',
          room: eq.roomNumber || '101',
          date: dateStr,
          startTime: startStr,
          endTime: endStr,
          duration: 2,
          purpose: historicalPurposes[histCounter % historicalPurposes.length],
          status: 'Approved',
          approvedBy: 'Platform AI System',
          approvedAt: pastDate,
          totalPrice: (eq.price || 500) * 2,
          totalAmount: (eq.price || 500) * 2,
          paymentStatus: 'paid',
          isHistorical: true,
          createdAt: pastDate,
        });
      }
    }

    if (historicalBookings.length > 0) {
      await Booking.insertMany(historicalBookings);
      console.log(`Seeded ${historicalBookings.length} synthetic historical bookings into MongoDB.`);
    }

    // 6. Seed Usage Logs
    console.log('Seeding Usage Logs...');
    const usageLogsData = [
      {
        logId: 'UL-1024',
        bookingId: 'BR-1024',
        equipment: {
          equipmentId: 'EQ-OSC-001',
          name: 'Digital Storage Oscilloscope',
          category: 'Electronics',
        },
        student: {
          name: 'Rahul Sharma',
          email: 'rahul.sharma@student.chitkara.edu.in',
        },
        lab: 'Electronics Lab 2',
        college: 'Chitkara University',
        building: 'Block C',
        room: 'C-204',
        date: '2026-09-20',
        scheduledStart: '10:00',
        scheduledEnd: '12:00',
        actualStart: '10:05',
        actualEnd: '11:52',
        durationMinutes: 107,
        purpose: 'Signal integrity analysis experiment',
        status: 'Completed',
        technician: 'Amit Kumar',
        notes: 'Equipment operated smoothly. High frequency capture verified without noise.',
      },
      {
        logId: 'UL-1023',
        bookingId: 'BR-1023',
        equipment: {
          equipmentId: 'EQ-3DP-001',
          name: '3D Printer - Industrial FDM',
          category: 'Fabrication',
        },
        student: {
          name: 'Priya Singh',
          email: 'priya.singh@student.chitkara.edu.in',
        },
        lab: 'Fabrication Lab',
        college: 'Chitkara University',
        building: 'Block B',
        room: 'B-102',
        date: '2026-09-20',
        scheduledStart: '14:00',
        scheduledEnd: '16:00',
        actualStart: '14:00',
        actualEnd: '',
        durationMinutes: 60,
        purpose: 'Drone chassis prototype printing',
        status: 'Active',
        technician: 'Amit Kumar',
        notes: 'Extrusion active at 215°C. First 40 layers completed with excellent adhesion.',
      },
      {
        logId: 'UL-1022',
        bookingId: 'BR-1020',
        equipment: {
          equipmentId: 'EQ-CNC-001',
          name: 'CNC Milling Machine - 5 Axis',
          category: 'Fabrication',
        },
        student: {
          name: 'Vikram Singh',
          email: 'vikram.singh@student.chitkara.edu.in',
        },
        lab: 'Advanced Manufacturing Lab',
        college: 'Chitkara University',
        building: 'Block D',
        room: 'D-001',
        date: '2026-09-19',
        scheduledStart: '09:00',
        scheduledEnd: '12:00',
        actualStart: '09:10',
        actualEnd: '12:05',
        durationMinutes: 175,
        purpose: 'Precision machining of turbine model',
        status: 'Completed',
        technician: 'Amit Kumar',
        notes: '5-axis calibration passed. Part produced with ±0.005mm tolerance.',
      },
    ];
    await UsageLog.insertMany(usageLogsData);
    console.log(`${usageLogsData.length} Usage Logs seeded.`);

    console.log('========================================================');
    console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Admin Account: nikhilpalyal6@gmail.com / Nikhil@123');
    console.log('Student Account: student@example.com / Student@123');
    console.log('========================================================');
    process.exit(0);
  } catch (error) {
    console.error('Error during database seed:', error);
    process.exit(1);
  }
};

seedDatabase();
