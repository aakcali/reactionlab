import { ReactionCondition } from "./types";

export const DEFAULT_CONDITIONS: ReactionCondition = {
  temperature: 25,
  concentration: 'medium',
  solvent: 'Water (H2O)',
  catalyst: false
};

export const EXAMPLE_REACTIONS = [
  { name: "Water Formation", reactants: ["Hydrogen (H2)", "Oxygen (O2)"], type: "Synthesis" },
  { name: "Neutralization", reactants: ["HCl", "NaOH"], type: "Acid-Base" },
  { name: "Combustion", reactants: ["Methane (CH4)", "Oxygen (O2)"], type: "Redox" },
  { name: "Esterification", reactants: ["Acetic Acid", "Ethanol"], type: "Condensation" },
];

export const SOLVENT_OPTIONS = [
  "Water (H2O)",
  "Ethanol (EtOH)",
  "Acetone",
  "Dichloromethane (DCM)",
  "Hexane",
  "None (Gas Phase)"
];
