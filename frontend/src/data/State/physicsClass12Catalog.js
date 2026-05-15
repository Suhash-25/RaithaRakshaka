/**
 * Class 12 Physics — Full NCERT Content Catalog
 * All 14 chapters with questions and misconception probes.
 */
import { CHAPTERS_9_TO_14 } from './physicsChapters9to14'

export const PHYSICS_CLASS_12 = {
  classId: 'class-12',
  classLabel: 'Class XII',
  subject: 'Physics',
  board: 'CBSE / NCERT',
  chapters: [
    // ── Chapter 1 ─────────────────────────────────────
    {
      id: 'ch1',
      number: 1,
      title: "Electric Charges and Fields",
      topics: [
        {
          id: 'ch1-t1',
          title: "Electric Charge",
          duration: '12 min',
          difficulty: 'foundation',
          animationType: 'electricCharge',
          learningObjectives: [
            'Explain how electric charge is acquired through friction and contact',
            'Apply the law of conservation of charge to real-world scenarios',
            'Distinguish between conductors and insulators at the atomic level',
            'Describe quantization of charge and its implications',
          ],
          mcq: [
            { id: 'ch1-t1-mcq1', text: 'When a glass rod is rubbed with silk, the rod acquires:', options: ['Negative charge by gaining protons', 'Positive charge by losing electrons', 'Positive charge by gaining protons', 'Negative charge by gaining electrons'], correctIndex: 1, explanation: 'Silk pulls electrons from glass, leaving the rod with fewer electrons (net positive charge).' },
            { id: 'ch1-t1-mcq2', text: 'The minimum charge that can exist freely in nature is:', options: ['1 coulomb', '1.6 × 10⁻¹⁹ C', '1.6 × 10⁻²⁰ C', 'Charge can be any value'], correctIndex: 1, explanation: 'Charge is quantized in units of e = 1.6 × 10⁻¹⁹ C (electron/proton charge).' },
          ],
          numerical: [
            { id: 'ch1-t1-num1', text: 'A body has a charge of −3.2 × 10⁻¹⁸ C. How many excess electrons does it have?', answer: 20, unit: 'electrons', solution: 'n = Q/e = 3.2×10⁻¹⁸ / 1.6×10⁻¹⁹ = 20 electrons', hint: 'Use n = Q/e where e = 1.6 × 10⁻¹⁹ C' },
          ],
          questions: [
            {
              id: 'ch1-t1-q1',
              text: 'When a glass rod is rubbed with silk, the rod becomes positively charged. Where did the electrons go and why does the rod not gain electrons instead?',
              hint: 'Think about which material holds electrons more tightly.',
              expectedConcepts: ['electron transfer', 'silk gains electrons', 'conservation of charge'],
              estimatedTime: '3 min',
            },
            {
              id: 'ch1-t1-q2',
              text: 'If you charge a plastic comb by rubbing it with dry hair and bring it near tiny pieces of paper, the paper pieces first attract and then fly away. Explain why.',
              hint: 'Consider what happens after the paper touches the comb.',
              expectedConcepts: ['induction', 'contact charging', 'repulsion after acquiring same charge'],
              estimatedTime: '3 min',
            },
            {
              id: 'ch1-t1-q3',
              text: 'Is the total charge of the universe conserved when you charge a glass rod with silk? Justify with the principle involved.',
              hint: 'Add up all charges before and after rubbing.',
              expectedConcepts: ['conservation', 'total charge zero', 'transfer not creation'],
              estimatedTime: '2 min',
            },
          ],
          misconceptions: [
            {
              id: 'ch1-t1-m1',
              probe: 'Does rubbing CREATE new electric charge on the glass rod?',
              options: ['Yes, friction generates new charges', 'No, electrons transfer from one object to another'],
              correctIndex: 1,
              correction: 'Rubbing does not create charge. It transfers electrons from one surface to another. Total charge is always conserved.',
              detectKeywords: ['creates', 'generates', 'produces charge', 'makes charge'],
            },
            {
              id: 'ch1-t1-m2',
              probe: 'When a glass rod is positively charged, does it mean protons were added to it?',
              options: ['Yes, protons moved to the rod', 'No, electrons were removed from the rod'],
              correctIndex: 1,
              correction: 'Protons are tightly bound in the nucleus and do not transfer. Positive charging means loss of electrons.',
              detectKeywords: ['protons move', 'protons transfer', 'gained protons'],
            },
          ],
        },
        {
          id: 'ch1-t2',
          title: "Coulomb's Law",
          description: "Diving into Coulomb's Law within the context of Electric Charges and Fields offers students a fascinating look at the mechanisms that drive Physics. It is not just about memorizing facts, but about comprehending the underlying patterns that make up this field of study. Mastery of this area is essential for building a robust educational foundation.\n\nUnderstanding the core elements of Coulomb's Law requires focused attention on its primary characteristics within Electric Charges and Fields. Students engage in comprehensive learning that encompasses both theoretical definitions and practical implications. This structured learning pathway ensures a deep and lasting comprehension of the subject material.\n\nA real-world example of Coulomb's Law can be seen in everyday problem-solving scenarios. When faced with a challenge related to Electric Charges and Fields, applying the structured methods learned in this topic allows for quick and accurate resolutions, demonstrating the immense value of this knowledge.\n\nUltimately, the knowledge gained from studying Coulomb's Law serves as a lifelong intellectual asset. By thoroughly understanding Electric Charges and Fields, learners are well-prepared to tackle future academic challenges with resilience and competence.",
          duration: '15 min',
          difficulty: 'core',
          animationType: 'coulombsLaw',
          learningObjectives: [
            'State Coulomb\'s law and identify the variables involved',
            'Calculate electrostatic force between point charges',
            'Compare electrostatic and gravitational forces',
            'Explain the role of the medium (dielectric constant) on force',
          ],
          mcq: [
            { id: 'ch1-t2-mcq1', text: 'If the distance between two charges is tripled, the force between them becomes:', options: ['1/3 of the original', '1/9 of the original', '3 times the original', '9 times the original'], correctIndex: 1, explanation: 'F ∝ 1/r². Tripling r makes F = F₀/9.' },
            { id: 'ch1-t2-mcq2', text: 'The SI unit of electric charge is:', options: ['Volt', 'Ampere', 'Coulomb', 'Newton'], correctIndex: 2, explanation: 'The coulomb (C) is the SI unit of electric charge. 1 C = 1 A × 1 s.' },
          ],
          numerical: [
            { id: 'ch1-t2-num1', text: 'Two charges of +2μC and −5μC are placed 20 cm apart in vacuum. Find the magnitude of the force between them.', answer: 2.25, unit: 'N', solution: 'F = kq₁q₂/r² = 9×10⁹ × 2×10⁻⁶ × 5×10⁻⁶ / (0.2)² = 2.25 N', hint: 'Use F = kq₁q₂/r² with k = 9 × 10⁹ N·m²/C²' },
          ],
          questions: [
            {
              id: 'ch1-t2-q1',
              text: 'Two point charges of +2μC and −3μC are placed 30 cm apart. If the distance is halved, by what factor does the force change? Explain the relationship.',
              hint: 'The force depends on the inverse square of distance.',
              expectedConcepts: ['inverse square', 'four times', 'distance halved'],
              estimatedTime: '3 min',
            },
            {
              id: 'ch1-t2-q2',
              text: 'Why is the constant k in Coulomb\'s law much larger in vacuum than in water? What does this tell us about force between charges in different media?',
              hint: 'Consider the role of the dielectric constant of the medium.',
              expectedConcepts: ['dielectric constant', 'medium reduces force', 'permittivity'],
              estimatedTime: '4 min',
            },
            {
              id: 'ch1-t2-q3',
              text: 'Coulomb\'s law looks similar to Newton\'s law of gravitation. State two key differences between the electrostatic and gravitational forces.',
              hint: 'Think about the sign of the force and its relative strength.',
              expectedConcepts: ['attractive and repulsive', 'much stronger', 'charge vs mass'],
              estimatedTime: '3 min',
            },
          ],
          misconceptions: [
            {
              id: 'ch1-t2-m1',
              probe: 'If the distance between two charges is doubled, the force becomes half. True or false?',
              options: ['True — force is inversely proportional to distance', 'False — force becomes one-fourth (inverse square law)'],
              correctIndex: 1,
              correction: 'Coulomb\'s law states F ∝ 1/r². Doubling distance reduces force to 1/4, not 1/2.',
              detectKeywords: ['half', 'inversely proportional to distance', 'linear'],
            },
            {
              id: 'ch1-t2-m2',
              probe: 'Does the electrostatic force between two charges depend on the masses of the charged objects?',
              options: ['Yes, heavier objects exert more electric force', 'No, electrostatic force depends only on charges and distance'],
              correctIndex: 1,
              correction: 'Unlike gravity, Coulomb\'s force depends only on the magnitudes of charges and the distance between them, not on mass.',
              detectKeywords: ['mass matters', 'heavier', 'weight affects'],
            },
          ],
        },
        {
          id: 'ch1-t3',
          title: "Electric Field",
      description: "In the realm of Physics, the concept of Electric Field stands out as a critical building block. Associated with Electric Charges and Fields, this subject matter encourages analytical thinking and deeper cognitive engagement. Students exploring this topic will discover how interconnected and structured our learning systems truly are.\n\nThe detailed examination of Electric Field reveals the intricate layers of Electric Charges and Fields. Through guided study, students unpack complex concepts, translating them into easily digestible pieces of knowledge. This process is essential for achieving academic excellence and conceptual clarity.\n\nFor instance, consider how Electric Field manifests in daily life. Whether you are organizing objects, measuring spaces, or simply observing nature, the principles of Electric Charges and Fields are actively at play. This practical manifestation makes the theoretical aspects much more tangible and easier to grasp.\n\nIn summary, mastering Electric Field empowers students with the confidence and skills necessary to excel in Physics. The journey through Electric Charges and Fields guarantees a comprehensive educational experience that goes far beyond the classroom.",
          duration: '14 min',
          difficulty: 'core',
          animationType: 'electricFieldLines',
          learningObjectives: [
            'Define electric field and explain its physical significance',
            'Draw and interpret electric field line patterns',
            'Calculate electric field due to point charges',
          ],
          mcq: [
            { id: 'ch1-t3-mcq1', text: 'Electric field lines:', options: ['Can cross each other at right angles', 'Start from negative and end at positive charges', 'Are always straight lines', 'Never intersect each other'], correctIndex: 3, explanation: 'If field lines crossed, there would be two directions of force at one point — a physical impossibility.' },
          ],
          numerical: [
            { id: 'ch1-t3-num1', text: 'Find the electric field at a distance of 30 cm from a point charge of 5 nC.', answer: 500, unit: 'N/C', solution: 'E = kq/r² = 9×10⁹ × 5×10⁻⁹ / (0.3)² = 500 N/C', hint: 'Use E = kq/r²' },
          ],
          questions: [
            {
              id: 'ch1-t3-q1',
              text: 'Draw and explain the electric field line pattern around a single positive point charge. Why do the lines point radially outward?',
              hint: 'A positive test charge placed nearby would be repelled outward.',
              expectedConcepts: ['radial', 'outward', 'test charge repelled', 'density decreases with distance'],
              estimatedTime: '3 min',
            },
            {
              id: 'ch1-t3-q2',
              text: 'Why do two electric field lines never intersect each other? What physical contradiction would arise if they did?',
              hint: 'Think about the direction of force at the intersection point.',
              expectedConcepts: ['two directions', 'unique direction', 'contradiction'],
              estimatedTime: '3 min',
            },
            {
              id: 'ch1-t3-q3',
              text: 'A uniform electric field exists in a region. What does the pattern of field lines look like, and what does "uniform" mean physically?',
              hint: 'Uniform means same magnitude and direction everywhere.',
              expectedConcepts: ['parallel', 'equally spaced', 'same force on test charge everywhere'],
              estimatedTime: '3 min',
            },
          ],
          misconceptions: [
            {
              id: 'ch1-t3-m1',
              probe: 'Do electric field lines represent the actual path a charged particle follows when released?',
              options: ['Yes, the particle always moves along field lines', 'Not necessarily — field lines show force direction, not the trajectory'],
              correctIndex: 1,
              correction: 'Field lines show the direction of force, not the path. A particle with initial velocity at an angle to the field follows a curved trajectory (like a projectile), not the field line itself.',
              detectKeywords: ['follows the line', 'moves along', 'path of particle'],
            },
          ],
        },
        {
          id: 'ch1-t4',
          title: "Electric Dipole",
          duration: '13 min',
          difficulty: 'advanced',
          animationType: 'electricDipole',
          learningObjectives: [
            'Define electric dipole and dipole moment',
            'Derive electric field along axial and equatorial lines of a dipole',
            'Analyze torque on a dipole in a uniform electric field',
          ],
          mcq: [
            { id: 'ch1-t4-mcq1', text: 'The electric field on the axial line of a dipole at large distance varies as:', options: ['1/r', '1/r²', '1/r³', '1/r⁴'], correctIndex: 2, explanation: 'For a dipole, E_axial ∝ 1/r³ at distances much larger than the dipole length.' },
          ],
          questions: [
            {
              id: 'ch1-t4-q1',
              text: 'An electric dipole is placed in a uniform electric field. Explain why the net force on it is zero but it still experiences a torque.',
              hint: 'Both charges experience equal and opposite forces, but at different positions.',
              expectedConcepts: ['equal opposite forces', 'torque due to separation', 'couple'],
              estimatedTime: '4 min',
            },
            {
              id: 'ch1-t4-q2',
              text: 'How does the electric field of a dipole vary with distance along the axial line versus the equatorial line? Which falls off faster?',
              hint: 'Compare the power of r in the denominator for both cases.',
              expectedConcepts: ['1/r³', 'axial is 2x equatorial', 'both fall as cube'],
              estimatedTime: '4 min',
            },
            {
              id: 'ch1-t4-q3',
              text: 'Define dipole moment. Why is it a vector quantity, and what direction does it point?',
              hint: 'It points from the negative charge to the positive charge.',
              expectedConcepts: ['p = q × 2a', 'negative to positive', 'vector', 'magnitude and direction'],
              estimatedTime: '2 min',
            },
          ],
          misconceptions: [
            {
              id: 'ch1-t4-m1',
              probe: 'The dipole moment vector points from the positive charge to the negative charge. True or false?',
              options: ['True — positive to negative', 'False — it points from negative to positive'],
              correctIndex: 1,
              correction: 'By convention, the dipole moment vector p̄ points from the negative charge toward the positive charge.',
              detectKeywords: ['positive to negative', 'plus to minus'],
            },
          ],
        },
        {
          id: 'ch1-t5',
          title: "Gauss's Law",
          duration: '18 min',
          difficulty: 'advanced',
          animationType: 'gaussLaw',
          learningObjectives: [
            'State and explain Gauss\'s law',
            'Calculate electric flux through closed surfaces',
            'Apply Gauss\'s law to symmetric charge distributions',
          ],
          mcq: [
            { id: 'ch1-t5-mcq1', text: 'A charge q is placed at the center of a cube. The electric flux through one face of the cube is:', options: ['q/ε₀', 'q/2ε₀', 'q/4ε₀', 'q/6ε₀'], correctIndex: 3, explanation: 'Total flux = q/ε₀. A cube has 6 faces, so flux through one face = q/6ε₀.' },
          ],
          numerical: [
            { id: 'ch1-t5-num1', text: 'A sphere of radius 10 cm encloses a charge of 8.85 × 10⁻¹² C. Find the total electric flux through the sphere.', answer: 1, unit: 'N·m²/C', solution: 'Φ = q/ε₀ = 8.85×10⁻¹² / 8.85×10⁻¹² = 1 N·m²/C', hint: 'Gauss\'s law: Φ = q/ε₀, shape doesn\'t matter' },
          ],
          questions: [
            {
              id: 'ch1-t5-q1',
              text: 'State Gauss\'s law. A point charge q is placed at the center of a cube. What is the total electric flux through the cube? Does the shape of the surface matter?',
              hint: 'Gauss\'s law relates total flux to enclosed charge, regardless of shape.',
              expectedConcepts: ['q/ε₀', 'shape does not matter', 'closed surface', 'flux depends only on enclosed charge'],
              estimatedTime: '4 min',
            },
            {
              id: 'ch1-t5-q2',
              text: 'Using Gauss\'s law, derive the electric field due to an infinite plane sheet of charge with surface charge density σ.',
              hint: 'Choose a cylindrical Gaussian surface with its flat faces parallel to the sheet.',
              expectedConcepts: ['cylindrical Gaussian surface', 'σ/2ε₀', 'perpendicular to sheet', 'uniform field'],
              estimatedTime: '5 min',
            },
            {
              id: 'ch1-t5-q3',
              text: 'If a charge is placed outside a closed Gaussian surface, what is the net flux through that surface? Explain why.',
              hint: 'Count field lines entering and leaving the surface.',
              expectedConcepts: ['zero net flux', 'lines enter and exit', 'no enclosed charge'],
              estimatedTime: '3 min',
            },
          ],
          misconceptions: [
            {
              id: 'ch1-t5-m1',
              probe: 'If the electric field at every point on a Gaussian surface is zero, does it mean there is no charge inside?',
              options: ['Yes — zero field means zero enclosed charge', 'Not necessarily — there could be equal positive and negative charges inside that cancel'],
              correctIndex: 1,
              correction: 'Zero net flux means zero net enclosed charge, but individual charges could exist inside if they sum to zero. However, if the field is truly zero everywhere on the surface, then the net enclosed charge must indeed be zero by Gauss\'s law.',
              detectKeywords: ['no charge at all', 'empty inside'],
            },
            {
              id: 'ch1-t5-m2',
              probe: 'Does Gauss\'s law only work for symmetric charge distributions?',
              options: ['Yes — it only applies to spheres, cylinders, and planes', 'No — it is always true, but symmetry makes calculations easier'],
              correctIndex: 1,
              correction: 'Gauss\'s law is universally valid for any charge distribution and any closed surface. Symmetry simply allows us to simplify the integral and calculate E easily.',
              detectKeywords: ['only symmetric', 'only works for sphere', 'needs symmetry'],
            },
          ],
        },
        {
          id: 'ch1-t6',
          title: "Applications of Gauss's Law",
          duration: '15 min',
          difficulty: 'advanced',
          animationType: 'gaussLaw',
          learningObjectives: [
            'Apply Gauss\'s law to find electric field of a spherical shell',
            'Derive electric field due to infinite line and plane of charge',
            'Explain why E = 0 inside a charged conducting sphere',
          ],
          mcq: [
            { id: 'ch1-t6-mcq1', text: 'The electric field inside a uniformly charged spherical shell is:', options: ['Maximum at the center', 'Proportional to distance from center', 'Zero everywhere', 'Inversely proportional to distance'], correctIndex: 2, explanation: 'By Gauss\'s law, a Gaussian surface inside encloses no charge, so E = 0.' },
          ],
          questions: [
            {
              id: 'ch1-t6-q1',
              text: 'Use Gauss\'s law to show that the electric field inside a uniformly charged spherical shell is zero. What Gaussian surface would you choose?',
              hint: 'Choose a concentric sphere inside the shell.',
              expectedConcepts: ['concentric sphere', 'no enclosed charge', 'E = 0 inside'],
              estimatedTime: '4 min',
            },
            {
              id: 'ch1-t6-q2',
              text: 'A long straight wire has a uniform linear charge density λ. Derive the expression for the electric field at a perpendicular distance r from the wire.',
              hint: 'Use a cylindrical Gaussian surface coaxial with the wire.',
              expectedConcepts: ['cylindrical surface', 'λ/2πε₀r', 'radial field'],
              estimatedTime: '5 min',
            },
          ],
          misconceptions: [
            {
              id: 'ch1-t6-m1',
              probe: 'The electric field inside a charged solid conducting sphere is zero. Is this because the charge distributes itself on the surface?',
              options: ['No — the field is zero because the total charge is zero', 'Yes — charges reside on the surface, leaving no enclosed charge for an internal Gaussian surface'],
              correctIndex: 1,
              correction: 'In a conductor, free charges redistribute to the surface. Any Gaussian surface inside encloses zero charge, so by Gauss\'s law E = 0 inside.',
              detectKeywords: ['charge everywhere inside', 'uniform distribution inside'],
            },
          ],
        },
      ],
    },
    // ── Chapter 2 ─────────────────────────────────────
    {
      id: 'ch2', number: 2, title: "Electrostatic Potential and Capacitance",
      topics: [
        { id: 'ch2-t1', title: "Electrostatic Potential", duration: '14 min', difficulty: 'foundation', animationType: 'electricPotential',
          learningObjectives: ['Define electric potential and potential difference', 'Relate electric potential to work done', 'Explain equipotential surfaces and their properties'],
          mcq: [
            { id: 'ch2-t1-mcq1', text: 'Work done in moving a charge along an equipotential surface is:', options: ['Maximum', 'Minimum but not zero', 'Zero', 'Depends on the path'], correctIndex: 2, explanation: 'No potential difference exists along an equipotential surface, so W = qΔV = 0.' },
          ],
          numerical: [
            { id: 'ch2-t1-num1', text: 'How much work is done in moving a charge of 2μC from a point at 100V to a point at 50V?', answer: 0.0001, unit: 'J', solution: 'W = qΔV = 2×10⁻⁶ × (100-50) = 1×10⁻⁴ J', hint: 'W = q(V₁ - V₂)' },
          ],
          questions: [
            { id: 'ch2-t1-q1', text: 'What is the physical significance of electric potential at a point? How is it different from electric field?', hint: 'Potential is work done per unit charge, field is force per unit charge.', expectedConcepts: ['work per unit charge', 'scalar', 'field is vector'], estimatedTime: '3 min' },
            { id: 'ch2-t1-q2', text: 'Explain why equipotential surfaces are always perpendicular to electric field lines.', hint: 'No work is done moving a charge along an equipotential surface.', expectedConcepts: ['no work along surface', 'perpendicular', 'component of E along surface is zero'], estimatedTime: '4 min' },
            { id: 'ch2-t1-q3', text: 'Can two equipotential surfaces intersect? Justify your answer.', hint: 'Think about what would happen at the intersection point.', expectedConcepts: ['cannot intersect', 'two potentials at one point', 'contradiction'], estimatedTime: '2 min' },
          ],
          misconceptions: [
            { id: 'ch2-t1-m1', probe: 'If the electric potential at a point is zero, the electric field at that point must also be zero. True or false?', options: ['True — zero potential means zero field', 'False — potential can be zero while field is non-zero'], correctIndex: 1, correction: 'The midpoint between two equal and opposite charges has zero potential but a non-zero electric field.', detectKeywords: ['zero potential means zero field'] },
          ],
        },
        { id: 'ch2-t2', title: "Potential due to Point Charge and Dipole", duration: '12 min', difficulty: 'core', animationType: 'electricPotential',
          learningObjectives: ['Calculate potential due to point charges', 'Compare potential variation for point charge (1/r) vs dipole (1/r²)', 'Explain zero potential on the equatorial plane of a dipole'],
          mcq: [
            { id: 'ch2-t2-mcq1', text: 'The electric potential at the equatorial point of a dipole is:', options: ['Maximum', 'Minimum', 'Zero', 'Equal to kq/r'], correctIndex: 2, explanation: 'The potentials from +q and −q cancel exactly on the equatorial plane.' },
          ],
          questions: [
            { id: 'ch2-t2-q1', text: 'Compare the potential due to a point charge and a dipole at large distances. Which falls off faster and why?', hint: 'Point charge potential goes as 1/r, dipole as 1/r².', expectedConcepts: ['1/r for point', '1/r² for dipole', 'dipole faster'], estimatedTime: '3 min' },
            { id: 'ch2-t2-q2', text: 'The potential at the equatorial point of a dipole is zero. Does this mean no work is needed to bring a charge from infinity to that point?', hint: 'Work done = qV. If V=0 then W=0.', expectedConcepts: ['yes zero work', 'V=0 at equatorial', 'path independent'], estimatedTime: '3 min' },
          ],
          misconceptions: [
            { id: 'ch2-t2-m1', probe: 'Potential is always positive near a positive charge and negative near a negative charge. True?', options: ['True always', 'It depends on contributions from all charges present'], correctIndex: 1, correction: 'The net potential at a point is the algebraic sum of potentials due to all charges. Near a positive charge it can still be negative if a larger negative charge is nearby.', detectKeywords: ['always positive near positive'] },
          ],
        },
        { id: 'ch2-t3', title: "Capacitance and Parallel Plate Capacitor", duration: '16 min', difficulty: 'core', animationType: 'capacitor',
          learningObjectives: ['Define capacitance and its SI unit', 'Derive capacitance of a parallel plate capacitor', 'Calculate energy stored in a capacitor', 'Explain the effect of dielectric on capacitance'],
          mcq: [
            { id: 'ch2-t3-mcq1', text: 'A parallel plate capacitor with air has capacitance C. If a dielectric of constant K=4 fills the gap, the new capacitance is:', options: ['C/4', 'C', '4C', '16C'], correctIndex: 2, explanation: 'Capacitance with dielectric = KC = 4C.' },
          ],
          numerical: [
            { id: 'ch2-t3-num1', text: 'A 10μF capacitor is charged to 200V. Calculate the energy stored.', answer: 0.2, unit: 'J', solution: 'U = ½CV² = 0.5 × 10×10⁻⁶ × (200)² = 0.2 J', hint: 'U = ½CV²' },
          ],
          questions: [
            { id: 'ch2-t3-q1', text: 'A parallel plate capacitor has capacitance C. If a dielectric slab of constant K is inserted between the plates, how does the capacitance change? Explain physically.', hint: 'The dielectric reduces the effective field between plates.', expectedConcepts: ['C becomes KC', 'dielectric reduces field', 'induced charges'], estimatedTime: '4 min' },
            { id: 'ch2-t3-q2', text: 'Why does the capacitance of a parallel plate capacitor increase when the plates are brought closer together?', hint: 'C = ε₀A/d — see how d affects C.', expectedConcepts: ['inversely proportional to d', 'closer plates stronger field', 'more charge stored'], estimatedTime: '3 min' },
            { id: 'ch2-t3-q3', text: 'Derive the expression for energy stored in a charged capacitor. Where is this energy stored?', hint: 'Energy is stored in the electric field between the plates.', expectedConcepts: ['½CV²', 'energy in electric field', 'energy density'], estimatedTime: '4 min' },
          ],
          misconceptions: [
            { id: 'ch2-t3-m1', probe: 'A capacitor stores charge. Does it also store energy?', options: ['No — it only stores charge', 'Yes — energy is stored in the electric field between the plates'], correctIndex: 1, correction: 'A capacitor stores both charge and energy. The energy is stored in the electric field and equals ½CV².', detectKeywords: ['only stores charge', 'no energy'] },
            { id: 'ch2-t3-m2', probe: 'If you double the voltage across a capacitor, the stored energy doubles. True?', options: ['True — energy is proportional to voltage', 'False — energy quadruples since U = ½CV²'], correctIndex: 1, correction: 'Energy U = ½CV². Doubling V makes U four times larger, not twice.', detectKeywords: ['doubles', 'proportional to V'] },
          ],
        },
        { id: 'ch2-t4', title: "Combination of Capacitors", duration: '12 min', difficulty: 'core', animationType: 'capacitor',
          learningObjectives: ['Calculate equivalent capacitance in series and parallel', 'Analyze charge and voltage distribution in combinations'],
          mcq: [
            { id: 'ch2-t4-mcq1', text: 'Three capacitors of 6μF each connected in series have equivalent capacitance:', options: ['18μF', '2μF', '6μF', '9μF'], correctIndex: 1, explanation: '1/Ceq = 1/6 + 1/6 + 1/6 = 3/6 = 1/2, so Ceq = 2μF.' },
          ],
          questions: [
            { id: 'ch2-t4-q1', text: 'Three capacitors of 2μF, 3μF, and 6μF are connected in parallel. Find the equivalent capacitance and explain why parallel combination increases capacitance.', hint: 'In parallel, capacitances add directly.', expectedConcepts: ['11μF', 'add directly', 'same voltage more charge'], estimatedTime: '3 min' },
            { id: 'ch2-t4-q2', text: 'The same three capacitors are connected in series. Find the equivalent capacitance and explain why it is less than the smallest individual capacitance.', hint: '1/C_eq = 1/C₁ + 1/C₂ + 1/C₃', expectedConcepts: ['1μF', 'reciprocal sum', 'same charge less voltage'], estimatedTime: '3 min' },
          ],
          misconceptions: [
            { id: 'ch2-t4-m1', probe: 'In series combination, each capacitor stores the same amount of charge. True or false?', options: ['False — the larger capacitor stores more charge', 'True — the same charge flows through all capacitors in series'], correctIndex: 1, correction: 'In series, the same current flows through all capacitors, so they all acquire the same charge Q. The voltage divides, not the charge.', detectKeywords: ['different charge', 'larger stores more'] },
          ],
        },
        { id: 'ch2-t5', title: "Dielectrics and Polarization", duration: '14 min', difficulty: 'advanced', animationType: 'capacitor',
          learningObjectives: ['Explain polarization in dielectric materials', 'Distinguish between polar and non-polar dielectrics', 'Analyze the effect of dielectric on electric field and capacitance'],
          questions: [
            { id: 'ch2-t5-q1', text: 'When a dielectric is placed in an external electric field, it gets polarized. Explain the mechanism of polarization in a non-polar dielectric.', hint: 'The centres of positive and negative charges separate slightly.', expectedConcepts: ['induced dipoles', 'charge separation', 'opposing field inside'], estimatedTime: '4 min' },
            { id: 'ch2-t5-q2', text: 'Why does inserting a dielectric between the plates of a capacitor increase its capacitance?', hint: 'The dielectric reduces the net electric field.', expectedConcepts: ['reduces net field', 'more charge for same voltage', 'K > 1'], estimatedTime: '3 min' },
          ],
          misconceptions: [
            { id: 'ch2-t5-m1', probe: 'Does a dielectric create new charges when polarized?', options: ['Yes — new charges appear on the surface', 'No — existing charges within molecules rearrange'], correctIndex: 1, correction: 'Polarization involves rearrangement of existing bound charges within molecules, not creation of new charges.', detectKeywords: ['creates charges', 'new charges appear'] },
          ],
        },
      ],
    },
    // ── Chapter 3 ─────────────────────────────────────
    {
      id: 'ch3', number: 3, title: "Current Electricity",
      topics: [
        { id: 'ch3-t1', title: "Electric Current and Drift Velocity", duration: '14 min', difficulty: 'foundation', animationType: 'ohmCircuit',
          learningObjectives: ['Define electric current and distinguish between drift velocity and signal speed', 'Derive the relation I = neAvd', 'Explain the effect of temperature on drift velocity'],
          mcq: [
            { id: 'ch3-t1-mcq1', text: 'The drift velocity of electrons in a conductor is of the order of:', options: ['3 × 10⁸ m/s', '10⁶ m/s', '10⁻⁴ m/s', '0 m/s'], correctIndex: 2, explanation: 'Drift velocity is typically ~0.1 mm/s, very small compared to the speed of the electric field signal.' },
          ],
          questions: [
            { id: 'ch3-t1-q1', text: 'Explain why the drift velocity of electrons in a conductor is very small (~mm/s) yet a bulb lights up almost instantly when the switch is turned on.', hint: 'Think about the electric field propagation vs. electron movement.', expectedConcepts: ['electric field propagates at speed of light', 'all electrons start drifting simultaneously', 'drift vs signal speed'], estimatedTime: '4 min' },
            { id: 'ch3-t1-q2', text: 'Derive the relation between current I, number density n, drift velocity vd, cross-sectional area A, and electron charge e.', hint: 'Count how many electrons cross a section per second.', expectedConcepts: ['I = neAvd', 'charge per unit time', 'number density'], estimatedTime: '4 min' },
            { id: 'ch3-t1-q3', text: 'If the temperature of a metallic conductor increases, what happens to its drift velocity for the same applied voltage? Explain.', hint: 'Higher temperature means more collisions.', expectedConcepts: ['drift velocity decreases', 'more collisions', 'relaxation time decreases'], estimatedTime: '3 min' },
          ],
          misconceptions: [
            { id: 'ch3-t1-m1', probe: 'Electrons travel from the battery to the bulb at the speed of light. True?', options: ['True — that is why the bulb lights instantly', 'False — the electric field propagates fast, but electrons drift slowly'], correctIndex: 1, correction: 'The electric field signal travels near the speed of light, causing all free electrons to start drifting almost simultaneously. Individual electrons move very slowly (~mm/s).', detectKeywords: ['electrons travel at speed of light', 'electrons move fast'] },
          ],
        },
        { id: 'ch3-t2', title: "Ohm's Law and Resistivity", duration: '15 min', difficulty: 'core', animationType: 'ohmCircuit',
          learningObjectives: ['State Ohm\'s law and its limitations', 'Define resistivity and its temperature dependence', 'Distinguish between ohmic and non-ohmic conductors'],
          mcq: [
            { id: 'ch3-t2-mcq1', text: 'The resistance of a conductor depends on:', options: ['Only length', 'Only cross-sectional area', 'Length, area, and material', 'Only material'], correctIndex: 2, explanation: 'R = ρL/A — resistance depends on length, area, and resistivity (material property).' },
          ],
          numerical: [
            { id: 'ch3-t2-num1', text: 'A copper wire of length 2m and cross-section 0.5 mm² has resistivity 1.7 × 10⁻⁸ Ω·m. Find its resistance.', answer: 0.068, unit: 'Ω', solution: 'R = ρL/A = 1.7×10⁻⁸ × 2 / (0.5×10⁻⁶) = 0.068 Ω', hint: 'R = ρL/A, convert mm² to m²' },
          ],
          questions: [
            { id: 'ch3-t2-q1', text: 'State Ohm\'s law. Under what conditions does it fail? Give one example of a non-ohmic device.', hint: 'Think about devices where V-I graph is not a straight line.', expectedConcepts: ['V = IR', 'linear relationship', 'diode is non-ohmic', 'fails at high temperature'], estimatedTime: '3 min' },
            { id: 'ch3-t2-q2', text: 'A copper wire and a nichrome wire of the same length and diameter are connected in series. Which has higher resistance and why?', hint: 'Compare the resistivity values of the two materials.', expectedConcepts: ['nichrome higher resistivity', 'R = ρL/A', 'material property'], estimatedTime: '3 min' },
            { id: 'ch3-t2-q3', text: 'Why does the resistance of a metallic conductor increase with temperature, while that of a semiconductor decreases?', hint: 'Think about what limits current flow in each case.', expectedConcepts: ['more collisions in metal', 'more charge carriers in semiconductor', 'opposite temperature dependence'], estimatedTime: '4 min' },
          ],
          misconceptions: [
            { id: 'ch3-t2-m1', probe: 'Ohm\'s law is a universal law that applies to all conducting materials. True?', options: ['True — all conductors obey Ohm\'s law', 'False — many materials and devices are non-ohmic'], correctIndex: 1, correction: 'Ohm\'s law is an empirical relationship valid only for ohmic conductors. Semiconductors, diodes, and electrolytes are examples of non-ohmic materials.', detectKeywords: ['universal', 'all materials', 'always true'] },
          ],
        },
        { id: 'ch3-t3', title: "Kirchhoff's Laws", duration: '16 min', difficulty: 'core', animationType: 'kirchhoff',
          learningObjectives: ['State junction and loop rules with conservation principles', 'Apply Kirchhoff\'s laws to multi-loop circuits', 'Derive the Wheatstone bridge balance condition'],
          mcq: [
            { id: 'ch3-t3-mcq1', text: 'Kirchhoff\'s junction rule is based on conservation of:', options: ['Energy', 'Momentum', 'Charge', 'Mass'], correctIndex: 2, explanation: 'Junction rule: current in = current out, which is conservation of charge.' },
          ],
          questions: [
            { id: 'ch3-t3-q1', text: 'State Kirchhoff\'s junction rule. What conservation principle does it represent?', hint: 'Think about what cannot accumulate at a junction.', expectedConcepts: ['sum of currents = 0', 'conservation of charge', 'incoming = outgoing'], estimatedTime: '3 min' },
            { id: 'ch3-t3-q2', text: 'State Kirchhoff\'s loop rule. What conservation principle does it represent?', hint: 'Think about a charge making a complete trip around a loop.', expectedConcepts: ['sum of potential differences = 0', 'conservation of energy', 'closed loop'], estimatedTime: '3 min' },
            { id: 'ch3-t3-q3', text: 'In a Wheatstone bridge, when is the bridge said to be balanced? What is the condition for zero current through the galvanometer?', hint: 'Think about the ratio of resistances.', expectedConcepts: ['P/Q = R/S', 'no current through galvanometer', 'balanced condition'], estimatedTime: '4 min' },
          ],
          misconceptions: [
            { id: 'ch3-t3-m1', probe: 'Kirchhoff\'s laws only work for simple circuits with one loop. True?', options: ['True — complex circuits need different methods', 'False — they work for any circuit, no matter how complex'], correctIndex: 1, correction: 'Kirchhoff\'s laws are universally applicable to any electrical circuit. For complex networks, you apply them to multiple junctions and loops simultaneously.', detectKeywords: ['only simple', 'one loop only'] },
          ],
        },
        { id: 'ch3-t4', title: "Wheatstone Bridge and Meter Bridge", duration: '14 min', difficulty: 'advanced', animationType: 'wheatstone',
          learningObjectives: ['Explain the principle of Wheatstone bridge', 'Calculate unknown resistance using meter bridge'],
          numerical: [
            { id: 'ch3-t4-num1', text: 'In a meter bridge, the null point is at 35 cm. If the known resistance is 7Ω, find the unknown resistance.', answer: 3.77, unit: 'Ω', solution: 'R/S = l/(100-l) → R = 7 × 35/65 ≈ 3.77 Ω', hint: 'R/S = l/(100-l)' },
          ],
          questions: [
            { id: 'ch3-t4-q1', text: 'In a meter bridge experiment, the balance point is found at 40 cm from one end. If the known resistance is 10Ω, find the unknown resistance and explain the principle.', hint: 'Use the Wheatstone bridge balance condition with length ratios.', expectedConcepts: ['R = S × l/(100-l)', 'balance condition', '6.67Ω'], estimatedTime: '4 min' },
          ],
          misconceptions: [
            { id: 'ch3-t4-m1', probe: 'The sensitivity of a meter bridge is the same everywhere along the wire. True?', options: ['True — it is uniform throughout', 'False — it is most sensitive when the balance point is near the middle'], correctIndex: 1, correction: 'The meter bridge is most sensitive when the balance point is near the middle of the wire (around 50 cm).', detectKeywords: ['same everywhere', 'uniform sensitivity'] },
          ],
        },
        { id: 'ch3-t5', title: "Cells and Internal Resistance", duration: '13 min', difficulty: 'core', animationType: 'ohmCircuit',
          learningObjectives: ['Define EMF and internal resistance', 'Calculate terminal voltage of a cell', 'Analyze series and parallel combinations of cells'],
          numerical: [
            { id: 'ch3-t5-num1', text: 'A cell of EMF 2V and internal resistance 1Ω is connected to an external resistance of 4Ω. Find the current and terminal voltage.', answer: 0.4, unit: 'A', solution: 'I = E/(R+r) = 2/(4+1) = 0.4A; V = E - Ir = 2 - 0.4 = 1.6V', hint: 'I = EMF/(R+r)' },
          ],
          questions: [
            { id: 'ch3-t5-q1', text: 'A cell of EMF 1.5V and internal resistance 0.5Ω is connected to an external resistance of 2.5Ω. Find the terminal voltage across the cell.', hint: 'V = EMF - Ir, where I = EMF/(R+r).', expectedConcepts: ['I = 0.5A', 'V = 1.25V', 'voltage drop across internal resistance'], estimatedTime: '3 min' },
            { id: 'ch3-t5-q2', text: 'Why is the terminal voltage of a cell always less than its EMF when it is supplying current?', hint: 'Current through internal resistance causes a voltage drop.', expectedConcepts: ['internal resistance', 'voltage drop Ir', 'V = E - Ir'], estimatedTime: '3 min' },
          ],
          misconceptions: [
            { id: 'ch3-t5-m1', probe: 'An ideal cell has zero internal resistance. In practice, can the terminal voltage ever equal the EMF?', options: ['Never — there is always some internal resistance', 'Yes — when no current is drawn (open circuit), terminal voltage equals EMF'], correctIndex: 1, correction: 'When no current flows (open circuit), there is no drop across the internal resistance, so V = EMF.', detectKeywords: ['never equals', 'always less'] },
          ],
        },
      ],
    },
    // ── Chapter 4 ─────────────────────────────────────
    {
      id: 'ch4', number: 4, title: "Moving Charges and Magnetism",
      topics: [
        { id: 'ch4-t1', title: "Magnetic Force on a Moving Charge", duration: '14 min', difficulty: 'foundation', animationType: 'biotsavart',
          learningObjectives: ['Describe the Lorentz force on a moving charge', 'Explain circular motion of charged particles in magnetic fields', 'Prove that magnetic force does no work'],
          mcq: [
            { id: 'ch4-t1-mcq1', text: 'A charged particle moving parallel to a magnetic field experiences:', options: ['Maximum force', 'Minimum but non-zero force', 'Zero force', 'Force perpendicular to both v and B'], correctIndex: 2, explanation: 'F = qv×B. When v ∥ B, the cross product is zero.' },
          ],
          questions: [
            { id: 'ch4-t1-q1', text: 'A proton moves with velocity v perpendicular to a uniform magnetic field B. Describe the path it follows and explain why the magnetic force does no work on it.', hint: 'The force is always perpendicular to velocity.', expectedConcepts: ['circular path', 'perpendicular force', 'no work because F⊥v', 'centripetal force'], estimatedTime: '4 min' },
            { id: 'ch4-t1-q2', text: 'Write the expression for the Lorentz force on a charge q moving with velocity v in the presence of both electric field E and magnetic field B.', hint: 'It combines electric and magnetic forces.', expectedConcepts: ['F = q(E + v×B)', 'vector cross product', 'both fields'], estimatedTime: '3 min' },
            { id: 'ch4-t1-q3', text: 'If a charged particle enters a magnetic field parallel to the field lines, what happens? Why?', hint: 'The cross product v×B = 0 when they are parallel.', expectedConcepts: ['no force', 'v×B = 0', 'continues in straight line'], estimatedTime: '2 min' },
          ],
          misconceptions: [
            { id: 'ch4-t1-m1', probe: 'The magnetic force can change the speed of a charged particle. True?', options: ['True — it accelerates the particle', 'False — it only changes direction, not speed'], correctIndex: 1, correction: 'Since F is always perpendicular to v, magnetic force does zero work and cannot change the particle\'s kinetic energy or speed — only its direction.', detectKeywords: ['changes speed', 'accelerates', 'speeds up'] },
          ],
        },
        { id: 'ch4-t2', title: "Biot-Savart Law", duration: '16 min', difficulty: 'core', animationType: 'biotsavart',
          learningObjectives: ['State and apply the Biot-Savart law', 'Derive magnetic field at the center of a circular loop', 'Compare Biot-Savart law with Coulomb\'s law'],
          numerical: [
            { id: 'ch4-t2-num1', text: 'A circular coil of radius 10 cm carries a current of 5A. Find the magnetic field at its center.', answer: 31.4, unit: 'μT', solution: 'B = μ₀I/2R = 4π×10⁻⁷ × 5/(2 × 0.1) = 31.4 × 10⁻⁶ T = 31.4 μT', hint: 'B = μ₀I/2R' },
          ],
          questions: [
            { id: 'ch4-t2-q1', text: 'State the Biot-Savart law. Using it, derive the expression for the magnetic field at the center of a circular loop carrying current I.', hint: 'Every element dl is perpendicular to r at the center.', expectedConcepts: ['dB = μ₀Idl×r̂/4πr²', 'B = μ₀I/2R at center', 'perpendicular'], estimatedTime: '5 min' },
            { id: 'ch4-t2-q2', text: 'Compare the Biot-Savart law with Coulomb\'s law. What are the similarities and differences?', hint: 'Both are inverse-square laws but one involves a cross product.', expectedConcepts: ['both inverse square', 'Biot-Savart has cross product', 'magnetic field depends on angle'], estimatedTime: '4 min' },
          ],
          misconceptions: [
            { id: 'ch4-t2-m1', probe: 'The magnetic field due to a straight current-carrying wire decreases as 1/r² with distance. True?', options: ['True — like Coulomb\'s law', 'False — it decreases as 1/r for an infinite straight wire'], correctIndex: 1, correction: 'For an infinitely long straight wire, B = μ₀I/2πr, which falls as 1/r, not 1/r².', detectKeywords: ['1/r²', 'inverse square'] },
          ],
        },
        { id: 'ch4-t3', title: "Ampere's Circuital Law", duration: '15 min', difficulty: 'core', animationType: 'biotsavart',
          learningObjectives: ['State Ampere\'s circuital law', 'Derive magnetic field inside a solenoid', 'Explain why B ≈ 0 outside an ideal solenoid'],
          mcq: [
            { id: 'ch4-t3-mcq1', text: 'The magnetic field inside a long solenoid is:', options: ['Zero', 'Uniform and depends on nI', 'Non-uniform', 'Depends on the radius'], correctIndex: 1, explanation: 'B = μ₀nI inside an ideal solenoid, uniform throughout.' },
          ],
          questions: [
            { id: 'ch4-t3-q1', text: 'State Ampere\'s circuital law. Use it to find the magnetic field inside a long solenoid carrying current I with n turns per unit length.', hint: 'Choose a rectangular Amperian loop.', expectedConcepts: ['∮B·dl = μ₀I_enc', 'B = μ₀nI inside', 'rectangular loop'], estimatedTime: '5 min' },
            { id: 'ch4-t3-q2', text: 'Why is the magnetic field outside an ideal solenoid approximately zero?', hint: 'Think about cancellation of field contributions from adjacent turns.', expectedConcepts: ['fields cancel outside', 'confined inside', 'infinite solenoid approximation'], estimatedTime: '3 min' },
          ],
          misconceptions: [
            { id: 'ch4-t3-m1', probe: 'The magnetic field inside a solenoid depends on the position along the axis. True?', options: ['True — it is stronger at the center', 'False — for an ideal solenoid, B is uniform throughout the interior'], correctIndex: 1, correction: 'In an ideal infinite solenoid, the magnetic field is uniform (same B everywhere inside). Only near the ends of a real finite solenoid does the field vary.', detectKeywords: ['stronger at center', 'varies inside', 'depends on position'] },
          ],
        },
        { id: 'ch4-t4', title: "Force between Parallel Current-Carrying Conductors", duration: '12 min', difficulty: 'core', animationType: 'biotsavart',
          learningObjectives: ['Determine force between parallel currents', 'State the SI definition of ampere'],
          questions: [
            { id: 'ch4-t4-q1', text: 'Two long parallel wires carry currents in the same direction. Do they attract or repel each other? Explain using the magnetic field of one wire on the other.', hint: 'Find the direction of force using F = Il×B.', expectedConcepts: ['attract', 'same direction currents attract', 'force using right hand rule'], estimatedTime: '4 min' },
            { id: 'ch4-t4-q2', text: 'The SI definition of one ampere is based on the force between parallel conductors. State this definition.', hint: 'It involves the force per unit length between two parallel wires 1m apart.', expectedConcepts: ['2×10⁻⁷ N/m', '1 meter apart', 'equal currents'], estimatedTime: '3 min' },
          ],
          misconceptions: [
            { id: 'ch4-t4-m1', probe: 'Two parallel wires carrying current in the same direction repel each other like two like charges. True?', options: ['True — same direction means same "sign" so they repel', 'False — parallel currents in the same direction attract each other'], correctIndex: 1, correction: 'Unlike electric charges, parallel currents in the same direction attract each other. Opposite direction currents repel.', detectKeywords: ['repel same direction', 'like charges repel'] },
          ],
        },
        { id: 'ch4-t5', title: "Moving Coil Galvanometer", duration: '12 min', difficulty: 'advanced', animationType: 'biotsavart',
          learningObjectives: ['Explain the working principle of a galvanometer', 'Convert galvanometer to ammeter and voltmeter'],
          questions: [
            { id: 'ch4-t5-q1', text: 'Explain the principle of a moving coil galvanometer. Why is a radial magnetic field used?', hint: 'Radial field ensures the plane of the coil is always parallel to B.', expectedConcepts: ['torque on current loop', 'radial field', 'uniform deflection', 'proportional to current'], estimatedTime: '4 min' },
            { id: 'ch4-t5-q2', text: 'How can a galvanometer be converted into an ammeter? Why is a low resistance connected in parallel?', hint: 'Most current should bypass the galvanometer.', expectedConcepts: ['shunt resistance', 'low value in parallel', 'protect galvanometer'], estimatedTime: '3 min' },
          ],
          misconceptions: [
            { id: 'ch4-t5-m1', probe: 'To convert a galvanometer to a voltmeter, a low resistance is connected in series. True?', options: ['True — low resistance in series', 'False — a HIGH resistance is connected in series'], correctIndex: 1, correction: 'A voltmeter needs high resistance to draw minimal current. A high resistance is connected in series with the galvanometer.', detectKeywords: ['low resistance in series for voltmeter'] },
          ],
        },
      ],
    },
    // ── Chapter 5 ─────────────────────────────────────
    {
      id: 'ch5', number: 5, title: "Magnetism and Matter",
      topics: [
        { id: 'ch5-t1', title: "Bar Magnet and Magnetic Field Lines", duration: '12 min', difficulty: 'foundation', animationType: 'magneticFieldLab',
          learningObjectives: ['Draw magnetic field lines of a bar magnet', 'Explain the magnetic dipole analogy with a solenoid'],
          questions: [
            { id: 'ch5-t1-q1', text: 'Draw the magnetic field line pattern of a bar magnet. How can you tell from the pattern where the field is strongest?', hint: 'Closer field lines mean stronger field.', expectedConcepts: ['N to S outside', 'density indicates strength', 'closed loops'], estimatedTime: '3 min' },
            { id: 'ch5-t1-q2', text: 'A bar magnet behaves like an equivalent solenoid. Explain this analogy.', hint: 'Compare the external field patterns.', expectedConcepts: ['similar field pattern', 'magnetic moment', 'dipole field'], estimatedTime: '4 min' },
          ],
          misconceptions: [
            { id: 'ch5-t1-m1', probe: 'Magnetic field lines start from the north pole and end at the south pole. True?', options: ['True — they start at N and end at S', 'Not exactly — field lines are closed loops, continuing through the magnet from S to N inside'], correctIndex: 1, correction: 'Magnetic field lines form closed loops. Outside the magnet they go N→S, but inside they continue from S→N. They have no start or end point.', detectKeywords: ['start at north', 'end at south', 'begin and end'] },
          ],
        },
        { id: 'ch5-t2', title: "Earth's Magnetism", duration: '10 min', difficulty: 'foundation', animationType: 'magneticFieldLab',
          learningObjectives: ['Explain elements of Earth\'s magnetic field', 'Define declination, dip, and horizontal component'],
          questions: [
            { id: 'ch5-t2-q1', text: 'The geographic north pole of the Earth is actually near the magnetic south pole. Explain why a compass needle\'s north pole points toward geographic north.', hint: 'Opposite poles attract.', expectedConcepts: ['magnetic south near geographic north', 'opposite poles attract', 'compass aligns with earth field'], estimatedTime: '3 min' },
            { id: 'ch5-t2-q2', text: 'Define the angle of declination and the angle of dip. How are they measured?', hint: 'Declination is horizontal, dip is vertical.', expectedConcepts: ['declination = angle between geographic and magnetic meridian', 'dip = angle with horizontal', 'dip circle'], estimatedTime: '3 min' },
          ],
          misconceptions: [
            { id: 'ch5-t2-m1', probe: 'The Earth\'s geographic north pole is also its magnetic north pole. True?', options: ['True — north is north', 'False — geographic north is near Earth\'s magnetic south pole'], correctIndex: 1, correction: 'The compass north pole is attracted toward geographic north because Earth\'s magnetic south pole is located near the geographic north pole.', detectKeywords: ['geographic north is magnetic north', 'same pole'] },
          ],
        },
        { id: 'ch5-t3', title: "Dia-, Para- and Ferromagnetic Materials", duration: '14 min', difficulty: 'core', animationType: 'magneticFieldLab',
          learningObjectives: ['Classify materials by magnetic behavior', 'Define magnetic susceptibility and permeability', 'Explain the Curie temperature and its significance'],
          questions: [
            { id: 'ch5-t3-q1', text: 'Classify the following as dia-, para- or ferromagnetic: copper, aluminium, iron, bismuth, oxygen. Explain the key difference between these three types.', hint: 'Think about how they respond to an external magnetic field.', expectedConcepts: ['diamagnetic repelled weakly', 'paramagnetic attracted weakly', 'ferromagnetic attracted strongly', 'correct classification'], estimatedTime: '4 min' },
            { id: 'ch5-t3-q2', text: 'What is the Curie temperature? What happens to a ferromagnetic material above this temperature?', hint: 'Thermal energy disrupts domain alignment.', expectedConcepts: ['becomes paramagnetic', 'domains randomize', 'thermal agitation overcomes alignment'], estimatedTime: '3 min' },
          ],
          misconceptions: [
            { id: 'ch5-t3-m1', probe: 'Diamagnetic materials are attracted by magnets, just weakly. True?', options: ['True — all materials are attracted by magnets', 'False — diamagnetic materials are weakly REPELLED by magnetic fields'], correctIndex: 1, correction: 'Diamagnetic materials are repelled, not attracted. They have negative susceptibility. Examples: bismuth, copper, water.', detectKeywords: ['attracted weakly', 'all attracted'] },
          ],
        },
        { id: 'ch5-t4', title: "Hysteresis", duration: '12 min', difficulty: 'advanced', animationType: 'magneticFieldLab',
          learningObjectives: ['Explain the B-H hysteresis curve', 'Define retentivity and coercivity', 'Select materials for transformer cores vs permanent magnets'],
          questions: [
            { id: 'ch5-t4-q1', text: 'What is magnetic hysteresis? Why does the B-H curve form a loop instead of retracing the same path?', hint: 'The magnetization lags behind the applied field.', expectedConcepts: ['magnetization lags', 'domain walls resist movement', 'energy dissipation', 'retentivity and coercivity'], estimatedTime: '4 min' },
            { id: 'ch5-t4-q2', text: 'Why is soft iron preferred for transformer cores while steel is used for permanent magnets?', hint: 'Compare their hysteresis loops.', expectedConcepts: ['soft iron narrow loop low loss', 'steel wide loop high retentivity', 'energy loss per cycle'], estimatedTime: '3 min' },
          ],
          misconceptions: [
            { id: 'ch5-t4-m1', probe: 'A material with high retentivity is best for transformer cores. True?', options: ['True — high retentivity means strong magnet', 'False — transformer cores need LOW retentivity and LOW coercivity to minimize energy loss'], correctIndex: 1, correction: 'Transformer cores need easily reversible magnetization (narrow hysteresis loop). High retentivity means more energy wasted as heat per cycle.', detectKeywords: ['high retentivity for transformers', 'strong magnet for transformer'] },
          ],
        },
      ],
    },
    // ── Chapter 6 ─────────────────────────────────────
    {
      id: 'ch6', number: 6, title: "Electromagnetic Induction",
      topics: [
        { id: 'ch6-t1', title: "Faraday's Laws of Electromagnetic Induction", duration: '15 min', difficulty: 'foundation', animationType: 'faradayLaw',
          learningObjectives: ['State Faraday\'s laws of electromagnetic induction', 'Calculate induced EMF from rate of change of flux', 'Relate the negative sign to Lenz\'s law'],
          mcq: [
            { id: 'ch6-t1-mcq1', text: 'The magnitude of induced EMF is proportional to:', options: ['The magnetic flux', 'The rate of change of magnetic flux', 'The area of the coil', 'The resistance of the coil'], correctIndex: 1, explanation: 'Faraday\'s law: EMF = −NdΦ/dt. EMF depends on rate of change, not the flux itself.' },
          ],
          numerical: [
            { id: 'ch6-t1-num1', text: 'A coil of 200 turns has flux changing from 0.05 Wb to 0.01 Wb in 0.02 s. Find the induced EMF.', answer: 400, unit: 'V', solution: 'EMF = NΔΦ/Δt = 200 × (0.05−0.01)/0.02 = 200 × 2 = 400 V', hint: 'EMF = NΔΦ/Δt' },
          ],
          questions: [
            { id: 'ch6-t1-q1', text: 'State Faraday\'s law of electromagnetic induction. A coil of 100 turns has its flux changing at the rate of 0.02 Wb/s. Find the induced EMF.', hint: 'EMF = −N × dΦ/dt', expectedConcepts: ['EMF = -NdΦ/dt', '2V', 'rate of change of flux'], estimatedTime: '3 min' },
            { id: 'ch6-t1-q2', text: 'Why is the negative sign in Faraday\'s law important? What physical principle does it represent?', hint: 'It is related to Lenz\'s law.', expectedConcepts: ['Lenz law', 'opposes change', 'conservation of energy'], estimatedTime: '3 min' },
          ],
          misconceptions: [
            { id: 'ch6-t1-m1', probe: 'A stationary magnet near a coil induces an EMF as long as the magnet is present. True?', options: ['True — the magnet\'s field induces EMF', 'False — EMF is induced only when the flux is CHANGING'], correctIndex: 1, correction: 'EMF is induced only when there is a change in magnetic flux. A stationary magnet produces constant flux and hence zero EMF.', detectKeywords: ['always induces', 'magnet present means EMF'] },
          ],
        },
        { id: 'ch6-t2', title: "Lenz's Law", duration: '12 min', difficulty: 'core', animationType: 'faradayLaw',
          learningObjectives: ['State Lenz\'s law and relate it to conservation of energy', 'Predict direction of induced current using Lenz\'s law'],
          questions: [
            { id: 'ch6-t2-q1', text: 'A north pole of a magnet is pushed toward a coil. Predict the direction of induced current and explain using Lenz\'s law.', hint: 'The coil must oppose the approaching north pole.', expectedConcepts: ['current creates opposing north pole', 'opposes change in flux', 'conservation of energy'], estimatedTime: '4 min' },
          ],
          misconceptions: [
            { id: 'ch6-t2-m1', probe: 'The induced current supports the change in flux to maintain equilibrium. True?', options: ['True — it helps the change', 'False — it always OPPOSES the change in flux'], correctIndex: 1, correction: 'Lenz\'s law states that the induced current opposes the cause that produces it. If it aided the change, energy would be created from nothing.', detectKeywords: ['supports', 'aids', 'helps the change'] },
          ],
        },
        { id: 'ch6-t3', title: "Motional EMF", duration: '13 min', difficulty: 'core', animationType: 'faradayLaw',
          learningObjectives: ['Derive the expression for motional EMF (BLv)', 'Explain the energy source in motional EMF generation'],
          numerical: [
            { id: 'ch6-t3-num1', text: 'A 50 cm rod moves at 10 m/s perpendicular to a field of 0.4 T. Find the motional EMF.', answer: 2, unit: 'V', solution: 'EMF = BLv = 0.4 × 0.5 × 10 = 2 V', hint: 'EMF = BLv' },
          ],
          questions: [
            { id: 'ch6-t3-q1', text: 'A conducting rod of length L moves with velocity v perpendicular to a uniform magnetic field B. Derive the expression for the motional EMF.', hint: 'Think about the force on free electrons in the rod.', expectedConcepts: ['EMF = BLv', 'force on electrons', 'charge separation'], estimatedTime: '4 min' },
          ],
          misconceptions: [
            { id: 'ch6-t3-m1', probe: 'Motional EMF is generated because the magnetic field does work on the charges. True?', options: ['True — B does work on moving charges', 'False — the external agent moving the rod does the work'], correctIndex: 1, correction: 'The magnetic force is perpendicular to charge velocity and does no work. The external agent that moves the rod against the opposing force does the actual work.', detectKeywords: ['magnetic field does work', 'B does work'] },
          ],
        },
        { id: 'ch6-t4', title: "Self and Mutual Inductance", duration: '15 min', difficulty: 'advanced', animationType: 'faradayLaw',
          learningObjectives: ['Define self-inductance and its mechanical analogy', 'Define mutual inductance', 'Calculate induced EMF from changing current'],
          questions: [
            { id: 'ch6-t4-q1', text: 'Define self-inductance. Why is the inductor sometimes called an electrical analogue of inertia in mechanics?', hint: 'An inductor opposes change in current through it.', expectedConcepts: ['opposes change in current', 'L = NΦ/I', 'analogous to mass'], estimatedTime: '4 min' },
            { id: 'ch6-t4-q2', text: 'Two coils have mutual inductance M. If current in coil 1 changes at 5 A/s and induced EMF in coil 2 is 10V, find M.', hint: 'EMF = -M × dI/dt', expectedConcepts: ['M = 2H', 'EMF = MdI/dt', 'mutual coupling'], estimatedTime: '3 min' },
          ],
          misconceptions: [
            { id: 'ch6-t4-m1', probe: 'Self-inductance only exists when two coils are present. True?', options: ['True — you need two coils for inductance', 'False — a single coil has self-inductance'], correctIndex: 1, correction: 'Self-inductance is a property of a single coil. It opposes change in its own current. Mutual inductance requires two coils.', detectKeywords: ['needs two coils', 'only with two'] },
          ],
        },
        { id: 'ch6-t5', title: "Eddy Currents", duration: '10 min', difficulty: 'core', animationType: 'faradayLaw',
          learningObjectives: ['Explain the origin of eddy currents', 'List useful and harmful effects of eddy currents'],
          questions: [
            { id: 'ch6-t5-q1', text: 'What are eddy currents? Give one application where they are useful and one where they are undesirable.', hint: 'Think about braking systems and transformer cores.', expectedConcepts: ['circulating currents in bulk conductor', 'electromagnetic braking useful', 'transformer heating undesirable'], estimatedTime: '3 min' },
          ],
          misconceptions: [
            { id: 'ch6-t5-m1', probe: 'Eddy currents are always harmful and should be eliminated. True?', options: ['True — they waste energy', 'False — they are useful in applications like electromagnetic braking and induction cooktops'], correctIndex: 1, correction: 'While eddy currents cause energy loss in transformers, they are utilized in electromagnetic braking, induction heating, and metal detectors.', detectKeywords: ['always harmful', 'always bad'] },
          ],
        },
      ],
    },
    // ── Chapter 7 ─────────────────────────────────────
    {
      id: 'ch7', number: 7, title: "Alternating Current",
      topics: [
        { id: 'ch7-t1', title: "AC Voltage and Current", duration: '12 min', difficulty: 'foundation', animationType: 'acCircuit',
          learningObjectives: ['Relate peak, RMS, and average values of AC', 'Explain why RMS value is used for power calculations'],
          mcq: [
            { id: 'ch7-t1-mcq1', text: 'The RMS value of an AC current with peak value 10A is:', options: ['10 A', '7.07 A', '5 A', '14.14 A'], correctIndex: 1, explanation: 'I_rms = I₀/√2 = 10/1.414 ≈ 7.07 A.' },
          ],
          questions: [
            { id: 'ch7-t1-q1', text: 'What is the relationship between peak value and RMS value of an alternating current? Why is RMS value used in practice?', hint: 'RMS gives the equivalent DC value for heating effect.', expectedConcepts: ['Irms = I₀/√2', 'same heating effect as DC', 'average power'], estimatedTime: '3 min' },
          ],
          misconceptions: [
            { id: 'ch7-t1-m1', probe: 'The average value of AC over a complete cycle is equal to the RMS value. True?', options: ['True — average and RMS are the same', 'False — the average of AC over a complete cycle is ZERO'], correctIndex: 1, correction: 'The average value of a sinusoidal AC over one complete cycle is zero (positive and negative halves cancel). RMS is different from average.', detectKeywords: ['average equals RMS', 'same as RMS'] },
          ],
        },
        { id: 'ch7-t2', title: "AC through LCR Circuit and Resonance", duration: '18 min', difficulty: 'advanced', animationType: 'acCircuit',
          learningObjectives: ['Analyze impedance and phase in LCR circuits', 'Derive resonance frequency and its conditions', 'Construct phasor diagrams for LCR circuits'],
          numerical: [
            { id: 'ch7-t2-num1', text: 'An LCR circuit has L = 0.5 H and C = 2μF. Find the resonance frequency.', answer: 159, unit: 'Hz', solution: 'f = 1/(2π√LC) = 1/(2π√(0.5 × 2×10⁻⁶)) ≈ 159 Hz', hint: 'f = 1/(2π√LC)' },
          ],
          questions: [
            { id: 'ch7-t2-q1', text: 'In a series LCR circuit, at what frequency does resonance occur? What happens to the impedance at resonance?', hint: 'XL = XC at resonance.', expectedConcepts: ['f = 1/2π√LC', 'impedance minimum = R', 'current maximum'], estimatedTime: '4 min' },
            { id: 'ch7-t2-q2', text: 'Explain with a phasor diagram why current leads voltage in a purely capacitive circuit.', hint: 'Capacitor needs current to flow first to build up voltage.', expectedConcepts: ['current leads by 90°', 'phasor diagram', 'I = CdV/dt'], estimatedTime: '4 min' },
          ],
          misconceptions: [
            { id: 'ch7-t2-m1', probe: 'At resonance in an LCR circuit, the voltage across L and C are both zero. True?', options: ['True — they cancel out so both are zero', 'False — they are equal and opposite, individually they can be very large'], correctIndex: 1, correction: 'At resonance, VL and VC are individually large but equal and opposite, so they cancel. Neither is zero individually.', detectKeywords: ['both zero', 'no voltage across L or C'] },
          ],
        },
        { id: 'ch7-t3', title: "Power in AC Circuits", duration: '12 min', difficulty: 'core', animationType: 'acCircuit',
          learningObjectives: ['Define power factor and its significance', 'Calculate average power in AC circuits', 'Explain wattless current in purely reactive circuits'],
          questions: [
            { id: 'ch7-t3-q1', text: 'What is the power factor of an AC circuit? For what type of circuit is the power factor zero, and what does that mean physically?', hint: 'Power factor = cosφ. Think about purely reactive circuits.', expectedConcepts: ['cosφ', 'zero for purely L or C', 'no power dissipated', 'wattless current'], estimatedTime: '4 min' },
          ],
          misconceptions: [
            { id: 'ch7-t3-m1', probe: 'A circuit with power factor zero consumes no energy at all. True?', options: ['False — some energy is always consumed', 'True — zero power factor means zero average power dissipation'], correctIndex: 1, correction: 'When cosφ = 0 (purely reactive circuit), average power = VIcosφ = 0. Energy oscillates between source and reactive element but is not dissipated.', detectKeywords: ['always consumes', 'some energy consumed'] },
          ],
        },
        { id: 'ch7-t4', title: "Transformers", duration: '14 min', difficulty: 'core', animationType: 'acCircuit',
          learningObjectives: ['Explain the working principle of a transformer', 'Calculate turns ratio and its effect on voltage/current', 'Explain why transformers require AC'],
          mcq: [
            { id: 'ch7-t4-mcq1', text: 'A step-up transformer increases voltage. The current in the secondary coil:', options: ['Also increases', 'Decreases', 'Remains same', 'Becomes zero'], correctIndex: 1, explanation: 'Power is conserved: V₁I₁ = V₂I₂. If V increases, I must decrease.' },
          ],
          questions: [
            { id: 'ch7-t4-q1', text: 'A step-up transformer increases voltage. Does this violate conservation of energy? Explain what happens to the current.', hint: 'Power in ≈ Power out for ideal transformer.', expectedConcepts: ['current decreases proportionally', 'P = VI constant', 'no energy violation'], estimatedTime: '3 min' },
            { id: 'ch7-t4-q2', text: 'Why do transformers not work with DC? What would happen if DC is applied to the primary?', hint: 'Think about what is needed for electromagnetic induction.', expectedConcepts: ['constant flux no EMF induced', 'needs changing flux', 'AC only'], estimatedTime: '3 min' },
          ],
          misconceptions: [
            { id: 'ch7-t4-m1', probe: 'A step-up transformer creates extra energy by increasing voltage. True?', options: ['True — it multiplies energy', 'False — it increases voltage but decreases current, keeping power constant'], correctIndex: 1, correction: 'A transformer converts voltage level while keeping power approximately constant. Higher voltage means proportionally lower current.', detectKeywords: ['creates energy', 'multiplies energy', 'free energy'] },
          ],
        },
        { id: 'ch7-t5', title: "LC Oscillations", duration: '12 min', difficulty: 'advanced', animationType: 'acCircuit',
          learningObjectives: ['Describe energy exchange in LC oscillations', 'Draw the analogy with mechanical oscillations'],
          questions: [
            { id: 'ch7-t5-q1', text: 'Describe the energy exchange between the inductor and capacitor during LC oscillations. What is the analogy with a mechanical system?', hint: 'Compare with a mass-spring system.', expectedConcepts: ['electric to magnetic energy', 'analogous to KE and PE', 'mass-spring oscillation'], estimatedTime: '4 min' },
          ],
          misconceptions: [
            { id: 'ch7-t5-m1', probe: 'In LC oscillations, energy is dissipated as heat in each cycle. True for ideal LC?', options: ['True — oscillations always lose energy', 'False — in an ideal LC circuit with no resistance, oscillations continue forever with no energy loss'], correctIndex: 1, correction: 'An ideal LC circuit has no resistance, so no energy is dissipated. Real circuits have some resistance causing damping.', detectKeywords: ['always lose energy', 'energy lost in ideal'] },
          ],
        },
      ],
    },
    // ── Chapter 8 ─────────────────────────────────────
    {
      id: 'ch8', number: 8, title: "Electromagnetic Waves",
      topics: [
        { id: 'ch8-t1', title: "Displacement Current and Maxwell's Equations", duration: '14 min', difficulty: 'advanced', animationType: 'emWave',
          learningObjectives: ['Explain the inconsistency Maxwell found in Ampere\'s law', 'Define displacement current and its physical significance'],
          questions: [
            { id: 'ch8-t1-q1', text: 'What problem did Maxwell identify with Ampere\'s circuital law, and how did he resolve it by introducing displacement current?', hint: 'Think about a charging capacitor.', expectedConcepts: ['inconsistency during charging', 'displacement current', 'changing electric field'], estimatedTime: '4 min' },
          ],
          misconceptions: [
            { id: 'ch8-t1-m1', probe: 'Displacement current involves actual movement of charges through the dielectric. True?', options: ['True — charges flow through the gap', 'False — it is due to changing electric field, no actual charge flow'], correctIndex: 1, correction: 'Displacement current is not a real current of moving charges. It arises from the time-varying electric field between the plates.', detectKeywords: ['actual charges', 'charges flow through', 'real current'] },
          ],
        },
        { id: 'ch8-t2', title: "Electromagnetic Spectrum", duration: '12 min', difficulty: 'foundation', animationType: 'emWave',
          learningObjectives: ['Arrange EM waves by frequency/wavelength', 'Identify sources, properties, and applications of each type'],
          mcq: [
            { id: 'ch8-t2-mcq1', text: 'Which of the following has the highest frequency?', options: ['Radio waves', 'Microwaves', 'X-rays', 'Gamma rays'], correctIndex: 3, explanation: 'Gamma rays have the highest frequency (and shortest wavelength) in the EM spectrum.' },
          ],
          questions: [
            { id: 'ch8-t2-q1', text: 'Arrange the following in order of increasing frequency: microwaves, X-rays, visible light, radio waves, gamma rays. Give one application of each.', hint: 'Lower frequency = longer wavelength.', expectedConcepts: ['radio < micro < visible < X-ray < gamma', 'applications for each'], estimatedTime: '4 min' },
            { id: 'ch8-t2-q2', text: 'All electromagnetic waves travel at the same speed in vacuum. How is this possible when they have different wavelengths?', hint: 'c = fλ. If c is constant, f and λ are inversely related.', expectedConcepts: ['c = fλ', 'higher frequency shorter wavelength', 'speed independent of frequency in vacuum'], estimatedTime: '3 min' },
          ],
          misconceptions: [
            { id: 'ch8-t2-m1', probe: 'Radio waves travel slower than gamma rays in vacuum. True?', options: ['True — gamma rays are more energetic so faster', 'False — all EM waves travel at the same speed c in vacuum'], correctIndex: 1, correction: 'All electromagnetic waves travel at c = 3×10⁸ m/s in vacuum regardless of frequency or energy.', detectKeywords: ['gamma faster', 'different speeds', 'energy means faster'] },
          ],
        },
        { id: 'ch8-t3', title: "Properties of EM Waves", duration: '10 min', difficulty: 'core', animationType: 'emWave',
          learningObjectives: ['Explain the transverse nature of EM waves', 'State that EM waves do not require a medium'],
          questions: [
            { id: 'ch8-t3-q1', text: 'Show that electromagnetic waves are transverse in nature. What oscillates in an EM wave?', hint: 'E and B are perpendicular to the direction of propagation.', expectedConcepts: ['E and B perpendicular to direction', 'transverse', 'no medium needed'], estimatedTime: '3 min' },
          ],
          misconceptions: [
            { id: 'ch8-t3-m1', probe: 'Electromagnetic waves need a material medium to propagate. True?', options: ['True — like sound waves', 'False — EM waves can travel through vacuum'], correctIndex: 1, correction: 'Unlike sound, electromagnetic waves do not need a medium. They propagate through vacuum via oscillating electric and magnetic fields.', detectKeywords: ['need medium', 'require medium', 'like sound'] },
          ],
        },
        { id: 'ch8-t4', title: "Energy and Momentum of EM Waves", duration: '10 min', difficulty: 'advanced', animationType: 'emWave',
          learningObjectives: ['Calculate energy and momentum carried by EM waves', 'Explain radiation pressure'],
          questions: [
            { id: 'ch8-t4-q1', text: 'EM waves carry both energy and momentum. If an EM wave is absorbed by a surface, what happens in terms of momentum transfer?', hint: 'Radiation pressure exists.', expectedConcepts: ['momentum = U/c', 'radiation pressure', 'force on surface'], estimatedTime: '3 min' },
          ],
          misconceptions: [
            { id: 'ch8-t4-m1', probe: 'EM waves carry energy but not momentum. True?', options: ['True — only particles carry momentum', 'False — EM waves carry both energy and momentum'], correctIndex: 1, correction: 'EM waves carry momentum p = U/c. This is demonstrated by radiation pressure, which can push on surfaces.', detectKeywords: ['no momentum', 'only energy'] },
          ],
        },
      ],
    },
    ...CHAPTERS_9_TO_14,
  ],
}

// ── Helper accessors ──────────────────────────────────
export function getChapter(chapterId) {
  return PHYSICS_CLASS_12.chapters.find(c => c.id === chapterId) ?? null
}

export function getTopic(chapterId, topicId) {
  const ch = getChapter(chapterId)
  return ch?.topics.find(t => t.id === topicId) ?? null
}

export function getAllChapters() {
  return PHYSICS_CLASS_12.chapters
}

export function getTopicQuestions(chapterId, topicId) {
  return getTopic(chapterId, topicId)?.questions ?? []
}

export function getTopicMisconceptions(chapterId, topicId) {
  return getTopic(chapterId, topicId)?.misconceptions ?? []
}
