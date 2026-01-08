
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
    title: 'Pre-Flight Inspection',
    items: [
      { id: '1', text: 'Documents (ARROW) - On Board', completed: false },
      { id: '2', text: 'Parking Brake - Set', completed: false },
      { id: '3', text: 'Control Wheel Lock - Removed', completed: false },
      { id: '4', text: 'Ignition Switch - OFF', completed: false },
      { id: '5', text: 'Avionics Master - OFF', completed: false },
      { id: '6', text: 'Master Switch - ON', completed: false },
      { id: '7', text: 'Fuel Quantity - Check Indicators', completed: false },
      { id: '8', text: 'Flaps - Extend for Inspection', completed: false },
      { id: '9', text: 'Master Switch - OFF', completed: false },
      { id: '10', text: 'Fuel Strainer/Sumps - Sample & Check', completed: false },
      { id: '11', text: 'Oil Level - Check (Min 5qt, Max 8qt)', completed: false },
      { id: '12', text: 'Propeller & Spinner - Check Condition', completed: false },
      { id: '13', text: 'Air Inlets/Filter - Clear of Debris', completed: false },
      { id: '14', text: 'Pitot Tube - Cover Removed/Clear', completed: false },
      { id: '15', text: 'Fuel Vents/Static Ports - Unobstructed', completed: false },
      { id: '16', text: 'Control Surfaces/Hinges - Free & Secure', completed: false },
      { id: '17', text: 'Tires/Struts/Brakes - Inspect', completed: false },
      { id: '18', text: 'Antennas/ELT - Secure', completed: false },
    ]
  },
  {
    title: 'Before Engine Start',
    items: [
      { id: '19', text: 'Pre-flight Inspection - Complete', completed: false },
      { id: '20', text: 'Passenger Briefing - Complete', completed: false },
      { id: '21', text: 'Seats & Seatbelts - Adjusted/Locked', completed: false },
      { id: '22', text: 'Brakes - Test & Set', completed: false },
      { id: '23', text: 'Fuel Selector - BOTH', completed: false },
      { id: '24', text: 'Circuit Breakers - Check All IN', completed: false },
      { id: '25', text: 'Carburetor Heat - COLD', completed: false },
      { id: '26', text: 'Master Switch - ON', completed: false },
      { id: '27', text: 'Beacon Light - ON', completed: false },
      { id: '28', text: 'Mixture - FULL RICH', completed: false },
      { id: '29', text: 'Throttle - Open 1/4 Inch', completed: false },
      { id: '30', text: 'Prime - As Required', completed: false },
      { id: '31', text: 'Propeller Area - CLEAR! (SHOUT)', completed: false },
    ]
  },
  {
    title: 'After Engine Start',
    items: [
      { id: '32', text: 'Oil Pressure - Check Green (30s)', completed: false },
      { id: '33', text: 'Mixture - Lean for Ground (1")', completed: false },
      { id: '34', text: 'Amps/Volts - Charging Status', completed: false },
      { id: '35', text: 'Avionics Master - ON', completed: false },
      { id: '36', text: 'Flaps - Retract', completed: false },
      { id: '37', text: 'Transponder - STANDBY/GROUND', completed: false },
    ]
  },
  {
    title: 'Before Taxi',
    items: [
      { id: '38', text: 'Brakes - Test Immediately', completed: false },
      { id: '39', text: 'Flight Instruments - Check in Turns', completed: false },
      { id: '40', text: 'Taxi Light - ON (as required)', completed: false },
      { id: '41', text: 'Taxi Clearance - Obtained', completed: false },
    ]
  },
  {
    title: 'After Taxi (Run-Up)',
    items: [
      { id: '42', text: 'Parking Brake - Set', completed: false },
      { id: '43', text: 'Doors & Windows - Closed & Locked', completed: false },
      { id: '44', text: 'Flight Controls - Free & Correct', completed: false },
      { id: '45', text: 'Fuel Selector - BOTH', completed: false },
      { id: '46', text: 'Mixture - FULL RICH', completed: false },
      { id: '47', text: 'Throttle - 1700 RPM', completed: false },
      { id: '48', text: 'Magnetos - Check Drop (Max 150)', completed: false },
      { id: '49', text: 'Carburetor Heat - Test & Return', completed: false },
      { id: '50', text: 'Engine Gauges - Check Green', completed: false },
      { id: '51', text: 'Vacuum Gauge - 4.5 - 5.4 inHg', completed: false },
      { id: '52', text: 'Idle - Check (600-800 RPM)', completed: false },
      { id: '53', text: 'Throttle - 1000 RPM or Less', completed: false },
      { id: '54', text: 'Friction Lock - Adjusted', completed: false },
    ]
  },
  {
    title: 'Before Takeoff',
    items: [
      { id: '55', text: 'Departure Briefing - Complete', completed: false },
      { id: '56', text: 'Flaps - Set for Takeoff (0-10)', completed: false },
      { id: '57', text: 'Trim - Set for Takeoff', completed: false },
      { id: '58', text: 'Transponder - ALT Mode', completed: false },
      { id: '59', text: 'Lights - Strobe & Landing ON', completed: false },
      { id: '60', text: 'Time - Record Start', completed: false },
    ]
  },
  {
    title: 'After Takeoff',
    items: [
      { id: '61', text: 'Airspeed - Vy (73-80 KIAS)', completed: false },
      { id: '62', text: 'Flaps - Retract (Above 500ft AGL)', completed: false },
      { id: '63', text: 'Landing Light - OFF (Above 1000ft)', completed: false },
      { id: '64', text: 'Engine Gauges - Monitor Normal', completed: false },
    ]
  },
  {
    title: 'Climb',
    items: [
      { id: '65', text: 'Airspeed - Cruise Climb (85-90)', completed: false },
      { id: '66', text: 'Power - Full Throttle', completed: false },
      { id: '67', text: 'Mixture - Lean (Above 3000ft MSL)', completed: false },
      { id: '68', text: 'Engine Gauges - Monitor', completed: false },
    ]
  },
  {
    title: 'In-Flight (Cruise)',
    items: [
      { id: '69', text: 'Power - Set 2200-2700 RPM', completed: false },
      { id: '70', text: 'Mixture - Lean for Cruise', completed: false },
      { id: '71', text: 'Heading Indicator - Align w/ Compass', completed: false },
      { id: '72', text: 'Fuel Status - Monitor & Note', completed: false },
      { id: '73', text: 'Flight Instruments - Periodic Check', completed: false },
    ]
  },
  {
    title: 'Descent',
    items: [
      { id: '74', text: 'ATIS/AWOS - Obtained & Noted', completed: false },
      { id: '75', text: 'Altimeter - Set Local Pressure', completed: false },
      { id: '76', text: 'Approach Briefing - Complete', completed: false },
      { id: '77', text: 'Fuel Selector - BOTH', completed: false },
      { id: '78', text: 'Mixture - Enrich as Needed', completed: false },
      { id: '79', text: 'Carburetor Heat - As Required', completed: false },
    ]
  },
  {
    title: 'Before Landing',
    items: [
      { id: '80', text: 'Seatbelts & Harnesses - Secure', completed: false },
      { id: '81', text: 'Fuel Selector - BOTH', completed: false },
      { id: '82', text: 'Mixture - FULL RICH', completed: false },
      { id: '83', text: 'Carburetor Heat - ON (Below Green)', completed: false },
      { id: '84', text: 'Landing Light - ON', completed: false },
      { id: '85', text: 'Autopilot - OFF', completed: false },
      { id: '86', text: 'Flaps - As Required', completed: false },
      { id: '87', text: 'Airspeed - Set Approach (60-70)', completed: false },
    ]
  },
  {
    title: 'After Landing',
    items: [
      { id: '88', text: 'Runway - Clear (Hold Short Line)', completed: false },
      { id: '89', text: 'Flaps - Retract', completed: false },
      { id: '90', text: 'Carburetor Heat - COLD', completed: false },
      { id: '91', text: 'Pitot Heat - OFF', completed: false },
      { id: '92', text: 'Landing Light - OFF (if day)', completed: false },
      { id: '93', text: 'Transponder - STANDBY/GROUND', completed: false },
    ]
  },
  {
    title: 'Taxi to Ramp',
    items: [
      { id: '94', text: 'Brakes - Test Again', completed: false },
      { id: '95', text: 'Mixture - Lean for Ground', completed: false },
      { id: '96', text: 'Taxi Clearance - Obtained', completed: false },
      { id: '97', text: 'Taxi Light - OFF (as required)', completed: false },
    ]
  },
  {
    title: 'Engine Shutdown',
    items: [
      { id: '98', text: 'Avionics Master - OFF', completed: false },
      { id: '99', text: 'Electrical Equipment - OFF', completed: false },
      { id: '100', text: '121.5 Frequency - Check (ELT)', completed: false },
      { id: '101', text: 'Mixture - Idle Cut-off', completed: false },
      { id: '102', text: 'Ignition Switch - OFF (Key out)', completed: false },
      { id: '103', text: 'Master Switch - OFF', completed: false },
      { id: '104', text: 'Control Lock - Install', completed: false },
      { id: '105', text: 'Hobbs & Tach - Record', completed: false },
      { id: '106', text: 'Secure Aircraft - Chocks/Ties', completed: false },
    ]
  },
  {
    title: '🚨 EMERGENCY: Engine Failure (Takeoff)',
    items: [
      { id: 'e1', text: 'Takeoff Roll: Throttle IDLE', completed: false },
      { id: 'e2', text: 'Takeoff Roll: Brakes APPLY HEAVILY', completed: false },
      { id: 'e3', text: 'Takeoff Roll: Flaps RETRACT', completed: false },
      { id: 'e4', text: 'Takeoff Roll: Mixture IDLE CUT-OFF', completed: false },
      { id: 'e5', text: 'Takeoff Roll: Ignition/Master OFF', completed: false },
      { id: 'e6', text: 'Immediately After Takeoff: Airspeed 65 KIAS', completed: false },
      { id: 'e7', text: 'Immediately After Takeoff: Land Straight Ahead', completed: false },
      { id: 'e8', text: 'Avoid Large Turns (Never back to runway)', completed: false },
    ]
  },
  {
    title: '🚨 EMERGENCY: Engine Failure (In-Flight)',
    items: [
      { id: 'e9', text: 'Airspeed - 65 KIAS (Best Glide)', completed: false },
      { id: 'e10', text: 'Landing Site - IDENTIFY (Fields/Roads)', completed: false },
      { id: 'e11', text: 'Fuel Selector - BOTH', completed: false },
      { id: 'e12', text: 'Mixture - FULL RICH', completed: false },
      { id: 'e13', text: 'Carburetor Heat - ON', completed: false },
      { id: 'e14', text: 'Ignition Switch - BOTH/START', completed: false },
      { id: 'e15', text: 'Primer - IN and LOCKED', completed: false },
      { id: 'e16', text: 'Master Switch - ON', completed: false },
    ]
  },
  {
    title: '🚨 EMERGENCY: Forced Landing (No Power)',
    items: [
      { id: 'e17', text: 'Radio - 121.5 (MAYDAY x3)', completed: false },
      { id: 'e18', text: 'Transponder - 7700', completed: false },
      { id: 'e19', text: 'Seats/Belts - SECURE', completed: false },
      { id: 'e20', text: 'Fuel Selector - OFF', completed: false },
      { id: 'e21', text: 'Mixture - IDLE CUT-OFF', completed: false },
      { id: 'e22', text: 'Ignition Switch - OFF', completed: false },
      { id: 'e23', text: 'Flaps - AS REQUIRED (Full once assured)', completed: false },
      { id: 'e24', text: 'Master Switch - OFF (After flaps)', completed: false },
      { id: 'e25', text: 'Doors - UNLATCHED (Prior to touchdown)', completed: false },
      { id: 'e26', text: 'Touchdown - TAIL LOW', completed: false },
    ]
  }
];
