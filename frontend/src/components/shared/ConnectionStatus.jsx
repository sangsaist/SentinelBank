import React from 'react';

const ConnectionStatus = ({ connected }) => {
  return (
    <div className={`
      flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300
      ${connected 
        ? 'bg-green-500/10 border-green-500/30 text-green-400' 
        : 'bg-red-500/10 border-red-500/30 text-red-400'}
    `}>
      <div className={`
        w-2 h-2 rounded-full 
        ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}
      `} />
      <span className="text-xs font-bold uppercase tracking-wider">
        {connected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
};

export default ConnectionStatus;
