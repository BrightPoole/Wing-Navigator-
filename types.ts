
export interface Runway {
  ident: string;
  length: number;
  width: number;
  surface: string;
}

export interface Airport {
  icao: string;
  name: string;
  lat: number;
  lng: number;
  elev: number;
  runways?: Runway[];
}

export interface WeatherData {
  icao: string;
  metar: string;
  taf: string;
  timestamp: string;
  flightCategory: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ChecklistGroup {
  title: string;
  items: ChecklistItem[];
}

export enum ViewMode {
  MAP = 'MAP',
  WEATHER = 'WEATHER',
  CALC = 'CALC',
  CHECKLIST = 'CHECKLIST',
  CHECKPOINTS = 'CHECKPOINTS'
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface WeatherHazard {
  id: string;
  type: string;
  hazard: string;
  points: [number, number][];
  level: string;
  validity: string;
  description?: string;
  category: 'SIGMET' | 'AIRMET';
}

export interface Checkpoint {
  id: string;
  timestamp: number;
  name: string;
  viewMode: ViewMode;
  mapCenter?: [number, number];
  mapZoom?: number;
  checklistState: ChecklistGroup[];
  flightPlan: Airport[];
}
