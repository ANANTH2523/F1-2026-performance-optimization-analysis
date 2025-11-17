import { Track } from '../types';

export const tracks: Track[] = [
  {
    id: 'catalunya',
    name: 'Circuit de Barcelona-Catalunya',
    country: 'Spain',
    type: 'Balanced, Technical',
    downforceLevel: 'high',
    abrasiveness: 'high',
    keyFeatures: 'A mix of high-speed and low-speed corners, long main straight. A comprehensive test of car performance.',
  },
  {
    id: 'monza',
    name: 'Autodromo Nazionale Monza',
    country: 'Italy',
    type: 'High-Speed, "Temple of Speed"',
    downforceLevel: 'low',
    abrasiveness: 'medium',
    keyFeatures: 'Longest straights on the calendar, heavy braking zones into tight chicanes. Requires minimal drag and maximum power.',
  },
  {
    id: 'monaco',
    name: 'Circuit de Monaco',
    country: 'Monaco',
    type: 'Street Circuit, Slow & Tight',
    downforceLevel: 'max',
    abrasiveness: 'low',
    keyFeatures: 'Narrow, twisty streets with no room for error. Requires maximum downforce, agility, and driver precision.',
  },
  {
    id: 'silverstone',
    name: 'Silverstone Circuit',
    country: 'UK',
    type: 'High-Speed, Sweeping Corners',
    downforceLevel: 'high',
    abrasiveness: 'high',
    keyFeatures: 'Famous for its high-speed corner sequences like Maggots and Becketts. Demands aerodynamic stability and efficiency.',
  },
    {
    id: 'spa',
    name: 'Circuit de Spa-Francorchamps',
    country: 'Belgium',
    type: 'High-Speed, Elevation Changes',
    downforceLevel: 'medium',
    abrasiveness: 'medium',
    keyFeatures: 'A long lap with significant elevation changes, including the iconic Eau Rouge. A mix of long straights and challenging corners.',
  },
];
