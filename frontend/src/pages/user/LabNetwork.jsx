import { useState, useMemo } from 'react'
import {
  Search,
  MapPin,
  Building2,
  Layers,
  RotateCcw,
  Plus,
  Minus,
  Navigation,
  Star,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  Send,
  Users,
  FlaskConical,
  Compass,
  Check,
  Car,
  Bookmark,
  Share2,
  List,
  LayoutGrid
} from 'lucide-react'
import punjabMapImg from '../../assets/chandigarh-map.jpg'

/* ─── Institutional Network Data (Distances centered from Chitkara University) ─── */
const INSTITUTIONS = [
  {
    id: 'pu-chd',
    name: 'Panjab University',
    location: 'Sector 14, Chandigarh',
    distanceKm: 25,
    travelTime: '~35 min',
    openStatus: 'Open · Closes 8 PM',
    rating: 4.8,
    reviewsCount: 120,
    verified: true,
    stats: {
      instruments: '50+',
      labs: '12',
      openTiming: 'Open now · Closes 8 PM'
    },
    shortDesc: 'Multidisciplinary research hub with 50+ central analytical facilities.',
    description:
      'Panjab University offers state-of-the-art research infrastructure across multiple disciplines. External researchers are welcome subject to approval and pre-booking verification.',
    tags: ['SEM', 'XRD', 'FTIR', '+4'],
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
    coords: { x: 65, y: 32 }, // Relative bearing from Chitkara
    instruments: [
      { name: 'FEI Nova NanoSEM 450 (FE-SEM)', category: 'Microscopy', rate: '₹1,800/hr', available: 'Today', status: 'Available' },
      { name: 'Rigaku SmartLab X-Ray Diffractometer', category: 'XRD', rate: '₹1,200/hr', available: 'Tomorrow', status: 'Available' },
      { name: 'Bruker ALPHA II FTIR Spectrometer', category: 'Spectroscopy', rate: '₹600/hr', available: 'This week', status: 'Available' },
      { name: 'PerkinElmer Lambda 750 UV-Vis-NIR', category: 'Spectroscopy', rate: '₹800/hr', available: 'This week', status: 'Available' }
    ],
    reviews: [
      { author: 'Dr. Gurpreet Singh', role: 'Postdoc, Nanotech', rating: 5, comment: 'High-resolution FE-SEM imaging was seamless. Staff was very supportive with sample preparation.' },
      { author: 'Pooja Sharma', role: 'PhD Scholar, Physics', rating: 4.8, comment: 'Clean lab environment and prompt slot allocation through LabCollab portal.' }
    ]
  },
  {
    id: 'pec-chd',
    name: 'PEC Chandigarh',
    location: 'Sector 12, Chandigarh',
    distanceKm: 28,
    travelTime: '~40 min',
    openStatus: 'Open · Closes 7 PM',
    rating: 4.6,
    reviewsCount: 98,
    verified: true,
    stats: {
      instruments: '38+',
      labs: '9',
      openTiming: 'Open now · Closes 7 PM'
    },
    shortDesc: 'Advanced prototyping, CNC machining, and aerospace materials testbeds.',
    description:
      'Punjab Engineering College features cutting-edge additive manufacturing, 5-axis CNC machining, and advanced materials characterization testbeds for engineering researchers.',
    tags: ['3D Printer', 'CNC', 'Materials Lab'],
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
    coords: { x: 68, y: 26 },
    instruments: [
      { name: 'EOS M 290 Direct Metal Laser 3D Printer', category: 'Prototyping', rate: '₹3,500/hr', available: 'Tomorrow', status: 'Available' },
      { name: 'Haas VF-2 5-Axis CNC Center', category: 'Fabrication', rate: '₹2,200/hr', available: 'This week', status: 'Available' },
      { name: 'Instron 5985 250kN Universal Tester', category: 'Materials', rate: '₹1,400/hr', available: 'Thursday', status: 'Available' }
    ],
    reviews: [
      { author: 'Rohan Verma', role: 'M.Tech, Mechanical', rating: 4.7, comment: 'Titanium 3D printing precision was remarkable for our aerodynamic turbine prototype.' }
    ]
  },
  {
    id: 'niper-mohali',
    name: 'NIPER Mohali',
    location: 'Sector 67, Mohali',
    distanceKm: 18,
    travelTime: '~25 min',
    openStatus: 'Open · Closes 6 PM',
    rating: 4.5,
    reviewsCount: 76,
    verified: true,
    stats: {
      instruments: '52+',
      labs: '14',
      openTiming: 'Open now · Closes 6 PM'
    },
    shortDesc: 'Premier pharmaceutical & high-field NMR analytical infrastructure.',
    description:
      'National Institute of Pharmaceutical Education and Research provides premier pharmaceutical, chemical, and biochemical analytical infrastructure including high-field NMR & LC-MS/MS.',
    tags: ['HPLC', 'NMR', 'Mass Spectrometer'],
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
    coords: { x: 58, y: 44 },
    instruments: [
      { name: 'Bruker Avance III HD 500 MHz NMR', category: 'NMR', rate: '₹2,500/hr', available: 'Friday morning', status: 'Limited' },
      { name: 'Waters ACQUITY UPLC-MS/MS Xevo TQ-S', category: 'Chromatography', rate: '₹4,000/hr', available: 'Next Monday', status: 'Limited' },
      { name: 'Agilent 1290 Infinity II LC System', category: 'HPLC', rate: '₹1,500/hr', available: 'Available this week', status: 'Available' }
    ],
    reviews: [
      { author: 'Dr. Ananya Ray', role: 'Senior Scientist', rating: 4.6, comment: 'Exceptional mass resolution on metabolomics samples. Results verified within 24 hours.' }
    ]
  },
  {
    id: 'thapar-pat',
    name: 'Thapar Institute (TIET)',
    location: 'Patiala, Punjab',
    distanceKm: 22,
    travelTime: '~30 min',
    openStatus: 'Open · Closes 8 PM',
    rating: 4.7,
    reviewsCount: 88,
    verified: true,
    stats: {
      instruments: '42+',
      labs: '10',
      openTiming: 'Open now · Closes 8 PM'
    },
    shortDesc: 'Advanced analytical characterization for materials science and energy storage.',
    description:
      'TIET Central Research Facility houses advanced analytical instrumentation for materials science, environmental monitoring, energy storage, and smart micro-devices.',
    tags: ['Materials Lab', 'SEM', 'Rheometer'],
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    coords: { x: 34, y: 72 },
    instruments: [
      { name: 'JEOL JSM-IT500HR Scanning Electron Microscope', category: 'Microscopy', rate: '₹1,500/hr', available: 'Today', status: 'Available' },
      { name: 'Anton Paar MCR 302 Modular Compact Rheometer', category: 'Rheology', rate: '₹1,100/hr', available: 'Wednesday', status: 'Available' },
      { name: 'TA Instruments Discovery DSC 2500', category: 'Thermal', rate: '₹950/hr', available: 'Tomorrow', status: 'Available' }
    ],
    reviews: [
      { author: 'Vikram Joshi', role: 'Research Fellow', rating: 4.8, comment: 'Very clean facility with automated data export to cloud drives directly.' }
    ]
  },
  {
    id: 'inst-mohali',
    name: 'INST Mohali',
    location: 'Sector 81, Mohali',
    distanceKm: 17,
    travelTime: '~22 min',
    openStatus: 'Open · Closes 7 PM',
    rating: 4.8,
    reviewsCount: 62,
    verified: true,
    stats: {
      instruments: '35+',
      labs: '8',
      openTiming: 'Open now · Closes 7 PM'
    },
    shortDesc: 'Nano-science research center for sensors, devices, and clean energy.',
    description:
      'Institute of Nano Science and Technology is dedicated to research on agricultural nanotechnology, sensors, medical devices, and clean energy storage.',
    tags: ['AFM', 'XPS', 'Cryo-EM'],
    image: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80',
    coords: { x: 55, y: 46 },
    instruments: [
      { name: 'Bruker Dimension Icon Atomic Force Microscope', category: 'Nanotechnology', rate: '₹2,200/hr', available: 'Thursday', status: 'Available' },
      { name: 'Thermo Scientific K-Alpha XPS System', category: 'Surface Science', rate: '₹3,800/hr', available: 'Next Tuesday', status: 'Limited' }
    ],
    reviews: [
      { author: 'Neha Kapoor', role: 'PhD Candidate', rating: 4.9, comment: 'Atomic force resolution achieved true atomic lattice steps on 2D MoS2 flakes!' }
    ]
  },
  {
    id: 'csio-chd',
    name: 'CSIR-CSIO',
    location: 'Sector 30, Chandigarh',
    distanceKm: 26,
    travelTime: '~36 min',
    openStatus: 'Open · Closes 6 PM',
    rating: 4.7,
    reviewsCount: 84,
    verified: true,
    stats: {
      instruments: '40+',
      labs: '11',
      openTiming: 'Open now · Closes 6 PM'
    },
    shortDesc: 'National research laboratory for optics, photonics, and micro-fabrication.',
    description:
      'Central Scientific Instruments Organisation specializes in advanced optical instrumentation, photonics, biomedical instrumentation, and sensor systems.',
    tags: ['Optics Lab', 'Sensors', 'Micro-fab'],
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    coords: { x: 67, y: 36 },
    instruments: [
      { name: 'Zygo Verifire Optical Interferometer', category: 'Metrology', rate: '₹2,400/hr', available: 'Available Friday', status: 'Available' },
      { name: 'Cleanroom Photolithography Mask Aligner', category: 'Micro-fab', rate: '₹3,000/hr', available: 'Wednesday', status: 'Available' }
    ],
    reviews: [
      { author: 'Karan Mehra', role: 'Optical Engineer', rating: 4.8, comment: 'Sub-nanometer surface roughness measurements were certified on spot.' }
    ]
  },
  {
    id: 'iit-ropar',
    name: 'IIT Ropar',
    location: 'Rupnagar, Punjab',
    distanceKm: 54,
    travelTime: '~1 hr 10 min',
    openStatus: 'Open · Closes 9 PM',
    rating: 4.9,
    reviewsCount: 184,
    verified: true,
    stats: {
      instruments: '78+',
      labs: '18',
      openTiming: 'Open now · Closes 9 PM'
    },
    shortDesc: 'Cleanrooms, cryo-electron microscopy, and nanofabrication facilities.',
    description:
      'Indian Institute of Technology Ropar offers world-class cleanrooms, field emission electron microscopy, electron beam lithography, and high-performance computing clusters.',
    tags: ['Cleanroom', 'SEM', 'TEM'],
    image: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=800&q=80',
    coords: { x: 42, y: 16 },
    instruments: [
      { name: 'JEOL JEM-2100F High-Resolution TEM (200kV)', category: 'TEM', rate: '₹5,000/hr', available: 'Thursday', status: 'Available' },
      { name: 'Raith e_Line Plus Electron Beam Lithography', category: 'Nanofab', rate: '₹6,500/hr', available: 'Friday', status: 'Limited' },
      { name: 'AJA Orion Magnetron Sputtering Deposition System', category: 'Thin Films', rate: '₹2,200/hr', available: 'Tomorrow', status: 'Available' }
    ],
    reviews: [
      { author: 'Dr. Siddharth Sen', role: 'Faculty Researcher', rating: 5, comment: 'Best TEM facility in Northern India. Cryo capabilities are unmatched.' }
    ]
  }
]

export default function LabNetwork() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDistance, setSelectedDistance] = useState('50')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedInstitution, setSelectedInstitution] = useState(INSTITUTIONS[0])
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'instruments' | 'availability' | 'reviews'
  const [rightViewMode, setRightViewMode] = useState('detail') // 'detail' or 'list'
  const [isDescExpanded, setIsDescExpanded] = useState(false)
  const [savedLabs, setSavedLabs] = useState({})
  const [zoomLevel, setZoomLevel] = useState(1)
  const [bookingSuccessModal, setBookingSuccessModal] = useState(null)
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [accessRequested, setAccessRequested] = useState(false)

  // Map layer checkboxes
  const [layers, setLayers] = useState({
    institutions: true,
    instruments: true,
    myLocation: true
  })

  // Filtered institutions
  const filteredInstitutions = useMemo(() => {
    return INSTITUTIONS.filter((inst) => {
      const matchesSearch =
        inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        inst.location.toLowerCase().includes(searchQuery.toLowerCase())

      const maxDist = parseInt(selectedDistance, 10)
      const matchesDist = isNaN(maxDist) || inst.distanceKm <= maxDist

      return matchesSearch && matchesDist
    })
  }, [searchQuery, selectedDistance])

  const handleSelectInstitution = (inst) => {
    setSelectedInstitution(inst)
    setActiveTab('overview')
    setRightViewMode('detail')
    setIsDescExpanded(false)
  }

  const toggleSave = (id) => {
    setSavedLabs(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* ── 1. Top Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#C58A48] bg-[#F7ECD9] px-2.5 py-1 rounded-md">
              THE LIVE NETWORK
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[#241B16] tracking-tight">
            Labs around you, <span className="text-[#C58A48]">within reach.</span>
          </h1>
          <p className="text-sm text-[#6B5E52] max-w-2xl font-normal">
            Discover verified labs, check availability, and compare exact distances from your campus base.
          </p>
        </div>

        {/* Top Right Badges: Chitkara University Base + Stats */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Location Center Badge: Chitkara University */}
          <div className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white border border-[#EDE8E0] shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-[#F7ECD9] text-[#965D25] border border-[#C58A48]/30 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4 text-[#C58A48]" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#A5998E]">Your Campus Base</p>
              <p className="text-xs font-black text-[#241B16]">Chitkara University</p>
              <p className="text-[10px] text-[#8C7B70]">Rajpura, Punjab (0 km)</p>
            </div>
          </div>

          {/* Metric 1 */}
          <div className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white border border-[#EDE8E0] shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-[#F7ECD9] text-[#965D25] flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-[#C58A48]" />
            </div>
            <div>
              <p className="text-sm font-black text-[#241B16] leading-none">50+</p>
              <p className="text-[10px] font-semibold text-[#8C7B70] mt-0.5">Partner Labs</p>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white border border-[#EDE8E0] shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <FlaskConical className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-black text-[#241B16] leading-none">1,000+</p>
              <p className="text-[10px] font-semibold text-[#8C7B70] mt-0.5">Instruments</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Filter Bar ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-3 border border-[#EDE8E0] shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#A5998E] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search instruments (e.g., SEM, 3D Printer, XRD, NMR...)"
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] text-xs md:text-sm text-[#241B16] placeholder-[#A5998E] focus:bg-white focus:border-[#C58A48] outline-none transition"
          />
        </div>

        {/* Distance Selector */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] text-xs font-semibold text-[#4A3E37]">
          <Compass className="w-3.5 h-3.5 text-[#C58A48]" />
          <span className="text-[#8C7B70] text-[11px]">Distance:</span>
          <select
            value={selectedDistance}
            onChange={(e) => setSelectedDistance(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-[#241B16] outline-none cursor-pointer pr-1"
          >
            <option value="20">Within 20 km</option>
            <option value="35">Within 35 km</option>
            <option value="50">Within 50 km</option>
            <option value="100">Within 100 km</option>
            <option value="999">All Regional</option>
          </select>
        </div>

        {/* Category Selector */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] text-xs font-semibold text-[#4A3E37]">
          <Layers className="w-3.5 h-3.5 text-[#C58A48]" />
          <span className="text-[#8C7B70] text-[11px]">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-[#241B16] outline-none cursor-pointer pr-1"
          >
            <option value="all">All Instruments</option>
            <option value="microscopy">Microscopy &amp; Imaging</option>
            <option value="spectroscopy">Spectroscopy &amp; NMR</option>
            <option value="prototyping">Additive &amp; Prototyping</option>
          </select>
        </div>

        {/* Search Submit Button */}
        <button
          className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-2xl bg-[#241B16] hover:bg-[#C58A48] text-white text-xs font-bold transition shadow-sm"
        >
          <span>Search</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── 3. SIDE-BY-SIDE MAIN WORKSPACE: MAP (LEFT) + PLACES/DETAILS (RIGHT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT COLUMN: Interactive Radar Map (lg:col-span-5 or 6) ── */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-3xl border border-[#EDE8E0] shadow-sm overflow-hidden p-4 md:p-5 space-y-3">
            
            {/* Map Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C58A48] animate-pulse" />
                <h2 className="text-xs font-black text-[#241B16] uppercase tracking-wider">
                  Radar Map (Center: Chitkara Base)
                </h2>
              </div>

              <button
                onClick={() => {
                  setZoomLevel(1)
                  setSelectedInstitution(INSTITUTIONS[0])
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-[#EDE8E0] hover:border-[#C58A48] bg-[#FAF8F5] hover:bg-white text-[11px] font-semibold text-[#6B5E52] transition"
              >
                <RotateCcw className="w-3 h-3 text-[#C58A48]" />
                <span>Reset</span>
              </button>
            </div>

            {/* Visual Radar Container with authentic map background */}
            <div
              className="relative w-full h-[580px] rounded-2xl border border-[#E8E2D9] overflow-hidden select-none bg-[#F7F4EE]"
              style={{
                backgroundImage: `url(${punjabMapImg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 45%'
              }}
            >
              {/* Subtle translucent warm overlay */}
              <div className="absolute inset-0 bg-[#FAF7F2]/55 pointer-events-none backdrop-blur-[0.5px]" />

              {/* Layer Controls (Top Right Floating) */}
              <div className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur-sm border border-[#EDE8E0] rounded-2xl p-2.5 shadow-md space-y-1.5 text-[10px] font-semibold text-[#4A3E37]">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={layers.institutions}
                    onChange={(e) => setLayers({ ...layers, institutions: e.target.checked })}
                    className="accent-[#C58A48] rounded w-3 h-3"
                  />
                  <span>Show Institutions</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={layers.instruments}
                    onChange={(e) => setLayers({ ...layers, instruments: e.target.checked })}
                    className="accent-[#C58A48] rounded w-3 h-3"
                  />
                  <span>Show Instruments</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={layers.myLocation}
                    onChange={(e) => setLayers({ ...layers, myLocation: e.target.checked })}
                    className="accent-[#C58A48] rounded w-3 h-3"
                  />
                  <span>Show Campus Base</span>
                </label>
              </div>

              {/* Concentric Radar Rings Centered on Chitkara University */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-300"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {/* 10 km Ring */}
                <div className="absolute w-40 h-40 rounded-full border border-dashed border-[#C58A48]/50 flex items-start justify-center">
                  <span className="text-[9px] font-bold text-[#965D25] bg-white/90 px-1 py-0.5 rounded-full -mt-2 border border-[#EDE8E0] shadow-xs">
                    10 km
                  </span>
                </div>

                {/* 25 km Ring (covers Mohali, Patiala, Panjab University) */}
                <div className="absolute w-72 h-72 rounded-full border border-[#C58A48]/40 flex items-start justify-center">
                  <span className="text-[9px] font-bold text-[#8C7B70] bg-white/90 px-1 py-0.5 rounded-full -mt-2 border border-[#EDE8E0] shadow-xs">
                    25 km
                  </span>
                </div>

                {/* 50 km Ring */}
                <div className="absolute w-[420px] h-[420px] rounded-full border border-dashed border-[#8C7B70]/40 flex items-start justify-center">
                  <span className="text-[9px] font-bold text-[#A5998E] bg-white/90 px-1 py-0.5 rounded-full -mt-2 border border-[#EDE8E0] shadow-xs">
                    50 km
                  </span>
                </div>

                {/* Center Crosshairs */}
                <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-[#C58A48]/30 to-transparent" />
                <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-[#C58A48]/30 to-transparent" />
              </div>

              {/* CENTER BEACON: CHITKARA UNIVERSITY (0 km) */}
              {layers.myLocation && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-15 flex flex-col items-center pointer-events-auto">
                  <div className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-[#C58A48] opacity-40" />
                    <div className="w-5 h-5 rounded-full bg-[#241B16] border-2 border-white shadow-xl flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F7ECD9]" />
                    </div>
                  </div>
                  <div className="mt-1 px-2.5 py-1 rounded-xl bg-white/95 border border-[#C58A48] shadow-lg text-center backdrop-blur-xs">
                    <p className="text-[8px] font-black uppercase tracking-wider text-[#C58A48]">Your Campus Base</p>
                    <p className="text-[11px] font-black text-[#241B16]">Chitkara University</p>
                    <p className="text-[9px] font-semibold text-[#8C7B70]">Center (0 km)</p>
                  </div>
                </div>
              )}

              {/* INSTITUTION NODES ON THE RADAR */}
              {layers.institutions &&
                filteredInstitutions.map((inst) => {
                  const isSelected = selectedInstitution?.id === inst.id
                  return (
                    <div
                      key={inst.id}
                      onClick={() => handleSelectInstitution(inst)}
                      className="absolute z-15 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 active:scale-95"
                      style={{
                        left: `${inst.coords.x}%`,
                        top: `${inst.coords.y}%`
                      }}
                    >
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border shadow-md backdrop-blur-xs transition-all ${
                          isSelected
                            ? 'bg-[#241B16] text-white border-[#241B16] ring-4 ring-[#C58A48]/35 scale-105'
                            : 'bg-white/95 text-[#241B16] border-[#EDE8E0] hover:border-[#C58A48]'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isSelected ? 'bg-[#C58A48] text-white' : 'bg-[#FAF8F5] text-[#C58A48]'
                          }`}
                        >
                          <Building2 className="w-3 h-3" />
                        </div>
                        <div className="text-left">
                          <p className="text-[11px] font-bold leading-tight truncate max-w-[100px]">{inst.name}</p>
                          <p
                            className={`text-[9px] font-semibold leading-tight ${
                              isSelected ? 'text-[#F7ECD9]' : 'text-[#8C7B70]'
                            }`}
                          >
                            {inst.distanceKm} km
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}

              {/* Bottom Left: Distance Legend */}
              <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-sm border border-[#EDE8E0] rounded-2xl p-2 shadow-md text-[9px] font-bold text-[#4A3E37] space-y-1">
                <p className="text-[8px] uppercase tracking-wider text-[#A5998E]">Distance from Chitkara</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>&lt; 20 km (Instant reach)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#C58A48]" />
                  <span>20 – 35 km (Tricity Hub)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>35 – 60 km (IIT Ropar)</span>
                </div>
              </div>

              {/* Bottom Right: Zoom Controls */}
              <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1 bg-white/95 backdrop-blur-sm border border-[#EDE8E0] rounded-2xl p-1 shadow-md">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.4))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#FAF8F5] text-[#4A3E37] transition"
                  title="Zoom in"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <div className="h-[1px] bg-[#EDE8E0] mx-0.5" />
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.75))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#FAF8F5] text-[#4A3E37] transition"
                  title="Zoom out"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="h-[1px] bg-[#EDE8E0] mx-0.5" />
                <button
                  onClick={() => setZoomLevel(1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#FAF8F5] text-[#C58A48] transition"
                  title="Recenter Chitkara Base"
                >
                  <Navigation className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Need Access Card under map */}
          <div className="bg-white rounded-3xl p-4 border border-[#EDE8E0] shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] flex items-center justify-center shrink-0 text-[#C58A48]">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#241B16]">Need inter-lab verification?</p>
                <p className="text-[10px] text-[#7A6D64]">Request facility clearance from partner labs.</p>
              </div>
            </div>
            <button
              onClick={() => setShowAccessModal(true)}
              className="px-3.5 py-1.5 rounded-xl border border-[#EDE8E0] hover:border-[#C58A48] text-xs font-bold text-[#241B16] hover:bg-[#FAF8F5] transition"
            >
              Request Access
            </button>
          </div>
        </div>

        {/* ── RIGHT COLUMN: PLACES & LARGE DETAILS CARD (BESIDE THE MAP!) ── */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Nearby Labs Horizontal Selector Strip */}
          <div className="bg-white rounded-3xl p-3.5 border border-[#EDE8E0] shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#241B16] uppercase tracking-wider">
                  Nearby Labs ({filteredInstitutions.length})
                </span>
                <span className="text-[10px] font-semibold text-[#8C7B70] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#EDE8E0]">
                  Click to inspect
                </span>
              </div>

              {/* View Switcher: Details vs List View */}
              <div className="flex items-center gap-1 bg-[#FAF8F5] p-0.5 rounded-xl border border-[#EDE8E0]">
                <button
                  onClick={() => setRightViewMode('detail')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    rightViewMode === 'detail'
                      ? 'bg-[#241B16] text-white shadow-xs'
                      : 'text-[#6B5E52] hover:text-[#241B16]'
                  }`}
                >
                  Details View
                </button>
                <button
                  onClick={() => setRightViewMode('list')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    rightViewMode === 'list'
                      ? 'bg-[#241B16] text-white shadow-xs'
                      : 'text-[#6B5E52] hover:text-[#241B16]'
                  }`}
                >
                  All Labs ({filteredInstitutions.length})
                </button>
              </div>
            </div>

            {/* Horizontal Mini-Pills Strip of Universities */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {filteredInstitutions.map((inst) => {
                const isSelected = selectedInstitution?.id === inst.id
                return (
                  <button
                    key={inst.id}
                    onClick={() => handleSelectInstitution(inst)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all shrink-0 text-left ${
                      isSelected
                        ? 'bg-[#241B16] text-white border-[#241B16] shadow-sm'
                        : 'bg-[#FAF8F5] text-[#241B16] border-[#EDE8E0] hover:border-[#C58A48]'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-xl overflow-hidden bg-white/20 shrink-0">
                      <img
                        src={inst.image}
                        alt={inst.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80'
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight truncate max-w-[110px]">{inst.name}</p>
                      <p className={`text-[10px] font-semibold leading-tight ${isSelected ? 'text-[#F7ECD9]' : 'text-[#8C7B70]'}`}>
                        {inst.distanceKm} km
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* VIEW MODE 1: THE LARGE UNIVERSITY DETAILS VIEW (EXACTLY MATCHING USER'S PHOTO) */}
          {rightViewMode === 'detail' && selectedInstitution && (
            <div className="bg-white rounded-3xl border border-[#EDE8E0] shadow-md overflow-hidden transition-all animate-in fade-in duration-200">
              
              {/* Hero Image with Close button & Distance Badge */}
              <div className="relative w-full h-52 sm:h-60 bg-[#FAF8F5] overflow-hidden">
                <img
                  src={selectedInstitution.image}
                  alt={selectedInstitution.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                
                {/* Close Button top right */}
                <button
                  onClick={() => setRightViewMode('list')}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#241B16] flex items-center justify-center shadow-lg transition"
                  title="View All Labs"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Distance from Chitkara Bottom Left */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-white/95 backdrop-blur-xs text-xs font-black text-[#241B16] shadow-sm flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-[#C58A48]" />
                    <span>{selectedInstitution.distanceKm} km from Chitkara · {selectedInstitution.travelTime}</span>
                  </span>
                </div>
              </div>

              {/* Detail Content */}
              <div className="p-5 md:p-6 space-y-5">
                {/* Title, Badges & Expandable Short Description */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl md:text-2xl font-black text-[#241B16] tracking-tight">
                      {selectedInstitution.name}
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSave(selectedInstitution.id)}
                        className="p-1.5 rounded-xl border border-[#EDE8E0] hover:border-[#C58A48] text-[#8C7B70] hover:text-[#241B16] transition"
                        title="Save Lab"
                      >
                        <Bookmark
                          className={`w-4 h-4 ${
                            savedLabs[selectedInstitution.id] ? 'fill-[#C58A48] text-[#C58A48]' : ''
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => alert(`Link copied for ${selectedInstitution.name}`)}
                        className="p-1.5 rounded-xl border border-[#EDE8E0] hover:border-[#C58A48] text-[#8C7B70] hover:text-[#241B16] transition"
                        title="Share Lab"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Verified + Rating + Location Subtitle */}
                  <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified Institution
                    </span>

                    <div className="flex items-center gap-1 text-xs font-bold text-[#241B16]">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{selectedInstitution.rating}</span>
                      <span className="text-[#A5998E] font-normal text-[11px]">({selectedInstitution.reviewsCount} reviews)</span>
                    </div>

                    <span className="text-xs text-[#7A6D64] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#A5998E]" />
                      {selectedInstitution.location}
                    </span>
                  </div>

                  {/* Short description directly with name — click to expand full description */}
                  <div
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="mt-3 p-3 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] hover:border-[#C58A48] cursor-pointer transition-all group"
                    title="Click to expand/collapse full description"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs text-[#6B5E52] leading-relaxed">
                        <p className="font-semibold text-[#241B16]">
                          {selectedInstitution.shortDesc}
                        </p>
                        {isDescExpanded && (
                          <p className="mt-2 pt-2 border-t border-[#EDE8E0] text-[#7A6D64] leading-relaxed animate-in fade-in duration-200">
                            {selectedInstitution.description}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-[#C58A48] shrink-0 group-hover:underline flex items-center gap-0.5 mt-0.5 select-none">
                        {isDescExpanded ? 'Show less ▴' : 'Read more ▾'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation: Overview | Instruments | Availability | Reviews */}
                <div className="flex items-center gap-5 border-b border-[#EDE8E0] text-xs font-bold">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-2.5 transition relative ${
                      activeTab === 'overview'
                        ? 'text-[#241B16] border-b-2 border-[#C58A48]'
                        : 'text-[#8C7B70] hover:text-[#241B16]'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('instruments')}
                    className={`pb-2.5 transition relative ${
                      activeTab === 'instruments'
                        ? 'text-[#241B16] border-b-2 border-[#C58A48]'
                        : 'text-[#8C7B70] hover:text-[#241B16]'
                    }`}
                  >
                    Instruments ({selectedInstitution.instruments.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('availability')}
                    className={`pb-2.5 transition relative ${
                      activeTab === 'availability'
                        ? 'text-[#241B16] border-b-2 border-[#C58A48]'
                        : 'text-[#8C7B70] hover:text-[#241B16]'
                    }`}
                  >
                    Availability
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-2.5 transition relative ${
                      activeTab === 'reviews'
                        ? 'text-[#241B16] border-b-2 border-[#C58A48]'
                        : 'text-[#8C7B70] hover:text-[#241B16]'
                    }`}
                  >
                    Reviews ({selectedInstitution.reviews.length})
                  </button>
                </div>

                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    {/* 3 Metric Cards */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0]">
                        <div className="w-7 h-7 rounded-lg bg-[#F7ECD9] text-[#965D25] flex items-center justify-center mb-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#C58A48]" />
                        </div>
                        <p className="text-base font-black text-[#241B16]">{selectedInstitution.stats.instruments}</p>
                        <p className="text-[10px] text-[#8C7B70]">Instruments</p>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0]">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-1.5">
                          <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <p className="text-base font-black text-[#241B16]">{selectedInstitution.stats.labs}</p>
                        <p className="text-[10px] text-[#8C7B70]">Research Labs</p>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0]">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <p className="text-xs font-black text-[#241B16] truncate">Open now</p>
                        <p className="text-[10px] text-[#8C7B70]">Closes 8 PM</p>
                      </div>
                    </div>

                    {/* Main CTA: View Instruments */}
                    <button
                      onClick={() => setActiveTab('instruments')}
                      className="w-full py-3.5 rounded-2xl bg-[#241B16] hover:bg-[#C58A48] text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <span>View Instruments</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* Secondary Actions: Directions + Save */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <a
                        href={`https://www.google.com/maps/dir/Chitkara+University,+Punjab/${encodeURIComponent(selectedInstitution.name + ' ' + selectedInstitution.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 rounded-2xl border border-[#EDE8E0] hover:border-[#C58A48] text-xs font-bold text-[#241B16] hover:bg-[#FAF8F5] transition flex items-center justify-center gap-1.5"
                      >
                        <Navigation className="w-3.5 h-3.5 text-[#C58A48]" />
                        <span>Get Directions</span>
                      </a>

                      <button
                        onClick={() => toggleSave(selectedInstitution.id)}
                        className="py-2.5 px-3 rounded-2xl border border-[#EDE8E0] hover:border-[#C58A48] text-xs font-bold text-[#241B16] hover:bg-[#FAF8F5] transition flex items-center justify-center gap-1.5"
                      >
                        <Bookmark
                          className={`w-3.5 h-3.5 ${
                            savedLabs[selectedInstitution.id] ? 'fill-[#C58A48] text-[#C58A48]' : 'text-[#8C7B70]'
                          }`}
                        />
                        <span>{savedLabs[selectedInstitution.id] ? 'Saved' : 'Save'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: INSTRUMENTS */}
                {activeTab === 'instruments' && (
                  <div className="space-y-2.5">
                    {selectedInstitution.instruments.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] flex items-center justify-between gap-2 hover:border-[#C58A48] transition"
                      >
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#C58A48]">
                            {item.category}
                          </span>
                          <h4 className="text-xs font-bold text-[#241B16] truncate">{item.name}</h4>
                          <p className="text-[10px] text-[#7A6D64] mt-0.5">
                            Availability: <span className="font-semibold text-[#241B16]">{item.available}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-black text-[#241B16]">{item.rate}</span>
                          <button
                            onClick={() => setBookingSuccessModal(item)}
                            className="px-3 py-1.5 rounded-xl bg-[#241B16] hover:bg-[#C58A48] text-white text-[11px] font-bold transition"
                          >
                            Book Slot
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => setActiveTab('overview')}
                      className="text-xs font-bold text-[#C58A48] hover:underline pt-1 block"
                    >
                      ← Back to Overview
                    </button>
                  </div>
                )}

                {/* TAB 3: AVAILABILITY */}
                {activeTab === 'availability' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] space-y-2">
                      <p className="text-xs font-bold text-[#241B16]">Weekly Booking Slots:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {['Mon 10am-2pm', 'Tue 2pm-6pm', 'Thu 10am-1pm', 'Fri 3pm-7pm'].map((slot, i) => (
                          <div key={i} className="p-2 rounded-xl bg-white border border-[#EDE8E0] text-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mb-1" />
                            <p className="font-bold text-[#241B16] text-[11px]">{slot}</p>
                            <p className="text-[9px] text-emerald-700 font-semibold">Open</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-[#8C7B70]">
                      * Direct inter-institutional access clearance enabled for Chitkara University researchers.
                    </p>
                  </div>
                )}

                {/* TAB 4: REVIEWS */}
                {activeTab === 'reviews' && (
                  <div className="space-y-2.5">
                    {selectedInstitution.reviews.map((rev, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] space-y-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-[#241B16]">{rev.author}</p>
                            <p className="text-[9px] text-[#8C7B70]">{rev.role}</p>
                          </div>
                          <div className="flex items-center gap-0.5 text-xs font-bold text-[#241B16]">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{rev.rating}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#6B5E52] leading-relaxed italic">&ldquo;{rev.comment}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* VIEW MODE 2: ALL LABS COMPACT LIST */}
          {rightViewMode === 'list' && (
            <div className="space-y-3">
              {filteredInstitutions.map((inst) => {
                const isSelected = selectedInstitution?.id === inst.id
                return (
                  <div
                    key={inst.id}
                    onClick={() => handleSelectInstitution(inst)}
                    className={`bg-white rounded-3xl p-3.5 border transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center gap-3.5 ${
                      isSelected
                        ? 'border-[#C58A48] ring-2 ring-[#C58A48]/20 bg-[#FAF8F5]'
                        : 'border-[#EDE8E0] hover:border-[#C58A48]/40'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#EDE8E0] shrink-0">
                      <img
                        src={inst.image}
                        alt={inst.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80'
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-sm font-black text-[#241B16] truncate">{inst.name}</h3>
                        <ChevronRight className="w-4 h-4 text-[#A5998E]" />
                      </div>
                      <p className="text-xs font-bold text-[#6B5E52] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#C58A48]" />
                        <span>{inst.distanceKm} km from Chitkara</span>
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {inst.tags.map((t) => (
                          <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FAF8F5] text-[#7A6D64] border border-[#EDE8E0]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>

      </div>

      {/* ── Booking Success Toast/Modal ────────────────────────────────────── */}
      {bookingSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#EDE8E0] shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-[#241B16]">Slot Request Sent</h3>
              <p className="text-xs text-[#7A6D64] mt-1">
                Requested booking for <strong className="text-[#241B16]">{bookingSuccessModal.name}</strong> at{' '}
                <strong className="text-[#241B16]">{selectedInstitution.name}</strong>.
              </p>
              <p className="text-[11px] text-[#8C7B70] mt-2 bg-[#FAF8F5] p-2 rounded-xl">
                Departure from Chitkara University: approx. {selectedInstitution.travelTime} drive ({selectedInstitution.distanceKm} km).
              </p>
            </div>
            <button
              onClick={() => setBookingSuccessModal(null)}
              className="w-full py-3 rounded-2xl bg-[#241B16] text-white font-bold text-xs hover:bg-[#C58A48] transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── Access Request Modal ───────────────────────────────────────────── */}
      {showAccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-[#EDE8E0] shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#F7ECD9] text-[#965D25] flex items-center justify-center">
                  <Compass className="w-4 h-4 text-[#C58A48]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#241B16]">Inter-Institutional Access</h3>
                  <p className="text-xs text-[#7A6D64]">Origin: Chitkara University Research Hub</p>
                </div>
              </div>
              <button
                onClick={() => setShowAccessModal(false)}
                className="p-1.5 rounded-full hover:bg-[#FAF8F5] text-[#8C7B70]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#241B16] block">
                  Target Lab / Instrument Needed:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cryo-TEM, Dual Beam FIB-SEM, High-Field NMR"
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-3 text-xs text-[#241B16] outline-none focus:border-[#C58A48]"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAccessModal(false)}
                  className="flex-1 py-3 rounded-2xl border border-[#EDE8E0] text-xs font-bold text-[#6B5E52] hover:bg-[#FAF8F5]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccessRequested(true)
                    setTimeout(() => {
                      setAccessRequested(false)
                      setShowAccessModal(false)
                    }, 1400)
                  }}
                  className="flex-2 py-3 rounded-2xl bg-[#241B16] hover:bg-[#C58A48] text-white text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  {accessRequested ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Request Forwarded!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
