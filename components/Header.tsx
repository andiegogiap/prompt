
import React from 'react';
import { ICONS } from '../constants';

interface HeaderProps {
    onToggleSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSettings }) => {
  return (
    <header className="flex items-center justify-between p-3 border-b border-white/20 bg-black/25 backdrop-blur-xl shadow-lg shadow-black/40 sticky top-0 z-20 flex-shrink-0">
      <div className="flex items-center gap-3">
        <a href="/" aria-label="Home">
          <img
            src="https://andiegogiap.com/assets/aionex-icon-256.png"
            alt="AIONEX logo"
            style={{ height: '32px', width: 'auto' }}
            width="32"
            height="32"
            loading="eager"
            decoding="async"
          />
        </a>
        <h1 className="text-xl font-bold text-fuchsia-300 tracking-widest">Prompt Whisperer</h1>
      </div>
      <div className="flex-shrink-0 text-xs text-gray-500 font-mono hidden md:block">
        <span>System USER: user_a95bfb54</span>
        <span className="mx-2 text-gray-700">|</span>
        <span>Session ID: session_1ab89b9e-e17</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          {React.cloneElement(ICONS.GIT, { className: 'h-5 w-5' })}
          <span>main</span>
        </div>
        <button onClick={onToggleSettings} className="p-2 rounded-full text-gray-400 hover:text-fuchsia-300 hover:bg-fuchsia-500/10 transition-colors" aria-label="Open global settings">
            {React.cloneElement(ICONS.SETTINGS, { className: 'h-5 w-5'})}
        </button>
      </div>
    </header>
  );
};

export default Header;