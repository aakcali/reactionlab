import { GoogleGenAI, Type } from "@google/genai";
import { ReactionAnalysis, ChemicalSpecies, ReactionCondition } from "../types";

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Identifies a molecule from an image string (base64).
 */
export const identifyMoleculeFromImage = async (base64Data: string): Promise<ChemicalSpecies> => {
  const ai = getClient();
  
  const prompt = "Identify the chemical structure in this image. Return the common name and chemical formula.";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            formula: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["name", "formula"],
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as ChemicalSpecies;
  } catch (error) {
    console.error("Error identifying molecule:", error);
    return { name: "Unknown", formula: "???" };
  }
};

/**
 * Analyzes the potential reaction between multiple reactants under specific conditions.
 */
export const analyzeReaction = async (
  reactants: string[],
  conditions: ReactionCondition
): Promise<ReactionAnalysis> => {
  const ai = getClient();

  const reactantsStr = reactants.filter(r => r.trim() !== "").join('", "');
  
  const prompt = `
    Analyze the chemical reaction between these reactants: ["${reactantsStr}"].
    Conditions: 
    - Temperature: ${conditions.temperature}°C
    - Concentration: ${conditions.concentration}
    - Solvent: ${conditions.solvent}
    - Catalyst: ${conditions.catalyst ? 'Present' : 'Absent'}

    Determine if a reaction occurs. If yes, describe the mechanism, steps, and energy profile.
    
    CRITICAL: You must provide a "visualScene" for each step. 
    The "visualScene" is a list of atoms/particles/ions to display.
    - Each item needs an x, y coordinate (range -150 to 150).
    - Represent the actual stoichiometry. E.g. for 2H2 + O2 -> 2H2O, show 4 H atoms and 2 O atoms moving.
    - LABEL ions specifically if they form (e.g. "H+", "Cl-", "O-2").
    - Use the 'bonds' array to list IDs of atoms connected to the current atom.
    - Use distinct colors for different elements (H=white/blue, O=red, C=grey/black, Cl=green, Na=purple).

    Return a structured JSON. 
  `;

  // Schema definition
  const schema = {
    type: Type.OBJECT,
    properties: {
      canReact: { type: Type.BOOLEAN },
      reactionType: { type: Type.STRING },
      equation: { type: Type.STRING },
      explanation: { type: Type.STRING },
      exothermic: { type: Type.BOOLEAN },
      activationEnergyDescription: { type: Type.STRING },
      products: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            formula: { type: Type.STRING }
          }
        }
      },
      reactionSteps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            stepNumber: { type: Type.INTEGER },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            energyLevel: { type: Type.INTEGER },
            visualState: { type: Type.STRING, enum: ['approach', 'collision', 'transition', 'product_formation', 'stabilization'] },
            visualScene: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  color: { type: Type.STRING },
                  r: { type: Type.NUMBER },
                  bonds: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["id", "label", "x", "y", "color", "r"]
              }
            },
            moleculesState: {
              type: Type.OBJECT,
              properties: {
                distance: { type: Type.NUMBER },
                vibration: { type: Type.NUMBER },
                glow: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as ReactionAnalysis;
  } catch (error) {
    console.error("Reaction analysis failed:", error);
    return {
      canReact: false,
      reactionType: "Error",
      equation: "",
      explanation: "Unable to analyze reaction at this time. Please check your inputs.",
      reactionSteps: [],
      products: [],
      exothermic: false,
      activationEnergyDescription: ""
    };
  }
};
