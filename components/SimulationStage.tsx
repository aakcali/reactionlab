import React, { useEffect, useState } from 'react';
import { ReactionStep, SimulationState, ChemicalSpecies, VisualItem } from '../types';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { EnergyDiagram } from './EnergyDiagram';

interface SimulationStageProps {
  simulationState: SimulationState;
  reactionSteps: ReactionStep[];
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  onPlayPause: () => void;
  products: ChemicalSpecies[];
}

export const SimulationStage: React.FC<SimulationStageProps> = ({
  simulationState,
  reactionSteps,
  currentStepIndex,
  onStepChange,
  onPlayPause,
  products
}) => {
  const currentStep = reactionSteps[currentStepIndex];
  
  // State to drive the animation frame loop
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    let animationId: number;
    if (simulationState === SimulationState.PLAYING) {
      const animate = () => {
        setFrame(f => f + 1);
        animationId = requestAnimationFrame(animate);
      };
      animationId = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationId);
  }, [simulationState]);


  if (simulationState === SimulationState.IDLE || simulationState === SimulationState.ANALYZING) {
    return (
      <div className="flex-1 bg-lab-dark relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/20 via-lab-dark to-lab-dark"></div>
        <div className="text-center space-y-4 relative z-10 p-8 max-w-lg">
           {simulationState === SimulationState.ANALYZING ? (
             <div className="flex flex-col items-center">
               <div className="w-16 h-16 border-4 border-lab-accent border-t-transparent rounded-full animate-spin mb-4"></div>
               <h2 className="text-2xl font-bold text-white">Analyzing Reaction Kinetics...</h2>
               <p className="text-slate-400">Calculating transition states and activation energies.</p>
             </div>
           ) : (
             <>
              <div className="inline-block p-4 rounded-full bg-slate-800 mb-4 animate-float">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                  <div className="w-8 h-8 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white">Virtual Reaction Lab</h2>
              <p className="text-lg text-slate-400">
                Enter multiple reactants in the left panel to begin. 
                Visualize bond formation and ionic states in real-time.
              </p>
             </>
           )}
        </div>
      </div>
    );
  }

  // --- RENDERING THE SIMULATION ---

  const glowIntensity = currentStep?.moleculesState?.glow || 0;
  const visualItems = currentStep?.visualScene || [];

  // Helper to find item by ID for bonds
  const getItem = (id: string) => visualItems.find(i => i.id === id);

  return (
    <div className="flex-1 bg-lab-dark flex flex-col relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(15,23,42,0)_0%,_#0f172a_100%)] z-10" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>
      </div>

      {/* Main Visual Canvas */}
      <div className="flex-1 relative flex items-center justify-center">
         <svg className="w-full h-full max-w-5xl max-h-[700px] overflow-visible" viewBox="-200 -150 400 300">
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={glowIntensity * 5 + 1} result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Render Bonds First */}
            {visualItems.map((item) => (
              item.bonds && item.bonds.map(targetId => {
                const target = getItem(targetId);
                if (target && item.id < target.id) { // Draw bond only once
                  return (
                    <line 
                      key={`${item.id}-${target.id}`}
                      x1={item.x} y1={item.y}
                      x2={target.x} y2={target.y}
                      stroke="#94a3b8"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-in-out"
                    />
                  );
                }
                return null;
              })
            ))}

            {/* Render Atoms/Particles */}
            {visualItems.map((item) => (
              <g 
                key={item.id} 
                style={{ 
                  transform: `translate(${item.x}px, ${item.y}px)`, 
                  transition: 'transform 1s ease-in-out' 
                }}
              >
                {/* Glow Effect if active */}
                {glowIntensity > 0.5 && (
                   <circle r={item.r * 1.5} fill={item.color} opacity="0.3" filter="url(#glow)" />
                )}
                
                {/* Atom Body */}
                <circle 
                  r={item.r} 
                  fill={item.color} 
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                  className="transition-all duration-500"
                />

                {/* Specular Highlight */}
                <circle cx={-item.r * 0.3} cy={-item.r * 0.3} r={item.r * 0.2} fill="white" opacity="0.4" />

                {/* Label (e.g., H, O, H+) */}
                <text 
                  y={item.r * 0.3} 
                  textAnchor="middle" 
                  fill={['#ffffff', '#f1f5f9'].includes(item.color.toLowerCase()) ? '#000' : '#fff'} 
                  style={{ fontSize: `${Math.max(10, item.r)}px`, fontWeight: 'bold', pointerEvents: 'none' }}
                >
                  {item.label}
                </text>
              </g>
            ))}

            {/* Fallback for no visual items */}
            {visualItems.length === 0 && (
              <text y="0" textAnchor="middle" fill="#475569" className="text-sm">
                Visualization not available for this step
              </text>
            )}

         </svg>
      </div>

      {/* Bottom Control Bar */}
      <div className="h-48 bg-slate-900/80 backdrop-blur-md border-t border-slate-700 flex">
        
        {/* Playback Controls */}
        <div className="w-1/3 border-r border-slate-700 p-6 flex flex-col justify-center gap-4">
          <div className="flex items-center justify-center gap-4">
             <button onClick={() => onStepChange(Math.max(0, currentStepIndex - 1))} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
               <SkipBack size={20} />
             </button>
             
             <button 
              onClick={onPlayPause}
              className="w-14 h-14 bg-lab-accent text-slate-900 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-sky-500/30"
            >
               {simulationState === SimulationState.PLAYING ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
             </button>
             
             <button onClick={() => onStepChange(Math.min(reactionSteps.length - 1, currentStepIndex + 1))} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
               <SkipForward size={20} />
             </button>
          </div>
          
          <div className="flex items-center gap-3 px-4">
             <span className="text-xs font-mono text-slate-500">STEP</span>
             <div className="flex-1 flex gap-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                {reactionSteps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 transition-colors ${i <= currentStepIndex ? 'bg-lab-accent' : 'bg-transparent'}`} 
                  />
                ))}
             </div>
             <span className="text-xs font-mono text-slate-300">{currentStepIndex + 1}/{reactionSteps.length}</span>
          </div>
        </div>

        {/* Energy Diagram Area */}
        <div className="flex-1 p-4 relative">
           <EnergyDiagram 
             steps={reactionSteps} 
             currentStepIndex={currentStepIndex} 
             progress={currentStepIndex / (reactionSteps.length - 1)} 
           />
        </div>
      </div>
    </div>
  );
};
