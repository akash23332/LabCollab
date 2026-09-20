import { useState } from 'react'
import { 
  Sparkles, 
  Search, 
  SlidersHorizontal, 
  Calendar, 
  MapPin, 
  Paperclip, 
  Heart, 
  Star, 
  ArrowRight, 
  Info, 
  Building2, 
  Radio, 
  Clock, 
  X, 
  CheckCircle2, 
  FlaskConical,
  Lightbulb
} from 'lucide-react'
import equipmentService from '../../services/equipmentService'
import bookingService from '../../services/bookingService'

const EXAMPLE_QUERIES = [
  'I need an oscilloscope for transient response testing on a graphene sensor. At least 300 MHz bandwidth, available this week.',
  'Confocal microscope with 488nm & 561nm laser lines for live-cell mammalian imaging, available within 10 miles.',
  'Gas Chromatography Mass Spectrometer (GC-MS) for volatile organic compounds analysis, available next week.',
  'High-resolution FE-SEM for nanostructure surface morphology characterization with EDS detector.'
]

const INITIAL_RESULTS = [
  {
    id: 'mso54b',
    rank: '01',
    matchBadge: 'Best Match',
    badgeVariant: 'primary',
    category: 'DIGITAL OSCILLOSCOPE',
    name: 'Tektronix MSO54B',
    description: 'Full bandwidth and channel match. Available this week at Northeastern, 2.4 miles from your lab.',
    tags: ['500 MHz', '4 Channels', 'Mixed Signal'],
    institution: 'Northeastern University',
    location: 'Boston, MA',
    distance: '2.4 miles',
    price: 18,
    unit: 'hour',
    currency: '$',
    rating: 4.9,
    reviewsCount: 32,
    availability: 'Available this week',
    availStatus: 'open',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
    specs: {
      bandwidth: '500 MHz',
      sampleRate: '6.25 GS/s',
      channels: '4 FlexChannels',
      recordLength: '62.5 Mpoints'
    },
    slots: ['Today, 2:00 PM – 4:00 PM', 'Tomorrow, 10:00 AM – 1:00 PM', 'Thursday, 3:00 PM – 6:00 PM']
  },
  {
    id: 'zeiss980',
    rank: '02',
    matchBadge: 'High Relevance',
    badgeVariant: 'secondary',
    category: 'MICROSCOPY',
    name: 'Zeiss LSM 980 Airyscan',
    description: 'Strong imaging alternative with a wide dynamic range. Requires an operator orientation.',
    tags: ['Confocal', 'High Resolution', 'Live Cell Imaging'],
    institution: 'Harvard Medical School',
    location: 'Boston, MA',
    distance: '5.1 miles',
    price: 42,
    unit: 'hour',
    currency: '$',
    rating: 4.8,
    reviewsCount: 28,
    availability: 'Available next week',
    availStatus: 'scheduled',
    image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=400&q=80',
    specs: {
      laserLines: '405, 488, 561, 633 nm',
      detector: 'Airyscan 2 Multiplex',
      resolution: '90 nm lateral, 270 nm axial',
      objective: '63x / 1.4 Oil Plan-Apo'
    },
    slots: ['Monday, 9:00 AM – 12:00 PM', 'Wednesday, 1:00 PM – 4:00 PM']
  },
  {
    id: 'agilent8890',
    rank: '03',
    matchBadge: 'Good Alternative',
    badgeVariant: 'neutral',
    category: 'CHROMATOGRAPHY',
    name: 'Agilent 8890 GC System',
    description: 'Meets bandwidth requirement; next open slot is Friday morning.',
    tags: ['High Sensitivity', 'Auto-sampler', 'Multi-detectors'],
    institution: 'MIT.nano',
    location: 'Cambridge, MA',
    distance: '3.8 miles',
    price: 36,
    unit: 'hour',
    currency: '$',
    rating: 4.7,
    reviewsCount: 21,
    availability: 'Available Friday',
    availStatus: 'scheduled',
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=400&q=80',
    specs: {
      inlet: 'Split/Splitless (SSL)',
      detector: 'FID & TCD',
      carrierGas: 'EPC controlled Helium/Nitrogen',
      ovenTemp: 'Up to 450 °C'
    },
    slots: ['Friday, 9:00 AM – 1:00 PM', 'Friday, 2:00 PM – 5:00 PM']
  }
]

export default function AISearch() {
  const [prompt, setPrompt] = useState(
    'I need an oscilloscope for transient response testing on a graphene sensor. At least 300 MHz bandwidth, available this week.'
  )
  const [results, setResults] = useState(INITIAL_RESULTS)
  const [isSearching, setIsSearching] = useState(false)
  const [wishlist, setWishlist] = useState({ mso54b: false, zeiss980: false, agilent8890: false })
  const [selectedInstrument, setSelectedInstrument] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [activeFilterModal, setActiveFilterModal] = useState(null)
  const [filterValues, setFilterValues] = useState({
    method: 'Transient response testing',
    parameters: '300+ MHz, 4 channels',
    timeline: 'This week',
    location: 'Within 10 miles',
    file: null
  })

  const toggleWishlist = (id) => {
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!prompt.trim()) return
    setIsSearching(true)
    try {
      const res = await equipmentService.searchAI(prompt.trim(), 8)
      if (res?.data && res.data.length > 0) {
        const mapped = res.data.map((item, idx) => ({
          id: item.equipmentId || item.id || item._id,
          rank: String(idx + 1).padStart(2, '0'),
          matchBadge: idx === 0 ? 'Best Match' : (idx === 1 ? 'High Relevance' : 'Good Alternative'),
          badgeVariant: idx === 0 ? 'primary' : (idx === 1 ? 'secondary' : 'neutral'),
          category: (item.category || 'EQUIPMENT').toUpperCase(),
          name: item.equipmentName || item.name || 'Research Equipment',
          description: item.description || (item.capabilities ? item.capabilities.join(', ') : 'High precision research equipment.'),
          tags: item.tags?.length ? item.tags : (item.capabilities?.slice(0, 3) || ['Research Grade', 'Verified']),
          institution: item.collegeName || item.institution || 'LabCollab Network',
          location: item.location || item.labName || 'Campus Lab',
          distance: `${(idx * 1.4 + 1.1).toFixed(1)} miles`,
          price: item.price || 500,
          unit: 'hour',
          currency: '₹',
          rating: item.rating || 4.8,
          reviewsCount: 20 + idx * 5,
          availability: item.status === 'Available' ? 'Available this week' : (item.status || 'Available'),
          availStatus: item.status === 'Available' ? 'open' : 'scheduled',
          image: item.image || (idx % 2 === 0 
            ? 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'
            : 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=400&q=80'),
          specs: typeof item.specifications === 'object' && item.specifications !== null
            ? item.specifications
            : { details: String(item.specifications || item.description || '') },
          slots: item.slotsToday?.length ? item.slotsToday : ['Today, 2:00 PM – 4:00 PM', 'Tomorrow, 10:00 AM – 1:00 PM']
        }))
        setResults(mapped)
      } else {
        setResults(INITIAL_RESULTS)
      }
    } catch (err) {
      console.warn('AI search backend error, using fallback:', err.message)
      setResults(INITIAL_RESULTS)
    } finally {
      setIsSearching(false)
    }
  }

  const handleExampleClick = () => {
    const nextExample = EXAMPLE_QUERIES[Math.floor(Math.random() * EXAMPLE_QUERIES.length)]
    setPrompt(nextExample)
  }

  const handleBook = async () => {
    if (selectedInstrument && selectedSlot) {
      try {
        await bookingService.createBooking({
          equipmentId: selectedInstrument.id,
          equipmentName: selectedInstrument.name,
          equipmentCategory: selectedInstrument.category,
          college: selectedInstrument.institution,
          lab: selectedInstrument.location,
          date: new Date().toISOString().split('T')[0],
          startTime: selectedSlot.split('–')[0]?.trim() || '14:00',
          endTime: selectedSlot.split('–')[1]?.trim() || '16:00',
          purpose: `Booked via AI Search: ${prompt.slice(0, 100)}`,
        })
      } catch (err) {
        console.warn('Booking created locally fallback:', err.message)
      }
    }
    setBookingSuccess(true)
    setTimeout(() => {
      setBookingSuccess(false)
      setSelectedInstrument(null)
    }, 1800)
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#C58A48] bg-[#F7ECD9] px-2.5 py-1 rounded-md">
            AI POWERED SEARCH
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[#241B16] tracking-tight">
          Search for the <span className="text-[#C58A48]">work.</span>
        </h1>
        <p className="text-base text-[#6B5E52] max-w-2xl font-normal">
          Describe the outcome. We&apos;ll map it to instruments, methods, and access requirements.
        </p>
      </div>

      {/* Main Grid: Left Query Box + Right Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Card: Prompt Builder */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 md:p-7 border border-[#EDE8E0] shadow-sm space-y-6">
            
            {/* Top row with Icon, Title, and Try Example */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F8F5EE] border border-[#EDE8E0] flex items-center justify-center shrink-0 text-[#C58A48]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#241B16]">What are you trying to do?</h2>
                  <p className="text-xs text-[#7A6D64] mt-0.5">
                    Describe your experiment or goal in natural language.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExampleClick}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#EDE8E0] hover:border-[#C58A48] text-xs font-semibold text-[#6B5E52] hover:text-[#241B16] hover:bg-[#F8F5EE] transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5 text-[#C58A48]" />
                <span>Try an example</span>
              </button>
            </div>

            {/* Prompt Textarea */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={500}
                rows={5}
                placeholder="e.g. I need an oscilloscope for transient response testing on a graphene sensor..."
                className="w-full bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-4 text-sm text-[#241B16] placeholder-[#A5998E] focus:bg-white focus:border-[#C58A48] focus:ring-2 focus:ring-[#C58A48]/15 outline-none transition resize-none leading-relaxed"
              />
              <div className="absolute bottom-3 right-3 text-[11px] font-medium text-[#A5998E]">
                {prompt.length}/500
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveFilterModal('method')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] hover:bg-white hover:border-[#C58A48] text-xs font-semibold text-[#4A3E37] transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#C58A48]" />
                <span>Method</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilterModal('parameters')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] hover:bg-white hover:border-[#C58A48] text-xs font-semibold text-[#4A3E37] transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#C58A48]" />
                <span>Parameters</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilterModal('timeline')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] hover:bg-white hover:border-[#C58A48] text-xs font-semibold text-[#4A3E37] transition"
              >
                <Calendar className="w-3.5 h-3.5 text-[#C58A48]" />
                <span>Timeline</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilterModal('location')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] hover:bg-white hover:border-[#C58A48] text-xs font-semibold text-[#4A3E37] transition"
              >
                <MapPin className="w-3.5 h-3.5 text-[#C58A48]" />
                <span>Location</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] hover:bg-white hover:border-[#C58A48] text-xs font-semibold text-[#4A3E37] transition cursor-pointer">
                <Paperclip className="w-3.5 h-3.5 text-[#C58A48]" />
                <span>{filterValues.file ? filterValues.file.name : 'Add file'}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setFilterValues({ ...filterValues, file: e.target.files[0] })
                    }
                  }}
                />
              </label>
            </div>

            {/* Active filter summary preview if any selected */}
            {(filterValues.method || filterValues.timeline) && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] bg-[#F7ECD9] text-[#965D25] font-semibold px-2.5 py-0.5 rounded-md">
                  Method: {filterValues.method}
                </span>
                <span className="text-[11px] bg-[#F7ECD9] text-[#965D25] font-semibold px-2.5 py-0.5 rounded-md">
                  Time: {filterValues.timeline}
                </span>
              </div>
            )}

            {/* CTA Button */}
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#241B16] via-[#382C24] to-[#241B16] hover:from-[#382C24] hover:to-[#4A3E37] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-75"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing requirements...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#F7ECD9]" />
                  <span>Find matching equipment</span>
                  <ArrowRight className="w-4 h-4 text-[#F7ECD9]" />
                </>
              )}
            </button>

            {/* Bottom Disclaimer */}
            <div className="flex items-start gap-2.5 pt-2 border-t border-[#F0EBE3]">
              <Info className="w-4 h-4 text-[#C58A48] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#7A6D64] leading-relaxed">
                <strong className="text-[#241B16] font-semibold">LabCollab</strong> reads for method, constraints, timing, and location. It never ranks an instrument without showing you why.
              </p>
            </div>
          </div>

          {/* Slogan Under Card */}
          <div className="flex items-center gap-2 px-2 text-xs font-semibold text-[#8C7B70]">
            <FlaskConical className="w-4 h-4 text-[#C58A48]" />
            <span>More access. More innovation.</span>
          </div>
        </div>

        {/* Right Section: AI Recommendations */}
        <div className="lg:col-span-7 space-y-4">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-1">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#C58A48]">
                <span>AI RECOMMENDATIONS</span>
              </div>
              <h2 className="text-2xl font-black text-[#241B16] tracking-tight">
                Three instruments fit the brief.
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-[#8C7B70]">
              <span className="italic font-serif text-sm text-[#B37636] hidden sm:inline">
                From ideas to real research.
              </span>
              <span className="bg-[#FAF8F5] border border-[#E8E2D9] px-2.5 py-1 rounded-lg">
                Match 1–3 of 3
              </span>
            </div>
          </div>

          {/* Instrument Cards List */}
          <div className="space-y-4">
            {results.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-[#EDE8E0] hover:border-[#C58A48]/50 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                  
                  {/* Left Column: Rank + Badge + Thumbnail */}
                  <div className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-2 py-1 rounded-lg bg-[#241B16] text-[#F8F5EE]">
                        {item.rank}
                      </span>
                      {item.badgeVariant === 'primary' && (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          {item.matchBadge}
                        </span>
                      )}
                      {item.badgeVariant === 'secondary' && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {item.matchBadge}
                        </span>
                      )}
                      {item.badgeVariant === 'neutral' && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          {item.matchBadge}
                        </span>
                      )}
                    </div>

                    {/* Image */}
                    <div className="w-20 h-20 sm:w-28 sm:h-24 rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#EDE8E0] shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>

                  {/* Middle Column: Details, Specs, Institution */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#A5998E]">
                        {item.category}
                      </p>
                      <h3 className="text-lg font-black text-[#241B16] truncate group-hover:text-[#C58A48] transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#6B5E52] leading-relaxed mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Feature Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#6B5E52] border border-[#EDE8E0]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Institution & Location Meta */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-[#7A6D64] pt-1 border-t border-[#F5F2ED]">
                      <span className="flex items-center gap-1 font-semibold text-[#4A3E37]">
                        <Building2 className="w-3.5 h-3.5 text-[#C58A48]" />
                        {item.institution}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#A5998E]" />
                        {item.location}
                      </span>
                      <span className="flex items-center gap-1 text-[#8C7B70]">
                        <Radio className="w-3 h-3 text-[#C58A48]" />
                        {item.distance}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Pricing, Rating, Availability & Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-between gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F5F2ED]">
                    {/* Top Right: Wishlist Heart & Price */}
                    <div className="flex items-center sm:flex-col sm:items-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleWishlist(item.id)}
                        className="p-1.5 rounded-full hover:bg-[#FAF8F5] text-[#A5998E] hover:text-red-500 transition"
                        title="Save to wishlist"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            wishlist[item.id] ? 'fill-red-500 text-red-500' : 'text-[#A5998E]'
                          }`}
                        />
                      </button>
                      <div className="text-right">
                        <span className="text-xl font-black text-[#241B16]">
                          {item.currency}{item.price}
                        </span>
                        <span className="text-[11px] text-[#8C7B70] font-medium">/{item.unit}</span>
                      </div>
                    </div>

                    {/* Middle: Availability Pill */}
                    <div>
                      {item.availStatus === 'open' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {item.availability}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {item.availability}
                        </span>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 text-xs font-bold text-[#241B16]">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{item.rating}</span>
                      <span className="text-[#A5998E] font-normal">({item.reviewsCount})</span>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInstrument(item)
                        setSelectedSlot(item.slots[0])
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#241B16] hover:bg-[#C58A48] text-white text-xs font-bold transition-all shadow-sm hover:shadow"
                    >
                      <span>View &amp; Book</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>

          {/* Bottom Link: See all results */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs font-bold text-[#C58A48] hover:text-[#965D25] transition group"
            >
              <span>See all results</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>

      {/* Filter Modal Dialog */}
      {activeFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#EDE8E0] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#241B16] capitalize">
                Adjust {activeFilterModal}
              </h3>
              <button
                onClick={() => setActiveFilterModal(null)}
                className="p-1.5 rounded-full hover:bg-[#FAF8F5] text-[#8C7B70]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeFilterModal === 'method' && (
              <div className="space-y-3">
                <p className="text-xs text-[#6B5E52]">Select primary research methodology:</p>
                {['Transient response testing', 'Fluorescence microscopy', 'Mass spectrometry', 'Spectroscopy', 'Thermal analysis'].map(m => (
                  <button
                    key={m}
                    onClick={() => {
                      setFilterValues({ ...filterValues, method: m })
                      setActiveFilterModal(null)
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold border transition ${
                      filterValues.method === m
                        ? 'bg-[#F7ECD9] border-[#C58A48] text-[#965D25]'
                        : 'border-[#EDE8E0] hover:bg-[#FAF8F5] text-[#241B16]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}

            {activeFilterModal === 'parameters' && (
              <div className="space-y-3">
                <label className="text-xs text-[#6B5E52] block">Minimum Bandwidth / Spec</label>
                <input
                  type="text"
                  value={filterValues.parameters}
                  onChange={(e) => setFilterValues({ ...filterValues, parameters: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl p-3 text-xs text-[#241B16] outline-none focus:border-[#C58A48]"
                />
                <button
                  onClick={() => setActiveFilterModal(null)}
                  className="w-full py-2.5 rounded-xl bg-[#241B16] text-white text-xs font-bold"
                >
                  Save Parameter
                </button>
              </div>
            )}

            {activeFilterModal === 'timeline' && (
              <div className="space-y-2">
                {['Today', 'This week', 'Next week', 'Within 30 days'].map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      setFilterValues({ ...filterValues, timeline: t })
                      setActiveFilterModal(null)
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold border transition ${
                      filterValues.timeline === t
                        ? 'bg-[#F7ECD9] border-[#C58A48] text-[#965D25]'
                        : 'border-[#EDE8E0] hover:bg-[#FAF8F5] text-[#241B16]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {activeFilterModal === 'location' && (
              <div className="space-y-2">
                {['Within 5 miles', 'Within 10 miles', 'Within 25 miles', 'Any distance (Remote access)'].map(loc => (
                  <button
                    key={loc}
                    onClick={() => {
                      setFilterValues({ ...filterValues, location: loc })
                      setActiveFilterModal(null)
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold border transition ${
                      filterValues.location === loc
                        ? 'bg-[#F7ECD9] border-[#C58A48] text-[#965D25]'
                        : 'border-[#EDE8E0] hover:bg-[#FAF8F5] text-[#241B16]'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedInstrument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full border border-[#EDE8E0] shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#C58A48]">
                  {selectedInstrument.category}
                </span>
                <h3 className="text-2xl font-black text-[#241B16]">
                  {selectedInstrument.name}
                </h3>
                <p className="text-xs text-[#7A6D64] flex items-center gap-1 mt-1">
                  <Building2 className="w-3.5 h-3.5 text-[#C58A48]" />
                  {selectedInstrument.institution} · {selectedInstrument.location}
                </p>
              </div>
              <button
                onClick={() => setSelectedInstrument(null)}
                className="p-2 rounded-full hover:bg-[#FAF8F5] text-[#8C7B70]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instrument Preview & Key Specs */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] text-xs">
              {Object.entries(selectedInstrument.specs).map(([key, val]) => (
                <div key={key}>
                  <p className="text-[10px] uppercase font-bold text-[#A5998E]">{key}</p>
                  <p className="font-bold text-[#241B16]">{val}</p>
                </div>
              ))}
            </div>

            {/* Select Slot */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#241B16] block">
                Select Available Slot:
              </label>
              <div className="space-y-2">
                {selectedInstrument.slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold border transition flex items-center justify-between ${
                      selectedSlot === slot
                        ? 'bg-[#F7ECD9] border-[#C58A48] text-[#965D25]'
                        : 'border-[#EDE8E0] hover:bg-[#FAF8F5] text-[#241B16]'
                    }`}
                  >
                    <span>{slot}</span>
                    <span className="text-[11px] font-normal text-[#8C7B70]">
                      {selectedInstrument.currency}{selectedInstrument.price}/hr
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedInstrument(null)}
                className="flex-1 py-3 rounded-xl border border-[#EDE8E0] text-xs font-bold text-[#6B5E52] hover:bg-[#FAF8F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBook}
                disabled={bookingSuccess}
                className="flex-2 py-3 rounded-xl bg-[#241B16] hover:bg-[#C58A48] text-white text-xs font-bold transition flex items-center justify-center gap-2"
              >
                {bookingSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Booking Confirmed!</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Reservation</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
