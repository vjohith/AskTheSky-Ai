import { EmergencyFacility } from '../src/types';

export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  category: 'National' | 'Disaster' | 'Medical' | 'Police/Fire' | 'Maritime' | 'Women/Child';
  description: string;
  available: string;
  tollFree: boolean;
}

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'ndrf',
    name: 'National Disaster Response Force (NDRF)',
    number: '1078',
    category: 'Disaster',
    description: 'Specialized force for disaster rescue, flood evacuation & cyclone relief',
    available: '24x7 All India',
    tollFree: true
  },
  {
    id: 'national-emergency',
    name: 'National Emergency Helpline (Pan-India ERSS)',
    number: '112',
    category: 'National',
    description: 'Unified emergency response service for police, fire, and medical aid',
    available: '24x7 All India',
    tollFree: true
  },
  {
    id: 'ambulance',
    name: 'National Ambulance & Emergency Medical Service',
    number: '108',
    category: 'Medical',
    description: 'Free emergency medical transport, trauma care, and patient triage',
    available: '24x7 All India',
    tollFree: true
  },
  {
    id: 'disaster-control',
    name: 'State Disaster Management Authority (SDMA / SEOC)',
    number: '1070',
    category: 'Disaster',
    description: 'State Emergency Operations Center for localized warnings & cyclone shelters',
    available: '24x7 State Control Rooms',
    tollFree: true
  },
  {
    id: 'district-disaster',
    name: 'District Disaster Management Helpline (DEOC)',
    number: '1077',
    category: 'Disaster',
    description: 'District level disaster management, relief camp allocations & rescue',
    available: '24x7 District HQ',
    tollFree: true
  },
  {
    id: 'police',
    name: 'Police Emergency Response',
    number: '100',
    category: 'Police/Fire',
    description: 'Law enforcement, law and order, and localized security assistance',
    available: '24x7 All India',
    tollFree: true
  },
  {
    id: 'fire',
    name: 'Fire & Emergency Rescue Services',
    number: '101',
    category: 'Police/Fire',
    description: 'Firefighting, urban building collapse rescue, and hazardous material containment',
    available: '24x7 All India',
    tollFree: true
  },
  {
    id: 'coast-guard',
    name: 'Indian Coast Guard SAR Helpline',
    number: '1554',
    category: 'Maritime',
    description: 'Maritime search and rescue, fisherman distress calls, sea storm emergencies',
    available: '24x7 Coastal & Marine',
    tollFree: true
  },
  {
    id: 'imd-weather',
    name: 'IMD Severe Weather & Cyclone Toll-Free Desk',
    number: '1800-180-1717',
    category: 'Disaster',
    description: 'Official India Meteorological Department severe weather advisories',
    available: '24x7 Toll Free',
    tollFree: true
  },
  {
    id: 'women-helpline',
    name: 'Women in Distress & Crisis Helpline',
    number: '1091',
    category: 'Women/Child',
    description: 'Support for women, safety in shelter camps, and crisis intervention',
    available: '24x7 All India',
    tollFree: true
  },
  {
    id: 'child-helpline',
    name: 'Childline Emergency Rescue',
    number: '1098',
    category: 'Women/Child',
    description: 'Protection and rescue for displaced, separated, or endangered children',
    available: '24x7 All India',
    tollFree: true
  }
];

export const EMERGENCY_FACILITIES: EmergencyFacility[] = [
  // Andhra Pradesh & Telangana
  {
    id: 'fac-1',
    name: "King George Hospital (KGH) & Trauma Center",
    type: 'hospital',
    address: 'Maharanipeta, Visakhapatnam, Andhra Pradesh 530002',
    phone: '+91 891 256 4891',
    lat: 17.7032,
    lon: 83.3052,
    open24x7: true,
    capacity: '1,200 Emergency Beds, Dedicated Disaster Ward'
  },
  {
    id: 'fac-2',
    name: 'Visakhapatnam Port Cyclone Relief Shelter #4',
    type: 'shelter',
    address: 'Beach Road, Harbour Park, Visakhapatnam, Andhra Pradesh',
    phone: '+91 891 287 4000',
    lat: 17.6980,
    lon: 83.3010,
    open24x7: true,
    capacity: 'Capacity: 3,500 people, Backup Generators & RO Water'
  },
  {
    id: 'fac-3',
    name: 'Visakhapatnam Central Police & Disaster Control Station',
    type: 'police',
    address: 'Suryabagh, Jagadamba Centre, Visakhapatnam, AP',
    phone: '+91 891 256 5454',
    lat: 17.7120,
    lon: 83.3015,
    open24x7: true
  },
  {
    id: 'fac-4',
    name: 'Suryabagh Main Fire & Rescue Station',
    type: 'fire',
    address: 'Opp. RTC Complex, Dwaraka Nagar, Visakhapatnam, AP',
    phone: '+91 891 256 2101',
    lat: 17.7240,
    lon: 83.3100,
    open24x7: true
  },
  {
    id: 'fac-5',
    name: 'AIIMS Mangalagiri Disaster Care Center',
    type: 'hospital',
    address: 'NH-16, Mangalagiri, Vijayawada-Guntur Region, AP 522503',
    phone: '+91 8645 280 000',
    lat: 16.4350,
    lon: 80.5650,
    open24x7: true,
    capacity: '800 Multi-speciality ICU & Burn Trauma Beds'
  },
  {
    id: 'fac-6',
    name: 'Vijayawada Krishna River Flood Relief Center',
    type: 'relief_center',
    address: 'Bhavani Island Ghats Road, Vijayawada, AP',
    phone: '+91 866 242 4100',
    lat: 16.5180,
    lon: 80.6120,
    open24x7: true,
    capacity: 'Community Food Kitchen & 2,000 Capacity Tents'
  },
  {
    id: 'fac-7',
    name: 'Gandhi General Hospital & Emergency Unit',
    type: 'hospital',
    address: 'Musheerabad, Secunderabad, Hyderabad, Telangana 500003',
    phone: '+91 40 2750 5566',
    lat: 17.4245,
    lon: 78.5030,
    open24x7: true,
    capacity: '1,800 Beds, Level 1 Trauma Center'
  },
  {
    id: 'fac-8',
    name: 'Hyderabad SDRF Urban Flood Rescue Base',
    type: 'relief_center',
    address: 'Tank Bund Road, Hussain Sagar, Hyderabad',
    phone: '+91 40 2345 0624',
    lat: 17.4230,
    lon: 78.4740,
    open24x7: true,
    capacity: '40 Inflatable Rescue Boats & De-watering Pumps'
  },
  // Odisha & Bengal Coastal Hubs
  {
    id: 'fac-9',
    name: 'SCB Medical College & Disaster Trauma Ward',
    type: 'hospital',
    address: 'Manglabag, Cuttack, Odisha 753007',
    phone: '+91 671 241 4080',
    lat: 20.4625,
    lon: 85.8828,
    open24x7: true,
    capacity: 'Super-specialty Disaster Triage Unit'
  },
  {
    id: 'fac-10',
    name: 'Puri Coastal Multi-Purpose Cyclone Shelter #12',
    type: 'shelter',
    address: 'Marine Drive, Puri Coast, Odisha',
    phone: '+91 6752 222 107',
    lat: 19.8135,
    lon: 85.8312,
    open24x7: true,
    capacity: 'Engineered for 250 km/h winds, 4,000 evacuee capacity'
  },
  // Maharashtra & South
  {
    id: 'fac-11',
    name: 'KEM Hospital & Disaster Response Cell',
    type: 'hospital',
    address: 'Acharya Donde Marg, Parel, Mumbai, Maharashtra 400012',
    phone: '+91 22 2410 7000',
    lat: 19.0020,
    lon: 72.8420,
    open24x7: true,
    capacity: '1,500 Beds, 24x7 Flood Trauma Unit'
  },
  {
    id: 'fac-12',
    name: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    type: 'hospital',
    address: 'EVR Periyar Salai, Park Town, Chennai, Tamil Nadu 600003',
    phone: '+91 44 2530 5000',
    lat: 13.0815,
    lon: 80.2780,
    open24x7: true,
    capacity: '2,000 Beds, Coastal Emergency Center'
  }
];

export const SURVIVAL_GUIDES = [
  {
    id: 'cyclone-guide',
    hazard: 'Cyclone & Coastal Storm Surge',
    icon: 'Wind',
    color: 'border-red-500 bg-red-950/20 text-red-400',
    before: [
      'Check structural integrity of roofs, secure tin sheets and loose outdoor objects.',
      'Keep battery-operated radio, fully charged power banks, and dry rations for 72 hours.',
      'Store at least 15 liters of clean drinking water per person in sealed containers.',
      'Fishermen must anchor boats securely in inland creeks and never venture to sea.'
    ],
    during: [
      'Stay strictly indoors away from glass windows and doors.',
      'Turn off main electrical breaker and gas cylinder valve.',
      'Beware of the "Eye of the Cyclone" – temporary calm is followed by even fiercer reverse winds.',
      'If in low-lying coastal zone, evacuate immediately to the designated Cyclone Relief Shelter.'
    ],
    after: [
      'Do not touch fallen electric wires or poles.',
      'Boil water before drinking to avoid waterborne cholera/diarrhea outbreaks.',
      'Report gas leaks or structural wall cracks to emergency responders on 112.'
    ]
  },
  {
    id: 'flood-guide',
    hazard: 'Flash Floods & River Basin Overflows',
    icon: 'Waves',
    color: 'border-blue-500 bg-blue-950/20 text-blue-400',
    before: [
      'Know your area’s flood risk and shortest route to elevated public ground.',
      'Keep vital land records, identity cards, and medicines in waterproof ziplock bags.',
      'Elevate valuable electrical appliances and grain bags above anticipated high-water mark.'
    ],
    during: [
      'Never drive or walk through moving floodwater ("Turn Around, Don’t Drown" – 15cm sweeps cars).',
      'Move to higher floors or rooftops if water level rises rapidly; take warm blankets and whistle for signaling.',
      'Avoid basements and underground parking structures where water can trap occupants instantly.'
    ],
    after: [
      'Beware of snakes, scorpions, and reptiles seeking dry shelter.',
      'Discard food items that came into contact with floodwater.',
      'Disinfect household water tanks before refilling.'
    ]
  },
  {
    id: 'heatwave-guide',
    hazard: 'Severe Heatwave (>42°C & High Wet-Bulb)',
    icon: 'SunMedium',
    color: 'border-amber-500 bg-amber-950/20 text-amber-400',
    before: [
      'Prepare ORS (Oral Rehydration Solution), lemon water, and buttermilk at home.',
      'Use dark curtains or window reflective films on south/west facing windows.',
      'Plan outdoor labor and farming exclusively during early mornings (5:30 AM - 9:00 AM).'
    ],
    during: [
      'Drink 3-4 liters of water daily, even if not feeling thirsty.',
      'Wear loose, lightweight, light-colored cotton clothing and wide-brimmed hats.',
      'Never leave children, elderly, or pets inside parked vehicles even for a few minutes.',
      'If someone suffers heatstroke (high fever, delirium, dry hot skin), move to shade and apply ice packs to neck, armpits, and groin immediately.'
    ],
    after: [
      'Rest in cool ventilated areas after peak afternoon hours.',
      'Continue electrolyte replenishment throughout the evening.'
    ]
  },
  {
    id: 'thunderstorm-guide',
    hazard: 'Severe Thunderstorms & Lightning Strikes',
    icon: 'Zap',
    color: 'border-yellow-500 bg-yellow-950/20 text-yellow-400',
    before: [
      'Observe the 30-30 Rule: If time between lightning flash and thunderclap is under 30 seconds, seek indoor shelter immediately.',
      'Unplug sensitive electronic devices and modems.'
    ],
    during: [
      'DO NOT shelter under isolated trees, metal sheds, or open bus stops.',
      'If caught in an open field, crouch low on balls of feet with feet together, head tucked ("Lightning Crouch"). Do NOT lie flat on the ground.',
      'Avoid touching metal fences, pipelines, and running tap water during the storm.'
    ],
    after: [
      'Wait at least 30 minutes after the last thunderclap before resuming outdoor activities.',
      'Provide immediate CPR to lightning strike victims; they carry no residual charge and are safe to touch.'
    ]
  }
];
