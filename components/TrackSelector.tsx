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
    <div className="space-y-2">
       <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <TrackIcon className="w-5 h-5 text-gray-400" />
          <label htmlFor="track-selector" className="font-medium text-white">Benchmark Circuit</label>
        </div>
      </div>
      <select
        id="track-selector"
        value={selectedTrackId}
        onChange={(e) => onSelectTrack(e.target.value)}
        className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
      >
        {tracks.map((track) => (
          <option key={track.id} value={track.id}>
            {track.name} ({track.type})
          </option>
        ))}
      </select>
       <p className="text-xs text-gray-400">Select the circuit for performance simulation and analysis.</p>
    </div>
  );
};

export default TrackSelector;
