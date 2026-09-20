/**
 * Phase 4 - AI service abstraction.
 *
 * The recommendation *model* is developed separately (and may live on another
 * machine). This module is the only place that knows how to reach it, so the
 * backend never depends on it being up:
 *
 *   AI_PROVIDER=mock      -> deterministic rule based parser (default)
 *   AI_PROVIDER=external  -> POST the query to AI_MODEL_URL, fall back on error
 *
 * `parseRequirement()` is the stable interface. Whatever the provider, the
 * result is passed through `normalizeRequirement()` so an AI response can only
 * ever contribute *parsed search intent*. It can never set booking state,
 * availability, prices or verification - those stay in the backend/database.
 */

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const AI_PROVIDERS = ['mock', 'external'];
const DEFAULT_TIMEOUT_MS = 4000;
const MIN_TIMEOUT_MS = 500;
const MAX_TIMEOUT_MS = 15000;
const MAX_QUERY_LENGTH = 400;
const MAX_STRING_FIELD = 80;
const MAX_KEYWORDS = 15;

/** Fields a provider (fallback or external) is allowed to contribute. */
const REQUIREMENT_FIELDS = [
  'equipmentType',
  'category',
  'date',
  'startTime',
  'endTime',
  'duration',
  'maxPricePerHour',
  'maxTotalPrice',
  'city',
  'state',
  'trainingRequired',
  'certificationRequired',
  'timeOfDay',
];

// ---------------------------------------------------------------------------
// Equipment vocabulary
// ---------------------------------------------------------------------------

/**
 * equipmentType => aliases used both to detect the intent in the query and to
 * match equipment rows (name/description/manufacturer/model/category).
 * `key` is what is returned as `equipmentType`.
 */
const EQUIPMENT_TYPES = [
  {
    key: 'SEM',
    category: 'microscopy',
    aliases: ['scanning electron microscope', 'scanning electron microscopy', 'sem'],
  },
  {
    key: 'TEM',
    category: 'microscopy',
    aliases: ['transmission electron microscope', 'transmission electron microscopy', 'tem'],
  },
  {
    key: 'Electron Microscope',
    category: 'microscopy',
    aliases: ['electron microscope', 'electron microscopy'],
  },
  {
    key: 'Microscope',
    category: 'microscopy',
    aliases: [
      'optical microscope',
      'confocal microscope',
      'fluorescence microscope',
      'inverted microscope',
      'microscope',
    ],
  },
  {
    key: '3D Printer',
    category: '3d printing',
    aliases: [
      '3d printer',
      '3d printing',
      '3d-printing',
      'fdm printer',
      'sla printer',
      'resin printer',
      'additive manufacturing',
    ],
  },
  { key: '3D Scanner', category: '3d scanning', aliases: ['3d scanner', '3d scanning', 'structured light scanner'] },
  { key: 'XRD', category: 'materials characterization', aliases: ['x-ray diffraction', 'xray diffraction', 'xrd'] },
  { key: 'XRF', category: 'materials characterization', aliases: ['x-ray fluorescence', 'xrf'] },
  {
    key: 'Spectrometer',
    category: 'spectroscopy',
    aliases: ['spectrometer', 'spectrophotometer', 'uv-vis', 'uv vis', 'ftir', 'raman', 'nmr', 'mass spectrometer'],
  },
  { key: 'PCR Machine', category: 'molecular biology', aliases: ['pcr machine', 'thermal cycler', 'pcr'] },
  { key: 'Centrifuge', category: 'molecular biology', aliases: ['centrifuge', 'ultracentrifuge'] },
  { key: 'Gene Sequencer', category: 'molecular biology', aliases: ['gene sequencer', 'dna sequencer', 'sequencer'] },
  { key: 'Bioreactor', category: 'bioprocessing', aliases: ['bioreactor', 'fermenter'] },
  { key: 'Autoclave', category: 'lab support', aliases: ['autoclave', 'sterilizer'] },
  { key: 'Oscilloscope', category: 'electronics', aliases: ['oscilloscope', 'dso', 'cro'] },
  { key: 'Signal Generator', category: 'electronics', aliases: ['signal generator', 'function generator'] },
  { key: 'PCB Machine', category: 'electronics', aliases: ['pcb milling', 'pcb printer', 'pcb machine'] },
  { key: 'CNC Machine', category: 'manufacturing', aliases: ['cnc machine', 'cnc mill', 'cnc', 'milling machine', 'lathe'] },
  { key: 'Laser Cutter', category: 'manufacturing', aliases: ['laser cutter', 'laser cutting', 'co2 laser'] },
  { key: 'Robotic Arm', category: 'robotics', aliases: ['robotic arm', 'robot arm', 'manipulator', 'humanoid robot'] },
  { key: 'Wind Tunnel', category: 'mechanical testing', aliases: ['wind tunnel'] },
  {
    key: 'Universal Testing Machine',
    category: 'mechanical testing',
    aliases: ['universal testing machine', 'tensile testing machine', 'utm', 'tensile tester'],
  },
  { key: 'Thermal Chamber', category: 'environmental testing', aliases: ['thermal chamber', 'environmental chamber', 'temperature chamber'] },
  { key: 'Fume Hood', category: 'lab support', aliases: ['fume hood', 'biosafety cabinet'] },
  { key: 'Supercomputer GPU Cluster', category: 'computing', aliases: ['gpu cluster', 'hpc cluster', 'supercomputer'] },
];

/** Cities the parser knows, with their state (used for structured location). */
const CITY_STATES = {
  chandigarh: 'Punjab',
  mohali: 'Punjab',
  amritsar: 'Punjab',
  ludhiana: 'Punjab',
  jalandhar: 'Punjab',
  patiala: 'Punjab',
  ambala: 'Haryana',
  kurukshetra: 'Haryana',
  gurgaon: 'Haryana',
  gurugram: 'Haryana',
  faridabad: 'Haryana',
  hisar: 'Haryana',
  delhi: 'Delhi',
  'new delhi': 'Delhi',
  noida: 'Uttar Pradesh',
  ghaziabad: 'Uttar Pradesh',
  lucknow: 'Uttar Pradesh',
  kanpur: 'Uttar Pradesh',
  varanasi: 'Uttar Pradesh',
  prayagraj: 'Uttar Pradesh',
  roorkee: 'Uttarakhand',
  dehradun: 'Uttarakhand',
  jaipur: 'Rajasthan',
  jodhpur: 'Rajasthan',
  udaipur: 'Rajasthan',
  mumbai: 'Maharashtra',
  bombay: 'Maharashtra',
  pune: 'Maharashtra',
  nagpur: 'Maharashtra',
  nashik: 'Maharashtra',
  thane: 'Maharashtra',
  ahmedabad: 'Gujarat',
  vadodara: 'Gujarat',
  surat: 'Gujarat',
  bangalore: 'Karnataka',
  bengaluru: 'Karnataka',
  mysore: 'Karnataka',
  mysuru: 'Karnataka',
  chennai: 'Tamil Nadu',
  madras: 'Tamil Nadu',
  coimbatore: 'Tamil Nadu',
  tiruchirappalli: 'Tamil Nadu',
  hyderabad: 'Telangana',
  warangal: 'Telangana',
  kolkata: 'West Bengal',
  calcutta: 'West Bengal',
  durgapur: 'West Bengal',
  bhubaneswar: 'Odisha',
  rourkela: 'Odisha',
  patna: 'Bihar',
  guwahati: 'Assam',
  shillong: 'Meghalaya',
  goa: 'Goa',
  kochi: 'Kerala',
  cochin: 'Kerala',
  trivandrum: 'Kerala',
  thiruvananthapuram: 'Kerala',
  kozhikode: 'Kerala',
  bhopal: 'Madhya Pradesh',
  indore: 'Madhya Pradesh',
  jabalpur: 'Madhya Pradesh',
  raipur: 'Chhattisgarh',
  visakhapatnam: 'Andhra Pradesh',
  vijayawada: 'Andhra Pradesh',
  tirupati: 'Andhra Pradesh',
  srinagar: 'Jammu and Kashmir',
  jammu: 'Jammu and Kashmir',
  pondicherry: 'Puducherry',
  puducherry: 'Puducherry',
};

const STATE_NAMES = [
  'andhra pradesh',
  'arunachal pradesh',
  'assam',
  'bihar',
  'chhattisgarh',
  'delhi',
  'goa',
  'gujarat',
  'haryana',
  'himachal pradesh',
  'jammu and kashmir',
  'jammu & kashmir',
  'jharkhand',
  'karnataka',
  'kerala',
  'madhya pradesh',
  'maharashtra',
  'manipur',
  'meghalaya',
  'mizoram',
  'nagaland',
  'odisha',
  'orissa',
  'punjab',
  'rajasthan',
  'sikkim',
  'tamil nadu',
  'telangana',
  'tripura',
  'uttar pradesh',
  'uttarakhand',
  'west bengal',
];

const DAY_PARTS = {
  morning: { start: '09:00', end: '12:00' },
  afternoon: { start: '14:00', end: '17:00' },
  evening: { start: '18:00', end: '21:00' },
  night: { start: '20:00', end: '23:00' },
};

const WORD_NUMBERS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  half: 0.5,
};

const MONTHS = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const WEEKDAYS = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/** Words that carry no equipment-search value on their own. */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'for', 'with', 'without', 'need', 'needs', 'needed', 'want', 'wants',
  'looking', 'look', 'find', 'search', 'access', 'book', 'booking', 'rent', 'rental', 'hire', 'use',
  'using', 'available', 'availability', 'slot', 'slots', 'equipment', 'lab', 'labs', 'laboratory',
  'machine', 'machines', 'device', 'instrument', 'instruments', 'something', 'anything', 'please',
  'today', 'tomorrow', 'tonight', 'this', 'next', 'day', 'days', 'week', 'weeks', 'hour', 'hours',
  'hr', 'hrs', 'minute', 'minutes', 'mins', 'morning', 'afternoon', 'evening', 'night', 'under',
  'below', 'less', 'than', 'max', 'maximum', 'min', 'minimum', 'budget', 'price', 'priced', 'cost',
  'costs', 'rupees', 'rupee', 'rs', 'inr', 'near', 'nearby', 'close', 'around', 'about', 'city',
  'state', 'campus', 'institute', 'institution', 'college', 'university', 'good', 'best', 'cheap',
  'cheapest', 'affordable', 'any', 'some', 'my', 'me', 'i', 'we', 'you', 'it', 'is', 'are', 'be',
  'can', 'could', 'would', 'should', 'get', 'give', 'show', 'help', 'am', 'pm', 'ok', 'okay',
  'from', 'to', 'at', 'on', 'by', 'until', 'till', 'per', 'total', 'overall', 'next', 'last',
  'need', 'require', 'requires', 'required', 'using', 'between', 'during', 'about', 'approx',
]);

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const pad2 = (value) => String(value).padStart(2, '0');

/** `YYYY-MM-DD` built from *local* calendar components (matches how dates are typed). */
const formatDateOnly = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const addDays = (date, days) => {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const wordRegex = (phrase) => new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'i');

const round = (value, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const minutesToTime = (minutes) => {
  if (!Number.isFinite(minutes) || minutes < 0 || minutes > 23 * 60 + 59) return null;
  return `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`;
};

const timeToMinutes = (time) => {
  if (!HH_MM.test(time)) return null;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const addHoursToTime = (time, hours) => {
  const base = timeToMinutes(time);
  if (base === null || !Number.isFinite(hours)) return null;
  return minutesToTime(base + Math.round(hours * 60));
};

const asNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(/,/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const asBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
};

// ---------------------------------------------------------------------------
// Provider configuration
// ---------------------------------------------------------------------------

const getProvider = () => {
  const configured = String(process.env.AI_PROVIDER || 'mock').trim().toLowerCase();
  return AI_PROVIDERS.includes(configured) ? configured : 'mock';
};

const getModelUrl = () => String(process.env.AI_MODEL_URL || '').trim();

const getTimeoutMs = () => {
  const parsed = Number.parseInt(process.env.AI_MODEL_TIMEOUT_MS, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.max(parsed, MIN_TIMEOUT_MS), MAX_TIMEOUT_MS);
};

/** Never expose keys/URLs: only the provider name and whether a URL is set. */
const getProviderConfig = () => ({
  provider: getProvider(),
  externalConfigured: Boolean(getModelUrl()),
  timeoutMs: getTimeoutMs(),
});

// ---------------------------------------------------------------------------
// Fallback (deterministic) parsing
// ---------------------------------------------------------------------------

const detectEquipmentType = (text) => {
  let best = null;

  EQUIPMENT_TYPES.forEach((entry) => {
    entry.aliases.forEach((alias) => {
      if (!wordRegex(alias).test(text)) return;
      // Longest matched alias wins ("scanning electron microscope" > "sem").
      if (!best || alias.length > best.alias.length) {
        best = { entry, alias };
      }
    });
  });

  return best ? best.entry : null;
};

const detectDuration = (text) => {
  // "between 3 and 5 hours" / "3-5 hours" -> take the upper bound.
  const range = text.match(/\b(\d+(?:\.\d+)?)\s*(?:to|-|–)\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/);
  if (range) return { duration: asNumber(range[2]), unit: 'hours' };

  const hours = text.match(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/);
  if (hours) return { duration: asNumber(hours[1]), unit: 'hours' };

  const shortHours = text.match(/\b(\d+(?:\.\d+)?)\s*h\b/);
  if (shortHours) return { duration: asNumber(shortHours[1]), unit: 'hours' };

  const minutes = text.match(/\b(\d+(?:\.\d+)?)\s*(?:minutes?|mins?)\b/);
  if (minutes) return { duration: round(asNumber(minutes[1]) / 60), unit: 'minutes' };

  if (/\b(?:half\s+an?\s+hour|half\s+hour|30\s*min)\b/.test(text)) {
    return { duration: 0.5, unit: 'hours' };
  }

  const words = Object.keys(WORD_NUMBERS).join('|');
  const worded = text.match(new RegExp(`\\b(${words})\\s+(?:hours?|hrs?)\\b`, 'i'));
  if (worded) return { duration: WORD_NUMBERS[worded[1].toLowerCase()], unit: 'hours' };

  const wordedMinutes = text.match(new RegExp(`\\b(${words})\\s+(?:minutes?|mins?)\\b`, 'i'));
  if (wordedMinutes) {
    return { duration: round(WORD_NUMBERS[wordedMinutes[1].toLowerCase()] / 60), unit: 'minutes' };
  }

  return null;
};

const detectPrice = (text) => {
  // 1. Explicit currency amount: "₹1000", "rs 1000", "inr 1,000".
  // 2. Budget keyword plus optional currency: "under 1000", "budget of 1500".
  const match =
    text.match(/(?:₹|rs\.?|inr)\s*(\d[\d,]*(?:\.\d+)?)/) ||
    text.match(
      /\b(?:under|below|less than|cheaper than|within|up ?to|upto|max(?:imum)?(?: of)?|budget of)\s*(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?)/
    );

  if (!match) return null;

  const value = asNumber(match[1]);
  if (value === null || value <= 0) return null;

  const valueIndex = match.index + match[0].length;
  const tail = text.slice(valueIndex, valueIndex + 20);

  if (/\bper\s*hour\b|\/\s*hour\b|\bhourly\b|\bper\s*hr\b/.test(tail)) {
    return { value, perHour: true };
  }
  if (/\bper\s*day\b|\bper\s*booking\b|\btotal\b|\bin\s*total\b|\boverall\b/.test(tail)) {
    return { value, perHour: false };
  }

  // Ambiguous ("under 1000"): a per-hour cap when no duration is known, a
  // booking-total cap when the query states how long the equipment is needed.
  return { value, perHour: null };
};

const detectDate = (text, reference) => {
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) {
    const candidate = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    if (!Number.isNaN(candidate.getTime())) return formatDateOnly(candidate);
  }

  const dmy = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]) - 1;
    const year = Number(dmy[3]);
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      return formatDateOnly(new Date(year, month, day));
    }
  }

  if (/\bday after tomorrow\b/.test(text)) return formatDateOnly(addDays(reference, 2));
  if (/\btomorrow\b|\btmrw\b|\btommorow\b/.test(text)) return formatDateOnly(addDays(reference, 1));
  if (/\btoday\b|\btonight\b|\bthis (?:morning|afternoon|evening)\b/.test(text)) {
    return formatDateOnly(reference);
  }

  const inDays = text.match(/\bin\s+(\d{1,2})\s+days?\b/);
  if (inDays) return formatDateOnly(addDays(reference, Number(inDays[1])));

  // "on 25 September", "25th of September", "Sept 25"
  const monthNames = Object.keys(MONTHS).join('|');
  const dayMonth = text.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${monthNames})\\b`, 'i'));
  const monthDay = text.match(new RegExp(`\\b(${monthNames})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i'));
  const resolved = dayMonth
    ? { day: Number(dayMonth[1]), month: MONTHS[dayMonth[2].toLowerCase()] }
    : monthDay
      ? { day: Number(monthDay[2]), month: MONTHS[monthDay[1].toLowerCase()] }
      : null;

  if (resolved && resolved.day >= 1 && resolved.day <= 31) {
    let candidate = new Date(reference.getFullYear(), resolved.month, resolved.day);
    // A bare month/day that already passed means next year.
    if (candidate < startOfDay(reference)) candidate = new Date(reference.getFullYear() + 1, resolved.month, resolved.day);
    return formatDateOnly(candidate);
  }

  // "this Friday", "on Monday", "next Saturday"
  const weekdayNames = Object.keys(WEEKDAYS).join('|');
  const weekday = text.match(new RegExp(`\\b(?:on|this|next|by)\\s+(${weekdayNames})\\b`, 'i'));
  if (weekday) {
    // "this Friday" / "on Monday" both resolve to the next occurrence of that
    // weekday (a week ahead when today already is that weekday).
    const target = WEEKDAYS[weekday[1].toLowerCase()];
    let ahead = (target - reference.getDay() + 7) % 7;
    if (ahead === 0) ahead = 7;
    return formatDateOnly(addDays(reference, ahead));
  }

  return null;
};

const detectDayPart = (text) => {
  if (/\bmorning\b/.test(text)) return 'morning';
  if (/\bafternoon\b/.test(text)) return 'afternoon';
  if (/\bevening\b/.test(text)) return 'evening';
  if (/\bnight\b|\btonight\b/.test(text)) return 'night';
  return null;
};

const detectTimes = (text) => {
  const hourToken = (hours, minutes, meridiem) => {
    let hour = Number(hours);
    const minute = minutes === undefined ? 0 : Number(minutes);
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    if (!meridiem && minutes === undefined && hour >= 1 && hour <= 7) hour += 12; // "at 3" -> 15:00
    if (hour > 23 || minute > 59) return null;
    return `${pad2(hour)}:${pad2(minute)}`;
  };

  // "from 2pm to 5pm", "13:00-16:00", "10 am until 1 pm"
  // The negative lookahead keeps "3 to 5 hours" from being read as a time range.
  const range = text.match(
    /\b(?:from\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to|until|till)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?!\s*(?:hours?|hrs?)\b)/
  );
  if (range) {
    // "from 2 to 5pm": the trailing am/pm applies to the start time as well.
    const start = hourToken(range[1], range[2], range[3] || range[6]);
    const end = hourToken(range[4], range[5], range[6]);
    if (start && end && start < end) return { startTime: start, endTime: end };
  }

  const single = text.match(/\b(?:at|from|starting(?: at)?|start(?:ing)? at|by|around|after)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (single) {
    const start = hourToken(single[1], single[2], single[3]);
    if (start) return { startTime: start, endTime: null };
  }

  // 24-hour clock form without am/pm, e.g. "at 14:00" or "from 09:30".
  const explicit = text.match(/\b(?:at|from|starting(?: at)?|start(?:ing)? at)\s+(\d{1,2}):(\d{2})\b/);
  if (explicit) {
    const start = hourToken(explicit[1], explicit[2], undefined);
    if (start) return { startTime: start, endTime: null };
  }

  return null;
};

const detectLocation = (text, userContext) => {
  const nearMe = /\bnear\s+me\b|\bnearby\b|\bclose\s+by\b|\bnear\s+my\s+(?:campus|city|location)\b|\bin\s+my\s+city\b/.test(text);

  if (nearMe) {
    const city = userContext?.location?.city || null;
    const state = userContext?.location?.state || (city ? CITY_STATES[city.toLowerCase()] || null : null);
    return { city, state, nearMe: true };
  }

  let city = null;
  Object.keys(CITY_STATES).forEach((name) => {
    if (city) return;
    // "near X", "in X", "around X" or a bare mention of a known city.
    if (wordRegex(name).test(text)) city = name;
  });

  let state = null;
  STATE_NAMES.forEach((name) => {
    if (state) return;
    if (wordRegex(name).test(text)) state = name;
  });

  if (!city && !state) return { city: null, state: null, nearMe: false };

  return {
    city: city ? city.replace(/\b\w/g, (char) => char.toUpperCase()) : null,
    state: state ? state.replace(/\b\w/g, (char) => char.toUpperCase()) : city ? CITY_STATES[city] || null : null,
    nearMe: false,
  };
};

const detectCapabilities = (text) => {
  let trainingRequired = null;
  let certificationRequired = null;

  if (/\bwithout\s+(?:any\s+)?training\b|\bno\s+training\b|\bno\s+training\s+required\b/.test(text)) trainingRequired = false;
  else if (/\b(?:needs?|requires?|with|need)\s+(?:some\s+)?training\b|\btraining\s+required\b|\btrained\s+operator\b/.test(text)) {
    trainingRequired = true;
  }

  if (/\bwithout\s+(?:any\s+)?certification\b|\bno\s+certification\b|\buncertified\b/.test(text)) certificationRequired = false;
  else if (/\bcertification\b|\bcertified\b|\bcertificate\b/.test(text)) certificationRequired = true;

  return { trainingRequired, certificationRequired };
};

const extractKeywords = (text) => {
  const tokens = text
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    // Drop stopwords, pure numbers and date-like tokens ("2026-10-05").
    .filter(
      (token) =>
        token.length >= 3 &&
        !STOPWORDS.has(token) &&
        !/^\d+$/.test(token) &&
        !/^\d+([-/]\d+)+$/.test(token)
    );

  return [...new Set(tokens)].slice(0, MAX_KEYWORDS);
};

/**
 * Deterministic, rule based parser. Always available - it is both the default
 * provider (AI_PROVIDER=mock) and the fallback when the external model fails.
 *
 * @param {string} query natural language requirement
 * @param {object} userContext sanitized context built from the authenticated user
 * @param {Date} [now] reference "today" (injectable for tests)
 */
const parseRequirementFallback = (query, userContext = {}, now = new Date()) => {
  const text = String(query || '').toLowerCase();
  const reference = startOfDay(now);

  const type = detectEquipmentType(text);
  const durationInfo = detectDuration(text);
  const duration = durationInfo ? round(durationInfo.duration, 2) : null;

  const price = detectPrice(text);
  const date = detectDate(text, reference);
  const dayPart = detectDayPart(text);
  const explicitTimes = detectTimes(text);
  const location = detectLocation(text, userContext);
  const capabilities = detectCapabilities(text);

  let startTime = explicitTimes?.startTime || null;
  let endTime = explicitTimes?.endTime || null;

  if (!startTime && dayPart && DAY_PARTS[dayPart]) {
    startTime = DAY_PARTS[dayPart].start;
  }

  if (startTime && !endTime) {
    if (duration) {
      endTime = addHoursToTime(startTime, duration);
    } else if (dayPart && DAY_PARTS[dayPart]) {
      endTime = DAY_PARTS[dayPart].end;
    }
  }

  let resolvedDuration = duration;
  if (!resolvedDuration && startTime && endTime) {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    if (startMinutes !== null && endMinutes !== null && endMinutes > startMinutes) {
      resolvedDuration = round((endMinutes - startMinutes) / 60, 2);
    }
  }

  // The availability model has no concept of a window crossing midnight.
  if (startTime && endTime && endTime <= startTime) endTime = null;

  const requirement = {
    equipmentType: type ? type.key : null,
    category: type ? type.category : null,
    date,
    startTime,
    endTime,
    duration: resolvedDuration,
    maxPricePerHour: null,
    maxTotalPrice: null,
    city: location.city,
    state: location.state,
    trainingRequired: capabilities.trainingRequired,
    certificationRequired: capabilities.certificationRequired,
    timeOfDay: dayPart,
  };

  if (price) {
    if (price.perHour === true) requirement.maxPricePerHour = price.value;
    else if (price.perHour === false) requirement.maxTotalPrice = price.value;
    else if (resolvedDuration) requirement.maxTotalPrice = price.value;
    else requirement.maxPricePerHour = price.value;
  }

  return {
    ...requirement,
    // Internal-only hints (never returned to the client verbatim).
    keywords: extractKeywords(text),
    aliases: type ? type.aliases : [],
    nearMe: location.nearMe,
    durationUnit: durationInfo ? durationInfo.unit : null,
  };
};

// ---------------------------------------------------------------------------
// Normalisation - the security boundary between any provider and the backend
// ---------------------------------------------------------------------------

/**
 * Whitelists and coerces provider output. Unknown keys (including anything that
 * looks like it wants to control availability, status, price or verification)
 * are dropped.
 */
const normalizeRequirement = (raw, fallbackRequirement) => {
  const base = fallbackRequirement || parseRequirementFallback('');
  const source = raw && typeof raw === 'object' ? raw : {};

  const pickString = (field) => {
    const value = source[field];
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim().slice(0, MAX_STRING_FIELD);
    return trimmed === '' ? null : trimmed;
  };

  const pickTime = (field) => {
    const value = pickString(field);
    return value && HH_MM.test(value) ? value : null;
  };

  const equipmentType = pickString('equipmentType');
  const category = pickString('category');
  const startTime = pickTime('startTime');
  const rawEndTime = pickTime('endTime');
  const endTime = startTime && rawEndTime && rawEndTime > startTime ? rawEndTime : null;

  const rawDate = pickString('date');
  const date = rawDate && DATE_ONLY.test(rawDate) ? rawDate : null;

  const rawDuration = asNumber(source.duration);
  const duration = rawDuration !== null && rawDuration > 0 ? round(rawDuration, 2) : null;

  const maxPricePerHour = asNumber(source.maxPricePerHour);
  const maxTotalPrice = asNumber(source.maxTotalPrice);

  const keywords = Array.isArray(source.keywords)
    ? [...new Set(source.keywords.map((word) => String(word).trim().toLowerCase()).filter(Boolean))].slice(0, MAX_KEYWORDS)
    : null;

  const aliases = Array.isArray(source.aliases)
    ? source.aliases.map((alias) => String(alias).trim().toLowerCase()).filter(Boolean).slice(0, 12)
    : null;

  const requirement = {
    equipmentType: equipmentType || base.equipmentType || null,
    category: category || base.category || null,
    date: date || base.date || null,
    startTime: startTime || base.startTime || null,
    endTime: endTime || base.endTime || null,
    duration: duration !== null ? duration : base.duration || null,
    maxPricePerHour: maxPricePerHour !== null && maxPricePerHour >= 0 ? maxPricePerHour : base.maxPricePerHour || null,
    maxTotalPrice: maxTotalPrice !== null && maxTotalPrice >= 0 ? maxTotalPrice : base.maxTotalPrice || null,
    city: pickString('city') || base.city || null,
    state: pickString('state') || base.state || null,
    trainingRequired: asBoolean(source.trainingRequired) ?? base.trainingRequired ?? null,
    certificationRequired: asBoolean(source.certificationRequired) ?? base.certificationRequired ?? null,
    timeOfDay: pickString('timeOfDay') || base.timeOfDay || null,
    keywords: keywords && keywords.length ? keywords : base.keywords || [],
    aliases: aliases && aliases.length ? aliases : base.aliases || [],
    nearMe: Boolean(source.nearMe ?? base.nearMe),
    durationUnit: source.durationUnit ?? base.durationUnit ?? null,
  };

  // A window that ends before it starts is dropped rather than guessed at.
  if (requirement.startTime && requirement.endTime && requirement.endTime <= requirement.startTime) {
    requirement.endTime = null;
  }

  return requirement;
};

/** The subset of the parsed requirement that is safe/useful to return. */
const toPublicRequirement = (requirement) => {
  const publicRequirement = {};
  REQUIREMENT_FIELDS.forEach((field) => {
    publicRequirement[field] = requirement?.[field] ?? null;
  });
  return publicRequirement;
};

// ---------------------------------------------------------------------------
// External provider
// ---------------------------------------------------------------------------

/**
 * POST the query to the external model. Expected response body (any of):
 *   { "requirement": {...} } | { "parsedRequirement": {...} } | {...fields}
 * Anything else (or any transport error) makes the caller fall back.
 */
const callExternalModel = async (query, userContext) => {
  const url = getModelUrl();
  if (!url) throw new Error('AI_MODEL_URL is not configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.AI_MODEL_API_KEY ? { 'x-api-key': process.env.AI_MODEL_API_KEY } : {}),
      },
      body: JSON.stringify({ query, userContext }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`AI provider responded with HTTP ${response.status}`);

    const payload = await response.json();
    const requirement = payload?.requirement || payload?.parsedRequirement || payload;
    if (!requirement || typeof requirement !== 'object' || Array.isArray(requirement)) {
      throw new Error('AI provider returned an unusable payload');
    }
    return requirement;
  } finally {
    clearTimeout(timer);
  }
};

/** Log-friendly error text: never a URL, key or stack trace. */
const safeErrorMessage = (error) => {
  if (!error) return 'unknown error';
  if (error.name === 'AbortError') return 'request timed out';
  if (error.name === 'TypeError') return 'provider unreachable';
  return String(error.message || error.name || 'unknown error').slice(0, 200);
};

/**
 * Stable interface used by the controller.
 *
 * @returns {Promise<{requirement: object, source: 'fallback'|'ai_model', provider: string, warning: string|null}>}
 */
const parseRequirement = async (query, userContext = {}) => {
  const provider = getProvider();
  const fallbackRequirement = normalizeRequirement(parseRequirementFallback(query, userContext), null);

  if (provider === 'mock') {
    return { requirement: fallbackRequirement, source: 'fallback', provider, warning: null };
  }

  if (!getModelUrl()) {
    console.warn('[ai] AI_PROVIDER=external but AI_MODEL_URL is not set - using deterministic fallback');
    return {
      requirement: fallbackRequirement,
      source: 'fallback',
      provider,
      warning: 'AI provider is not configured; deterministic fallback used.',
    };
  }

  try {
    const raw = await callExternalModel(query, userContext);
    // The model's fields win where present; the deterministic parser fills gaps.
    const requirement = normalizeRequirement(raw, fallbackRequirement);
    return { requirement, source: 'ai_model', provider, warning: null };
  } catch (error) {
    console.warn(`[ai] external provider unavailable (${safeErrorMessage(error)}) - using deterministic fallback`);
    return {
      requirement: fallbackRequirement,
      source: 'fallback',
      provider,
      warning: 'AI provider unavailable; deterministic fallback used.',
    };
  }
};

module.exports = {
  parseRequirement,
  parseRequirementFallback,
  normalizeRequirement,
  toPublicRequirement,
  getProvider,
  getProviderConfig,

  // exported for the recommendation service and tests
  MAX_QUERY_LENGTH,
  EQUIPMENT_TYPES,
  CITY_STATES,
  formatDateOnly,
  addHoursToTime,
  timeToMinutes,
  detectEquipmentType,
  detectDuration,
  detectPrice,
  detectDate,
  detectTimes,
  detectLocation,
  extractKeywords,
};
