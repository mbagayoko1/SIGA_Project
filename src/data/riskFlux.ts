export interface CountryRiskInfo {
  id: string;
  name: string;
  riskScore: number; // 0-100
  status: 'Critical' | 'High' | 'Moderate' | 'Stable';
  threats: string[];
  humanitarianNeeds: string;
  politicalContext: string;
}

export const WCA_COUNTRY_INTELLIGENCE: Record<string, CountryRiskInfo> = {
  "Mali": {
    id: "MLI",
    name: "Mali",
    riskScore: 92,
    status: 'Critical',
    threats: ["ISGS activity", "JNIM expansion", "Institutional transition"],
    humanitarianNeeds: "Over 7M people in need of assistance.",
    politicalContext: "Transition period with significant regional realignments."
  },
  "Burkina Faso": {
    id: "BFA",
    name: "Burkina Faso",
    riskScore: 89,
    status: 'Critical',
    threats: ["Mass displacement", "Liptako-Gourma pressure", "Food insecurity"],
    humanitarianNeeds: "2M+ IDPs requiring urgent SRHR support.",
    politicalContext: "Securitization of governance and shift in regional alliances."
  },
  "Niger": {
    id: "NER",
    name: "Niger",
    riskScore: 85,
    status: 'High',
    threats: ["Border security", "Migration flux", "Economic sanctions impact"],
    humanitarianNeeds: "Protection services for migrants and host communities.",
    politicalContext: "Focus on domestic stabilization and regional cooperation."
  },
  "Nigeria": {
    id: "NGA",
    name: "Nigeria",
    riskScore: 78,
    status: 'High',
    threats: ["North-east insurgency", "North-west banditry", "Economic volatility"],
    humanitarianNeeds: "Massive scale-up required for GBV response in conflict zones.",
    politicalContext: "Navigating complex internal security and economic reforms."
  },
  "Chad": {
    id: "TCD",
    name: "Chad",
    riskScore: 82,
    status: 'High',
    threats: ["Sudan crisis spillover", "Lake Chad instability", "Transition dynamics"],
    humanitarianNeeds: "Refugee response for 500k+ Sudanese arrivals.",
    politicalContext: "Managing large-scale regional displacement while navigating transition."
  },
  "Cameroon": {
    id: "CMR",
    name: "Cameroon",
    riskScore: 70,
    status: 'Moderate',
    threats: ["Far North insurgency", "North-West/South-West crisis"],
    humanitarianNeeds: "Access to health in hard-to-reach conflict areas.",
    politicalContext: "Maintaining stability across diverse internal frontlines."
  },
  "Central African Rep.": {
    id: "CAF",
    name: "Central African Rep.",
    riskScore: 88,
    status: 'Critical',
    threats: ["Non-state armed groups", "Resource competition", "Weak state presence"],
    humanitarianNeeds: "Restoration of core health systems in rural provinces.",
    politicalContext: "Gradual state building amid persistent security challenges."
  },
  "Senegal": {
    id: "SEN",
    name: "Senegal",
    riskScore: 35,
    status: 'Stable',
    threats: ["Democratic protests", "Maritime illegal migration"],
    humanitarianNeeds: "Youth employment and migration management.",
    politicalContext: "Strong democratic institutions navigating electoral shifts."
  },
  "Mauritania": {
    id: "MRT",
    name: "Mauritania",
    riskScore: 45,
    status: 'Moderate',
    threats: ["Sahel border spillover", "Refugee influx from Mali"],
    humanitarianNeeds: "Health services in the eastern border regions.",
    politicalContext: "Regional mediator role in the Sahel crisis."
  },
  "Côte d'Ivoire": {
    id: "CIV",
    name: "Côte d'Ivoire",
    riskScore: 40,
    status: 'Stable',
    threats: ["Northern border spillover", "Social cohesion"],
    humanitarianNeeds: "Resilience building in northern districts.",
    politicalContext: "Economic growth leader focusing on regional stability."
  },
  "Ghana": {
    id: "GHA",
    name: "Ghana",
    riskScore: 30,
    status: 'Stable',
    threats: ["Northern border security", "Economic inflation"],
    humanitarianNeeds: "Primary healthcare strengthening.",
    politicalContext: "Stable democracy with minor security concerns in the north."
  },
  "Benin": {
    id: "BEN",
    name: "Benin",
    riskScore: 55,
    status: 'Moderate',
    threats: ["Northern park security", "Extremist spillover"],
    humanitarianNeeds: "Support for communities in northern border zones.",
    politicalContext: "Increasing focus on border security and social resilience."
  },
  "Togo": {
    id: "TGO",
    name: "Togo",
    riskScore: 50,
    status: 'Moderate',
    threats: ["Northern border spillover"],
    humanitarianNeeds: "Emergency preparedness in northern regions.",
    politicalContext: "Strengthening state presence in vulnerable borders."
  },
  "Sierra Leone": {
    id: "SLE",
    name: "Sierra Leone",
    riskScore: 48,
    status: 'Moderate',
    threats: ["Economic volatility", "Youth restlessness"],
    humanitarianNeeds: "Maternal health and GBV prevention.",
    politicalContext: "Consolidating peace and economic recovery."
  },
  "Liberia": {
    id: "LBR",
    name: "Liberia",
    riskScore: 42,
    status: 'Stable',
    threats: ["Health system fragility"],
    humanitarianNeeds: "Universal health coverage for rural women.",
    politicalContext: "Stable transition and focus on healthcare infrastructure."
  },
  "Guinea": {
    id: "GIN",
    name: "Guinea",
    riskScore: 65,
    status: 'High',
    threats: ["Political transition", "Labor unrest"],
    humanitarianNeeds: "Access to essential medicines and contraceptives.",
    politicalContext: "Navigating constitutional transition and social dialogue."
  },
  "Guinea-Bissau": {
    id: "GNB",
    name: "Guinea-Bissau",
    riskScore: 58,
    status: 'Moderate',
    threats: ["Political instability", "Drug trafficking flux"],
    humanitarianNeeds: "Strengthening maternal health services.",
    politicalContext: "Institutional reforms and stabilization efforts."
  },
  "Gambia": {
    id: "GMB",
    name: "Gambia",
    riskScore: 32,
    status: 'Stable',
    threats: ["Economic reliance on tourism", "Social fragmentation"],
    humanitarianNeeds: "Primary health and youth engagement.",
    politicalContext: "Democratic consolidation post-transition."
  },
  "Gabon": {
    id: "GAB",
    name: "Gabon",
    riskScore: 52,
    status: 'Moderate',
    threats: ["Transition stability"],
    humanitarianNeeds: "Health equity and social protection.",
    politicalContext: "Managing transition following institutional institutional shifts."
  },
  "Congo": {
    id: "COG",
    name: "Congo",
    riskScore: 45,
    status: 'Moderate',
    threats: ["Economic diversification risks"],
    humanitarianNeeds: "Equitable access to SRHR in forest regions.",
    politicalContext: "Stability with focus on environmental and human development."
  },
  "Equatorial Guinea": {
    id: "GNQ",
    name: "Equatorial Guinea",
    riskScore: 38,
    status: 'Stable',
    threats: ["Economic volatility"],
    humanitarianNeeds: "Strengthening primary health infrastructure.",
    politicalContext: "Stability focusing on infrastructure and health."
  },
  "Sao Tome and Principe": {
    id: "STP",
    name: "Sao Tome and Principe",
    riskScore: 25,
    status: 'Stable',
    threats: ["Climate change vulnerability"],
    humanitarianNeeds: "Climate-resilient health services.",
    politicalContext: "Highly stable island democracy."
  },
  "Dem. Rep. Congo": {
    id: "COD",
    name: "Dem. Rep. Congo",
    riskScore: 95,
    status: 'Critical',
    threats: ["Eastern conflict (M23)", "Internal displacement", "Health epidemics"],
    humanitarianNeeds: "Urgent scale-up for 6M+ displaced persons.",
    politicalContext: "Complex security crisis in the East impacting regional stability."
  }
};

export const RISK_FLUX_POINTS = [
  { name: "Liptako-Gourma Tri-Border", coordinates: [1.5, 14.5], color: "#ef4444", risk: 'Critical', details: 'Transnational extremist activity' },
  { name: "Lake Chad Basin", coordinates: [14.0, 13.5], color: "#ef4444", risk: 'Severe', details: 'Boko Haram/ISWAP intersection' },
  { name: "Gulf of Guinea", coordinates: [5.0, 3.0], color: "#3b82f6", risk: 'Stressed', details: 'Maritime piracy & smuggling routes' },
  { name: "Central Sahel Corridor", coordinates: [-1.0, 16.0], color: "#f59e0b", risk: 'Escalating', details: 'Alliance of Sahel States (AES) shift' },
  { name: "Mano River Union", coordinates: [-10.0, 8.0], color: "#10b981", risk: 'Stable', details: 'Sub-regional democratic consolidation' },
];

export const FLUX_LINES = [
  { from: [0.0, 15.0], to: [-10.0, 10.0], type: 'migration', label: 'Western Migration Route' },
  { from: [1.5, 14.5], to: [5.0, 7.0], type: 'security', label: 'Extremist Spillover Pressure' },
  { from: [14.0, 13.5], to: [12.0, 5.0], type: 'humanitarian', label: 'Displacement Flow (Borno-Coastal)' },
  { from: [10.0, 2.0], to: [14.0, 13.5], type: 'supply', label: 'Logistical Supply Chain' },
];
