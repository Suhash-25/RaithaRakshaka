/** Chapters 9–14 of Class 12 Physics NCERT */
export const CHAPTERS_9_TO_14 = [
  { id:'ch9', number:9, title:'Ray Optics and Optical Instruments', topics:[
    { id:'ch9-t1', title:'Reflection and Refraction', duration:'14 min', difficulty:'foundation', animationType:'rayOptics',
      learningObjectives: ['Apply Snell\'s law to calculate angle of refraction', 'Explain total internal reflection with real-world examples', 'Calculate apparent depth using refractive index'],
      mcq: [
        { id:'ch9-t1-mcq1', text:'When light passes from water (n=1.33) to air (n=1), the refracted ray bends:', options:['Toward the normal','Away from the normal','Does not bend','Along the normal'], correctIndex:1, explanation:'Light bends away from normal when going from denser (water) to rarer (air) medium.' },
      ],
      numerical: [
        { id:'ch9-t1-num1', text:'A ray of light enters glass (n=1.5) from air at an angle of incidence 30°. Find the angle of refraction.', answer:19.47, unit:'°', solution:'sinθr = sin30°/1.5 = 0.5/1.5 = 0.333, θr = 19.47°', hint:'Use Snell\'s law: n₁sinθ₁ = n₂sinθ₂' },
      ],
      questions:[
        { id:'ch9-t1-q1', text:'A ray of light passes from glass (n=1.5) to water (n=1.33). Will the ray bend toward or away from the normal? Explain using Snell\'s law.', hint:'Compare refractive indices.', expectedConcepts:['bends away','denser to rarer','Snell\'s law n1sinθ1=n2sinθ2'], estimatedTime:'3 min' },
        { id:'ch9-t1-q2', text:'Why does a swimming pool appear shallower than it actually is? Explain with a ray diagram.', hint:'Light bends as it exits water.', expectedConcepts:['refraction at surface','apparent depth','n=real/apparent'], estimatedTime:'3 min' },
      ],
      misconceptions:[
        { id:'ch9-t1-m1', probe:'Light always bends toward the normal when entering any new medium. True?', options:['True','False — it bends toward normal only when entering a denser medium'], correctIndex:1, correction:'Light bends toward the normal only when going from a rarer to denser medium. It bends away when going from denser to rarer.', detectKeywords:['always toward normal'] },
      ],
    },
    { id:'ch9-t2', title:'Total Internal Reflection', duration:'12 min', difficulty:'core', animationType:'rayOptics',
      learningObjectives: ['State the conditions for total internal reflection', 'Derive the critical angle formula', 'Explain applications like optical fibre and mirage'],
      questions:[
        { id:'ch9-t2-q1', text:'What conditions are necessary for total internal reflection? Why can\'t it occur when light goes from rarer to denser medium?', hint:'Think about the critical angle.', expectedConcepts:['denser to rarer','angle > critical angle','no refracted ray'], estimatedTime:'4 min' },
      ],
      misconceptions:[
        { id:'ch9-t2-m1', probe:'Total internal reflection can occur when light travels from air to glass. True?', options:['True','False — it only occurs from denser to rarer medium'], correctIndex:1, correction:'TIR requires light to travel from an optically denser to a rarer medium at an angle exceeding the critical angle.', detectKeywords:['air to glass','rarer to denser'] },
      ],
    },
    { id:'ch9-t3', title:'Lenses and Mirror Formula', duration:'15 min', difficulty:'core', animationType:'rayOptics',
      learningObjectives: ['Apply mirror and lens formulae to locate images', 'Derive the lens-maker\'s formula', 'Determine magnification and nature of image'],
      numerical: [
        { id:'ch9-t3-num1', text:'An object is placed 30 cm from a convex lens of focal length 20 cm. Find the image distance.', answer:60, unit:'cm', solution:'1/v - 1/u = 1/f → 1/v = 1/20 - 1/(-30) = 1/20 + 1/30 = 5/60 = 1/12. Wait, 1/v = 1/f + 1/u = 1/20 + 1/30 ... Actually using 1/v - 1/u = 1/f: 1/v = 1/20 + 1/(-30) ... Let me recalculate: 1/v = 1/f + 1/u = 1/20 - 1/30 = 1/60. v = 60 cm.', hint:'Use lens formula: 1/v - 1/u = 1/f' },
      ],
      questions:[
        { id:'ch9-t3-q1', text:'An object is placed between F and 2F of a convex lens. Describe the nature, position, and size of the image formed.', hint:'Use ray diagram or lens formula.', expectedConcepts:['beyond 2F','real inverted','magnified'], estimatedTime:'3 min' },
        { id:'ch9-t3-q2', text:'Derive the lens maker\'s formula relating focal length to radii of curvature and refractive index.', hint:'Apply refraction at two spherical surfaces.', expectedConcepts:['1/f = (n-1)(1/R1 - 1/R2)','two refractions','thin lens'], estimatedTime:'5 min' },
      ],
      misconceptions:[
        { id:'ch9-t3-m1', probe:'A convex lens always forms a magnified image. True?', options:['True','False — it depends on object position'], correctIndex:1, correction:'A convex lens forms diminished images when object is beyond 2F, same size at 2F, and magnified between F and 2F.', detectKeywords:['always magnified','always bigger'] },
      ],
    },
    { id:'ch9-t4', title:'Prism and Dispersion', duration:'12 min', difficulty:'core', animationType:'rayOptics',
      learningObjectives: ['Explain dispersion of white light through a prism', 'Relate deviation to wavelength/refractive index'],
      mcq: [
        { id:'ch9-t4-mcq1', text:'In dispersion by a prism, which colour deviates the most?', options:['Red','Yellow','Green','Violet'], correctIndex:3, explanation:'Violet has the shortest wavelength and highest refractive index, causing maximum deviation.' },
      ],
      questions:[
        { id:'ch9-t4-q1', text:'White light enters a glass prism and splits into colors. Why does violet light deviate more than red?', hint:'Different wavelengths have different refractive indices.', expectedConcepts:['violet higher n','dispersion','shorter wavelength more deviation'], estimatedTime:'3 min' },
      ],
      misconceptions:[
        { id:'ch9-t4-m1', probe:'The prism adds color to white light. True?', options:['True — prism creates colors','False — white light already contains all colors; the prism separates them'], correctIndex:1, correction:'White light is a mixture of all visible wavelengths. The prism separates them because each wavelength refracts differently.', detectKeywords:['creates color','adds color','prism makes color'] },
      ],
    },
    { id:'ch9-t5', title:'Optical Instruments — Microscope', duration:'12 min', difficulty:'advanced', animationType:'rayOptics',
      learningObjectives: ['Explain magnifying power of simple and compound microscopes', 'Derive expression for total magnification'],
      questions:[
        { id:'ch9-t5-q1', text:'Explain the working of a compound microscope. Why does it use two convex lenses?', hint:'Objective creates a magnified real image; eyepiece magnifies it further.', expectedConcepts:['two-stage magnification','objective near object','eyepiece as magnifier'], estimatedTime:'4 min' },
      ],
      misconceptions:[
        { id:'ch9-t5-m1', probe:'A single convex lens gives the same magnification as a compound microscope. True?', options:['True','False — compound microscope multiplies magnifications of two lenses'], correctIndex:1, correction:'A compound microscope achieves much higher magnification by multiplying the individual magnifications of objective and eyepiece.', detectKeywords:['single lens same'] },
      ],
    },
    { id:'ch9-t6', title:'Optical Instruments — Telescope', duration:'12 min', difficulty:'advanced', animationType:'rayOptics',
      learningObjectives: ['Compare refracting and reflecting telescopes', 'Explain why large aperture improves resolution and brightness'],
      questions:[
        { id:'ch9-t6-q1', text:'In an astronomical telescope, the objective has a large aperture and large focal length. Explain why both are important.', hint:'Large aperture collects more light; large focal length gives higher magnification.', expectedConcepts:['light gathering','angular magnification = fo/fe','resolving power'], estimatedTime:'4 min' },
      ],
      misconceptions:[
        { id:'ch9-t6-m1', probe:'A telescope magnifies objects by making them appear closer. True?', options:['True — it brings objects closer','It increases the angular size, not the actual distance'], correctIndex:1, correction:'A telescope increases the angle subtended by a distant object at the eye (angular magnification), not the actual distance.', detectKeywords:['brings closer','moves object'] },
      ],
    },
  ]},
  { id:'ch10', number:10, title:'Wave Optics', topics:[
    { id:'ch10-t1', title:'Huygens Principle', duration:'12 min', difficulty:'foundation', animationType:'waveOptics',
      learningObjectives: ['State Huygens\' principle of secondary wavelets', 'Use Huygens\' construction to explain reflection and refraction'],
      questions:[
        { id:'ch10-t1-q1', text:'State Huygens principle. How does it explain the laws of reflection and refraction?', hint:'Each point on a wavefront acts as a source of secondary wavelets.', expectedConcepts:['secondary wavelets','new wavefront as envelope','explains refraction by speed change'], estimatedTime:'4 min' },
      ],
      misconceptions:[
        { id:'ch10-t1-m1', probe:'Huygens principle works only for light waves. True?', options:['True','False — it applies to all types of waves'], correctIndex:1, correction:'Huygens principle is a general wave construction applicable to sound, water, and all other waves too.', detectKeywords:['only light','only for light'] },
      ],
    },
    { id:'ch10-t2', title:'Young\'s Double Slit Experiment', duration:'16 min', difficulty:'core', animationType:'waveOptics',
      learningObjectives: ['Derive the expression for fringe width', 'Explain conditions for constructive and destructive interference'],
      mcq: [
        { id:'ch10-t2-mcq1', text:'In YDSE, if the wavelength is doubled, the fringe width:', options:['Halves','Doubles','Remains same','Quadruples'], correctIndex:1, explanation:'β = λD/d. Doubling λ doubles β.' },
      ],
      numerical: [
        { id:'ch10-t2-num1', text:'In YDSE, slits are 0.5 mm apart, screen is 1 m away, and wavelength is 600 nm. Find the fringe width.', answer:1.2, unit:'mm', solution:'β = λD/d = 600×10⁻⁹ × 1 / (0.5×10⁻³) = 1.2×10⁻³ m = 1.2 mm', hint:'β = λD/d' },
      ],
      questions:[
        { id:'ch10-t2-q1', text:'In Young\'s experiment, what happens to the fringe width if the slit separation is doubled? Derive the expression for fringe width.', hint:'β = λD/d', expectedConcepts:['fringe width halves','β = λD/d','inversely proportional to d'], estimatedTime:'4 min' },
        { id:'ch10-t2-q2', text:'If white light is used instead of monochromatic light in YDSE, what pattern is observed?', hint:'Each color has different fringe width.', expectedConcepts:['central white fringe','colored fringes','overlap of patterns'], estimatedTime:'3 min' },
      ],
      misconceptions:[
        { id:'ch10-t2-m1', probe:'Interference proves that light is a particle. True?', options:['True','False — interference is a wave phenomenon'], correctIndex:1, correction:'Interference (constructive and destructive superposition) is a definitive wave property. It was key evidence for the wave nature of light.', detectKeywords:['particle','proves particle'] },
      ],
    },
    { id:'ch10-t3', title:'Diffraction', duration:'14 min', difficulty:'core', animationType:'waveOptics',
      learningObjectives: ['Distinguish diffraction from interference', 'Explain single-slit diffraction pattern'],
      questions:[
        { id:'ch10-t3-q1', text:'How is diffraction different from interference? Why is diffraction more noticeable when slit width is comparable to wavelength?', hint:'Diffraction is bending around obstacles.', expectedConcepts:['bending around edges','single slit vs double slit','slit width ≈ wavelength'], estimatedTime:'4 min' },
      ],
      misconceptions:[
        { id:'ch10-t3-m1', probe:'Diffraction only occurs with light, not with sound or water waves. True?', options:['True','False — all waves exhibit diffraction'], correctIndex:1, correction:'Diffraction is a universal wave phenomenon. Sound diffracts around corners, and water waves diffract around barriers.', detectKeywords:['only light','light only'] },
      ],
    },
    { id:'ch10-t4', title:'Polarization', duration:'12 min', difficulty:'core', animationType:'waveOptics',
      learningObjectives: ['Explain polarization as proof of transverse nature', 'State Malus\' law and Brewster\'s law'],
      mcq: [
        { id:'ch10-t4-mcq1', text:'Polarization is possible only for:', options:['Longitudinal waves','Transverse waves','Both types','Sound waves'], correctIndex:1, explanation:'Only transverse waves can be polarized; longitudinal waves oscillate along propagation direction.' },
      ],
      questions:[
        { id:'ch10-t4-q1', text:'What is polarization of light? Why can\'t sound waves be polarized?', hint:'Only transverse waves can be polarized.', expectedConcepts:['transverse wave property','E oscillates in one plane','sound is longitudinal'], estimatedTime:'3 min' },
      ],
      misconceptions:[
        { id:'ch10-t4-m1', probe:'Both transverse and longitudinal waves can be polarized. True?', options:['True','False — only transverse waves can be polarized'], correctIndex:1, correction:'Polarization restricts oscillation to one plane, which is only possible for transverse waves. Longitudinal waves oscillate along the propagation direction and cannot be polarized.', detectKeywords:['longitudinal can be polarized','both types'] },
      ],
    },
    { id:'ch10-t5', title:'Resolving Power', duration:'10 min', difficulty:'advanced', animationType:'waveOptics',
      learningObjectives: ['Define resolving power of microscope and telescope', 'Apply Rayleigh criterion'],
      questions:[
        { id:'ch10-t5-q1', text:'What limits the resolving power of a microscope? How can it be improved?', hint:'Rayleigh criterion and numerical aperture.', expectedConcepts:['diffraction limit','smaller wavelength better','larger aperture better'], estimatedTime:'3 min' },
      ],
      misconceptions:[
        { id:'ch10-t5-m1', probe:'Higher magnification always means better resolution. True?', options:['True','False — resolution is limited by diffraction, not magnification'], correctIndex:1, correction:'Beyond the diffraction limit, increasing magnification only enlarges a blurry image. Resolution depends on wavelength and aperture.', detectKeywords:['more magnification more resolution','always better'] },
      ],
    },
  ]},
  { id:'ch11', number:11, title:'Dual Nature of Radiation and Matter', topics:[
    { id:'ch11-t1', title:'Photoelectric Effect', duration:'15 min', difficulty:'foundation', animationType:'photoelectric',
      learningObjectives: ['State the experimental observations of photoelectric effect', 'Write and explain Einstein\'s photoelectric equation', 'Explain why wave theory fails to explain photoelectric effect'],
      mcq: [
        { id:'ch11-t1-mcq1', text:'The stopping potential in photoelectric effect depends on:', options:['Intensity of light','Frequency of light','Area of metal surface','Distance of source'], correctIndex:1, explanation:'Stopping potential depends on KE_max of photoelectrons, which depends on frequency (E = hf − φ), not intensity.' },
      ],
      numerical: [
        { id:'ch11-t1-num1', text:'Light of wavelength 400 nm falls on a metal with work function 2 eV. Find the maximum KE of photoelectrons. (h = 6.63×10⁻³⁴ Js)', answer:1.1, unit:'eV', solution:'E = hc/λ = (6.63×10⁻³⁴ × 3×10⁸)/(400×10⁻⁹) = 4.97×10⁻¹⁹ J = 3.1 eV. KE = E − φ = 3.1 − 2 = 1.1 eV', hint:'KE_max = hf − φ' },
      ],
      questions:[
        { id:'ch11-t1-q1', text:'Light of frequency above the threshold falls on a metal surface. Explain why increasing intensity increases current but NOT the maximum kinetic energy of photoelectrons.', hint:'Each photon ejects one electron.', expectedConcepts:['more photons more electrons','KE depends on frequency','intensity = number of photons'], estimatedTime:'4 min' },
        { id:'ch11-t1-q2', text:'Write Einstein\'s photoelectric equation and explain each term.', hint:'Energy of photon = work function + KE.', expectedConcepts:['hf = φ + KEmax','threshold frequency','work function'], estimatedTime:'3 min' },
      ],
      misconceptions:[
        { id:'ch11-t1-m1', probe:'Brighter light always causes photoelectric emission regardless of color/frequency. True?', options:['True — more light means more energy','False — frequency must exceed threshold regardless of intensity'], correctIndex:1, correction:'No matter how intense, light below the threshold frequency cannot cause photoemission. Each photon must individually have enough energy.', detectKeywords:['brighter always works','more light always'] },
      ],
    },
    { id:'ch11-t2', title:'Wave-Particle Duality', duration:'12 min', difficulty:'core', animationType:'photoelectric',
      learningObjectives: ['State de Broglie\'s hypothesis', 'Calculate de Broglie wavelength of particles'],
      numerical: [
        { id:'ch11-t2-num1', text:'Calculate the de Broglie wavelength of an electron accelerated through 100 V. (m = 9.1×10⁻³¹ kg)', answer:0.123, unit:'nm', solution:'λ = h/√(2meV) = 6.63×10⁻³⁴/√(2×9.1×10⁻³¹×1.6×10⁻¹⁹×100) = 1.23×10⁻¹⁰ m = 0.123 nm', hint:'λ = h/√(2meV)' },
      ],
      questions:[
        { id:'ch11-t2-q1', text:'State de Broglie\'s hypothesis. Calculate the de Broglie wavelength of an electron accelerated through 100V.', hint:'λ = h/p = h/√(2meV)', expectedConcepts:['λ = h/mv','matter waves','λ ≈ 0.123 nm'], estimatedTime:'4 min' },
      ],
      misconceptions:[
        { id:'ch11-t2-m1', probe:'Only microscopic particles like electrons have wave nature. A cricket ball also has a wavelength. True?', options:['False — only electrons have waves','True — all matter has a wavelength, but for large objects it is immeasurably small'], correctIndex:1, correction:'De Broglie\'s hypothesis applies to ALL matter. A cricket ball has a wavelength, but it is so tiny (~10⁻³⁴ m) that wave effects are undetectable.', detectKeywords:['only electrons','only microscopic'] },
      ],
    },
    { id:'ch11-t3', title:'Davisson-Germer Experiment', duration:'10 min', difficulty:'core', animationType:'photoelectric',
      learningObjectives: ['Describe the experimental setup and results', 'Explain how it confirmed de Broglie\'s hypothesis'],
      questions:[
        { id:'ch11-t3-q1', text:'How did the Davisson-Germer experiment confirm de Broglie\'s hypothesis?', hint:'Electron diffraction pattern matched predicted wavelength.', expectedConcepts:['electron diffraction','nickel crystal','wavelength matched de Broglie'], estimatedTime:'4 min' },
      ],
      misconceptions:[
        { id:'ch11-t3-m1', probe:'The Davisson-Germer experiment proved electrons are only waves, not particles. True?', options:['True','False — it showed electrons have wave properties too, confirming duality'], correctIndex:1, correction:'The experiment confirmed wave-particle duality: electrons exhibit wave behavior (diffraction) while still being particles.', detectKeywords:['only waves','not particles'] },
      ],
    },
    { id:'ch11-t4', title:'Photon Properties', duration:'10 min', difficulty:'advanced', animationType:'photoelectric',
      learningObjectives: ['Describe energy, momentum, and zero rest mass of photons', 'Apply E = hf and p = h/λ'],
      questions:[
        { id:'ch11-t4-q1', text:'A photon has energy E = hf. Does it have mass? Explain the relationship between photon momentum and wavelength.', hint:'Photons are massless but carry momentum p = h/λ.', expectedConcepts:['zero rest mass','p = h/λ = E/c','massless but has momentum'], estimatedTime:'3 min' },
      ],
      misconceptions:[
        { id:'ch11-t4-m1', probe:'Since photons have momentum, they must have mass. True?', options:['True — momentum requires mass','False — photons are massless; their momentum comes from energy (p=E/c)'], correctIndex:1, correction:'In relativity, momentum does not require mass. For photons: p = E/c = h/λ, with zero rest mass.', detectKeywords:['must have mass','photon has mass'] },
      ],
    },
  ]},
  { id:'ch12', number:12, title:'Atoms', topics:[
    { id:'ch12-t1', title:'Rutherford\'s Model and Alpha Scattering', duration:'14 min', difficulty:'foundation', animationType:'atomModel',
      learningObjectives: ['Describe Rutherford\'s alpha scattering experiment', 'Draw conclusions about atomic structure from the results'],
      questions:[
        { id:'ch12-t1-q1', text:'In Rutherford\'s alpha scattering experiment, most alpha particles pass straight through the gold foil. What does this tell us about atomic structure?', hint:'Most of the atom is empty space.', expectedConcepts:['mostly empty space','small dense nucleus','positive charge concentrated'], estimatedTime:'3 min' },
      ],
      misconceptions:[
        { id:'ch12-t1-m1', probe:'In Rutherford\'s model, electrons orbit the nucleus in fixed stable orbits. True?', options:['True','False — Rutherford\'s model could not explain stable orbits; that was Bohr\'s contribution'], correctIndex:1, correction:'Rutherford\'s model predicted electrons should spiral into the nucleus (radiating energy). Bohr introduced quantized stable orbits.', detectKeywords:['Rutherford stable orbits','Rutherford explained orbits'] },
      ],
    },
    { id:'ch12-t2', title:'Bohr\'s Model of Hydrogen Atom', duration:'16 min', difficulty:'core', animationType:'atomModel',
      learningObjectives: ['State Bohr\'s postulates', 'Derive the expression for energy levels of hydrogen', 'Calculate transition energies and corresponding wavelengths'],
      mcq: [
        { id:'ch12-t2-mcq1', text:'The energy of an electron in the nth orbit of hydrogen is:', options:['Proportional to n²','-13.6/n² eV','Proportional to n','-13.6n² eV'], correctIndex:1, explanation:'En = -13.6/n² eV. Energy becomes less negative (increases) as n increases.' },
      ],
      questions:[
        { id:'ch12-t2-q1', text:'State Bohr\'s postulates. Why is angular momentum quantized in Bohr\'s model?', hint:'L = nh/2π', expectedConcepts:['quantized orbits','L = nh/2π','stationary states no radiation'], estimatedTime:'4 min' },
        { id:'ch12-t2-q2', text:'Calculate the energy of an electron in the 3rd orbit of hydrogen. What happens when it jumps to the 1st orbit?', hint:'En = -13.6/n² eV', expectedConcepts:['-1.51 eV','emits photon','energy difference = photon energy'], estimatedTime:'4 min' },
      ],
      misconceptions:[
        { id:'ch12-t2-m1', probe:'In Bohr\'s model, the electron can orbit at any distance from the nucleus. True?', options:['True — any distance is allowed','False — only specific discrete orbits are allowed'], correctIndex:1, correction:'Bohr\'s key insight was that only specific orbits (where angular momentum is quantized) are allowed. This explained discrete spectral lines.', detectKeywords:['any distance','any orbit','continuous orbits'] },
      ],
    },
    { id:'ch12-t3', title:'Hydrogen Spectrum', duration:'12 min', difficulty:'core', animationType:'atomModel',
      learningObjectives: ['Name spectral series and their spectral regions', 'Apply the Rydberg formula to calculate wavelengths'],
      numerical: [
        { id:'ch12-t3-num1', text:'Calculate the wavelength of the first line of the Balmer series (transition n=3 to n=2). R = 1.097×10⁷ /m', answer:656, unit:'nm', solution:'1/λ = R(1/2² - 1/3²) = R(1/4 - 1/9) = R × 5/36 = 1.097×10⁷ × 5/36 = 1.524×10⁶. λ = 656 nm', hint:'Use Rydberg formula: 1/λ = R(1/n₁² - 1/n₂²)' },
      ],
      questions:[
        { id:'ch12-t3-q1', text:'Name the spectral series of hydrogen. Which series lies in the visible region and why?', hint:'Balmer series transitions end at n=2.', expectedConcepts:['Lyman UV','Balmer visible','Paschen IR','transitions to n=2'], estimatedTime:'4 min' },
      ],
      misconceptions:[
        { id:'ch12-t3-m1', probe:'Hydrogen emits a continuous spectrum of all colors. True?', options:['True','False — hydrogen emits discrete spectral lines at specific wavelengths'], correctIndex:1, correction:'Hydrogen produces a line spectrum (discrete wavelengths) because electrons transition between quantized energy levels.', detectKeywords:['continuous spectrum','all colors','all wavelengths'] },
      ],
    },
    { id:'ch12-t4', title:'Limitations of Bohr\'s Model', duration:'10 min', difficulty:'advanced', animationType:'atomModel',
      learningObjectives: ['Identify the shortcomings of Bohr\'s model', 'Explain why quantum mechanics was needed'],
      questions:[
        { id:'ch12-t4-q1', text:'Why does Bohr\'s model fail for atoms with more than one electron? What improvements does quantum mechanics provide?', hint:'Electron-electron interactions are not accounted for.', expectedConcepts:['only works for hydrogen-like','no multi-electron','quantum mechanics uses wavefunctions'], estimatedTime:'4 min' },
      ],
      misconceptions:[
        { id:'ch12-t4-m1', probe:'Bohr\'s model accurately predicts spectra of all elements. True?', options:['True','False — it only works for hydrogen and hydrogen-like ions'], correctIndex:1, correction:'Bohr\'s model works only for single-electron systems. Multi-electron atoms require quantum mechanical treatment.', detectKeywords:['all elements','every element','universal'] },
      ],
    },
  ]},
  { id:'ch13', number:13, title:'Nuclei', topics:[
    { id:'ch13-t1', title:'Nuclear Size and Composition', duration:'12 min', difficulty:'foundation', animationType:'nuclearPhysics',
      learningObjectives: ['Relate nuclear radius to mass number using R = R₀A^(1/3)', 'Explain why nuclear density is constant'],
      questions:[
        { id:'ch13-t1-q1', text:'The radius of a nucleus is given by R = R₀A^(1/3). What does this tell us about nuclear density?', hint:'Volume ∝ A, mass ∝ A, so density is constant.', expectedConcepts:['density is constant','independent of A','~10¹⁷ kg/m³'], estimatedTime:'3 min' },
      ],
      misconceptions:[
        { id:'ch13-t1-m1', probe:'Heavier nuclei are denser than lighter ones. True?', options:['True','False — nuclear density is approximately constant for all nuclei'], correctIndex:1, correction:'Since R ∝ A^(1/3), volume ∝ A, and mass ∝ A, the density m/V is approximately the same for all nuclei.', detectKeywords:['heavier denser','larger more dense'] },
      ],
    },
    { id:'ch13-t2', title:'Mass-Energy Equivalence and Binding Energy', duration:'15 min', difficulty:'core', animationType:'nuclearPhysics',
      learningObjectives: ['Define mass defect and relate it to binding energy', 'Interpret the binding energy per nucleon curve', 'Explain stability conditions using BE/A'],
      mcq: [
        { id:'ch13-t2-mcq1', text:'Which element has the highest binding energy per nucleon?', options:['Hydrogen','Helium','Iron (Fe-56)','Uranium'], correctIndex:2, explanation:'Iron-56 has the maximum BE/A (≈8.8 MeV), making it the most stable nucleus.' },
      ],
      questions:[
        { id:'ch13-t2-q1', text:'What is mass defect? How is it related to the binding energy of a nucleus?', hint:'E = Δmc²', expectedConcepts:['mass of parts > mass of nucleus','Δm = mass defect','BE = Δmc²'], estimatedTime:'4 min' },
        { id:'ch13-t2-q2', text:'The binding energy per nucleon curve peaks around iron (A≈56). What does this imply for fusion and fission?', hint:'Moving toward iron releases energy.', expectedConcepts:['iron most stable','light nuclei fuse','heavy nuclei fission','both release energy'], estimatedTime:'4 min' },
      ],
      misconceptions:[
        { id:'ch13-t2-m1', probe:'Mass defect means some nucleons disappear when a nucleus is formed. True?', options:['True — nucleons are lost','False — all nucleons remain; mass is converted to binding energy'], correctIndex:1, correction:'No nucleons disappear. The "missing mass" is converted to energy (E=mc²) that holds the nucleus together.', detectKeywords:['nucleons disappear','nucleons lost','missing nucleons'] },
      ],
    },
    { id:'ch13-t3', title:'Radioactivity — Alpha, Beta, Gamma', duration:'14 min', difficulty:'core', animationType:'nuclearPhysics',
      learningObjectives: ['Compare properties of alpha, beta, and gamma radiation', 'Write nuclear reaction equations for each type'],
      mcq: [
        { id:'ch13-t3-mcq1', text:'Which radiation has the highest penetrating power?', options:['Alpha','Beta','Gamma','All are equal'], correctIndex:2, explanation:'Gamma rays are most penetrating (can pass through lead), while alpha is stopped by paper.' },
      ],
      questions:[
        { id:'ch13-t3-q1', text:'Compare alpha, beta, and gamma radiation in terms of nature, charge, penetrating power, and ionizing power.', hint:'Alpha is most ionizing but least penetrating.', expectedConcepts:['alpha = He nucleus','beta = electron','gamma = photon','penetration order'], estimatedTime:'4 min' },
      ],
      misconceptions:[
        { id:'ch13-t3-m1', probe:'Gamma rays are the most ionizing form of radiation. True?', options:['True — gamma is most dangerous','False — alpha particles have the highest ionizing power'], correctIndex:1, correction:'Alpha particles, being heavy and doubly charged, have the highest ionizing power. Gamma rays are most penetrating but least ionizing.', detectKeywords:['gamma most ionizing','gamma strongest ionization'] },
      ],
    },
    { id:'ch13-t4', title:'Radioactive Decay Law and Half-life', duration:'14 min', difficulty:'core', animationType:'nuclearPhysics',
      learningObjectives: ['Derive the radioactive decay law N = N₀e^(−λt)', 'Calculate remaining activity after n half-lives'],
      numerical: [
        { id:'ch13-t4-num1', text:'A radioactive sample has activity 800 Bq. After 3 half-lives, what is its activity?', answer:100, unit:'Bq', solution:'After 3 half-lives: A = 800 × (1/2)³ = 800/8 = 100 Bq', hint:'A = A₀ × (1/2)^n' },
      ],
      questions:[
        { id:'ch13-t4-q1', text:'The half-life of a radioactive substance is 10 days. What fraction remains after 30 days?', hint:'After n half-lives, fraction = (1/2)ⁿ.', expectedConcepts:['3 half-lives','1/8 remains','exponential decay'], estimatedTime:'3 min' },
      ],
      misconceptions:[
        { id:'ch13-t4-m1', probe:'After two half-lives, all the radioactive material has decayed. True?', options:['True','False — after 2 half-lives, 1/4 still remains'], correctIndex:1, correction:'After each half-life, half the remaining material decays. After 2 half-lives: 1/2 × 1/2 = 1/4 remains. It never fully reaches zero.', detectKeywords:['all decayed','nothing left','completely gone'] },
      ],
    },
    { id:'ch13-t5', title:'Nuclear Fission and Fusion', duration:'14 min', difficulty:'advanced', animationType:'nuclearPhysics',
      learningObjectives: ['Compare fission and fusion processes', 'Explain why fusion requires high temperatures (Coulomb barrier)', 'Relate both to the BE/A curve'],
      questions:[
        { id:'ch13-t5-q1', text:'Why does nuclear fusion require extremely high temperatures while fission can be initiated by slow neutrons?', hint:'Protons repel each other — you need energy to overcome Coulomb barrier.', expectedConcepts:['Coulomb barrier','thermal energy overcomes repulsion','neutrons are neutral no barrier'], estimatedTime:'4 min' },
      ],
      misconceptions:[
        { id:'ch13-t5-m1', probe:'Nuclear fusion produces radioactive waste similar to fission. True?', options:['True','False — fusion produces far less radioactive waste than fission'], correctIndex:1, correction:'Fusion of light nuclei (like hydrogen isotopes) produces helium and neutrons, with far less long-lived radioactive waste compared to fission.', detectKeywords:['same waste','similar waste','equal waste'] },
      ],
    },
  ]},
  { id:'ch14', number:14, title:'Semiconductor Electronics', topics:[
    { id:'ch14-t1', title:'Intrinsic and Extrinsic Semiconductors', duration:'14 min', difficulty:'foundation', animationType:'semiconductor',
      learningObjectives: ['Distinguish intrinsic from extrinsic semiconductors', 'Explain n-type and p-type doping mechanisms'],
      mcq: [
        { id:'ch14-t1-mcq1', text:'In a p-type semiconductor, the majority charge carriers are:', options:['Electrons','Holes','Protons','Neutrons'], correctIndex:1, explanation:'p-type doping with trivalent atoms creates holes as majority carriers.' },
      ],
      questions:[
        { id:'ch14-t1-q1', text:'Explain the difference between intrinsic and extrinsic semiconductors. Why does adding a pentavalent impurity create an n-type semiconductor?', hint:'Pentavalent atoms have one extra electron.', expectedConcepts:['pure vs doped','extra electron is free','n-type majority carrier electron'], estimatedTime:'4 min' },
      ],
      misconceptions:[
        { id:'ch14-t1-m1', probe:'An n-type semiconductor is negatively charged. True?', options:['True — it has extra electrons','False — it is electrically neutral; the extra electrons come with extra protons in the dopant'], correctIndex:1, correction:'Doping adds neutral atoms. The semiconductor remains electrically neutral. "n-type" refers to the type of majority charge carrier, not overall charge.', detectKeywords:['negatively charged','net negative','has negative charge'] },
      ],
    },
    { id:'ch14-t2', title:'p-n Junction Diode', duration:'15 min', difficulty:'core', animationType:'semiconductor',
      learningObjectives: ['Explain formation of depletion region', 'Analyze forward and reverse bias V-I characteristics', 'Identify threshold/knee voltage'],
      questions:[
        { id:'ch14-t2-q1', text:'Explain the formation of the depletion region at a p-n junction. Why does current flow easily in forward bias but not in reverse bias?', hint:'The depletion region acts as a barrier.', expectedConcepts:['diffusion of carriers','immobile ions form barrier','forward bias narrows depletion','reverse bias widens'], estimatedTime:'4 min' },
        { id:'ch14-t2-q2', text:'Draw the V-I characteristics of a p-n junction diode. Why is the curve non-linear?', hint:'Below threshold voltage, very little current flows.', expectedConcepts:['threshold/knee voltage','exponential rise','non-ohmic'], estimatedTime:'3 min' },
      ],
      misconceptions:[
        { id:'ch14-t2-m1', probe:'No current flows through a reverse-biased diode. True?', options:['True — zero current','False — a very small reverse saturation current flows due to minority carriers'], correctIndex:1, correction:'A small reverse saturation current flows due to thermally generated minority carriers. It is very small but not zero.', detectKeywords:['zero current','no current at all','absolutely zero'] },
      ],
    },
    { id:'ch14-t3', title:'Diode as Rectifier', duration:'12 min', difficulty:'core', animationType:'semiconductor',
      learningObjectives: ['Compare half-wave and full-wave rectification', 'Explain the role of filter capacitors'],
      questions:[
        { id:'ch14-t3-q1', text:'Explain how a full-wave rectifier works using two diodes and a center-tapped transformer. Why is it preferred over half-wave?', hint:'Both halves of AC cycle are utilized.', expectedConcepts:['both halves used','smoother output','higher efficiency'], estimatedTime:'4 min' },
      ],
      misconceptions:[
        { id:'ch14-t3-m1', probe:'A rectifier converts DC to AC. True?', options:['True','False — a rectifier converts AC to DC'], correctIndex:1, correction:'A rectifier converts AC to pulsating DC. The reverse process (DC to AC) is done by an inverter.', detectKeywords:['DC to AC','converts direct to alternating'] },
      ],
    },
    { id:'ch14-t4', title:'Transistor and its Characteristics', duration:'16 min', difficulty:'advanced', animationType:'semiconductor',
      learningObjectives: ['Explain transistor action in common-emitter configuration', 'Define current gain β and voltage gain'],
      questions:[
        { id:'ch14-t4-q1', text:'In a common-emitter transistor circuit, explain why a small change in base current causes a large change in collector current.', hint:'Current amplification factor β.', expectedConcepts:['β = IC/IB','thin base region','most carriers reach collector','amplification'], estimatedTime:'4 min' },
      ],
      misconceptions:[
        { id:'ch14-t4-m1', probe:'A transistor generates extra current to amplify signals. True?', options:['True — it creates current','False — it controls a larger current from the power supply using a small input current'], correctIndex:1, correction:'A transistor does not create energy. It uses a small base current to control a much larger current flowing from the power supply through the collector.', detectKeywords:['generates current','creates current','makes extra'] },
      ],
    },
    { id:'ch14-t5', title:'Logic Gates', duration:'12 min', difficulty:'core', animationType:'semiconductor',
      learningObjectives: ['Draw truth tables for basic logic gates (AND, OR, NOT, NAND, NOR)', 'Explain why NAND and NOR are called universal gates'],
      mcq: [
        { id:'ch14-t5-mcq1', text:'The universal gates are:', options:['AND, OR','NOT, XOR','NAND, NOR','AND, NOT'], correctIndex:2, explanation:'NAND and NOR are universal because any logic function can be built using only NAND or only NOR gates.' },
      ],
      questions:[
        { id:'ch14-t5-q1', text:'Construct an OR gate using NAND gates only. Why are NAND and NOR gates called universal gates?', hint:'Any logic function can be built from NAND alone.', expectedConcepts:['universal gate','any function from NAND','combination circuit'], estimatedTime:'4 min' },
      ],
      misconceptions:[
        { id:'ch14-t5-m1', probe:'An AND gate gives output 1 when any one input is 1. True?', options:['True','False — AND gives 1 only when ALL inputs are 1'], correctIndex:1, correction:'AND requires all inputs to be 1 for output 1. The gate that gives 1 when any input is 1 is the OR gate.', detectKeywords:['any one input','one input is enough'] },
      ],
    },
  ]},
]
