import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceDot } from 'recharts';
import { ReactionStep } from '../types';

interface EnergyDiagramProps {
  steps: ReactionStep[];
  currentStepIndex: number;
  progress: number; // 0 to 1 overall
}

export const EnergyDiagram: React.FC<EnergyDiagramProps> = ({ steps, currentStepIndex }) => {
  if (!steps || steps.length === 0) return null;

  // Transform steps into coordinate points for the chart.
  // We add intermediate points to create curves.
  const data = steps.map((step, index) => ({
    name: step.name,
    step: index,
    energy: step.energyLevel,
    desc: step.description
  }));

  // Determine current active point
  const activePoint = data[currentStepIndex] || data[0];

  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-bold">Reaction Coordinate</h3>
      <div className="flex-1 w-full min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              hide={true} 
            />
            <YAxis hide={true} domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
              itemStyle={{ color: '#38bdf8' }}
              labelStyle={{ display: 'none' }}
              formatter={(value: number) => [`${value} kJ/mol (relative)`, 'Energy']}
            />
            <Area 
              type="monotone" 
              dataKey="energy" 
              stroke="#38bdf8" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorEnergy)" 
              animationDuration={1000}
            />
            <ReferenceDot 
              x={activePoint.name} 
              y={activePoint.energy} 
              r={6} 
              fill="#fff" 
              stroke="#38bdf8"
              strokeWidth={2}
            >
             <animate attributeName="r" from="6" to="10" dur="1s" repeatCount="indefinite" />
            </ReferenceDot>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-xs text-slate-400 border-t border-slate-800 pt-2">
        <span className="font-bold text-white">Current State: </span> 
        {activePoint.desc}
      </div>
    </div>
  );
};
