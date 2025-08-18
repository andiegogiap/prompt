
import React, { useState, useCallback, useEffect } from 'react';
import type { PromptSettings, WorkflowDefinition, StepDefinition, AgentDefinition } from '../types';
import { ICONS } from '../constants';
import { Button } from './ui/Button';
import { streamGenerateContent } from '../services/geminiService';
import { WorkflowVisualizer } from './WorkflowVisualizer';

interface WorkflowRunnerProps {
  initialPrompt: string;
  initialSettings: PromptSettings;
  addLog: (message: string) => void;
  systemOrchestratorInstruction: string;
  aiSupervisorInstruction: string;
}

export interface WorkflowStepState {
  status: 'pending' | 'active' | 'completed' | 'error';
  output: string | null;
  error: string | null;
}

export const WorkflowRunner: React.FC<WorkflowRunnerProps> = ({ 
    initialPrompt, 
    initialSettings, 
    addLog, 
    systemOrchestratorInstruction, 
    aiSupervisorInstruction 
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [generatedPlan, setGeneratedPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State for interactive workflow execution
  const [workflowData, setWorkflowData] = useState<WorkflowDefinition | null>(null);
  const [workflowState, setWorkflowState] = useState<Record<number, WorkflowStepState>>({});
  const [isExecutingStepId, setIsExecutingStepId] = useState<number | null>(null);

  const handleGeneratePlan = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setGeneratedPlan('');
    setWorkflowData(null);
    setWorkflowState({});
    addLog(`[${new Date().toLocaleTimeString()}] Generating workflow from definition...`);

    let fullResponse = "";
    const onChunk = (chunk: string) => {
      if (chunk === '__CLEAR_AND_RETRY__') {
        fullResponse = "";
        setGeneratedPlan('');
        return;
      }
      fullResponse += chunk;
      setGeneratedPlan(fullResponse);
    };

    const onComplete = () => {
      addLog(`[${new Date().toLocaleTimeString()}] Workflow generation complete.`);
      setIsLoading(false);
    };

    const onError = (error: string) => {
      addLog(`[${new Date().toLocaleTimeString()}] Error: ${error}`);
      setGeneratedPlan(`Error: ${error}`);
      setIsLoading(false);
    };

    const planGenerationSettings: PromptSettings = {
        ...initialSettings,
        systemInstruction: systemOrchestratorInstruction,
    };

    streamGenerateContent(
      prompt, '', '', [], planGenerationSettings,
      onChunk, onComplete, onError,
      aiSupervisorInstruction
    );
  }, [prompt, initialSettings, isLoading, addLog, systemOrchestratorInstruction, aiSupervisorInstruction]);
  
  const handleWorkflowParsed = useCallback((data: WorkflowDefinition | null) => {
    setWorkflowData(data);
    if (data) {
        const initialState: Record<number, WorkflowStepState> = {};
        let firstStep = true;
        for (const step of data.steps) {
            initialState[step.id] = {
                status: firstStep ? 'active' : 'pending',
                output: null,
                error: null,
            };
            firstStep = false;
        }
        setWorkflowState(initialState);
    } else {
        setWorkflowState({});
    }
  }, []);

  const handleExecuteStep = useCallback(async (stepId: number, userInstruction: string) => {
    if (!workflowData) return;
    
    setIsExecutingStepId(stepId);
    setWorkflowState(prev => ({ ...prev, [stepId]: { ...prev[stepId], output: '', error: null }}));
    addLog(`[${new Date().toLocaleTimeString()}] Executing step ${stepId}: ${userInstruction}`);

    const step = workflowData.steps.find(s => s.id === stepId)!;
    const agent = workflowData.agents[step.agent];

    const completedSteps = workflowData.steps.filter(s => workflowState[s.id]?.status === 'completed' && workflowState[s.id].output);
    const context = completedSteps.length > 0 
      ? "Context from previous completed steps:\n" + completedSteps.map(cs => `- Step ${cs.id} (${cs.name}) output: "${workflowState[cs.id].output}"`).join('\n')
      : "No previous steps have been completed.";
    
    const agentSystemInstruction = `You are ${step.agent}, a ${agent.role}. Your capabilities are: ${agent.verbs.join(', ')}.`;
    const finalPrompt = `Your current task is "${step.name}".\n${context}\n\nBased on that context, follow these instructions precisely:\n---\n${userInstruction}\n---`;

    let fullResponse = "";
    const onChunk = (chunk: string) => {
        if (chunk === '__CLEAR_AND_RETRY__') {
          fullResponse = "";
          setWorkflowState(prev => ({ ...prev, [stepId]: { ...prev[stepId], status: 'active', output: '' }}));
          return;
        }
        fullResponse += chunk;
        setWorkflowState(prev => ({ ...prev, [stepId]: { ...prev[stepId], status: 'active', output: fullResponse }}));
    };

    const onComplete = (finalResponse: string) => {
        addLog(`[${new Date().toLocaleTimeString()}] Step ${stepId} completed.`);
        setWorkflowState(prev => {
            const newState = { ...prev };
            newState[stepId] = { ...newState[stepId], status: 'completed', output: finalResponse };
            
            // Find the next step in the sequence
            const currentStepIndex = workflowData.steps.findIndex(s => s.id === stepId);
            if (currentStepIndex < workflowData.steps.length - 1) {
                const nextStepId = workflowData.steps[currentStepIndex + 1].id;
                 if (newState[nextStepId]?.status === 'pending') {
                   newState[nextStepId] = { ...newState[nextStepId], status: 'active' };
                 }
            }
            return newState;
        });
        setIsExecutingStepId(null);
    };

    const onError = (error: string) => {
        addLog(`[${new Date().toLocaleTimeString()}] Error on step ${stepId}: ${error}`);
        setWorkflowState(prev => ({ ...prev, [stepId]: { ...prev[stepId], status: 'error', error: error }}));
        setIsExecutingStepId(null);
    };

    const stepExecutionSettings: PromptSettings = {
        ...initialSettings,
        systemInstruction: agentSystemInstruction,
    };

    streamGenerateContent(finalPrompt, '', '', [], stepExecutionSettings, onChunk, onComplete, onError, aiSupervisorInstruction);

  }, [workflowData, workflowState, initialSettings, addLog, aiSupervisorInstruction]);


  return (
    <div className="flex w-full h-full">
      <div className="w-1/2 flex flex-col p-4 border-r border-white/10">
        <h2 className="text-lg font-bold text-fuchsia-400 mb-3 flex items-center gap-2">
           {React.cloneElement(ICONS.WORKFLOW, { className: 'h-6 w-6' })}
          Workflow Definition
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Define the high-level goal for the AI multi-agent system. The AI architect ('ANDIE') will generate a detailed execution plan in YAML format based on your instructions.
        </p>
        <div className="flex-grow flex flex-col bg-white/5 border border-white/20 rounded-2xl">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the workflow you want the AI agents to execute..."
            className="w-full h-full p-4 bg-transparent rounded-t-2xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-mono text-sm resize-none"
            aria-label="Workflow Definition Prompt"
          />
           <div className="p-2 border-t border-white/20 bg-black/20 rounded-b-2xl">
             <p className="text-xs text-gray-400 font-mono">System Persona: {systemOrchestratorInstruction}</p>
           </div>
        </div>
        <Button onClick={handleGeneratePlan} disabled={isLoading} className="w-full mt-4" size="lg">
            {isLoading ? React.cloneElement(ICONS.SPINNER, {className: 'mr-2 h-5 w-5'}) : null}
            {isLoading ? 'Generating Plan...' : 'Generate Execution Plan'}
        </Button>
      </div>
      <div className="w-1/2 flex flex-col p-4 overflow-y-auto right-pane-scroller">
        <h2 className="text-lg font-bold text-fuchsia-400 mb-3">Generated Execution Plan</h2>
        {isLoading && !generatedPlan ? (
            <div className="flex items-center text-gray-500 h-full justify-center">
                {React.cloneElement(ICONS.SPINNER, {className: "mr-2 h-5 w-5"})}
                Awaiting AI response...
            </div>
        ) : generatedPlan ? (
             <WorkflowVisualizer 
                yamlString={generatedPlan} 
                onWorkflowParsed={handleWorkflowParsed}
                workflowState={workflowState}
                isExecutingStepId={isExecutingStepId}
                onExecuteStep={handleExecuteStep}
              />
        ) : (
            <div className="flex items-center text-gray-500 h-full justify-center">
                <p>Generated workflow will appear here...</p>
            </div>
        )}
      </div>
    </div>
  );
};