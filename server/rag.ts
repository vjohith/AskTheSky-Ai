import { RAGDocument, UserRole } from '../src/types';

export const RAG_KNOWLEDGE_BASE: RAGDocument[] = [
  {
    id: 'rag-imd-color-codes',
    title: 'IMD Official 4-Stage Color Coded Weather Warning System',
    source: 'India Meteorological Department (IMD) Standard Operational Guidelines',
    category: 'emergency',
    summary: 'Definitions and action triggers for Green, Yellow, Orange, and Red weather alerts.',
    keyInstructions: [
      'Green (No Warning): Weather is normal. No specialized action required by public or authorities.',
      'Yellow (Be Updated / Watch): Weather condition is severe or likely to deteriorate. Keep updated on forecasts.',
      'Orange (Be Prepared / Alert): High risk of heavy rain (64.5 - 115.5 mm), strong winds (50-65 km/h) or extreme heat. Disruption of rail, road, and power likely. Prepare emergency kits.',
      'Red (Take Action / Warning): Extremely severe weather. Very heavy to extremely heavy rainfall (>204.4 mm), severe cyclonic storm winds (>89 km/h), or lethal heatwave (>45°C). Immediate disaster response, evacuation of vulnerable zones, and suspension of fishing/outdoor activity mandated.'
    ]
  },
  {
    id: 'rag-cyclone-maritime',
    title: 'INCOIS & IMD Coastal Marine Advisory & Fisherman Safety Thresholds',
    source: 'Indian National Centre for Ocean Information Services (INCOIS) & Coastal Security Protocols',
    category: 'maritime',
    summary: 'Wind speed, swell wave height, and squally weather protocols for coastal and deep-sea fishermen.',
    keyInstructions: [
      'Swell waves > 2.5 meters: Small mechanized boats and country crafts (Kattumaram) must return to harbor immediately.',
      'Wind speeds > 45 km/h (25 knots): Deep-sea fishing beyond 12 nautical miles strictly suspended.',
      'Cyclonic gale > 65 km/h (35 knots): Complete port clearance, hoist Local Cautionary Signal (LC-III / Danger-VIII), secure harbor trawlers.',
      'Coastal storm surge warning: Coastal aquaculture ponds require emergency netting to prevent prawn/fish escape and brackish water inundation.'
    ]
  },
  {
    id: 'rag-agrimet-crop-rules',
    title: 'IMD Agrimet Crop Protection & Agricultural Weather Advisory',
    source: 'National Agro-Meteorological Advisory Service & ICAR Directives',
    category: 'agriculture',
    summary: 'Actionable farm advisories during rain, high moisture, heatwaves, and hailstorms for major Indian crops.',
    keyInstructions: [
      'Heavy Rainfall (>50 mm): Immediately suspend irrigation, nitrogenous fertilizer top-dressing, and chemical spraying. Dig drainage trenches in cotton, groundnut, soybean, and paddy fields to prevent root rot and lodging.',
      'Standing Mature Paddy & Maize: Undertake immediate harvest if grain moisture is acceptable and stack harvested produce on elevated tarpaulins or poly-houses.',
      'Heatwave (>40°C): Provide light, frequent micro-irrigation or sprinkler irrigation during late evening or early morning to maintain soil moisture and prevent flower drop in pulses and vegetables.',
      'High Humidity (>85%) + Warm Temp (28-32°C): High risk of fungal blast in paddy and bollworm in cotton. Post-rain, apply recommended systemic fungicides once sky clears.'
    ]
  },
  {
    id: 'rag-flood-ndma',
    title: 'NDMA Standard Operating Procedure for Flood Management & Evacuation',
    source: 'National Disaster Management Authority (NDMA) National Flood Guidelines',
    category: 'flood',
    summary: 'Community and household level protocols during riverine overflow and urban flash floods.',
    keyInstructions: [
      'Early Warning Stage: Monitor Central Water Commission (CWC) river gauges and reservoir discharge advisories (e.g. Prakasam Barrage, Nagarjuna Sagar, Godavari Dowleswaram Barrage).',
      'Flash Flood Warning: Move domestic livestock to elevated mounds or flood shelters. Do not tether cattle.',
      'Water Inundation: Turn off household electrical mains to prevent electrocution through submerged wiring.',
      'Relief Camp Protocol: Distribute chlorine tablets (1 tablet per 20L water) and halogen tablets. Boil all water before consumption.'
    ]
  },
  {
    id: 'rag-heatwave-action-plan',
    title: 'National Action Plan for Prevention and Management of Heatwaves',
    source: 'NDMA & Ministry of Health and Family Welfare (MoHFW)',
    category: 'heatwave',
    summary: 'Guidelines for public health, school scheduling, and outdoor worker safety during heatwaves.',
    keyInstructions: [
      'Schools: Shift classroom timings to 7:00 AM - 11:30 AM during heatwave alerts (>40°C). Prohibit open-ground physical education during peak sun hours.',
      'Outdoor Workers & MGNREGA: Mandate mandatory shaded rest breaks between 12:00 PM and 3:30 PM with on-site potable water and ORS packets.',
      'Heat Stroke First-Aid: Heat stroke is a medical emergency characterized by cessation of sweating, body temperature >40°C (104°F), and confusion. Immediately pour cold water over body, apply ice packs, and call 108.'
    ]
  },
  {
    id: 'rag-travel-monsoon',
    title: 'Highway & Travel Advisory during Extreme Weather & Landslides',
    source: 'Ministry of Road Transport and Highways (MoRTH) & Border Roads Organisation (BRO)',
    category: 'emergency',
    summary: 'Road travel and transit precautions for ghat roads, coastal highways, and low-lying underpasses.',
    keyInstructions: [
      'Ghat Roads & Hilly Terrains (e.g. Eastern Ghats, Western Ghats, Araku, Nilgiris): Avoid travel during heavy downpours due to sudden landslide, mudslip, and falling boulder hazards.',
      'Urban Underpasses & Low-Lying Arterials: Never drive into flooded underpasses where depth cannot be gauged.',
      'High Wind Crosswinds (>60 km/h): High-sided vehicles, container trucks, and two-wheelers must reduce speed on open bridges and expressways.'
    ]
  }
];

export function retrieveRAGContext(query: string, location?: string, role?: UserRole): { contextText: string; citations: string[] } {
  const queryLower = (query + ' ' + (location || '') + ' ' + (role || '')).toLowerCase();
  
  const scoredDocs = RAG_KNOWLEDGE_BASE.map(doc => {
    let score = 0;
    const titleLower = doc.title.toLowerCase();
    const summaryLower = doc.summary.toLowerCase();
    const instructionsText = doc.keyInstructions.join(' ').toLowerCase();

    // Check keywords
    const keywords = ['cyclone', 'flood', 'rain', 'wind', 'heat', 'heatwave', 'farmer', 'crop', 'fish', 'sea', 'boat', 'travel', 'school', 'student', 'lightning', 'alert', 'red', 'yellow', 'orange'];
    keywords.forEach(kw => {
      if (queryLower.includes(kw)) {
        if (titleLower.includes(kw)) score += 5;
        if (summaryLower.includes(kw)) score += 3;
        if (instructionsText.includes(kw)) score += 2;
      }
    });

    if (role === 'farmer' && (doc.category === 'agriculture' || doc.id.includes('agrimet'))) score += 10;
    if (role === 'fisherman' && (doc.category === 'maritime' || doc.id.includes('maritime'))) score += 10;
    if (role === 'traveler' && (doc.id.includes('travel') || doc.category === 'emergency')) score += 8;
    if (role === 'student' && doc.id.includes('heatwave')) score += 8;

    return { doc, score };
  });

  scoredDocs.sort((a, b) => b.score - a.score);
  // Pick top 2-3 docs
  const topMatches = scoredDocs.filter(d => d.score > 0).slice(0, 3);
  if (topMatches.length === 0) {
    // Default top 2
    topMatches.push(scoredDocs[0], scoredDocs[1]);
  }

  const citations = topMatches.map(m => `${m.doc.title} (${m.doc.source})`);
  const contextText = topMatches.map(m => `### ${m.doc.title} [Source: ${m.doc.source}]\nSummary: ${m.doc.summary}\nKey Protocols:\n${m.doc.keyInstructions.map(i => `- ${i}`).join('\n')}`).join('\n\n');

  return { contextText, citations };
}
