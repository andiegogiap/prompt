
import React from 'react';
import { ICONS } from '../constants';
import { Button } from './ui/Button';

interface SettingsPanelProps {
  isVisible: boolean;
  onClose: () => void;
  systemOrchestratorInstruction: string;
  setSystemOrchestratorInstruction: (value: string) => void;
  aiSupervisorInstruction: string;
  setAiSupervisorInstruction: (value: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isVisible,
  onClose,
  systemOrchestratorInstruction,
  setSystemOrchestratorInstruction,
  aiSupervisorInstruction,
  setAiSupervisorInstruction,
}) => {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>
      
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-black/25 backdrop-blur-xl border-l border-white/20 shadow-2xl shadow-black/50 z-50 transform transition-transform duration-300 ease-in-out ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-panel-title"
      >
        <div className="flex flex-col h-full">
          <header className="flex items-center justify-between p-4 border-b border-white/20 flex-shrink-0">
            <h2 id="settings-panel-title" className="text-lg font-semibold text-fuchsia-300 flex items-center gap-2">
              {React.cloneElement(ICONS.SETTINGS, { className: 'h-6 w-6' })}
              <span>Global Instructions</span>
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close settings panel">
              {React.cloneElement(ICONS.CLOSE, { className: 'h-5 w-5' })}
            </Button>
          </header>
          
          <div className="p-6 overflow-y-auto flex-grow space-y-8">
            <div>
              <label htmlFor="orchestrator-instruction" className="block text-md font-medium text-gray-300 mb-2">
                System Orchestrator Instruction
              </label>
              <p className="text-xs text-gray-500 mb-3">This high-level directive guides the AI Architect ('ANDIE') when it generates multi-agent workflow plans (YAML files).</p>
              <textarea
                id="orchestrator-instruction"
                value={systemOrchestratorInstruction}
                onChange={(e) => setSystemOrchestratorInstruction(e.target.value)}
                className="w-full h-48 p-3 bg-white/10 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-mono text-sm"
                aria-label="System Orchestrator Instruction"
              />
            </div>

            <div>
              <label htmlFor="supervisor-instruction" className="block text-md font-medium text-gray-300 mb-2">
                AI Supervisor Instruction
              </label>
              <p className="text-xs text-gray-500 mb-3">This global meta-instruction is prepended to every prompt. It acts as a universal rulebook for all AI responses, in both composer and workflow modes.</p>
              <textarea
                id="supervisor-instruction"
                value={aiSupervisorInstruction}
                onChange={(e) => setAiSupervisorInstruction(e.target.value)}
                className="w-full h-48 p-3 bg-white/10 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-mono text-sm"
                aria-label="AI Supervisor Instruction"
              />
            </div>
          </div>

          <footer className="p-4 border-t border-white/20 flex-shrink-0">
            <p className="text-xs text-center text-gray-500">These instructions are saved automatically as you type.</p>
          </footer>
        </div>
      </div>
    </>
  );
};