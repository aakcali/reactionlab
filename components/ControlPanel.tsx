import React, { useState, useRef } from 'react';
import { Beaker, Upload, Play, RefreshCw, BookOpen, Flame, Zap, Droplets, Microscope, Plus, Trash2, Loader2 } from 'lucide-react';
import { ReactionCondition, ReactionAnalysis, SimulationState } from '../types';
import { EXAMPLE_REACTIONS, SOLVENT_OPTIONS } from '../constants';
import { identifyMoleculeFromImage } from '../services/geminiService';

interface ControlPanelProps {
  reactants: string[];
  setReactants: (val: string[]) => void;
  conditions: ReactionCondition;
  setConditions: (val: ReactionCondition) => void;
  onAnalyze: () => void;
  onSimulate: () => void;
  simulationState: SimulationState;
  analysis: ReactionAnalysis | null;
  onReset: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  reactants, setReactants, conditions, setConditions,
  onAnalyze, onSimulate, simulationState, analysis, onReset
}) => {
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [uploadingState, setUploadingState] = useState<Record<number, boolean>>({});

  const handleReactantChange = (index: number, value: string) => {
    const newReactants = [...reactants];
    newReactants[index] = value;
    setReactants(newReactants);
  };

  const addReactant = () => {
    setReactants([...reactants, ""]);
  };

  const removeReactant = (index: number) => {
    const newReactants = reactants.filter((_, i) => i !== index);
    setReactants(newReactants);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingState(prev => ({ ...prev, [index]: true }));

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const species = await identifyMoleculeFromImage(base64);
        handleReactantChange(index, species.name);
      } catch (error) {
        console.error("Failed to identify molecule", error);
      } finally {
        setUploadingState(prev => ({ ...prev, [index]: false }));
        // Reset input value so the same file can be selected again if needed
        if (fileInputRefs.current[index]) {
          fileInputRefs.current[index].value = '';
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const isAnalyzing = simulationState === SimulationState.ANALYZING;
  const isPlaying = simulationState === SimulationState.PLAYING;

  return (
    <div className="h-full flex flex-col bg-lab-panel border-r border-slate-700 text-slate-300 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-6 border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Beaker className="text-lab-accent" />
          <span>ReactionLab</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">AI-Powered Chemical Simulation</p>
      </div>

      <div className="p-6 space-y-8 flex-1">
        
        {/* Input Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-lab-accent uppercase tracking-wider flex items-center gap-2">
            <Microscope size={16} /> Input Molecules
          </h2>
          
          <div className="space-y-3">
            {reactants.map((reactant, index) => (
              <div key={index} className="space-y-1 animate-fade-in">
                <label className="text-xs font-medium text-slate-400 flex justify-between">
                  <span>Molecule {index + 1}</span>
                  {reactants.length > 2 && (
                    <button onClick={() => removeReactant(index)} className="text-red-400 hover:text-red-300">
                      <Trash2 size={12} />
                    </button>
                  )}
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={reactant}
                    onChange={(e) => handleReactantChange(index, e.target.value)}
                    placeholder={`Reactant ${index + 1}`}
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-lab-accent outline-none placeholder:text-slate-600"
                  />
                  <input 
                    type="file" 
                    ref={el => { fileInputRefs.current[index] = el; }}
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(e, index)}
                  />
                  <button 
                    onClick={() => fileInputRefs.current[index]?.click()}
                    disabled={uploadingState[index]}
                    className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-md transition-colors"
                    title="Upload Structure Image"
                  >
                    {uploadingState[index] ? (
                      <Loader2 size={18} className="animate-spin text-lab-accent" />
                    ) : (
                      <Upload size={18} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={addReactant}
            className="w-full py-3 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-lab-accent hover:border-lab-accent hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <Plus size={16} /> Add Another Component
          </button>

          {/* Example Loader */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-700/50">
            {EXAMPLE_REACTIONS.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => setReactants([...ex.reactants])}
                className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-full text-slate-400 hover:text-white transition-colors border border-slate-700"
              >
                {ex.name}
              </button>
            ))}
          </div>
        </section>

        {/* Conditions Section */}
        <section className="space-y-4 border-t border-slate-700 pt-6">
          <h2 className="text-sm font-semibold text-lab-accent uppercase tracking-wider flex items-center gap-2">
            <Flame size={16} /> Reaction Conditions
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Temperature ({conditions.temperature}°C)</label>
              <input 
                type="range" 
                min="0" max="300" step="5"
                value={conditions.temperature}
                onChange={(e) => setConditions({...conditions, temperature: Number(e.target.value)})}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-lab-accent"
              />
            </div>
            
            <div>
              <label className="text-xs text-slate-400 block mb-1">Concentration</label>
              <div className="flex bg-slate-800 rounded-md p-0.5">
                {['low', 'medium', 'high'].map((c) => (
                   <button
                    key={c}
                    onClick={() => setConditions({...conditions, concentration: c as any})}
                    className={`flex-1 text-[10px] uppercase py-1 rounded-sm transition-colors ${conditions.concentration === c ? 'bg-lab-accent text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
             <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1"><Droplets size={12}/> Solvent</label>
             <select 
              value={conditions.solvent}
              onChange={(e) => setConditions({...conditions, solvent: e.target.value})}
              className="w-full bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 text-sm text-white focus:ring-2 focus:ring-lab-accent outline-none"
             >
               {SOLVENT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button
               onClick={() => setConditions({...conditions, catalyst: !conditions.catalyst})}
               className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-all border ${conditions.catalyst ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-slate-800 border-slate-600 text-slate-400'}`}
            >
              <Zap size={16} /> Catalyst {conditions.catalyst ? 'Added' : 'None'}
            </button>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="border-t border-slate-700 pt-6">
           {!analysis ? (
             <button
               onClick={onAnalyze}
               disabled={reactants.some(r => !r) || isAnalyzing}
               className="w-full bg-lab-accent hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-3 rounded-lg shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
             >
               {isAnalyzing ? <RefreshCw className="animate-spin" /> : <Microscope />}
               {isAnalyzing ? 'Analyzing Potential...' : 'Analyze Reaction'}
             </button>
           ) : (
             <div className="space-y-3">
               <div className={`p-4 rounded-lg border ${analysis.canReact ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <h3 className={`font-bold flex items-center gap-2 ${analysis.canReact ? 'text-green-400' : 'text-red-400'}`}>
                    {analysis.canReact ? 'Reaction Feasible' : 'No Reaction Predicted'}
                  </h3>
                  <p className="text-xs mt-1 text-slate-300">{analysis.explanation}</p>
               </div>

               {analysis.canReact && (
                 <button
                   onClick={onSimulate}
                   disabled={isPlaying}
                   className="w-full bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3 rounded-lg shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                 >
                   <Play fill="currentColor" />
                   {isPlaying ? 'Simulating...' : 'Start Simulation'}
                 </button>
               )}
               
               <button onClick={onReset} className="w-full text-slate-400 text-xs hover:text-white underline">Reset Analysis</button>
             </div>
           )}
        </section>

        {/* Educational Content */}
        {analysis && analysis.canReact && (
          <section className="border-t border-slate-700 pt-6 space-y-4">
            <h2 className="text-sm font-semibold text-lab-accent uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={16} /> Learning Mode
            </h2>
            
            <div className="space-y-3 text-sm">
              <div className="bg-slate-800 p-3 rounded-md">
                <span className="text-xs text-slate-400 uppercase font-bold">Reaction Type</span>
                <p className="text-white font-medium">{analysis.reactionType}</p>
              </div>
              
              <div className="bg-slate-800 p-3 rounded-md">
                <span className="text-xs text-slate-400 uppercase font-bold">Equation</span>
                <p className="font-mono text-xs text-sky-300 mt-1">{analysis.equation}</p>
              </div>

               <div className="bg-slate-800 p-3 rounded-md">
                <span className="text-xs text-slate-400 uppercase font-bold">Thermodynamics</span>
                <p className="text-slate-300 mt-1">
                  {analysis.exothermic ? 'Exothermic (Releases Energy)' : 'Endothermic (Absorbs Energy)'}
                </p>
                 <p className="text-xs text-slate-500 mt-1">{analysis.activationEnergyDescription}</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
