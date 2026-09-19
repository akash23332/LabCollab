export const navLinks = [
  { label: 'Explore Instruments', href: '#features' },
  { label: 'India Network', href: '#network' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Partner Institutions', href: '#institutions' },
]

export const stats = [
  {
    label: 'Partner Institutions',
    value: '140+',
    icon: 'Building2',
    note: 'Across 28 states & UTs in India',
    badge: '+18 joined this quarter',
  },
  {
    label: 'Advanced Equipment',
    value: '1,850+',
    icon: 'Microscope',
    note: 'SEM, TEM, NMR, XRD, Confocal & more',
    badge: '₹420Cr+ value',
  },
  {
    label: 'Research Sessions',
    value: '34,200+',
    icon: 'CalendarDays',
    note: 'Hours utilized by PhDs & industry',
    badge: '99.4% slot fulfillment',
  },
  {
    label: 'Average Utilization',
    value: '84%',
    icon: 'BarChart3',
    note: 'Up from 26% baseline idle time',
    badge: '+58% lab efficiency',
  },
]

export const features = [
  {
    title: 'Equipment Discovery',
    description:
      'Search high-end instruments across partner labs by technique, resolution, availability, and location.',
    icon: 'Search',
    accent: 'emerald',
  },
  {
    title: 'AI Smart Scheduling',
    description:
      'Intelligent slot allocation algorithms that eliminate idle time and resolve scheduling conflicts.',
    icon: 'Sparkles',
    accent: 'violet',
  },
  {
    title: 'Verified Institutions',
    description:
      'Rigorous peer verification for all participating central research facilities, IITs, and universities.',
    icon: 'ShieldCheck',
    accent: 'blue',
  },
  {
    title: 'Secure QR Check-in',
    description:
      'Contactless QR-based session logging with tamper-proof audit trails for every research hour.',
    icon: 'QrCode',
    accent: 'amber',
  },
  {
    title: 'Real-time Telemetry',
    description:
      'Live dashboards tracking instrument operational status, booking queues, and power utilization.',
    icon: 'Activity',
    accent: 'rose',
  },
  {
    title: 'Predictive Lab Analytics',
    description:
      'Deep insights on research demand patterns to optimize shared national scientific infrastructure.',
    icon: 'Brain',
    accent: 'cyan',
  },
]

export const networkNodes = [
  {
    city: 'New Delhi (CRF / AIIMS)',
    equipment: 133,
    x: 172,
    y: 98,
    state: 'Delhi NCR',
    institutes: ['IIT Delhi', 'AIIMS New Delhi', 'JNU Science Complex'],
  },
  {
    city: 'Chandigarh & Roorkee',
    equipment: 48,
    x: 156,
    y: 72,
    state: 'North Hub',
    institutes: ['IIT Roorkee', 'Panjab University', 'CSIO-CSIR'],
  },
  {
    city: 'Mumbai (SAIF & TIFR)',
    equipment: 104,
    x: 122,
    y: 176,
    state: 'Maharashtra',
    institutes: ['IIT Bombay', 'TIFR Mumbai', 'ICT Mumbai'],
  },
  {
    city: 'Pune (NCL & IISER)',
    equipment: 68,
    x: 132,
    y: 196,
    state: 'Maharashtra',
    institutes: ['CSIR-NCL Pune', 'IISER Pune', 'Pune University'],
  },
  {
    city: 'Bengaluru (CeNSE & IISc)',
    equipment: 142,
    x: 148,
    y: 248,
    state: 'Karnataka',
    institutes: ['IISc Bengaluru', 'JNCASR', 'NCBS-TIFR'],
  },
  {
    city: 'Hyderabad (CCMB & UoH)',
    equipment: 76,
    x: 160,
    y: 206,
    state: 'Telangana',
    institutes: ['IIT Hyderabad', 'CSIR-CCMB', 'University of Hyderabad'],
  },
  {
    city: 'Chennai (SAIF & IITM)',
    equipment: 82,
    x: 176,
    y: 272,
    state: 'Tamil Nadu',
    institutes: ['IIT Madras', 'Anna University', 'CLRI-CSIR'],
  },
  {
    city: 'Kolkata & Kharagpur',
    equipment: 94,
    x: 238,
    y: 168,
    state: 'West Bengal',
    institutes: ['IIT Kharagpur', 'IACS Kolkata', 'IISER Kolkata'],
  },
]

export const networkLegend = [
  { city: 'Delhi NCR Hub', color: '#10b981', count: '130+ tools' },
  { city: 'Bengaluru CeNSE', color: '#059669', count: '140+ tools' },
  { city: 'Mumbai SAIF', color: '#0284c7', count: '100+ tools' },
  { city: 'Hyderabad Bio-Hub', color: '#8b5cf6', count: '75+ tools' },
  { city: 'Chennai Tech-Corridor', color: '#f59e0b', count: '80+ tools' },
  { city: 'Kolkata Science Cluster', color: '#ec4899', count: '90+ tools' },
]

export const indiaInstitutions = [
  {
    id: 'iisc',
    name: 'IISc Bengaluru',
    fullName: 'Indian Institute of Science — Centre for Nano Science & Engineering (CeNSE)',
    location: 'Bengaluru, Karnataka',
    tier: 'Institute of Eminence',
    equipmentCount: 68,
    featuredInstruments: ['Cryo-TEM 300kV Titan', 'Field Emission SEM (FESEM)', '800 MHz NMR Spectrometer'],
    rating: 4.98,
    activeBookings: '18 active slots today',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'iitd',
    name: 'IIT Delhi',
    fullName: 'Central Research Facility (CRF), IIT Delhi',
    location: 'Hauz Khas, New Delhi',
    tier: 'Centre of Excellence',
    equipmentCount: 84,
    featuredInstruments: ['HR-TEM with EDS/EELS', 'X-Ray Photoelectron Spectrometer (XPS)', 'Confocal Raman Microscope'],
    rating: 4.95,
    activeBookings: '24 active slots today',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'iitb',
    name: 'IIT Bombay',
    fullName: 'Sophisticated Analytical Instrument Facility (SAIF) & CRNTS',
    location: 'Powai, Mumbai',
    tier: 'National Facility',
    equipmentCount: 62,
    featuredInstruments: ['High-Resolution Powder XRD', 'HR-LCMS Orbitrap Mass Spec', 'Atomic Force Microscope (AFM)'],
    rating: 4.94,
    activeBookings: '15 active slots today',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'iitm',
    name: 'IIT Madras',
    fullName: 'Sophisticated Analytical Instruments Facility, IIT Madras',
    location: 'Chennai, Tamil Nadu',
    tier: 'Institute of Eminence',
    equipmentCount: 56,
    featuredInstruments: ['Single Crystal XRD', 'Dual Beam FIB-SEM System', 'MALDI-TOF/TOF Mass Spectrometer'],
    rating: 4.92,
    activeBookings: '12 active slots today',
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  {
    id: 'tifr',
    name: 'TIFR Mumbai',
    fullName: 'Tata Institute of Fundamental Research — Central Instrumentation',
    location: 'Colaba, Mumbai',
    tier: 'Premier Fundamental Lab',
    equipmentCount: 42,
    featuredInstruments: ['Femtosecond Laser Facility', 'SQUID Magnetometer (MPMS3)', 'E-Beam Lithography Cleanroom'],
    rating: 4.97,
    activeBookings: '9 active slots today',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    id: 'aiims',
    name: 'AIIMS New Delhi',
    fullName: 'Central Inter-Disciplinary Research Facility (CIRF)',
    location: 'Ansari Nagar, New Delhi',
    tier: 'Apex Biomedical Lab',
    equipmentCount: 49,
    featuredInstruments: ['Super-Resolution STED Microscope', 'BD FACS Aria Fusion Cell Sorter', '7T Preclinical MRI'],
    rating: 4.96,
    activeBookings: '16 active slots today',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    id: 'ncl',
    name: 'CSIR-NCL Pune',
    fullName: 'National Chemical Laboratory — Central Analytical Facility',
    location: 'Pashan, Pune',
    tier: 'National CSIR Lab',
    equipmentCount: 46,
    featuredInstruments: ['Solid-State 600MHz NMR', 'Automated Chemisorption Analyzer', 'GPC/SEC Polymer Suite'],
    rating: 4.91,
    activeBookings: '11 active slots today',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  {
    id: 'iitkgp',
    name: 'IIT Kharagpur',
    fullName: 'Central Research Facility, IIT Kharagpur',
    location: 'Kharagpur, West Bengal',
    tier: 'Institute of Eminence',
    equipmentCount: 52,
    featuredInstruments: ['Inductively Coupled Plasma Mass Spec (ICP-MS)', 'Micro-CT 3D X-Ray Scanner', 'Scanning Tunneling Microscope (STM)'],
    rating: 4.93,
    activeBookings: '14 active slots today',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
  },
]

export const trustedInstitutions = [
  { name: 'IISc Bengaluru', initials: 'IISc', city: 'Bengaluru' },
  { name: 'IIT Delhi', initials: 'IITD', city: 'New Delhi' },
  { name: 'IIT Bombay', initials: 'IITB', city: 'Mumbai' },
  { name: 'IIT Madras', initials: 'IITM', city: 'Chennai' },
  { name: 'TIFR Mumbai', initials: 'TIFR', city: 'Mumbai' },
  { name: 'AIIMS New Delhi', initials: 'AIIMS', city: 'New Delhi' },
  { name: 'CSIR India', initials: 'CSIR', city: 'National' },
  { name: 'IIT Kharagpur', initials: 'IITKGP', city: 'Kharagpur' },
]

export const heroFloatingCards = [
  {
    title: 'FE-SEM High Resolution',
    subtitle: '0.8nm resolution • Live Slot Available',
    icon: 'Microscope',
    position: 'top-6 -left-4 md:-left-8',
    status: 'Available',
  },
  {
    title: 'Central Facility IIT Delhi',
    subtitle: 'Verified Research Partner • 4.9★',
    icon: 'Building2',
    position: 'top-4 -right-4 md:-right-6',
    status: 'Verified',
  },
  {
    title: 'AI Smart Slot Matcher',
    subtitle: 'Instant clash-free booking',
    icon: 'Sparkles',
    position: 'bottom-6 -left-4 md:-left-6',
    status: 'Active',
  },
]

