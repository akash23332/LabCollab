import { useState, useMemo, useEffect } from 'react'
import { 
  Search, 
  Sparkles, 
  SlidersHorizontal, 
  RotateCcw, 
  Heart, 
  LayoutGrid, 
  List, 
  Building2, 
  MapPin, 
  ArrowRight, 
  Microscope, 
  Dna, 
  Cog, 
  Cpu, 
  Monitor, 
  FlaskConical, 
  Grid2X2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  X, 
  Zap, 
  ChevronDown, 
  Info, 
  Star,
  Layers,
  Flame,
  Check,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/ui/Button'
import equipmentService from '../../services/equipmentService'
import bookingService from '../../services/bookingService'

// 7 Categories from Image 1
const categories = [
  {
    id: 'analytical',
    name: 'Analytical & Characterization',
    icon: Building2,
    bg: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/70',
    iconColor: 'text-emerald-700',
    count: 24,
  },
  {
    id: 'life-sciences',
    name: 'Life Sciences',
    icon: Dna,
    bg: 'bg-purple-50/90 text-purple-800 border-purple-200/80 hover:bg-purple-100/70',
    iconColor: 'text-purple-600',
    count: 18,
  },
  {
    id: 'mechanical',
    name: 'Mechanical & Manufacturing',
    icon: Cog,
    bg: 'bg-amber-50/90 text-amber-900 border-amber-200/80 hover:bg-amber-100/70',
    iconColor: 'text-amber-700',
    count: 15,
  },
  {
    id: 'electronics',
    name: 'Electronics & Electrical',
    icon: Cpu,
    bg: 'bg-blue-50/90 text-blue-800 border-blue-200/80 hover:bg-blue-100/70',
    iconColor: 'text-blue-600',
    count: 19,
  },
  {
    id: 'computing',
    name: 'Computing & AI/ML',
    icon: Monitor,
    bg: 'bg-indigo-50/90 text-indigo-800 border-indigo-200/80 hover:bg-indigo-100/70',
    iconColor: 'text-indigo-600',
    count: 12,
  },
  {
    id: 'chemical',
    name: 'Chemical & Materials',
    icon: FlaskConical,
    bg: 'bg-[#FCF7F0] text-[#784614] border-[#EED7B3] hover:bg-[#F7ECD9]',
    iconColor: 'text-[#B37636]',
    count: 22,
  },
  {
    id: 'general',
    name: 'General Lab Equipment',
    icon: Grid2X2,
    bg: 'bg-violet-50/90 text-violet-800 border-violet-200/80 hover:bg-violet-100/70',
    iconColor: 'text-violet-600',
    count: 31,
  },
]

// Instruments data with accurate cards from Image 2 & 3
const initialInstruments = [
  {
    id: 'inst-1',
    title: 'Zeiss LSM 980 Confocal Microscope',
    category: 'life-sciences',
    categoryLabel: 'Microscopy',
    institution: 'IIT Delhi',
    location: 'New Delhi',
    state: 'Delhi',
    availability: 'Available Today',
    availType: 'today',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
    tags: ['Confocal', 'High Resolution', 'Live Cell Imaging'],
    price: 1200,
    priceLabel: '₹1,200',
    rating: 4.9,
    operator: 'Operator Included',
    specs: 'Airyscan 2 super-resolution (120nm lateral), 4 laser lines (405, 488, 561, 633nm), incubation chamber for live-cell kinetics.',
    slotsToday: ['14:00 - 16:00', '16:30 - 18:30'],
    visualType: 'microscope',
  },
  {
    id: 'inst-2',
    title: 'Thermo Scientific SEM (Quattro S)',
    category: 'analytical',
    categoryLabel: 'Electron Microscopy',
    institution: 'BITS Pilani',
    location: 'Rajasthan',
    state: 'Rajasthan',
    availability: 'Limited Slots',
    availType: 'limited',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
    tags: ['Scanning Electron', 'High Magnification', 'EDX'],
    price: 1500,
    priceLabel: '₹1,500',
    rating: 4.8,
    operator: 'Assisted or Self-Operated',
    specs: 'Field Emission Environmental SEM, high-resolution secondary electron detector, Oxford Instruments Ultim Max EDX detector.',
    slotsToday: ['11:00 - 13:00'],
    visualType: 'sem',
  },
  {
    id: 'inst-3',
    title: 'Formlabs Form 3+ SLA Printer',
    category: 'mechanical',
    categoryLabel: 'Additive Manufacturing',
    institution: 'Chitkara University',
    location: 'Punjab',
    state: 'Punjab',
    availability: 'Available This Week',
    availType: 'week',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
    tags: ['SLA', 'High Precision', 'Prototyping'],
    price: 200,
    priceLabel: '₹200',
    rating: 4.7,
    operator: 'Self-Operated (Trained)',
    specs: 'Low Force Stereolithography (LFS), 25-micron laser spot size, biocompatible and engineering resin support.',
    slotsToday: ['09:00 - 12:00', '13:00 - 16:00'],
    visualType: 'printer',
  },
  {
    id: 'inst-4',
    title: 'Bio-Rad T100 Thermal Cycler',
    category: 'life-sciences',
    categoryLabel: 'Genomics & PCR',
    institution: 'Amity University',
    location: 'Noida',
    state: 'Uttar Pradesh',
    availability: 'High Demand',
    availType: 'demand',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
    tags: ['PCR', '96 Wells', 'Thermal Gradient'],
    price: 300,
    priceLabel: '₹300',
    rating: 4.9,
    operator: 'Self-Operated',
    specs: '96-well fast reaction module, dynamic thermal gradient spanning 1-25°C across block, intuitive touchscreen UI.',
    slotsToday: ['10:00 - 11:30', '15:00 - 16:30'],
    visualType: 'cycler',
  },
  {
    id: 'inst-5',
    title: 'Bruker D8 Advance XRD',
    category: 'analytical',
    categoryLabel: 'X-ray Diffraction',
    institution: 'Tufts University',
    location: 'Boston / Global Grid',
    state: 'International',
    availability: 'Available Today',
    availType: 'today',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
    tags: ['Powder XRD', 'Thin Film', 'LYNXEYE XE-T'],
    price: 850,
    priceLabel: '₹850',
    rating: 4.9,
    operator: 'Operator Included',
    specs: 'Cu Ka source (40kV, 40mA), LYNXEYE XE-T energy-dispersive detector, high-temperature Anton Paar chamber up to 1200°C.',
    slotsToday: ['14:00 - 16:00'],
    visualType: 'xrd',
  },
  {
    id: 'inst-6',
    title: 'Tektronix MSO54B Oscilloscope',
    category: 'electronics',
    categoryLabel: 'Electrical Testing',
    institution: 'Northeastern University',
    location: 'Grid Node East',
    state: 'Network Grid',
    availability: 'Available Today',
    availType: 'today',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
    tags: ['4 Channels', '2 GHz Bandwidth', '6.25 GS/s'],
    price: 450,
    priceLabel: '₹450',
    rating: 4.9,
    operator: 'Self-Operated',
    specs: 'FlexChannel technology with 4 analog / 32 digital logic channels, 12-bit ADC vertical resolution, 15.6" HD display.',
    slotsToday: ['14:00 - 16:00', '17:00 - 19:00'],
    visualType: 'oscilloscope',
  },
  {
    id: 'inst-7',
    title: 'Agilent 8890 GC System with MSD',
    category: 'chemical',
    categoryLabel: 'Chromatography',
    institution: 'IIT Bombay',
    location: 'Mumbai',
    state: 'Maharashtra',
    availability: 'Available This Week',
    availType: 'week',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
    tags: ['Gas Chromatography', 'Mass Spec', 'Autosampler'],
    price: 1100,
    priceLabel: '₹1,100',
    rating: 4.7,
    operator: 'Operator Included',
    specs: 'State-of-the-art EPC pneumatic controls, single quadrupole MSD, 7693A automatic liquid sampler (150 vials).',
    slotsToday: ['09:30 - 12:30'],
    visualType: 'gcms',
  },
  {
    id: 'inst-8',
    title: 'Malvern Zetasizer Ultra',
    category: 'chemical',
    categoryLabel: 'Particle Analysis',
    institution: 'IISc Bangalore',
    location: 'Bangalore',
    state: 'Karnataka',
    availability: 'Limited Slots',
    availType: 'limited',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
    tags: ['DLS Particle Sizing', 'Zeta Potential', 'MADLS'],
    price: 600,
    priceLabel: '₹600',
    rating: 4.8,
    operator: 'Assisted Operator',
    specs: 'Multi-Angle DLS (MADLS), measuring particle size from 0.3nm to 10µm, particle concentration without calibration.',
    slotsToday: ['11:00 - 13:00'],
    visualType: 'zetasizer',
  },
]

// Visual component for scientific equipment graphics
function InstrumentVisual({ type }) {
  return (
    <div className="relative h-44 w-full bg-gradient-to-b from-[#FAF8F5] to-[#F2EDE4] flex items-center justify-center overflow-hidden p-3 border-b border-[#EAE1D3]">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#C58A48_1px,transparent_1px)] [background-size:14px_14px] opacity-15" />
      
      {/* Equipment Graphic Representation */}
      {type === 'microscope' && (
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-3">
            <div className="h-28 w-20 bg-gradient-to-t from-stone-900 via-stone-800 to-stone-700 rounded-2xl shadow-xl border border-stone-600 flex flex-col items-center justify-between p-2">
              <div className="w-8 h-4 rounded-full bg-teal-400/80 shadow-xs animate-pulse" />
              <div className="w-12 h-10 bg-stone-950 rounded-lg border border-stone-700 flex items-center justify-center">
                <span className="text-[8px] font-mono text-emerald-400 font-bold">100X OIL</span>
              </div>
              <div className="w-14 h-3 bg-stone-600 rounded-full" />
            </div>
            <div className="h-20 w-24 bg-stone-900 rounded-xl border border-stone-700 p-1.5 shadow-lg flex flex-col justify-between">
              <div className="flex justify-between items-center px-1">
                <span className="text-[7px] text-teal-300 font-mono">LSM 980</span>
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
              </div>
              <div className="h-10 bg-black rounded border border-teal-900/60 flex items-center justify-center">
                <div className="h-6 w-14 bg-gradient-to-r from-emerald-500/30 via-teal-400/40 to-cyan-500/30 rounded-xs flex items-center justify-center">
                  <span className="text-[7px] font-bold text-teal-200">AIRYSCAN 2</span>
                </div>
              </div>
              <div className="flex gap-1">
                <div className="h-1 flex-1 bg-stone-700 rounded" />
                <div className="h-1 flex-1 bg-teal-600 rounded" />
              </div>
            </div>
          </div>
        </div>
      )}

      {type === 'sem' && (
        <div className="relative z-10 flex items-center gap-2">
          <div className="h-28 w-24 bg-gradient-to-b from-stone-800 to-stone-950 rounded-2xl shadow-xl border border-stone-700 flex flex-col justify-between p-2">
            <div className="w-full flex justify-between items-center">
              <span className="text-[8px] font-bold text-amber-400">QUATTRO S</span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            </div>
            <div className="h-14 bg-stone-900 rounded-lg border border-amber-900/40 p-1 flex items-center justify-center">
              <div className="w-full h-full bg-black rounded flex items-center justify-center text-[8px] font-mono text-amber-200">
                FEG • 30kV
              </div>
            </div>
            <div className="flex justify-between text-[6px] text-stone-400 font-mono">
              <span>EDX ON</span>
              <span>LOW-VAC</span>
            </div>
          </div>
          <div className="h-20 w-16 bg-stone-900 rounded-xl border border-stone-700 p-1 flex flex-col justify-between">
            <div className="h-12 bg-black rounded border border-stone-800 flex items-center justify-center">
              <span className="text-[7px] text-stone-300 font-mono">SPECTRUM</span>
            </div>
            <span className="text-[7px] text-center font-bold text-amber-400">OXFORD</span>
          </div>
        </div>
      )}

      {type === 'printer' && (
        <div className="relative z-10 h-28 w-24 bg-gradient-to-b from-stone-900 via-stone-800 to-stone-950 rounded-2xl shadow-xl border border-stone-700 p-2 flex flex-col justify-between">
          <div className="w-full h-14 bg-amber-500/10 border border-amber-400/40 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-2 w-8 h-2 bg-stone-300 rounded shadow" />
            <div className="w-12 h-6 border-b-2 border-amber-400 flex items-center justify-center">
              <span className="text-[7px] text-amber-300 font-mono">LFS RESIN</span>
            </div>
          </div>
          <div className="h-6 bg-stone-950 rounded border border-stone-800 flex items-center justify-between px-2">
            <span className="text-[7px] text-stone-300 font-bold">FORM 3+</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>
        </div>
      )}

      {type === 'cycler' && (
        <div className="relative z-10 h-26 w-28 bg-gradient-to-b from-stone-100 to-stone-300 rounded-2xl shadow-xl border border-stone-300 p-2 flex flex-col justify-between">
          <div className="h-12 bg-stone-900 rounded-xl border border-stone-700 p-1.5 flex flex-col justify-between text-white">
            <div className="flex justify-between items-center">
              <span className="text-[7px] font-bold text-teal-400">T100 THERMAL</span>
              <span className="text-[7px] font-mono text-emerald-400">95.0°C</span>
            </div>
            <div className="h-4 bg-black rounded flex items-center justify-around px-1 text-[6px] text-stone-300">
              <span>96-WELL</span>
              <span className="text-teal-300">GRADIENT</span>
            </div>
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="text-[8px] font-extrabold text-stone-700">BIO-RAD</span>
            <span className="text-[7px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded">READY</span>
          </div>
        </div>
      )}

      {type === 'oscilloscope' && (
        <div className="relative z-10 h-26 w-32 bg-stone-900 rounded-2xl shadow-xl border border-stone-700 p-2 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[8px] font-bold text-[#C58A48]">MSO54B</span>
            <span className="text-[7px] font-mono text-stone-400">2 GHz • 6.25 GS/s</span>
          </div>
          <div className="h-11 bg-black rounded-lg border border-teal-900/40 p-1 flex flex-col justify-center">
            <div className="w-full h-0.5 bg-cyan-400 shadow-xs mb-1" />
            <div className="w-full h-0.5 bg-yellow-400 shadow-xs" />
          </div>
          <div className="flex justify-between items-center text-[7px] font-mono text-stone-400">
            <span className="text-emerald-400">CH 1-4 ACTIVE</span>
            <span>TEKTRONIX</span>
          </div>
        </div>
      )}

      {type === 'xrd' && (
        <div className="relative z-10 h-28 w-30 bg-stone-900 rounded-2xl shadow-xl border border-stone-700 p-2 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[8px] font-bold text-stone-200">BRUKER D8</span>
            <span className="text-[7px] font-mono text-emerald-400">LYNXEYE</span>
          </div>
          <div className="h-12 bg-black rounded-lg border border-stone-800 p-1 flex items-center justify-center">
            <div className="w-16 h-8 border-b-2 border-stone-500 rounded-full border-dashed flex items-center justify-center">
              <span className="text-[7px] font-mono text-amber-300">2θ SCAN</span>
            </div>
          </div>
          <div className="flex justify-between text-[7px] text-stone-400 font-mono">
            <span>Cu Ka 40kV</span>
            <span className="text-emerald-400">ONLINE</span>
          </div>
        </div>
      )}

      {type === 'gcms' && (
        <div className="relative z-10 h-26 w-32 bg-stone-100 rounded-2xl shadow-xl border border-stone-300 p-2 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[8px] font-extrabold text-stone-800">AGILENT 8890</span>
            <span className="text-[7px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded">GC-MS</span>
          </div>
          <div className="h-10 bg-stone-900 rounded-lg p-1 text-white flex flex-col justify-center">
            <span className="text-[6px] font-mono text-cyan-300">OVEN: 280°C • FLOW: 1.2 mL/min</span>
            <div className="w-full h-1 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full mt-1" />
          </div>
          <div className="flex justify-between text-[7px] text-stone-600 font-mono">
            <span>AUTOSAMPLER</span>
            <span className="text-emerald-700 font-bold">READY</span>
          </div>
        </div>
      )}

      {type === 'zetasizer' && (
        <div className="relative z-10 h-26 w-30 bg-stone-900 rounded-2xl shadow-xl border border-stone-700 p-2 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[8px] font-bold text-amber-400">ZETASIZER ULTRA</span>
            <span className="text-[7px] font-mono text-stone-400">MALVERN</span>
          </div>
          <div className="h-10 bg-black rounded-lg border border-amber-900/40 flex items-center justify-center p-1">
            <span className="text-[8px] font-mono text-emerald-300 font-bold">MADLS: 0.3nm - 10µm</span>
          </div>
          <div className="flex justify-between text-[7px] text-stone-400 font-mono">
            <span>ZETA POTENTIAL</span>
            <span className="text-emerald-400">CALIBRATED</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FindEquipment() {
  const { setActiveTab } = useAuth()
  
  // States for Search, Filters, and Modals
  const [instruments, setInstruments] = useState(initialInstruments)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedInstitution, setSelectedInstitution] = useState('all')
  const [selectedAvailability, setSelectedAvailability] = useState('all')
  const [maxPrice, setMaxPrice] = useState('all')
  const [sortBy, setSortBy] = useState('recommended')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  useEffect(() => {
    const fetchLiveEquipment = async () => {
      try {
        setLoading(true)
        const res = await equipmentService.getEquipment({ limit: 100 })
        if (res?.data && res.data.length > 0) {
          const mapped = res.data.map((item) => {
            const rawCat = (item.category || '').toLowerCase()
            let categorySlug = 'general'
            if (rawCat.includes('life') || rawCat.includes('microscop') || rawCat.includes('imaging') || rawCat.includes('bio')) categorySlug = 'life-sciences'
            else if (rawCat.includes('analytical') || rawCat.includes('xrd') || rawCat.includes('characterization')) categorySlug = 'analytical'
            else if (rawCat.includes('mech') || rawCat.includes('fab') || rawCat.includes('print')) categorySlug = 'mechanical'
            else if (rawCat.includes('electr') || rawCat.includes('rf') || rawCat.includes('wave')) categorySlug = 'electronics'
            else if (rawCat.includes('chem')) categorySlug = 'chemical'
            else if (rawCat.includes('comp') || rawCat.includes('ai')) categorySlug = 'computing'

            // Format location as clean string
            let locStr = 'Campus Lab'
            if (typeof item.location === 'string' && item.location) {
              locStr = item.location
            } else if (item.labName) {
              locStr = item.labName
            } else if (item.location && typeof item.location === 'object') {
              locStr = [item.location.building, item.location.city].filter(Boolean).join(', ') || 'Campus Lab'
            }

            // Format institution as clean string
            let instStr = 'Chitkara University'
            if (typeof item.collegeName === 'string' && item.collegeName) {
              instStr = item.collegeName
            } else if (typeof item.institution === 'string' && item.institution) {
              instStr = item.institution
            } else if (typeof item.collegeId === 'string' && item.collegeId) {
              instStr = item.collegeId
            }

            return {
              id: item.equipmentId || item._id,
              title: item.equipmentName || item.title || item.name || 'Scientific Instrument',
              category: categorySlug,
              categoryLabel: item.category || 'General',
              institution: instStr,
              location: locStr,
              state: item.state || (typeof item.location === 'object' ? item.location?.state : null) || 'Punjab',
              availability: item.status === 'Available' ? 'Available Today' : (item.status || 'Available'),
              availType: item.status === 'Available' ? 'today' : 'limited',
              badgeClass: item.status === 'Available'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200',
              dotClass: item.status === 'Available' ? 'bg-emerald-500' : 'bg-amber-500',
              tags: Array.isArray(item.tags) && item.tags.length 
                ? item.tags 
                : (Array.isArray(item.capabilities) && item.capabilities.length ? item.capabilities.slice(0, 3) : ['Verified', 'Research Grade']),
              price: item.price || item.pricePerHour || 500,
              priceLabel: item.priceLabel || `₹${item.price || item.pricePerHour || 500}`,
              rating: item.rating || 4.8,
              operator: item.operator || 'Self-Operated (Trained)',
              specs: typeof item.specifications === 'string' 
                ? (item.specifications || item.description || '') 
                : (item.description || JSON.stringify(item.specifications || '')),
              slotsToday: Array.isArray(item.slotsToday) && item.slotsToday.length ? item.slotsToday : ['10:00 - 12:00', '14:00 - 16:00'],
              visualType: item.visualType || 'generic',
              demandPrediction: item.demandPrediction,
            }
          })
          setInstruments(mapped)
        }
      } catch (err) {
        console.warn('Using fallback equipment:', err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchLiveEquipment()
  }, [])
  
  // Favorites / Wishlist state
  const [wishlist, setWishlist] = useState(['inst-1', 'inst-6'])
  
  // Details Modal State
  const [activeModalInstrument, setActiveModalInstrument] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false)
  
  // AI Intent Search Modal
  const [showIntentSearchModal, setShowIntentSearchModal] = useState(false)
  const [intentInput, setIntentInput] = useState('')

  // Toggle favorite
  const toggleWishlist = (id, e) => {
    e.stopPropagation()
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedInstitution('all')
    setSelectedAvailability('all')
    setMaxPrice('all')
    setSortBy('recommended')
  }

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (searchQuery) count++
    if (selectedCategory !== 'all') count++
    if (selectedInstitution !== 'all') count++
    if (selectedAvailability !== 'all') count++
    if (maxPrice !== 'all') count++
    return count
  }, [searchQuery, selectedCategory, selectedInstitution, selectedAvailability, maxPrice])

  // Filtered and Sorted instruments
  const filteredInstruments = useMemo(() => {
    return instruments.filter(item => {
      // Search text match
      const q = (searchQuery || '').toLowerCase()
      const title = String(item.title || item.name || '').toLowerCase()
      const inst = String(item.institution || '').toLowerCase()
      const loc = String(item.location || '').toLowerCase()
      const tags = Array.isArray(item.tags) ? item.tags : []
      const specs = String(item.specs || '').toLowerCase()

      const matchesSearch = !q || 
        title.includes(q) ||
        inst.includes(q) ||
        loc.includes(q) ||
        tags.some(t => String(t).toLowerCase().includes(q)) ||
        specs.includes(q)

      // Category match
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory

      // Institution match
      const matchesInstitution = selectedInstitution === 'all' || item.institution === selectedInstitution

      // Availability match
      const matchesAvailability = selectedAvailability === 'all' || item.availType === selectedAvailability

      // Price filter match
      const matchesPrice = maxPrice === 'all' || item.price <= parseInt(maxPrice)

      return matchesSearch && matchesCategory && matchesInstitution && matchesAvailability && matchesPrice
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price
      if (sortBy === 'price-high') return b.price - a.price
      if (sortBy === 'rating') return b.rating - a.rating
      return 0 // recommended default
    })
  }, [instruments, searchQuery, selectedCategory, selectedInstitution, selectedAvailability, maxPrice, sortBy])

  // Institutions unique list
  const uniqueInstitutions = useMemo(() => {
    return Array.from(new Set(instruments.map(i => String(i.institution || '')).filter(Boolean)))
  }, [instruments])

  const handleIntentSubmit = (e) => {
    e.preventDefault()
    if (!intentInput.trim()) return
    setSearchQuery(intentInput.trim())
    setShowIntentSearchModal(false)
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10 animate-fadeIn">
      
      {/* 1. Header Section from Image 3 */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C58A48]/30 bg-[#FCF7F0] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#965D25] mb-2 shadow-xs">
            <span>Discover Capability</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight font-sans">
            Explore the <span className="text-[#C58A48]">network.</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-2 font-medium">
            Verified instruments, transparent access, no campus boundaries.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowIntentSearchModal(true)}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#E5DAC6] bg-white px-4 py-2.5 text-xs font-bold text-stone-800 shadow-xs hover:border-[#C58A48] hover:bg-[#FAF8F5] transition self-start md:self-auto"
        >
          <Sparkles className="h-4 w-4 text-[#C58A48]" />
          <span>Search by intent</span>
        </button>
      </div>

      {/* 2. Wide Search & Filters Bar from Image 3 */}
      <div className="rounded-3xl border border-[#EAE1D3] bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search instruments, methods, institutions (e.g. TEM, Confocal, XRD)..."
              className="w-full rounded-2xl border border-[#E5DAC6] bg-[#FAF8F5] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:border-[#C58A48] focus:outline-none focus:ring-1 focus:ring-[#C58A48]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
            <div className="inline-flex items-center gap-1.5 rounded-2xl border border-[#E5DAC6] bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700 shadow-xs">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#C58A48]" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1 rounded-full bg-[#C58A48] px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {activeFiltersCount}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition"
            >
              <RotateCcw className="h-3.5 w-3.5 text-stone-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Multi-Dropdown Filters Row */}
        <div className="pt-3 border-t border-[#EFE8DC] grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full appearance-none rounded-xl border border-[#E5DAC6] bg-white py-2 pl-3 pr-8 text-stone-700 font-medium focus:border-[#C58A48] focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
          </div>

          {/* Institution Dropdown */}
          <div className="relative">
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              className="w-full appearance-none rounded-xl border border-[#E5DAC6] bg-white py-2 pl-3 pr-8 text-stone-700 font-medium focus:border-[#C58A48] focus:outline-none cursor-pointer"
            >
              <option value="all">All Institutions</option>
              {uniqueInstitutions.map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
          </div>

          {/* Availability Dropdown */}
          <div className="relative">
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="w-full appearance-none rounded-xl border border-[#E5DAC6] bg-white py-2 pl-3 pr-8 text-stone-700 font-medium focus:border-[#C58A48] focus:outline-none cursor-pointer"
            >
              <option value="all">Any Availability</option>
              <option value="today">Available Today</option>
              <option value="limited">Limited Slots</option>
              <option value="week">Available This Week</option>
              <option value="demand">High Demand</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
          </div>

          {/* Max Price Dropdown */}
          <div className="relative">
            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full appearance-none rounded-xl border border-[#E5DAC6] bg-white py-2 pl-3 pr-8 text-stone-700 font-medium focus:border-[#C58A48] focus:outline-none cursor-pointer"
            >
              <option value="all">Any Hourly Rate</option>
              <option value="500">Under ₹500 / hr</option>
              <option value="1000">Under ₹1,000 / hr</option>
              <option value="1500">Under ₹1,500 / hr</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
          </div>
        </div>
      </div>

      {/* 3. Browse by Category Section from Image 1 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Browse by Category</h2>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#C58A48] hover:text-[#B37636] hover:underline"
          >
            <span>View all categories</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Horizontal Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
                className={`group flex flex-col justify-between p-3.5 rounded-2xl border text-left transition-all ${
                  cat.bg
                } ${
                  isSelected ? 'ring-2 ring-[#C58A48] shadow-md -translate-y-0.5' : 'shadow-xs hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 shadow-xs ${cat.iconColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-[#C58A48]" />}
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">
                    {cat.name}
                  </p>
                  <p className="text-[10px] opacity-75 mt-1 font-medium">
                    {cat.count} instruments
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. Featured Instruments Section from Image 2 */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-900 tracking-tight">Featured Instruments</h2>
              <span className="rounded-full bg-[#FAF5EC] border border-[#ECE0CE] px-2.5 py-0.5 text-xs font-bold text-[#965D25]">
                {filteredInstruments.length} found
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              High-demand instruments available across our network.
            </p>
          </div>

          {/* Sort and View Toggle Controls */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none rounded-xl border border-[#E5DAC6] bg-white py-2 pl-3 pr-8 text-xs font-semibold text-stone-700 shadow-xs focus:border-[#C58A48] focus:outline-none cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rating</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
            </div>

            <div className="flex items-center rounded-xl border border-[#E5DAC6] bg-white p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-[#241B16] text-white shadow-xs' : 'text-stone-400 hover:text-stone-700'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-[#241B16] text-white shadow-xs' : 'text-stone-400 hover:text-stone-700'
                }`}
                title="List View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Instruments Grid View */}
        {filteredInstruments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#E5DAC6] bg-white p-12 text-center space-y-3">
            <Microscope className="h-10 w-10 text-stone-300 mx-auto" />
            <h3 className="text-base font-bold text-stone-800">No instruments match your criteria</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Try adjusting your search query, selecting "All Categories", or resetting your price filters.
            </p>
            <button
              onClick={resetFilters}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#C58A48] px-4 py-2 text-xs font-bold text-white shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6' : 'space-y-4'}>
            {filteredInstruments.map((instrument) => {
              const isSaved = wishlist.includes(instrument.id)
              
              if (viewMode === 'list') {
                return (
                  <div
                    key={instrument.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-[#EAE1D3] bg-white p-4 shadow-xs transition hover:border-[#C58A48] hover:shadow-md"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="h-20 w-24 shrink-0 rounded-2xl overflow-hidden">
                        <InstrumentVisual type={instrument.visualType} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${instrument.badgeClass}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${instrument.dotClass}`} />
                            {instrument.availability}
                          </span>
                          {instrument.demandPrediction?.demandLevel && (
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${
                              String(instrument.demandPrediction.demandLevel).toUpperCase() === 'HIGH'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : String(instrument.demandPrediction.demandLevel).toUpperCase() === 'MEDIUM'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                              <span>{String(instrument.demandPrediction.demandLevel).toUpperCase()} DEMAND</span>
                            </span>
                          )}
                          <span className="text-xs font-bold text-amber-700">★ {instrument.rating}</span>
                        </div>
                        <h3 className="text-base font-bold text-stone-900 mt-1">{instrument.title}</h3>
                        <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3 text-stone-400" />
                          <span className="font-semibold text-stone-700">{instrument.institution}</span>
                          <span>•</span>
                          <MapPin className="h-3 w-3 text-stone-400" />
                          <span>{instrument.location}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100">
                      <div className="text-left sm:text-right">
                        <span className="text-base font-extrabold text-stone-900">{instrument.priceLabel}</span>
                        <span className="text-[11px] text-stone-500"> / hour</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveModalInstrument(instrument)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#241B16] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#382C25] transition active:scale-95"
                      >
                        <span>View Details</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              }

              // Card Structure Exactly Matching Image 2
              return (
                <div
                  key={instrument.id}
                  className="group relative flex flex-col justify-between rounded-3xl border border-[#EAE1D3] bg-white overflow-hidden shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#C58A48] hover:shadow-xl hover:shadow-stone-900/5"
                >
                  <div>
                    {/* Top Image Box with Status Badge and Wishlist Heart */}
                    <div className="relative">
                      <InstrumentVisual type={instrument.visualType} />
                      
                      {/* Top-Left Availability and AI Demand Badges */}
                      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 items-start">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold backdrop-blur-md shadow-xs ${instrument.badgeClass}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${instrument.dotClass}`} />
                          {instrument.availability}
                        </span>
                        {instrument.demandPrediction?.demandLevel && (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-extrabold backdrop-blur-md shadow-xs ${
                            String(instrument.demandPrediction.demandLevel).toUpperCase() === 'HIGH'
                              ? 'bg-rose-900/90 text-rose-100 border-rose-600'
                              : String(instrument.demandPrediction.demandLevel).toUpperCase() === 'MEDIUM'
                              ? 'bg-amber-800/90 text-amber-100 border-amber-600'
                              : 'bg-emerald-800/90 text-emerald-100 border-emerald-600'
                          }`}>
                            <Sparkles className="h-2.5 w-2.5 text-yellow-300" />
                            <span>{String(instrument.demandPrediction.demandLevel).toUpperCase()} DEMAND</span>
                          </span>
                        )}
                      </div>

                      {/* Top-Right Wishlist Heart Button */}
                      <button
                        type="button"
                        onClick={(e) => toggleWishlist(instrument.id, e)}
                        className={`absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition ${
                          isSaved 
                            ? 'bg-rose-50 border-rose-200 text-rose-500' 
                            : 'bg-white/80 border-stone-200 text-stone-400 hover:text-rose-500 hover:bg-white'
                        }`}
                        title={isSaved ? 'Remove from saved' : 'Save to watchlist'}
                      >
                        <Heart className={`h-4 w-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </div>

                    {/* Card Content Area */}
                    <div className="p-4 sm:p-5 space-y-3">
                      {/* Title */}
                      <h3 className="text-sm font-bold text-stone-900 leading-snug line-clamp-2">
                        {instrument.title}
                      </h3>

                      {/* Institution & Location */}
                      <div className="flex items-center gap-2 text-[11px] text-stone-600">
                        <div className="flex items-center gap-1 truncate font-semibold text-stone-800">
                          <Building2 className="h-3.5 w-3.5 text-[#C58A48] shrink-0" />
                          <span className="truncate">{instrument.institution}</span>
                        </div>
                        <span className="text-stone-300">•</span>
                        <div className="flex items-center gap-1 shrink-0 text-stone-500">
                          <MapPin className="h-3 w-3 text-stone-400" />
                          <span>{instrument.location}</span>
                        </div>
                      </div>

                      {/* Feature Tags from Image 2 */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {instrument.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-lg bg-[#FAF8F5] border border-[#EAE1D3] px-2 py-0.5 text-[10px] font-medium text-stone-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Price and View Details Action */}
                  <div className="p-4 sm:p-5 pt-0 mt-2">
                    <div className="flex items-center justify-between pt-3 border-t border-[#EFE8DC]">
                      <div>
                        <span className="text-lg font-extrabold text-stone-900">{instrument.priceLabel}</span>
                        <span className="text-xs text-stone-500 font-medium"> / hour</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveModalInstrument(instrument)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#241B16] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#382C25] active:scale-95"
                      >
                        <span>View Details</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 5. Bottom Banner from Image 2 */}
        <div className="mt-12 rounded-3xl border border-[#EAE1D3] bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800">
            <Zap className="h-3.5 w-3.5 text-emerald-600" />
            <span>Building a more accessible research ecosystem.</span>
          </div>

          <button
            type="button"
            onClick={() => alert('All available grid instruments loaded!')}
            className="inline-flex items-center gap-2 rounded-full border border-[#E5DAC6] bg-[#FAF8F5] px-6 py-2.5 text-xs font-bold text-stone-800 shadow-xs hover:border-[#C58A48] hover:bg-white transition"
          >
            <span>Load More Instruments</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          <p className="text-xs text-stone-500 italic font-serif text-center sm:text-right">
            More institutions. More ideas. A brighter tomorrow.
          </p>
        </div>

      </div>

      {/* 6. Instrument Details & Booking Modal */}
      {activeModalInstrument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#19120F]/65 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#EAE1D3] bg-white p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${activeModalInstrument.badgeClass}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${activeModalInstrument.dotClass}`} />
                    {activeModalInstrument.availability}
                  </span>
                  {activeModalInstrument.demandPrediction?.demandLevel && (
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${
                      String(activeModalInstrument.demandPrediction.demandLevel).toUpperCase() === 'HIGH'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : String(activeModalInstrument.demandPrediction.demandLevel).toUpperCase() === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      <span>AI Demand: {String(activeModalInstrument.demandPrediction.demandLevel).toUpperCase()}</span>
                      {activeModalInstrument.demandPrediction?.predictedBookings ? (
                        <span className="opacity-75 font-normal">({activeModalInstrument.demandPrediction.predictedBookings} req/wk)</span>
                      ) : null}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-stone-900 mt-2">{activeModalInstrument.title}</h3>
                <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                  <Building2 className="h-3.5 w-3.5 text-[#C58A48]" />
                  <span className="font-semibold text-stone-800">{activeModalInstrument.institution}</span>
                  <span>•</span>
                  <span>{activeModalInstrument.location}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveModalInstrument(null)
                  setBookingConfirmed(false)
                  setSelectedSlot(null)
                  setBookingError('')
                }}
                className="rounded-xl border border-stone-200 p-2 text-stone-400 hover:bg-stone-50 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Visual & Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#EAE1D3] overflow-hidden">
                <InstrumentVisual type={activeModalInstrument.visualType} />
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE1D3] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-medium">Hourly Rate</span>
                    <span className="font-extrabold text-stone-900 text-sm">{activeModalInstrument.priceLabel} / hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-medium">Operator Mode</span>
                    <span className="font-semibold text-stone-800">{activeModalInstrument.operator}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-medium">User Rating</span>
                    <span className="font-bold text-amber-700">★ {activeModalInstrument.rating} / 5.0</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-stone-900 mb-1">Specifications</h4>
                  <p className="text-stone-600 leading-relaxed text-[11px]">{activeModalInstrument.specs}</p>
                </div>
              </div>
            </div>

            {/* Booking Slot Selection */}
            {!bookingConfirmed ? (
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-stone-900 text-sm">Select Available Time Slot</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {activeModalInstrument.slotsToday.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slot)
                        setBookingError('')
                      }}
                      className={`p-3 rounded-2xl border text-center transition ${
                        selectedSlot === slot 
                          ? 'border-[#C58A48] bg-[#FCF7F0] text-[#965D25] ring-2 ring-[#C58A48] font-bold shadow-xs' 
                          : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700 font-medium'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5 mx-auto mb-1 text-stone-400" />
                      <span className="text-xs">{slot}</span>
                    </button>
                  ))}
                </div>

                {/* Booking Error Banner */}
                {bookingError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-800 flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 flex-1">
                      <p className="font-bold text-rose-900">
                        {bookingError.toLowerCase().includes('conflict') ||
                        bookingError.toLowerCase().includes('already booked') ||
                        bookingError.toLowerCase().includes('active booking')
                          ? 'Booking Conflict Detected'
                          : 'Booking Request Notice'}
                      </p>
                      <p className="text-rose-700 leading-snug">{bookingError}</p>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModalInstrument(null)
                      setBookingError('')
                    }}
                    className="flex-1 rounded-xl border border-stone-200 py-3 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!selectedSlot || isBookingSubmitting}
                    onClick={async () => {
                      setBookingError('')
                      setIsBookingSubmitting(true)
                      try {
                        await bookingService.createBooking({
                          equipmentId: activeModalInstrument.id,
                          equipmentName: activeModalInstrument.title,
                          equipmentCategory: activeModalInstrument.categoryLabel || activeModalInstrument.category,
                          college: activeModalInstrument.institution,
                          lab: activeModalInstrument.location,
                          date: new Date().toISOString().split('T')[0],
                          startTime: selectedSlot ? selectedSlot.split(' - ')[0] : '10:00',
                          endTime: selectedSlot ? selectedSlot.split(' - ')[1] : '12:00',
                          purpose: 'Research experiment session booked via Find Equipment portal',
                        })
                        setBookingConfirmed(true)
                      } catch (err) {
                        setBookingError(err.message || 'Unable to complete reservation for this slot. Please choose another slot.')
                      } finally {
                        setIsBookingSubmitting(false)
                      }
                    }}
                    className={`flex-1 rounded-xl py-3 text-xs font-bold text-white transition ${
                      selectedSlot && !isBookingSubmitting
                        ? 'bg-[#C58A48] hover:bg-[#B37636] shadow-md shadow-[#C58A48]/20 cursor-pointer' 
                        : 'bg-stone-300 cursor-not-allowed'
                    }`}
                  >
                    {isBookingSubmitting ? 'Checking Availability...' : 'Confirm & Reserve Slot'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-3 animate-fadeIn">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h4 className="text-lg font-bold text-emerald-900">Reservation Confirmed!</h4>
                <p className="text-xs text-emerald-700">
                  Your session for <span className="font-bold">{activeModalInstrument.title}</span> at <span className="font-bold">{selectedSlot}</span> has been synced to your dashboard upcoming bookings.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModalInstrument(null)
                      setBookingConfirmed(false)
                      setActiveTab('overview')
                    }}
                    className="rounded-xl bg-[#241B16] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#382C25]"
                  >
                    View in Dashboard
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 7. Search by Intent AI Modal */}
      {showIntentSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#19120F]/65 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#EAE1D3] bg-white p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FCF7F0] border border-[#EED7B3] text-[#C58A48]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">AI Intent Search</h3>
                  <p className="text-[11px] text-stone-500">Describe your research experiment or technique in plain language</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIntentSearchModal(false)}
                className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleIntentSubmit} className="space-y-4">
              <textarea
                rows={3}
                value={intentInput}
                onChange={(e) => setIntentInput(e.target.value)}
                placeholder="e.g. 'I need to image live neuron cells at sub-150nm resolution with temperature control' or 'Looking for powder XRD for perovskite solar thin films'..."
                className="w-full rounded-2xl border border-[#E5DAC6] bg-[#FAF8F5] p-3.5 text-xs text-stone-800 placeholder-stone-400 focus:border-[#C58A48] focus:outline-none"
              />

              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] text-stone-400 font-bold uppercase py-1">Try:</span>
                {['Live-cell confocal', 'High resolution FE-SEM', 'Powder XRD', 'Microfluidics SLA'].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setIntentInput(suggestion)}
                    className="rounded-lg bg-stone-100 hover:bg-[#FCF7F0] hover:text-[#965D25] border border-stone-200 px-2 py-0.5 text-[10px] text-stone-600 transition"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIntentSearchModal(false)}
                  className="flex-1 rounded-xl border border-stone-200 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#C58A48] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#B37636]"
                >
                  Find Optimal Instruments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
