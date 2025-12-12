export interface ChemicalSpecies {
  name: string;
  formula: string;
  description?: string;
  color?: string; // Hex code for visualization
}

export interface ReactionCondition {
  temperature: number; // Celsius
  concentration: 'low' | 'medium' | 'high';
  solvent: string;
  catalyst: boolean;
}

export interface VisualItem {
  id: string; // Unique ID for tracking animation
  label: string; // Text to display (e.g. "H", "O", "H2O", "H+")
  x: number; // -100 to 100 coordinates
  y: number; // -100 to 100 coordinates
  color: string; // Hex
  r: number; // Radius/Size
  bonds: string[]; // IDs of other items this is bonded to
}

export interface ReactionStep {
  stepNumber: number;
  name: string;
  description: string;
  energyLevel: number; // 0-100 relative scale
  visualState: 'approach' | 'collision' | 'transition' | 'product_formation' | 'stabilization';
  visualScene: VisualItem[]; // Detailed visualization data
  moleculesState: {
    distance: number; // 0-1 (1 is far, 0 is merged)
    vibration: number; // 0-1 intensity
    glow: number; // 0-1 intensity
  };
}

export interface ReactionAnalysis {
  canReact: boolean;
  reactionType: string;
  equation: string;
  explanation: string;
  reactionSteps: ReactionStep[];
  products: ChemicalSpecies[];
  exothermic: boolean;
  activationEnergyDescription: string;
}

export enum SimulationState {
  IDLE,
  ANALYZING,
  READY,
  PLAYING,
  PAUSED,
  FINISHED
}
