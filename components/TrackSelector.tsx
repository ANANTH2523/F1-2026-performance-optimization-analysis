
import React from 'react';
import { Track } from '../types';
import { TrackIcon } from './icons/TrackIcon';

interface TrackSelectorProps {
  tracks: Track[];
  selectedTrackId: string;
  onSelectTrack: (trackId: string) => void;
}

const TrackSelector: React.FC<TrackSelectorProps> = ({ tracks, selectedTrackId, onSelectTrack }) => {
  return (
    <div className="space-y-2 mb-6">
       <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <TrackIcon className="w-4 h-4 text-blue-400" />
          <label htmlFor="track-selector" className="font-bold text-sm text-gray-200 uppercase tracking-wide">Circuit Profile</label>
        </div>
      </div>
      <div className="relative">
        <select
          id="track-selector"
          value={selectedTrackId}
          onChange={(e) => onSelectTrack(e.target.value)}
          className="w-full p-3 pl-4 bg-gray-900/50 border border-gray-600 hover:border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white font-mono text-sm appearance-none transition-colors cursor-pointer shadow-inner"
        >
          {tracks.map((track) => (
            <option key={track.id} value={track.id}>
              {track.name}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </div>
      </div>
       <div className="flex justify-between text-[10px] text-gray-500 font-mono uppercase">
          <span>Target Environment</span>
          <span>Config Loaded</span>
       </div>
    </div>
  );
};

export default TrackSelector;