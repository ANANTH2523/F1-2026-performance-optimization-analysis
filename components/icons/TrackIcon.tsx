import React from 'react';

export const TrackIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}
  >
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M9 6.75V15m6-6v8.25m.5-11.25a.75.75 0 01.75.75v10.5a.75.75 0 01-1.5 0V6.75a.75.75 0 01.75-.75zM3 6.75a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75V6.75z" 
    />
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M9 9h6" 
    />
  </svg>
);
