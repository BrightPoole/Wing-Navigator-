
import { ChecklistGroup, WeatherHazard, Airport } from './types';

export const MAJOR_AIRPORTS: Airport[] = [
  { 
    icao: 'KJFK', 
    name: 'John F. Kennedy Intl', 
    lat: 40.6413, 
    lng: -73.7781, 
    elev: 13,
    runways: [
      { ident: '04L/22R', length: 12079, width: 200, surface: 'Asphalt/Concrete' },
      { ident: '04R/22L', length: 8400, width: 200, surface: 'Asphalt/Concrete' },
      { ident: '13L/31R', length: 10000, width: 200, surface: 'Asphalt/Concrete' },
      { ident: '13R/31L', length: 14511, width: 200, surface: 'Concrete' }
    ]
  },
  { 
    icao: 'EDDF', 
    name: 'Frankfurt Airport', 
    lat: 50.0333, 
    lng: 8.5705, 
    elev: 364,
    runways: [
      { ident: '07C/25C', length: 13123, width: 197, surface: 'Asphalt' },
      { ident: '07L/25R', length: 13123, width: 148, surface: 'Concrete' },
      { ident: '07R/25L', length: 13123, width: 148, surface: 'Concrete' },
      { ident: '18', length: 13123, width: 148, surface: 'Concrete' }
    ]
  },
  { 
    icao: 'RPLL', 
    name: 'Ninoy Aquino Intl', 
    lat: 14.5086, 
    lng: 121.0194, 
    elev: 75,
    runways: [
      { ident: '06/24', length: 12261, width: 197, surface: 'Asphalt/Concrete' },
      { ident: '13/31', length: 7310, width: 148, surface: 'Asphalt' }
    ]
  },
  { 
    icao: 'OMDB', 
    name: 'Dubai International', 
    lat: 25.2532, 
    lng: 55.3657, 
    elev: 62,
    runways: [
      { ident: '12L/30R', length: 13123, width: 197, surface: 'Asphalt' },
      { ident: '12R/30L', length: 14108, width: 197, surface: 'Asphalt' }
    ]
  },
  { 
    icao: 'RJTT', 
    name: 'Tokyo Haneda Intl', 
    lat: 35.5494, 
    lng: 139.7798, 
    elev: 21,
    runways: [
      { ident: '16R/34L', length: 9840, width: 200, surface: 'Asphalt' },
      { ident: '16L/34R', length: 11020, width: 200, surface: 'Asphalt' },
      { ident: '04/22', length: 8200, width: 200, surface: 'Asphalt' },
      { ident: '05/23', length: 8200, width: 171, surface: 'Asphalt' }
    ]
  },
  { 
    icao: 'KLAX', 
    name: 'Los Angeles Intl', 
    lat: 33.9416, 
    lng: -118.4085, 
    elev: 125,
    runways: [
      { ident: '06L/24R', length: 8926, width: 150, surface: 'Concrete' },
      { ident: '06R/24L', length: 10285, width: 150, surface: 'Concrete' },
      { ident: '07L/25R', length: 12091, width: 150, surface: 'Concrete' },
      { ident: '07R/25L', length: 11095, width: 200, surface: 'Concrete' }
    ]
  },
  { 
    icao: 'EGLL', 
    name: 'London Heathrow', 
    lat: 51.4700, 
    lng: -0.4543, 
    elev: 83,
    runways: [
      { ident: '09L/27R', length: 12801, width: 164, surface: 'Asphalt' },
      { ident: '09R/27L', length: 12001, width: 164, surface: 'Asphalt' }
    ]
  },
  { 
    icao: 'KSFO', 
    name: 'San Francisco Intl', 
    lat: 37.6213, 
    lng: -122.3790, 
    elev: 13,
    runways: [
      { ident: '01L/19R', length: 7650, width: 200, surface: 'Asphalt' },
      { ident: '01R/19L', length: 8650, width: 200, surface: 'Asphalt' },
      { ident: '10L/28R', length: 11870, width: 200, surface: 'Asphalt' },
      { ident: '10R/28L', length: 11381, width: 200, surface: 'Asphalt' }
    ]
  },
  { 
    icao: 'VHHH', 
    name: 'Hong Kong Intl', 
    lat: 22.3080, 
    lng: 113.9185, 
    elev: 28,
    runways: [
      { ident: '07L/25R', length: 12467, width: 200, surface: 'Asphalt' },
      { ident: '07R/25L', length: 12467, width: 200, surface: 'Asphalt' },
      { ident: '07C/25C', length: 12467, width: 200, surface: 'Asphalt' }
    ]
  },
];

export const MOCK_SIGMETS: WeatherHazard[] = [
  {
    id: 'SIG-01',
    category: 'SIGMET',
    type: 'CONVECTIVE',
    hazard: 'Severe Turbulence',
    points: [
      [42.0, -80.0],
      [45.0, -75.0],
      [43.0, -70.0],
      [40.0, -75.0]
    ],
    level: 'FL250-FL380',
    validity: '251200Z - 251800Z',
    description: 'Area of severe turbulence associated with fast-moving cold front. Possible moderate to severe icing in clouds.'
  },
  {
    id: 'SIG-02',
    category: 'SIGMET',
    type: 'VOLCANIC',
    hazard: 'Ash Cloud',
    points: [
      [60.0, -20.0],
      [63.0, -15.0],
      [61.0, -10.0],
      [58.0, -15.0]
    ],
    level: 'SFC-FL300',
    validity: '250900Z - 251500Z',
    description: 'Volcanic ash cloud moving east-southeast. Avoid all operations within defined area.'
  }
];

export const MOCK_AIRMETS: WeatherHazard[] = [
  {
    id: 'AIR-01',
    category: 'AIRMET',
    type: 'SIERRA',
    hazard: 'IFR/Mountain Obscuration',
    points: [
      [35.0, -120.0],
      [38.0, -118.0],
      [37.0, -115.0],
      [34.0, -116.0]
    ],
    level: 'SFC-12000FT',
    validity: '251400Z - 252000Z',
    description: 'Ceilings below 1000ft and/or visibility below 3 miles affecting high terrain. Continuous obscuration likely.'
  },
  {
    id: 'AIR-02',
    category: 'AIRMET',
    type: 'TANGO',
    hazard: 'Moderate Turbulence',
    points: [
      [40.0, -122.0],
      [43.0, -121.0],
      [42.0, -119.0],
      [39.0, -120.0]
    ],
    level: 'FL180-FL280',
    validity: '251200Z - 251800Z',
    description: 'Moderate turbulence reported by multiple aircraft. Forecast to persist through afternoon.'
  }
];

export const PREFLIGHT_CHECKLIST: ChecklistGroup[] = [
  {
    title: 'Pre-Flight Internal',
    items: [
      { id: '1', text: 'Documents (ARROW) - Check', completed: false },
      { id: '2', text: 'Control Wheel Lock - Remove', completed: false },
      { id: '3', text: 'Ignition Switch - OFF', completed: false },
      { id: '4', text: 'Master Switch - ON', completed: false },
      { id: '5', text: 'Fuel Quantity - Check', completed: false },
      { id: '6', text: 'Flaps - Extend', completed: false },
    ]
  },
  {
    title: 'Before Engine Start',
    items: [
      { id: '7', text: 'Pre-flight Inspection - Complete', completed: false },
      { id: '8', text: 'Passenger Briefing - Complete', completed: false },
      { id: '9', text: 'Seats, Belts - Adjusted/Locked', completed: false },
      { id: '10', text: 'Brakes - Test & Set', completed: false },
      { id: '11', text: 'Circuit Breakers - Check In', completed: false },
    ]
  }
];
