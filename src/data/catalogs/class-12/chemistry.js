export const CHEMISTRY_CLASS_12 = {
  classId: 'class-12',
  classLabel: 'Class XII',
  subject: 'Chemistry',
  board: 'CBSE / NCERT',
  chapters: [
    // ── Chapter 1: Solutions ─────────────────────────────────────
    {
      id: 'ch1',
      number: 1,
      title: 'Solutions',
      topics: [
        {
          id: 'ch1-t1',
          title: 'Types of Solutions and Concentration',
          duration: '15 min',
          difficulty: 'foundation',
          learningObjectives: [
            'Define different types of solutions',
            'Calculate molarity, molality, and mole fraction',
            'Understand the effect of temperature on concentration terms'
          ],
          mcq: [
            { id: 'ch1-t1-mcq1', text: 'Which of the following concentration terms is independent of temperature?', options: ['Molarity', 'Molality', 'Normality', 'Formality'], correctIndex: 1, explanation: 'Molality involves only masses (moles of solute per kg of solvent), whereas volume changes with temperature.' }
          ],
          numerical: [
            { id: 'ch1-t1-num1', text: 'Calculate the molality of 2.5g of ethanoic acid (CH3COOH) in 75g of benzene.', answer: 0.556, unit: 'mol/kg', solution: 'Molar mass of CH3COOH = 60g/mol. Moles = 2.5/60 = 0.0417 mol. Molality = 0.0417 / 0.075 kg = 0.556 mol/kg.', hint: 'Find moles of solute, then divide by mass of solvent in kg.' }
          ],
          questions: [
            { id: 'ch1-t1-q1', text: 'Why is molality preferred over molarity for expressing the concentration of a solution in thermodynamic studies?', hint: 'Think about how temperature affects liquids.', expectedConcepts: ['temperature independent', 'mass does not change', 'volume changes with temperature'], estimatedTime: '3 min' }
          ],
          misconceptions: [
            { id: 'ch1-t1-m1', probe: 'If you heat a 1M aqueous solution, does its molarity stay the same?', options: ['Yes, the amount of solute is unchanged', 'No, the volume of the solution expands, decreasing molarity'], correctIndex: 1, correction: 'Heating causes the liquid solvent to expand, increasing the total volume. Since Molarity = Moles / Volume, the molarity decreases.', detectKeywords: ['stays the same', 'unchanged', 'mass is constant'] }
          ]
        },
        {
          id: 'ch1-t2',
          title: "Henry's Law and Solubility",
          duration: '12 min',
          difficulty: 'core',
          learningObjectives: [
            'Explain the solubility of a gas in a liquid',
            'State Henry\'s law and its applications'
          ],
          mcq: [
            { id: 'ch1-t2-mcq1', text: 'Henry\'s law constant KH is larger for a gas. This means:', options: ['Gas is more soluble', 'Gas is less soluble', 'Solubility is unaffected', 'Temperature is higher'], correctIndex: 1, explanation: 'Higher KH means lower solubility at the same pressure (p = KH·χ).' }
          ],
          numerical: [
            { id: 'ch1-t2-num1', text: 'At 298K, Henry\'s law constant for CO₂ is 1.67×10⁸ Pa. Calculate mole fraction of CO₂ in water at 2.5 atm.', answer: 0.00000152, unit: 'mol fraction', solution: 'p = KH·χ → χ = p/KH. 2.5 atm = 2.5 × 101325 Pa. χ = 253312.5 / 1.67×10⁸ = 1.52×10⁻⁶', hint: 'Convert atm to Pa, then use χ = p/KH' }
          ],
          questions: [
            { id: 'ch1-t2-q1', text: 'Why does a bottle of cold soft drink fizz more than a warm one when opened? Explain using Henry\'s law.', hint: 'Consider how temperature affects the solubility of gases.', expectedConcepts: ['solubility decreases with temperature', 'pressure drops on opening', 'CO2 escapes'], estimatedTime: '4 min' }
          ],
          misconceptions: [
            { id: 'ch1-t2-m1', probe: 'Henry\'s law applies perfectly to all gases dissolving in water. True?', options: ['True — it is a universal law', 'False — it fails for gases that react with the solvent (like NH3)'], correctIndex: 1, correction: 'Henry\'s law is a limiting law. Gases like NH₃ or HCl that react or dissociate in water do not strictly obey Henry\'s law.', detectKeywords: ['universal law', 'perfectly applies'] }
          ]
        },
        {
          id: 'ch1-t3',
          title: "Raoult's Law and Ideal Solutions",
          duration: '18 min',
          difficulty: 'advanced',
          learningObjectives: [
            'Define vapor pressure of liquid solutions',
            'State Raoult\'s law for volatile solutes',
            'Distinguish between ideal and non-ideal solutions'
          ],
          mcq: [
            { id: 'ch1-t3-mcq1', text: 'An ideal solution is formed when its components:', options: ['Have no volume change on mixing', 'Have no enthalpy change on mixing', 'Both A and B', 'Form azeotropes'], correctIndex: 2, explanation: 'For an ideal solution, ΔH_mix = 0 and ΔV_mix = 0.' }
          ],
          questions: [
            { id: 'ch1-t3-q1', text: 'Explain the molecular basis for a positive deviation from Raoult\'s law using a mixture of ethanol and acetone as an example.', hint: 'Think about hydrogen bonding.', expectedConcepts: ['A-B interactions weaker than A-A or B-B', 'acetone breaks hydrogen bonds', 'higher vapor pressure'], estimatedTime: '5 min' }
          ],
          misconceptions: [
            { id: 'ch1-t3-m1', probe: 'If two liquids mix to form a warm solution, they show positive deviation from Raoult\'s law. True?', options: ['True — heat release means positive deviation', 'False — heat release (exothermic) means stronger interactions, so it is negative deviation'], correctIndex: 1, correction: 'A warm solution means ΔH_mix is negative (exothermic). Stronger A-B interactions lead to lower vapor pressure, which is a negative deviation.', detectKeywords: ['heat means positive', 'warm means positive'] }
          ]
        }
      ]
    },
    // ── Chapter 2: Electrochemistry ─────────────────────────────────────
    {
      id: 'ch2',
      number: 2,
      title: 'Electrochemistry',
      topics: [
        {
          id: 'ch2-t1',
          title: 'Galvanic Cells and Nernst Equation',
          duration: '20 min',
          difficulty: 'advanced',
          learningObjectives: [
            'Construct galvanic cells and calculate standard EMF',
            'Apply Nernst equation to non-standard conditions',
            'Relate cell potential to Gibbs free energy'
          ],
          numerical: [
            { id: 'ch2-t1-num1', text: 'Calculate the EMF of the cell at 298K: Mg(s) | Mg²⁺(0.130M) || Ag⁺(0.0001M) | Ag(s). Given E°_cell = 3.17V.', answer: 2.96, unit: 'V', solution: 'E = E° - (0.059/n)log(Q). n=2, Q = [Mg²⁺]/[Ag⁺]² = 0.130 / (10⁻⁴)² = 1.3×10⁷. E = 3.17 - (0.059/2)log(1.3×10⁷) = 3.17 - 0.21 = 2.96V', hint: 'Use Nernst equation with n=2 and Q=[Mg²⁺]/[Ag⁺]²' }
          ],
          questions: [
            { id: 'ch2-t1-q1', text: 'Why does the voltage of a galvanic cell drop to zero over time?', hint: 'Think about the concentration of reactants and products.', expectedConcepts: ['reaches equilibrium', 'reaction quotient Q equals K', 'E_cell becomes zero'], estimatedTime: '4 min' }
          ],
          misconceptions: [
            { id: 'ch2-t1-m1', probe: 'In a galvanic cell, the anode is positive and the cathode is negative. True?', options: ['True', 'False — anode is negative (oxidation) and cathode is positive (reduction)'], correctIndex: 1, correction: 'In a galvanic cell, oxidation occurs at the anode, leaving electrons behind, making it the negative terminal.', detectKeywords: ['anode is positive', 'cathode is negative'] }
          ]
        },
        {
          id: 'ch2-t2',
          title: 'Conductance of Electrolytic Solutions',
          duration: '15 min',
          difficulty: 'core',
          learningObjectives: [
            'Define specific, equivalent, and molar conductivity',
            'Explain Kohlrausch\'s law of independent migration of ions'
          ],
          mcq: [
            { id: 'ch2-t2-mcq1', text: 'Upon dilution, the specific conductivity (κ) of an electrolytic solution:', options: ['Increases', 'Decreases', 'Remains constant', 'First increases then decreases'], correctIndex: 1, explanation: 'Specific conductivity decreases because the number of current-carrying ions per unit volume decreases upon dilution.' }
          ],
          questions: [
            { id: 'ch2-t2-q1', text: 'Explain Kohlrausch\'s law of independent migration of ions. How is it useful for weak electrolytes?', hint: 'Weak electrolytes do not fully dissociate at high concentrations.', expectedConcepts: ['limiting molar conductivity', 'sum of ionic conductivities', 'cannot extrapolate for weak electrolytes', 'calculate using strong electrolytes'], estimatedTime: '4 min' }
          ],
          misconceptions: [
            { id: 'ch2-t2-m1', probe: 'Does molar conductivity decrease upon dilution like specific conductivity?', options: ['Yes, they both decrease', 'No, molar conductivity INCREASES upon dilution'], correctIndex: 1, correction: 'While specific conductivity decreases, molar conductivity increases with dilution because the total volume V containing one mole of electrolyte increases much faster than the drop in κ.', detectKeywords: ['both decrease', 'molar conductivity decreases'] }
          ]
        }
      ]
    },
    // ── Chapter 3: Chemical Kinetics ─────────────────────────────────────
    {
      id: 'ch3',
      number: 3,
      title: 'Chemical Kinetics',
      topics: [
        {
          id: 'ch3-t1',
          title: 'Rate of Reaction and Rate Law',
          duration: '15 min',
          difficulty: 'foundation',
          learningObjectives: [
            'Define average and instantaneous rate of reaction',
            'Write rate law and determine order of reaction'
          ],
          mcq: [
            { id: 'ch3-t1-mcq1', text: 'The unit of rate constant for a zero-order reaction is:', options: ['s⁻¹', 'mol L⁻¹ s⁻¹', 'L mol⁻¹ s⁻¹', 'L² mol⁻² s⁻¹'], correctIndex: 1, explanation: 'For zero order, Rate = k[A]⁰ = k. The unit of k is same as rate: mol L⁻¹ s⁻¹.' }
          ],
          questions: [
            { id: 'ch3-t1-q1', text: 'Distinguish between the order and molecularity of a reaction.', hint: 'One is theoretical, one is experimental.', expectedConcepts: ['order is experimental sum of powers', 'molecularity is theoretical number of colliding species', 'order can be fractional/zero', 'molecularity must be integer > 0'], estimatedTime: '4 min' }
          ],
          misconceptions: [
            { id: 'ch3-t1-m1', probe: 'You can always determine the rate law simply by looking at the balanced stoichiometric equation. True?', options: ['True — coefficients become exponents', 'False — rate law must be determined experimentally'], correctIndex: 1, correction: 'The rate law is determined experimentally. The exponents in the rate law only match stoichiometric coefficients if the reaction is an elementary (single-step) reaction.', detectKeywords: ['always looking at equation', 'coefficients are exponents'] }
          ]
        },
        {
          id: 'ch3-t2',
          title: 'Integrated Rate Equations and Half-Life',
          duration: '18 min',
          difficulty: 'advanced',
          learningObjectives: [
            'Derive integrated rate equations for zero and first order',
            'Calculate half-life of reactions'
          ],
          numerical: [
            { id: 'ch3-t2-num1', text: 'A first-order reaction has a rate constant of 1.15×10⁻³ s⁻¹. How long will 5g of this reactant take to reduce to 3g?', answer: 444, unit: 's', solution: 't = (2.303/k)log([A]0/[A]) = (2.303 / 1.15×10⁻³) * log(5/3) = 2000 * 0.2218 = 444 s', hint: 'Use t = (2.303/k)log([R]₀/[R])' }
          ],
          questions: [
            { id: 'ch3-t2-q1', text: 'Show that the half-life of a first-order reaction is independent of the initial concentration of reactants.', hint: 'Use the integrated rate equation and substitute [A] = [A]0/2.', expectedConcepts: ['t = (2.303/k)log2', 't1/2 = 0.693/k', 'no concentration term in equation'], estimatedTime: '3 min' }
          ],
          misconceptions: [
            { id: 'ch3-t2-m1', probe: 'For a zero-order reaction, the half-life is constant regardless of how much reactant you start with. True?', options: ['True — half-life is constant for zero order', 'False — half-life is proportional to initial concentration for zero order'], correctIndex: 1, correction: 'For a zero-order reaction, t1/2 = [A]0 / 2k. It depends on the initial concentration. It is only first-order reactions where half-life is constant.', detectKeywords: ['constant for zero order', 'independent for zero order'] }
          ]
        }
      ]
    },
    // Scaffolding remaining chapters to avoid token limits
    { id: 'ch4', number: 4, title: 'Surface Chemistry', topics: [] },
    { id: 'ch5', number: 5, title: 'General Principles of Extraction', topics: [] },
    { id: 'ch6', number: 6, title: 'The p-Block Elements', topics: [] },
    { id: 'ch7', number: 7, title: 'The d- and f-Block Elements', topics: [] },
    { id: 'ch8', number: 8, title: 'Coordination Compounds', topics: [] },
    { id: 'ch9', number: 9, title: 'Haloalkanes and Haloarenes', topics: [] },
    { id: 'ch10', number: 10, title: 'Alcohols, Phenols and Ethers', topics: [] },
    { id: 'ch11', number: 11, title: 'Aldehydes, Ketones and Carboxylic Acids', topics: [] },
    { id: 'ch12', number: 12, title: 'Amines', topics: [] },
    { id: 'ch13', number: 13, title: 'Biomolecules', topics: [] },
    { id: 'ch14', number: 14, title: 'Polymers', topics: [] },
    { id: 'ch15', number: 15, title: 'Chemistry in Everyday Life', topics: [] }
  ]
}
