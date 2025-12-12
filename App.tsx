import React, { useState, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { SimulationStage } from './components/SimulationStage';
import { ReactionCondition, ReactionAnalysis, SimulationState } from './types';
import { DEFAULT_CONDITIONS } from './constants';
import { analyzeReaction } from './services/geminiService';

export default function App() {
  const [reactants, setReactants] = useState<string[]>(["", ""]);
  const [conditions, setConditions] = useState<ReactionCondition>(DEFAULT_CONDITIONS);
  
  const [simulationState, setSimulationState] = useState<SimulationState>(SimulationState.IDLE);
  const [analysis, setAnalysis] = useState<ReactionAnalysis | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Analysis Logic
  const handleAnalyze = async () => {
    setSimulationState(SimulationState.ANALYZING);
    // Filter out empty strings
    const validReactants = reactants.filter(r => r.trim().length > 0);
    const result = await analyzeReaction(validReactants, conditions);
    setAnalysis(result);
    setSimulationState(SimulationState.READY);
    setCurrentStepIndex(0);
  };

  // Simulation Start Logic
  const handleSimulate = () => {
    setSimulationState(SimulationState.PLAYING);
    setCurrentStepIndex(0);
  };

  // Playback Loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (simulationState === SimulationState.PLAYING && analysis?.canReact) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (!analysis.reactionSteps) return prev;
          
          if (prev < analysis.reactionSteps.length - 1) {
            return prev + 1;
          } else {
            setSimulationState(SimulationState.FINISHED);
            return prev;
          }
        });
      }, 2500); // 2.5 seconds per step
    }

    return () => clearInterval(interval);
  }, [simulationState, analysis]);

  const togglePlayPause = () => {
    if (simulationState === SimulationState.PLAYING) {
      setSimulationState(SimulationState.PAUSED);
    } else if (simulationState === SimulationState.PAUSED || simulationState === SimulationState.READY) {
      setSimulationState(SimulationState.PLAYING);
    } else if (simulationState === SimulationState.FINISHED) {
      setCurrentStepIndex(0);
      setSimulationState(SimulationState.PLAYING);
    }
  };

  const handleReset = () => {
    setSimulationState(SimulationState.IDLE);
    setAnalysis(null);
    setCurrentStepIndex(0);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-lab-dark text-slate-100 font-sans">
      
      {/* Left Panel: 35% width on desktop */}
      <div className="w-full md:w-[400px] lg:w-[450px] flex-shrink-0 z-20 shadow-2xl">
        <ControlPanel 
          reactants={reactants} setReactants={setReactants}
          conditions={conditions} setConditions={setConditions}
          onAnalyze={handleAnalyze}
          onSimulate={handleSimulate}
          simulationState={simulationState}
          analysis={analysis}
          onReset={handleReset}
        />
      </div>

      {/* Right Panel: Visualization */}
      <div className="flex-1 flex flex-col min-w-0">
        <SimulationStage 
          simulationState={simulationState}
          reactionSteps={analysis?.reactionSteps || []}
          currentStepIndex={currentStepIndex}
          onStepChange={(idx) => {
            setCurrentStepIndex(idx);
            setSimulationState(SimulationState.PAUSED);
          }}
          onPlayPause={togglePlayPause}
          products={analysis?.products || []}
        />
      </div>
    </div>
  );
}
