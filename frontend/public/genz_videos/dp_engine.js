const P=new URLSearchParams(location.search);
const sub=(P.get('subject')||'').toLowerCase();
const title=P.get('title')||'Learning Module';
const lang=P.get('lang')||'english';
const ti=parseInt(P.get('ti')||'0');
const ch=parseInt(P.get('ch')||'1');
const tKey=title.toLowerCase().trim();
const cls=parseInt(P.get('cls')||'9');
// lv: 0=primary(1-3), 1=upper(4-5), 2=middle(6-8), 3=secondary(9-10), 4=senior(11-12)
const lv=cls<=3?0:cls<=5?1:cls<=8?2:cls<=10?3:4;
const LV_LABELS=['Primary','Upper Primary','Middle School','Secondary','Senior Secondary'];

// Per-topic colour palette shifts — topic 0 blue, 1 purple, 2 green, 3 amber, 4 red, 5+ indigo
const PALETTES=[
  {accent:'#22d3ee',grad:'135deg,#0ea5e9,#6366f1'},
  {accent:'#f0abfc',grad:'135deg,#a855f7,#ec4899'},
  {accent:'#4ade80',grad:'135deg,#22c55e,#06b6d4'},
  {accent:'#fbbf24',grad:'135deg,#f59e0b,#ef4444'},
  {accent:'#f87171',grad:'135deg,#ef4444,#f97316'},
  {accent:'#818cf8',grad:'135deg,#6366f1,#22d3ee'},
];
const pal=PALETTES[Math.min(ti,PALETTES.length-1)];

// Topic-specific content overrides
const TOVERRIDE={
  'irrational numbers':{s2:`<h2 style="color:#fff">Irrational Numbers</h2>${['√2, √3, π — cannot be expressed as p/q (q≠0)','Decimal: non-terminating, non-repeating','√2 = 1.41421356… never repeats','Proof: assume √2=p/q → contradiction'].map(t=>`<div class="card">${t}</div>`).join('')}`,s3:`<h2 style="color:#fff">Proof √2 is Irrational</h2><div class="eq" style="color:#22d3ee">Assume √2 = p/q (lowest terms)</div><div class="eq" style="color:#f0abfc">⟹ 2q² = p²  ⟹  p is even</div><div class="eq" style="color:#4ade80">⟹ q is also even — contradiction!</div><div class="eq" style="color:#fbbf24">∴ √2 ∉ ℚ (Irrational)</div>`},
  'real numbers and their decimal expansions':{s2:`<h2 style="color:#fff">Decimal Expansions</h2>${['Terminating: 7/4 = 1.75','Non-terminating repeating: 1/3 = 0.333…','Non-terminating non-repeating: π, √2 (irrational)','Rational ↔ terminating or repeating decimal'].map(t=>`<div class="card">${t}</div>`).join('')}`,s3:`<h2 style="color:#fff">Classification</h2><div class="bar-wrap">${[['Terminating','#22d3ee'],['Repeating','#f0abfc'],['Irrational','#fbbf24']].map(([l,c])=>`<div style="text-align:center"><div class="bar" style="background:${c};height:clamp(40px,8vw,100px)"></div><div style="color:${c};font-size:clamp(10px,1.3vw,14px);margin-top:8px;font-weight:700">${l}</div></div>`).join('')}</div>`},
  'euclid\'s division lemma':{s2:`<h2 style="color:#fff">Euclid's Division Lemma</h2><div class="eq" style="font-size:clamp(28px,5vw,60px);font-weight:900;color:#22d3ee">a = bq + r</div>${['a = dividend, b = divisor','q = quotient, 0 ≤ r < b','17 ÷ 5: 17 = 5×3 + 2','Used to find HCF efficiently'].map(t=>`<div class="card">${t}</div>`).join('')}`,s3:`<h2 style="color:#fff">Euclid's Algorithm for HCF</h2>${['Step 1: a = bq + r','Step 2: b becomes new a, r becomes new b','Step 3: Repeat until r = 0','Step 4: Last b = HCF'].map((t,i)=>`<div class="card"><strong style="color:#22d3ee">0${i+1}</strong> ${t}</div>`).join('')}`},
  'polynomials in one variable':{s2:`<h2 style="color:#fff">Polynomial Basics</h2><div class="eq" style="color:#f0abfc;font-size:clamp(22px,4vw,48px)">p(x) = aₙxⁿ + … + a₁x + a₀</div>${['Degree = highest power of variable','Monomial: 3x² | Binomial: x+1 | Trinomial: x²+x+1','Linear (deg 1), Quadratic (deg 2), Cubic (deg 3)'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'zeroes of a polynomial':{s2:`<h2 style="color:#fff">Zeroes of a Polynomial</h2>${['Zero of p(x) = value of x where p(x) = 0','p(x) = x − 3  →  zero is x = 3','Geometrically: where graph crosses x-axis','Linear polynomial has 1 zero, quadratic has at most 2'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'ohm\'s law':{s2:`<h2 style="color:#fff">Ohm's Law</h2><div class="eq" style="font-size:clamp(36px,7vw,90px);font-weight:900;color:#22d3ee">V = I × R</div>${['V = Voltage (Volts)','I = Current (Amperes)','R = Resistance (Ohms Ω)','V-I graph is a straight line'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'electric charge':{s2:`<h2 style="color:#fff">Electric Charge</h2>${['SI Unit: Coulomb (C)','Positive (+) and Negative (−) charges','Like charges repel, unlike attract','Quantised: q = ne, e = 1.6×10⁻¹⁹ C','Conserved: total charge in closed system constant'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'coulomb\'s law':{s2:`<h2 style="color:#fff">Coulomb's Law</h2><div class="eq" style="color:#60a5fa;font-size:clamp(24px,4vw,52px);font-weight:900">F = kq₁q₂/r²</div>${['k = 9×10⁹ N·m²/C²','Force ∝ product of charges','Force ∝ 1/r² (inverse square law)','Acts along the line joining the two charges'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'newton\'s second law of motion':{s2:`<h2 style="color:#fff">F = ma</h2><div class="eq" style="color:#60a5fa;font-size:clamp(40px,8vw,96px);font-weight:900">F = m × a</div>${['F = Net Force (Newtons N)','m = Mass (kilograms kg)','a = Acceleration (m/s²)','Double the force → double the acceleration'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'newton\'s first law of motion':{s2:`<h2 style="color:#fff">Law of Inertia</h2><div class="card" style="color:#60a5fa;font-size:clamp(14px,1.8vw,20px);text-align:center">"An object at rest stays at rest, and an object in motion continues at the same velocity, unless acted upon by an unbalanced force."</div>${['Inertia = resistance to change in state','Greater mass = greater inertia','Seat belts protect against inertia in crashes'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'the fun they had':{s2:`<h2 style="color:#fff">The Fun They Had</h2>${['Author: Isaac Asimov (Science Fiction)','Setting: Year 2157 — futuristic homes','Tommy finds a real printed book — a wonder!','Margie studies with a mechanical teacher at home','Theme: Human connection in education is irreplaceable'].map(t=>`<div class="card">${t}</div>`).join('')}`,s3:`<h2 style="color:#fff">Literary Elements</h2>${['Character: Margie (curious student) & Tommy (older)','Conflict: Margie dislikes her mechanical teacher','Irony: Old school seems fun, new school is lonely','Mood: Nostalgic and thought-provoking'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'the last lesson':{s2:`<h2 style="color:#fff">The Last Lesson</h2>${['Author: Alphonse Daudet','Set in Alsace, France (Franco-Prussian War)','Germans ban French language in schools','M. Hamel gives his final passionate French lesson','Theme: Patriotism and value of mother tongue'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'the portrait of a lady':{s2:`<h2 style="color:#fff">The Portrait of a Lady</h2>${['Author: Khushwant Singh','A grandson\'s memories of his grandmother','Contrast: Village grandma vs city grandma','She fed dogs and sparrows — a symbol of kindness','Theme: Changing family structures and generation gap'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'dna as genetic material':{s2:`<h2 style="color:#fff">DNA as Genetic Material</h2>${['Griffith (1928): Discovered transforming principle','Avery, MacLeod & McCarty (1944): Transforming principle = DNA','Hershey & Chase (1952): Radioactive labelling — DNA carries genes','DNA replicates faithfully; proteins cannot'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'structure of dna':{s2:`<h2 style="color:#fff">DNA Double Helix</h2>${['Watson & Crick (1953) — Nobel Prize 1962','Two antiparallel strands twisted right-handed','A pairs with T (2 H-bonds); G pairs with C (3 H-bonds)','Sugar: Deoxyribose | Backbone: Phosphate-sugar'].map(t=>`<div class="card">${t}</div>`).join('')}`,s3:`<h2 style="color:#fff">B-DNA Parameters</h2>${[['Diameter','2 nm','#22d3ee'],['Pitch','3.4 nm','#4ade80'],['Base pairs/turn','10','#f0abfc'],['Rise/base pair','0.34 nm','#fbbf24']].map(([k,v,c])=>`<div class="card"><strong style="color:${c}">${k}</strong> → ${v}</div>`).join('')}`},
  'classes and objects':{s2:`<h2 style="color:#fff">OOP: Classes and Objects</h2>${['Class = Blueprint/Template (e.g. Dog blueprint)','Object = Instance of class (e.g. my_dog = Dog("Buddy"))','Attributes = Data/Properties','Methods = Functions/Behaviour','Encapsulation: data + behaviour together'].map(t=>`<div class="card">${t}</div>`).join('')}`,s3:`<h2 style="color:#fff">Python Class Example</h2><div style="background:#0d1117;border:1px solid rgba(99,102,241,.5);border-radius:16px;padding:clamp(12px,2.5vw,28px);max-width:580px;width:100%;text-align:left;font-family:monospace" class="eq"><span style="color:#ff79c6">class</span> <span style="color:#50fa7b">Dog</span>:<br>&nbsp;&nbsp;<span style="color:#ff79c6">def</span> <span style="color:#50fa7b">__init__</span>(self,name):<br>&nbsp;&nbsp;&nbsp;&nbsp;self.name = name<br>&nbsp;&nbsp;<span style="color:#ff79c6">def</span> <span style="color:#50fa7b">bark</span>(self):<br>&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#ff79c6">print</span>(<span style="color:#f1fa8c">"Woof!"</span>)</div>`},
  'inheritance':{s2:`<h2 style="color:#fff">Inheritance in OOP</h2>${['Child class inherits from Parent class','Syntax: class Child(Parent):','Avoids code duplication (DRY principle)','Types: Single, Multiple, Multilevel, Hierarchical','super() calls parent class constructor'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'types of relations':{s2:`<h2 style="color:#fff">Types of Relations</h2>${[['Reflexive','aRa for all a ∈ A','#22d3ee'],['Symmetric','aRb ⟹ bRa','#f0abfc'],['Transitive','aRb and bRc ⟹ aRc','#4ade80'],['Equivalence','Reflexive + Symmetric + Transitive','#fbbf24']].map(([n,d,c])=>`<div class="card"><strong style="color:${c}">${n}</strong> — ${d}</div>`).join('')}`,s3:`<h2 style="color:#fff">Example</h2><div class="eq" style="color:#22d3ee">R = {(1,1),(2,2),(3,3)} on A={1,2,3}</div><div class="card">This is Reflexive, Symmetric and Transitive → Equivalence Relation</div>`},
  'types of functions':{s2:`<h2 style="color:#fff">Types of Functions</h2>${[['One-One (Injective)','Different inputs → different outputs: f(a)=f(b) ⟹ a=b','#f0abfc'],['Onto (Surjective)','Every element in codomain has a pre-image','#4ade80'],['Bijective','Both One-One and Onto','#fbbf24'],['Many-One','Multiple inputs can map to same output','#f87171']].map(([n,d,c])=>`<div class="card"><strong style="color:${c}">${n}</strong> — ${d}</div>`).join('')}`},
  'composition of functions':{s2:`<h2 style="color:#fff">Composition of Functions</h2><div class="eq" style="color:#22d3ee;font-size:clamp(24px,4vw,52px)">(g∘f)(x) = g(f(x))</div>${['Apply f first, then apply g to the result','(g∘f)(x) ≠ (f∘g)(x) in general — not commutative','If f: A→B and g: B→C, then g∘f: A→C'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'invertible functions':{s2:`<h2 style="color:#fff">Invertible Functions</h2><div class="eq" style="color:#fbbf24;font-size:clamp(22px,4vw,48px)">f⁻¹(f(x)) = x</div>${['A function is invertible only if it is Bijective','f(x) = y  ⟺  f⁻¹(y) = x','The graph of f⁻¹ is reflection of f about y = x'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'continuity':{s2:`<h2 style="color:#fff">Continuity of a Function</h2><div class="eq" style="color:#22d3ee;font-size:clamp(18px,3vw,36px)">lim(x→a⁻) f(x) = lim(x→a⁺) f(x) = f(a)</div>${['Left-hand limit = Right-hand limit = Function value','Discontinuous if any of these 3 differ','Polynomials, sin, cos are everywhere continuous'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'differentiability':{s2:`<h2 style="color:#fff">Differentiability</h2><div class="eq" style="color:#f0abfc;font-size:clamp(18px,3vw,36px)">f'(a) = lim(h→0) [f(a+h)−f(a)] / h</div>${['Differentiable ⟹ Continuous (not vice versa)','|x| is continuous but not differentiable at x = 0','Every polynomial is differentiable everywhere'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'maxima and minima':{s2:`<h2 style="color:#fff">Maxima and Minima</h2>${['Find f\'(x) = 0 (critical points)','Second Derivative Test: f\'\'(x) < 0 → maxima, f\'\'(x) > 0 → minima','Absolute max/min: check critical points + endpoints'].map(t=>`<div class="card">${t}</div>`).join('')}`,s3:`<h2 style="color:#fff">First Derivative Test</h2>${['f\'(x) changes + to − at x=c → Local Maximum','f\'(x) changes − to + at x=c → Local Minimum','f\'(x) doesn\'t change sign → Point of Inflection'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'electric field':{s2:`<h2 style="color:#fff">Electric Field</h2><div class="eq" style="color:#60a5fa;font-size:clamp(28px,5vw,60px);font-weight:900">E = F / q₀</div>${['E = Electric field strength (N/C)','Direction: away from +ve charge, towards −ve charge','E due to point charge: E = kq/r²','Uniform field: E is same at all points'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'gauss\'s law':{s2:`<h2 style="color:#fff">Gauss\'s Law</h2><div class="eq" style="color:#22d3ee;font-size:clamp(22px,4vw,48px);font-weight:900">Φ = q/ε₀</div>${['Total electric flux through closed surface = q_enclosed / ε₀','ε₀ = 8.85 × 10⁻¹² C²/N·m²','Used to find E for symmetric charge distributions'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'electrostatic potential':{s2:`<h2 style="color:#fff">Electrostatic Potential</h2><div class="eq" style="color:#f0abfc;font-size:clamp(24px,4vw,52px);font-weight:900">V = kq/r</div>${['V = Work done per unit charge to bring test charge from ∞ to point','SI Unit: Volt (V) = Joule/Coulomb','Potential is scalar quantity','V due to multiple charges: V = ΣV_i'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'capacitors and capacitance':{s2:`<h2 style="color:#fff">Capacitance</h2><div class="eq" style="color:#22d3ee;font-size:clamp(28px,5vw,60px);font-weight:900">C = Q / V</div>${['C = Capacitance (Farads, F)','Q = Charge stored, V = Voltage across plates','Parallel plate: C = ε₀A/d','Dielectric increases capacitance by factor k'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'kirchhoff\'s laws':{s2:`<h2 style="color:#fff">Kirchhoff\'s Laws</h2>${[['KCL','Sum of currents at a junction = 0 (conservation of charge)','#22d3ee'],['KVL','Sum of EMFs in a loop = Sum of IR drops (conservation of energy)','#4ade80']].map(([n,d,c])=>`<div class="card"><strong style="color:${c}">${n}</strong> — ${d}</div>`).join('')}`,s3:`<h2 style="color:#fff">KVL Example</h2><div class="eq" style="color:#fbbf24">ε₁ − IR₁ − IR₂ − ε₂ = 0</div><div class="card">Traverse loop, add EMFs and subtract IR drops</div>`},
  'mole concept':{s2:`<h2 style="color:#fff">Mole Concept</h2><div class="eq" style="color:#4ade80;font-size:clamp(22px,4vw,48px);font-weight:900">1 mol = 6.022 × 10²³</div>${['Avogadro Number: Nₐ = 6.022 × 10²³','Molar mass = mass in grams of 1 mole','n = Given mass / Molar mass','1 mole of any gas at STP = 22.4 L'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'colligative properties':{s2:`<h2 style="color:#fff">Colligative Properties</h2>${['Relative lowering of vapour pressure: ΔP/P° = x_solute','Elevation of boiling point: ΔTb = Kb × m','Depression of freezing point: ΔTf = Kf × m','Osmotic pressure: π = iCRT'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'nernst equation':{s2:`<h2 style="color:#fff">Nernst Equation</h2><div class="eq" style="color:#4ade80;font-size:clamp(18px,2.5vw,32px);font-weight:900">E = E° − (RT/nF)lnQ</div>${['E = Cell EMF at non-standard conditions','E° = Standard EMF','n = moles of electrons transferred','F = Faraday constant = 96500 C/mol'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'pollination':{s2:`<h2 style="color:#fff">Pollination</h2>${[['Self-Pollination','Pollen from same flower/plant','#4ade80'],['Cross-Pollination','Pollen from different plant','#22d3ee'],['Agents','Wind (anemophily), Water (hydrophily), Insects (entomophily)','#f0abfc']].map(([n,d,c])=>`<div class="card"><strong style="color:${c}">${n}</strong> — ${d}</div>`).join('')}`},
  'double fertilisation':{s2:`<h2 style="color:#fff">Double Fertilisation</h2>${['Unique to angiosperms (flowering plants)','Pollen tube carries 2 male gametes','Gamete 1 + Egg → Zygote → Embryo','Gamete 2 + Polar nuclei → Primary Endosperm Nucleus (3n)'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'replication':{s2:`<h2 style="color:#fff">DNA Replication</h2>${['Semi-conservative model (Meselson & Stahl, 1958)','Each strand serves as template for new strand','Enzyme: DNA Polymerase (needs primer)','Direction: 5\' → 3\'  only','Leading strand: continuous | Lagging strand: Okazaki fragments'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'transcription':{s2:`<h2 style="color:#fff">Transcription (DNA → RNA)</h2>${['Template strand → mRNA via RNA Polymerase','A pairs with U (in RNA), T pairs with A','Three types of RNA: mRNA, tRNA, rRNA','Occurs in nucleus (prokaryotes: cytoplasm)'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'types of chemical reactions':{s2:`<h2 style="color:#fff">Types of Chemical Reactions</h2>${[['Combination','A + B → AB','#22d3ee'],['Decomposition','AB → A + B','#f0abfc'],['Displacement','A + BC → AC + B','#4ade80'],['Double Displacement','AB + CD → AD + CB','#fbbf24'],['Redox','Simultaneous oxidation & reduction','#f87171']].map(([n,d,c])=>`<div class="card"><strong style="color:${c}">${n}</strong>: ${d}</div>`).join('')}`},
  'spherical mirrors':{s2:`<h2 style="color:#fff">Mirror Formula</h2><div class="eq" style="color:#22d3ee;font-size:clamp(28px,5vw,60px);font-weight:900">1/f = 1/v + 1/u</div>${['f = focal length, v = image distance, u = object distance','Magnification: m = −v/u','Concave mirror: f is negative (by convention)','Convex mirror: always forms virtual, erect, diminished image'].map(t=>`<div class="card">${t}</div>`).join('')}`},
  'electric current and circuit':{s2:`<h2 style="color:#fff">Electric Current</h2><div class="eq" style="color:#60a5fa;font-size:clamp(28px,5vw,60px);font-weight:900">I = Q / t</div>${['I = Current (Amperes, A)','Q = Charge (Coulombs, C)','t = Time (seconds, s)','Conventional current flows + to −; electrons flow − to +'].map(t=>`<div class="card">${t}</div>`).join('')}`},
};

// Subject themes
const themes={
  mathematics:{bg:['#0a0e1a','#0d1b2a','#0a1628','#0d0a1e','#070d14'],accent:'#22d3ee',btn:'linear-gradient(135deg,#0ea5e9,#6366f1)'},
  hindi:{bg:['#1a0a0a','#1e0d0a','#150a05','#1a0d05','#100808'],accent:'#f97316',btn:'linear-gradient(135deg,#f97316,#ef4444)'},
  kannada:{bg:['#0a0a1a','#0d0a1e','#08080f','#0f0a20','#070710'],accent:'#a855f7',btn:'linear-gradient(135deg,#a855f7,#ec4899)'},
  physics:{bg:['#030d1a','#050e1c','#030b18','#040a14','#020810'],accent:'#60a5fa',btn:'linear-gradient(135deg,#3b82f6,#06b6d4)'},
  chemistry:{bg:['#0a0a00','#0d0f00','#080a00','#050800','#060806'],accent:'#4ade80',btn:'linear-gradient(135deg,#22c55e,#16a34a)'},
  biology:{bg:['#050f05','#060d06','#040c04','#030b03','#020a02'],accent:'#86efac',btn:'linear-gradient(135deg,#4ade80,#22d3ee)'},
  science:{bg:['#030d1a','#050e1c','#030b18','#040a14','#020810'],accent:'#60a5fa',btn:'linear-gradient(135deg,#3b82f6,#8b5cf6)'},
  computer:{bg:['#050010','#08001a','#06000e','#0a0018','#040010'],accent:'#818cf8',btn:'linear-gradient(135deg,#6366f1,#06b6d4)'},
  history:{bg:['#1a0e00','#180d00','#150b00','#120a00','#0f0800'],accent:'#fbbf24',btn:'linear-gradient(135deg,#f59e0b,#d97706)'},
  geography:{bg:['#001a0a','#00180a','#001508','#001206','#000f05'],accent:'#34d399',btn:'linear-gradient(135deg,#10b981,#059669)'},
  social:{bg:['#1a0e00','#180d00','#150b00','#120a00','#0f0800'],accent:'#fbbf24',btn:'linear-gradient(135deg,#f59e0b,#d97706)'},
  evs:{bg:['#001a0a','#00180a','#001508','#001206','#000f05'],accent:'#34d399',btn:'linear-gradient(135deg,#10b981,#059669)'},
  english:{bg:['#0f1735','#0d1530','#0b1228','#090f22','#070d1c'],accent:'#818cf8',btn:'linear-gradient(135deg,#6366f1,#a855f7)'},
  electronics:{bg:['#001a08','#001206','#051a00','#021000','#030e00'],accent:'#4ade80',btn:'linear-gradient(135deg,#16a34a,#22d3ee)'}
};

// Resolver functions
const getThemeFixed=()=>{
  const priority=['computer','electronics','mathematics','chemistry','biology','physics','geography','history','social','science','hindi','kannada','evs','english'];
  if(themes[sub]) return themes[sub];
  for(const k of priority){if(sub.includes(k))return themes[k]||themes.english;}
  return themes.english;
};

const getClassTheme = () => {
  const base = getThemeFixed();
  if (lv <= 1) {
    return {
      ...base,
      bg: base.bg.map(c => gsap.utils.interpolate(c, '#1a1a2e', 0.2)) 
    };
  }
  return base;
};
const th = getClassTheme();

// Content per subject
const content={
  mathematics:(()=>{
    const M=[
      // lv0: Class 1-3
      {s1:`<h2 style="background:linear-gradient(135deg,#f0abfc,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${title}</h2><div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-top:20px;font-size:clamp(32px,6vw,72px)">${['🍎','🍌','⭐','🎈','🔢'].map(e=>`<span>${e}</span>`).join('')}</div><p style="color:#f0abfc;font-size:clamp(13px,1.8vw,22px);margin-top:12px">Class ${cls} · Fun Maths · ${LV_LABELS[lv]}</p>`,
       s2:`<h2 style="color:#fff">Let's Count!</h2>${['Numbers help us count objects','1,2,3,4,5 — five fingers on your hand!','Shapes are everywhere: circle, square, triangle','Adding means putting things together'].map(t=>`<div class="card">${t}</div>`).join('')}`,
       s3:`<h2 style="color:#fff">Count Together</h2><div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:20px">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<div style="background:rgba(240,171,252,.2);border:2px solid #f0abfc;border-radius:50%;width:clamp(36px,6vw,64px);height:clamp(36px,6vw,64px);display:flex;align-items:center;justify-content:center;color:#f0abfc;font-size:clamp(16px,2.5vw,28px);font-weight:900;opacity:0;transform:scale(.3)" class="node">${n}</div>`).join('')}</div>`,
       s4:`<h2 style="color:#fff">Remember!</h2><div class="card" style="color:#f0abfc;text-align:center">Practice every day — count objects!</div>`,
       s5:`<div class="recap"><h2 style="background:linear-gradient(135deg,#f0abfc,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Great Work! 🌟</h2><p style="color:#e9d5ff;font-size:clamp(14px,2vw,22px);margin-top:12px">You learned <strong style="color:#f0abfc">${title}</strong>.</p></div>`},
      // lv1: Class 4-5
      {s1:`<h2 style="background:linear-gradient(135deg,#fb923c,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${title}</h2><div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-top:20px">${['×','÷','½','△','□'].map(s=>`<span style="background:rgba(251,146,60,.15);border:2px solid #fb923c;color:#fb923c;font-size:clamp(22px,4vw,52px);padding:10px 22px;border-radius:14px;font-weight:900">${s}</span>`).join('')}</div><p style="color:#fb923c;margin-top:14px;font-size:clamp(13px,1.8vw,20px)">Class ${cls} Maths · ${LV_LABELS[lv]}</p>`,
       s2:`<h2 style="color:#fff">Key Concepts</h2>${[`<strong style="color:#fb923c">${title}</strong> — Chapter ${ch}`,'Multiplication is repeated addition: 3×4 = 12','Fractions show parts of a whole','Geometry involves shapes and angles'].map(t=>`<div class="card">${t}</div>`).join('')}`,
       s3:`<h2 style="color:#fff">Multiplication Table — ${ch}</h2><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">${Array.from({length:10},(_,i)=>`<div style="background:rgba(251,146,60,.15);border:1px solid #fb923c;border-radius:10px;padding:8px 14px;color:#fb923c;font-weight:700;opacity:0;transform:scale(.5)" class="node">${ch}×${i+1}=${ch*(i+1)}</div>`).join('')}</div>`,
       s4:`<h2 style="color:#fff">Formula</h2><div class="eq" style="color:#fb923c">a × b = b × a</div>`,
       s5:`<div class="recap"><h2 style="background:linear-gradient(135deg,#fb923c,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Well Done!</h2><p style="color:#fed7aa;margin-top:12px">Completed <strong style="color:#fb923c">${title}</strong>.</p></div>`},
      // lv2: Class 6-8
      {s1:`<h2 style="background:linear-gradient(135deg,#4ade80,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${title}</h2><div style="font-family:monospace;font-size:clamp(15px,2.2vw,26px);color:#4ade80;background:rgba(0,0,0,.4);border:1px solid rgba(74,222,128,.4);border-radius:12px;padding:12px 22px;margin-top:18px">x + y = z &nbsp;|&nbsp; 2x − 5 = 0</div><p style="color:#06b6d4;margin-top:14px;font-size:clamp(13px,1.6vw,20px)">Class ${cls} Maths · ${LV_LABELS[lv]}</p>`,
       s2:`<h2 style="color:#fff">Algebraic Basics</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${[['Variables','Letters like x, y','#4ade80'],['Expression','Combo: 2x+3','#22d3ee'],['Equation','Balanced: 2x+3=7','#a78bfa'],['Integers','…-1,0,1…','#fb923c']].map(([n,d,c])=>`<div class="card" style="border-color:${c}44;opacity:0;transform:translateX(-40px)"><strong style="color:${c}">${n}</strong><br><span style="font-size:12px;color:#94a3b8">${d}</span></div>`).join('')}</div>`,
       s3:`<h2 style="color:#fff">Number Line</h2><div style="display:flex;align-items:center;margin:18px auto"><div style="flex:1;height:2px;background:#4ade80"></div>${['-2','-1','0','1','2'].map(v=>`<div style="display:flex;flex-direction:column;align-items:center" class="node"><div style="width:2px;height:10px;background:#4ade80"></div><span style="font-size:10px;color:#4ade80">${v}</span></div>`).join('')}<div style="flex:1;height:2px;background:#4ade80"></div></div>`,
       s4:`<h2 style="color:#fff">Identity</h2><div class="eq" style="color:#4ade80">a + (−a) = 0</div>`,
       s5:`<div class="recap"><h2 style="background:linear-gradient(135deg,#4ade80,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Excellent!</h2><p style="color:#bbf7d0;margin-top:12px">Mastered <strong style="color:#4ade80">${title}</strong>.</p></div>`},
      // lv3: Class 9-10
      {s1:`<h2 style="background:linear-gradient(135deg,#22d3ee,#6366f1);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${title}</h2><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:18px">${['x²+y²=r²','sin²θ+cos²θ=1'].map(eq=>`<div style="background:rgba(34,211,238,.1);border:1px solid rgba(34,211,238,.4);color:#22d3ee;padding:7px 16px;border-radius:18px;font-family:monospace">${eq}</div>`).join('')}</div><p style="color:#94a3b8;margin-top:14px">Class ${cls} Mathematics · ${LV_LABELS[lv]}</p>`,
       s2:`<h2 style="color:#fff">Core Equations</h2><div style="display:flex;flex-wrap:wrap;justify-content:center;gap:16px">${[['#22d3ee','x² + y² = r²'],['#f0abfc','a² + b² = c²'],['#fbbf24','f(x) = mx + b']].map(([c,eq])=>`<div class="eq" style="color:${c};opacity:0;transform:translateY(-20px)">${eq}</div>`).join('')}</div>`,
       s3:`<h2 style="color:#fff">Visualization</h2><div style="position:relative;width:60%;height:140px;border-left:2px solid #22d3ee;border-bottom:2px solid #22d3ee;margin:18px auto"><div style="position:absolute;bottom:0;left:0;width:100%;height:100%;display:flex;align-items:flex-end;gap:2px">${Array.from({length:10},(_,i)=>`<div style="flex:1;background:linear-gradient(to top,#22d3ee,#6366f1);height:${Math.sin(i+ch)*40+50}%;opacity:0;transform:scaleY(0);transform-origin:bottom" class="bar"></div>`).join('')}</div></div>`,
       s4:`<h2 style="color:#fff">Board Exam Tip</h2><div class="card">Master the standard forms and derivations for board exams.</div>`,
       s5:`<div class="recap"><h2 style="background:linear-gradient(135deg,#22d3ee,#6366f1);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Outstanding!</h2><p style="color:#e0f2fe;margin-top:12px">Completed <strong style="color:#22d3ee">${title}</strong>.</p></div>`},
      // lv4: Class 11-12
      {s1:`<h2 style="background:linear-gradient(135deg,#818cf8,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${title}</h2><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:18px">${['d/dx','∫f(x)dx','lim(x→0)'].map(eq=>`<div style="background:rgba(129,140,248,.1);border:1px solid rgba(129,140,248,.35);color:#818cf8;padding:7px 14px;border-radius:10px;font-family:monospace">${eq}</div>`).join('')}</div><p style="color:#94a3b8;margin-top:14px">Class ${cls} · ${LV_LABELS[lv]}</p>`,
       s2:`<h2 style="color:#fff">Advanced Calculus</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${[['Diff','Rate of change','#818cf8'],['Integ','Area under curve','#a855f7'],['Limits','Behaviour at point','#22d3ee'],['Matrices','Array operations','#4ade80']].map(([n,d,c])=>`<div class="card" style="border-color:${c}44;opacity:0;transform:translateX(-40px)"><strong style="color:${c}">${n}</strong><br><span style="font-size:11px;color:#94a3b8">${d}</span></div>`).join('')}</div>`,
       s3:`<h2 style="color:#fff">Formulae</h2><div style="background:#0d1117;border:1px solid #818cf866;border-radius:14px;padding:20px;font-family:monospace" class="eq"><div style="color:#818cf8">d/dx(sin x) = cos x</div><div style="color:#a855f7">∫eˣ dx = eˣ + C</div></div>`,
       s4:`<h2 style="color:#fff">Exam Focus</h2><div class="card" style="color:#818cf8">High weightage topic for JEE / NEET.</div>`,
       s5:`<div class="recap"><h2 style="background:linear-gradient(135deg,#818cf8,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Brilliant!</h2><p style="color:#e0e7ff;margin-top:12px">Mastered <strong style="color:#818cf8">${title}</strong>.</p></div>`}
    ];
    return M[lv];
  })(),

  science:(()=>{
    const SC=[
      // lv0: Class 1-3
      {s1:`<h2 style="background:linear-gradient(135deg,#4ade80,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${title}</h2><div style="font-size:48px;display:flex;gap:14px;justify-content:center;margin-top:18px">${['🌱','🐦','🌞','💧'].map(e=>`<span>${e}</span>`).join('')}</div><p style="color:#4ade80">Class ${cls} · Nature Study</p>`,
       s2:`<h2 style="color:#fff">Nature!</h2>${['Plants need sunlight and water','Animals grow and move','The Sun gives us light','Protect our Earth'].map(t=>`<div class="card">${t}</div>`).join('')}`,
       s3:`<h2 style="color:#fff">Classification</h2><div style="display:flex;gap:16px;justify-content:center">${[['🌿 Plants','Living','#4ade80'],['🪨 Stone','Non-Living','#f87171']].map(([e,l,c])=>`<div style="border:2px solid ${c};padding:12px;opacity:0;transform:scale(.5)" class="node">${e}<br><small>${l}</small></div>`).join('')}</div>`,
       s4:`<h2 style="color:#fff">Observe!</h2><div class="card">Look at the world around you — it's full of science!</div>`,
       s5:`<div class="recap"><h2 style="background:linear-gradient(135deg,#4ade80,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Great Explorer!</h2></div>`},
      // lv1: Class 4-5
      {s1:`<h2 style="background:linear-gradient(135deg,#34d399,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${title}</h2><p style="color:#06b6d4">Class ${cls} Science</p>`,
       s2:`<h2 style="color:#fff">Key Concepts</h2>${['Our body systems work together','Photosynthesis: how plants make food','Adaptation in animals','Environmental protection'].map(t=>`<div class="card">${t}</div>`).join('')}`,
       s3:`<h2 style="color:#fff">Organs</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${[['Heart','Circulatory','#f87171'],['Lungs','Respiratory','#06b6d4']].map(([n,d,c])=>`<div class="card" style="border-color:${c}44;opacity:0" class="node"><strong>${n}</strong>: ${d}</div>`).join('')}</div>`,
       s4:`<h2 style="color:#fff">Tip</h2><div class="card">Health is wealth — eat nutritious food!</div>`,
       s5:`<div class="recap"><h2 style="background:linear-gradient(135deg,#34d399,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Well Done!</h2></div>`},
      // lv2: Class 6-8
      {s1:`<h2 style="background:linear-gradient(135deg,#60a5fa,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${title}</h2><div style="display:flex;justify-content:center;margin-top:20px"><div style="width:60px;height:60px;border:3px solid #60a5fa;border-radius:50%;border-top-color:transparent;animation:spin 4s linear infinite"></div></div>`,
       s2:`<h2 style="color:#fff">Physics & Biology</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${[['Force','Push or Pull','#60a5fa'],['Heat','Thermal Energy','#f87171'],['Light','Reflection/Refraction','#fbbf24'],['Cells','Basic unit of life','#4ade80']].map(([n,d,c])=>`<div class="card" style="border-color:${c}44;opacity:0" class="node"><strong style="color:${c}">${n}</strong><br>${d}</div>`).join('')}</div>`,
       s3:`<h2 style="color:#fff">Method</h2>${['1. Observation','2. Hypothesis','3. Experiment','4. Conclusion'].map(t=>`<div class="card">${t}</div>`).join('')}`,
       s4:`<h2 style="color:#fff">SI Unit</h2><div class="eq" style="color:#60a5fa">Speed = d / t (m/s)</div>`,
       s5:`<div class="recap"><h2 style="background:linear-gradient(135deg,#60a5fa,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Excellent!</h2></div>`},
      // lv3: Class 9-10
      {s1:`<h2 style="background:linear-gradient(135deg,#38bdf8,#6366f1);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${title}</h2><div style="display:flex;gap:10px;justify-content:center;font-family:monospace">${['F=ma','v=u+at'].map(e=>`<div style="border:1px solid #38bdf8;padding:5px 10px">${e}</div>`).join('')}</div>`,
       s2:`<h2 style="color:#fff">Core Principles</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${[['Motion','v=u+at','#38bdf8'],['Atoms','P+N+E','#4ade80'],['Chemical','Reactions','#f0abfc'],['Genetics','Inheritance','#fbbf24']].map(([n,d,c])=>`<div class="card" style="border-color:${c}44;opacity:0" class="node"><strong style="color:${c}">${n}</strong><br>${d}</div>`).join('')}</div>`,
       s3:`<h2 style="color:#fff">Equations</h2>${['v = u + at','s = ut + ½at²','v² = u² + 2as'].map(e=>`<div class="eq" style="color:#38bdf8">${e}</div>`).join('')}`,
       s4:`<h2 style="color:#fff">Board Tip</h2><div class="card">Understand derivations and solve numericals carefully.</div>`,
       s5:`<div class="recap"><h2 style="background:linear-gradient(135deg,#38bdf8,#6366f1);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Outstanding!</h2></div>`},
      // lv4: Class 11-12
      {s1:`<h2 style="background:linear-gradient(135deg,#818cf8,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${title}</h2><div style="display:flex;gap:10px;justify-content:center;font-family:monospace">${['ΔG=ΔH-TΔS','E=hν'].map(e=>`<div style="border:1px solid #818cf8;padding:5px 10px">${e}</div>`).join('')}</div>`,
       s2:`<h2 style="color:#fff">Advanced Concepts</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${[['Electro','Coulomb Law','#818cf8'],['Thermo','Gibbs Energy','#06b6d4'],['DNA','Replication','#4ade80'],['Quantum','Planck Law','#f0abfc']].map(([n,d,c])=>`<div class="card" style="border-color:${c}44;opacity:0" class="node"><strong style="color:${c}">${n}</strong><br>${d}</div>`).join('')}</div>`,
       s3:`<h2 style="color:#fff">Key Formulae</h2><div style="background:#0d1117;padding:20px;font-family:monospace;color:#818cf8">F = kq₁q₂/r²<br>E = hν</div>`,
       s4:`<h2 style="color:#fff">JEE/NEET Focus</h2><div class="card">In-depth conceptual clarity and graphical analysis.</div>`,
       s5:`<div class="recap"><h2 style="background:linear-gradient(135deg,#818cf8,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Brilliant!</h2></div>`}
    ];
    return SC[lv];
  })(),

  social:(()=>{
    const SS=[
      {s1:`<h2 style="color:#fbbf24">${title}</h2><div style="font-size:40px">🏠 👨‍👩‍👧 🏫</div>`,s2:`<h2 style="color:#fff">My World</h2>${['Family is my first school','School is for learning','Friends are special'].map(t=>`<div class="card">${t}</div>`).join('')}`,s3:`<div style="display:flex;gap:10px;justify-content:center">${['🤝 Helper','🍎 Food'].map(t=>`<div class="node">${t}</div>`).join('')}</div>`,s4:`<div class="card">Be kind to everyone!</div>`,s5:`<div class="recap">🌟 Well Done!</div>`},
      {s1:`<h2 style="color:#f59e0b">${title}</h2>`,s2:`<h2 style="color:#fff">My Country</h2>${['India: land of festivals','Many languages','Diverse culture'].map(t=>`<div class="card">${t}</div>`).join('')}`,s3:`<div style="display:flex;gap:10px;justify-content:center">${['🇮🇳 India','🗺️ Maps'].map(t=>`<div class="node">${t}</div>`).join('')}</div>`,s4:`<div class="card">Unity in Diversity!</div>`,s5:`<div class="recap">Great Job!</div>`},
      {s1:`<h2 style="color:#fbbf24">${title}</h2>`,s2:`<h2 style="color:#fff">History & Civics</h2>${['History teaches from past','Civics defines rights','Geography reveals resources'].map(t=>`<div class="card">${t}</div>`).join('')}`,s3:`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${['📜 History','⚖️ Civics','🌍 Geography','📈 Econ'].map(t=>`<div class="node">${t}</div>`).join('')}</div>`,s4:`<div class="card">Be a responsible citizen!</div>`,s5:`<div class="recap">Well Done!</div>`},
      {s1:`<h2 style="color:#f59e0b">${title}</h2>`,s2:`<h2 style="color:#fff">Constitution & Democracy</h2>${['Democratic values','Political systems','Global events'].map(t=>`<div class="card">${t}</div>`).join('')}`,s3:`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${['🗳️ Voting','📜 Rights','🤝 Peace','🏗️ Dev'].map(t=>`<div class="node">${t}</div>`).join('')}</div>`,s4:`<div class="card">Rule of Law is supreme.</div>`,s5:`<div class="recap">Outstanding!</div>`},
      {s1:`<h2 style="color:#f59e0b">${title}</h2>`,s2:`<h2 style="color:#fff">Advanced Humanities</h2>${['Historical analysis','Socio-economic impact','Geopolitics'].map(t=>`<div class="card">${t}</div>`).join('')}`,s3:`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${['🏛️ History','🗳️ PolSci','🗺️ Geo','📉 Eco'].map(t=>`<div class="node">${t}</div>`).join('')}</div>`,s4:`<div class="card">Critical thinking is key.</div>`,s5:`<div class="recap">Brilliant!</div>`}
    ];
    return SS[lv];
  })(),

  english:(()=>{
    const EG=[
      {s1:`<h2 style="color:#818cf8">${title}</h2><div style="font-size:40px">🔤 📖 ✍️</div>`,s2:`<h2 style="color:#fff">Story Time</h2>${['A, B, C... Z','Words make sentences','Reading is fun'].map(t=>`<div class="card">${t}</div>`).join('')}`,s3:`<div style="display:flex;gap:10px;justify-content:center">${['📖 Read','✍️ Write'].map(t=>`<div class="node">${t}</div>`).join('')}</div>`,s4:`<div class="card">Read every day!</div>`,s5:`<div class="recap">📖 Great Reader!</div>`},
      {s1:`<h2 style="color:#6366f1">${title}</h2>`,s2:`<h2 style="color:#fff">Grammar Fun</h2>${['Nouns & Verbs','Adjectives describe','Stories and Poems'].map(t=>`<div class="card">${t}</div>`).join('')}`,s3:`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${['Noun','Verb','Adj','Adv'].map(t=>`<div class="node">${t}</div>`).join('')}</div>`,s4:`<div class="card">Express yourself clearly!</div>`,s5:`<div class="recap">Well Done!</div>`},
      {s1:`<h2 style="color:#818cf8">${title}</h2>`,s2:`<h2 style="color:#fff">Literature</h2>${['Prose & Poetry','Figures of speech','Communication skills'].map(t=>`<div class="card">${t}</div>`).join('')}`,s3:`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${['Fiction','Poetry','Drama','Writing'].map(t=>`<div class="node">${t}</div>`).join('')}</div>`,s4:`<div class="card">"Literature is the art of words."</div>`,s5:`<div class="recap">Brilliant!</div>`},
      {s1:`<h2 style="color:#6366f1">${title}</h2>`,s2:`<h2 style="color:#fff">Analysis & Boards</h2>${['Critical appreciation','Themes & Subtext','Board prep'].map(t=>`<div class="card">${t}</div>`).join('')}`,s3:`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${['Critique','Theme','Context','Devices'].map(t=>`<div class="node">${t}</div>`).join('')}</div>`,s4:`<div class="card">Focus on clarity and depth.</div>`,s5:`<div class="recap">Outstanding!</div>`},
      {s1:`<h2 style="color:#6366f1">${title}</h2>`,s2:`<h2 style="color:#fff">Advanced Rhetoric</h2>${['Modern literature','Complex analysis','Professional comms'].map(t=>`<div class="card">${t}</div>`).join('')}`,s3:`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${['Theory','Style','Analysis','Eloquence'].map(t=>`<div class="node">${t}</div>`).join('')}</div>`,s4:`<div class="card">Master the art of language.</div>`,s5:`<div class="recap">Brilliant!</div>`}
    ];
    return EG[lv];
  })(),

  computer:(()=>{
    const CS=[
      // lv0: Class 1-3
      {s1:`<h2 style="background:linear-gradient(135deg,#818cf8,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${title}</h2><div style="font-size:clamp(32px,6vw,72px);display:flex;gap:14px;justify-content:center;margin-top:18px">${['💻','🖱️','⌨️','🎮'].map(e=>`<span>${e}</span>`).join('')}</div>`,
       s2:`<h2 style="color:#fff">Hello World!</h2>${['Computers are our smart friends','We use a mouse to click and drag','The keyboard helps us type words','Games are made with computer code'].map(t=>`<div class="card">${t}</div>`).join('')}`,
       s3:`<div style="display:flex;gap:20px;justify-content:center;margin-top:20px"><div style="background:rgba(129,140,248,.2);border:2px solid #818cf8;border-radius:12px;padding:15px;opacity:0;transform:scale(.5)" class="node">Input ⌨️</div><div style="background:rgba(34,211,238,.2);border:2px solid #22d3ee;border-radius:12px;padding:15px;opacity:0;transform:scale(.5)" class="node">Output 🖥️</div></div>`,
       s4:`<div class="card" style="color:#818cf8;text-align:center">Computers follow our instructions exactly!</div>`,
       s5:`<div class="recap"><h2 style="background:linear-gradient(135deg,#818cf8,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Great Start! 💻</h2></div>`},
      // lv1: Class 4-5
      {s1:`<h2 style="background:linear-gradient(135deg,#6366f1,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${title}</h2><p style="color:#a5b4fc">Class ${cls} · Information Tech</p>`,
       s2:`<h2 style="color:#fff">IT Basics</h2>${['Hardware: the parts you can touch','Software: the programs that run','Operating System (OS) manages everything','The Internet connects the whole world'].map(t=>`<div class="card">${t}</div>`).join('')}`,
       s3:`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:500px;margin:0 auto">${[['CPU','The Brain','#818cf8'],['RAM','Short-term Memory','#22d3ee'],['Hard Drive','Long-term Storage','#4ade80'],['GPU','Graphics Power','#f0abfc']].map(([n,d,c])=>`<div class="card" style="border-color:${c}44;opacity:0;transform:translateY(20px)" class="node"><strong style="color:${c}">${n}</strong><br><small>${d}</small></div>`).join('')}</div>`,
       s4:`<div class="card" style="text-align:center">Technology helps us solve big problems!</div>`,
       s5:`<div class="recap"><h2 style="background:linear-gradient(135deg,#6366f1,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Well Done!</h2></div>`},
      // lv2: Class 6-8
      {s1:`<h2 style="background:linear-gradient(135deg,#818cf8,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${title}</h2><div style="font-family:monospace;color:#4ade80;background:rgba(0,0,0,.4);padding:10px;border-radius:8px">01001000 01101001</div>`,
       s2:`<h2 style="color:#fff">Algorithms & Logic</h2>${['Algorithms are step-by-step instructions','Binary: the language of 0s and 1s','Flowcharts help visualize the logic','Debugging is finding and fixing errors'].map(t=>`<div class="card">${t}</div>`).join('')}`,
       s3:`<div style="background:#0d1117;border:1px solid #818cf866;border-radius:12px;padding:15px;font-family:monospace;text-align:left"><span style="color:#818cf8">if</span> age >= 18:<br>&nbsp;&nbsp;<span style="color:#4ade80">print</span>("You can vote!")<br><span style="color:#818cf8">else</span>:<br>&nbsp;&nbsp;<span style="color:#4ade80">print</span>("Too young.")</div>`,
       s4:`<div class="card" style="text-align:center">Computer Science is the language of the future.</div>`,
       s5:`<div class="recap"><h2 style="background:linear-gradient(135deg,#818cf8,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Brilliant!</h2></div>`},
      // lv3: Class 9-10
      {s1:`<h2 style="background:linear-gradient(135deg,#6366f1,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${title}</h2><p style="color:#94a3b8">CBSE Class ${cls} · CS / IT</p>`,
       s2:`<h2 style="color:#fff">Programming Foundations</h2>${['Variables store data types (int, str, bool)','Control Flow: if-else and loops (for, while)','Data Structures: Arrays and Lists','Functions: reusable blocks of code'].map(t=>`<div class="card">${t}</div>`).join('')}`,
       s3:`<div style="background:#0d1117;border:1px solid #6366f188;border-radius:16px;padding:20px;font-family:monospace;text-align:left" class="eq"><span style="color:#ff79c6">def</span> <span style="color:#50fa7b">factorial</span>(n):<br>&nbsp;&nbsp;<span style="color:#ff79c6">if</span> n == 0: <span style="color:#ff79c6">return</span> 1<br>&nbsp;&nbsp;<span style="color:#ff79c6">return</span> n * factorial(n-1)</div>`,
       s4:`<div class="card">Understand the logic behind every line of code.</div>`,
       s5:`<div class="recap"><h2 style="background:linear-gradient(135deg,#6366f1,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Outstanding!</h2></div>`},
      // lv4: Class 11-12
      {s1:`<h2 style="background:linear-gradient(135deg,#818cf8,#f0abfc);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${title}</h2><div style="font-family:monospace;font-size:12px;color:#94a3b8">Class Object = new Class();</div>`,
       s2:`<h2 style="color:#fff">Advanced CS & OOP</h2>${['Encapsulation: hiding internal state','Inheritance: deriving new classes from existing ones','Polymorphism: one interface, multiple forms','Abstraction: simplifying complex reality'].map(t=>`<div class="card">${t}</div>`).join('')}`,
       s3:`<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${[['Stack','LIFO Structure','#f87171'],['Queue','FIFO Structure','#60a5fa'],['Tree','Hierarchical Data','#4ade80'],['Graph','Network of Nodes','#fbbf24']].map(([n,d,c])=>`<div class="card" style="border-color:${c}44;opacity:0" class="node"><strong style="color:${c}">${n}</strong><br><small>${d}</small></div>`).join('')}</div>`,
       s4:`<div class="card">Focus on Big-O complexity and optimized algorithms.</div>`,
       s5:`<div class="recap"><h2 style="background:linear-gradient(135deg,#818cf8,#f0abfc);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Code Mastered! 🚀</h2></div>`}
    ];
    return CS[lv];
  })(),
  electronics:(()=>{
    const EL=[
      // lv0-1: Basic circuits
      {s1:`<h2 style="color:#4ade80">${title}</h2><div style="font-size:40px">🔋 💡 🔌</div>`,s2:`<h2 style="color:#fff">Electricity!</h2>${['Batteries store power','Wires carry electricity','Bulbs give us light'].map(t=>`<div class="card">${t}</div>`).join('')}`,s3:`<div style="display:flex;gap:10px;justify-content:center"><div class="node" style="opacity:0;transform:scale(.5)">🔋 Battery</div><div class="node" style="opacity:0;transform:scale(.5)">💡 Bulb</div></div>`,s4:`<div class="card">Be safe around electricity!</div>`,s5:`<div class="recap">Great!</div>`},
      // lv2-3: Components & Ohm's Law
      {s1:`<h2 style="background:linear-gradient(135deg,#4ade80,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${title}</h2>`,
       s2:`<h2 style="color:#fff">Core Components</h2>${['Resistors (R) — oppose current','Capacitors (C) — store charge','Diodes — allow one-way flow','LEDs — light emitting diodes'].map(t=>`<div class="card">${t}</div>`).join('')}`,
       s3:`<div style="font-size:40px;font-weight:900;color:#4ade80" class="eq">V = I × R</div>`,
       s4:`<div class="card">Ohm's Law is the foundation of electronics.</div>`,
       s5:`<div class="recap">Well Done!</div>`},
      // lv4: Advanced Electronics
      {s1:`<h2 style="background:linear-gradient(135deg,#4ade80,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${title}</h2>`,
       s2:`<h2 style="color:#fff">Semiconductors & ICs</h2>${['Transistors as switches/amplifiers','Integrated Circuits (ICs) — micro-chips','Digital Logic Gates (AND, OR, NOT)'].map(t=>`<div class="card">${t}</div>`).join('')}`,
       s3:`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${[['P-N Junction','Foundation','#4ade80'],['BJT','Transistor','#22d3ee'],['MOSFET','High speed','#a78bfa'],['Operational Amp','OP-AMP','#fb923c']].map(([n,d,c])=>`<div class="card" style="border-color:${c}44;opacity:0" class="node"><strong style="color:${c}">${n}</strong><br><small>${d}</small></div>`).join('')}</div>`,
       s4:`<div class="card">Semiconductors changed the world!</div>`,
       s5:`<div class="recap">Circuit Complete! ⚡</div>`}
    ];
    return EL[lv<=1?0:lv<=3?1:2];
  })(),


  hindi:{
    s1:`<h2 style="color:#f97316">${title}</h2>`,
    s2:`<h2 style="color:#fff">हिन्दी भाषा</h2>${['हिन्दी हमारी शान है।','व्याकरण सीखें।','साहित्य का आनंद लें।'].map(t=>`<div class="card">${t}</div>`).join('')}`,
    s3:`<div style="display:flex;gap:10px;justify-content:center">${['अ','आ','इ','ई'].map(t=>`<div class="node">${t}</div>`).join('')}</div>`,
    s4:`<div class="card">हिन्दी हमारी राष्ट्रभाषा है।</div>`,
    s5:`<div class="recap">शाबाश!</div>`
  }
};

const getCont=()=>{
  if(content[sub]) return content[sub];
  const priority=['computer','electronics','mathematics','chemistry','biology','physics','geography','history','social','science','hindi','kannada','evs','english'];
  for(const k of priority){if(sub.includes(k))return content[k]||content.english;}
  return content.english;
};

const C=getCont();
const TOTAL=32;
const OV=TOVERRIDE[tKey]||{};
const S={s1:OV.s1||C.s1, s2:OV.s2||C.s2, s3:OV.s3||C.s3, s4:OV.s4||C.s4, s5:OV.s5||C.s5};

// Inject UI
document.getElementById('s1').innerHTML=S.s1;
document.getElementById('s2').innerHTML=S.s2;
document.getElementById('s3').innerHTML=S.s3;
document.getElementById('s4').innerHTML=S.s4;
document.getElementById('s5').innerHTML=S.s5;

document.getElementById('ph1').textContent=title;
document.getElementById('pp').textContent=`${P.get('subject')||'Learning'} · PragnaVistara`;
document.getElementById('playBtn').style.background=th.btn;
document.getElementById('playBtn').style.boxShadow=`0 0 40px ${th.accent}66`;
document.body.style.background=th.bg[0];
document.getElementById('pf').style.background=`linear-gradient(90deg,${th.accent},#a855f7)`;

const easeMain = lv <= 1 ? 'elastic.out(1, 0.5)' : 'power2.out';
const easeCards = lv <= 1 ? 'back.out(1.7)' : 'power3.out';
const durMultiplier = lv <= 1 ? 0.8 : 0.65;
const bgs=th.bg.map((c,i)=>`radial-gradient(ellipse at ${[30,70,50,20,50][i]}% ${[60,30,50,70,50][i]}%,${c} 0%,#020408 80%)`);
const bgEl=document.getElementById('bg');

let tl=null;
function buildTl(){
  tl=gsap.timeline({onUpdate:upd,onComplete:()=>{document.getElementById('picoP').style.display='none';document.getElementById('picoR').style.display='block';}});
  tl.call(()=>bgEl.style.background=bgs[0])
    .to('#s1',{opacity:1,duration:.1})
    .fromTo('#s1 h2',{scale:.7,opacity:0,filter:'blur(12px)'},{scale:1,opacity:1,filter:'blur(0)',duration:0.8 * durMultiplier,ease:easeMain})
    .fromTo('#s1 p,#s1 div',{opacity:0,y:20},{opacity:1,y:0,duration:0.6 * durMultiplier,stagger:.12},'-=.3')
    .to('#s1',{opacity:0,scale:1.1,duration:.55,ease:'power2.in'},'+=2.0')
    .call(()=>bgEl.style.background=bgs[1])
    .to('#s2',{opacity:1,duration:.1})
    .fromTo('#s2 h2',{opacity:0,y:-20},{opacity:1,y:0,duration:.5 * durMultiplier})
    .to('#s2 .card,#s2 .eq',{x:0,opacity:1,scale:1,duration:.5 * durMultiplier,stagger:.2,ease:easeCards})
    .to('#s2',{opacity:0,x:80,duration:.55,ease:'power2.in'},'+=1.8')
    .call(()=>bgEl.style.background=bgs[2])
    .to('#s3',{opacity:1,duration:.1})
    .fromTo('#s3 h2',{opacity:0,y:-20},{opacity:1,y:0,duration:.5 * durMultiplier})
    .to('#s3 .card',{x:0,opacity:1,duration:.5 * durMultiplier,stagger:.2,ease:easeCards})
    .to('#s3 .bar,#s3 .node',{scale:1,opacity:1,duration:.5 * durMultiplier,stagger:.12,ease:'power3.out'},'-=1.2')
    .to('#s3',{opacity:0,y:-60,duration:.55,ease:'power2.in'},'+=1.8')
    .call(()=>bgEl.style.background=bgs[3])
    .to('#s4',{opacity:1,duration:.1})
    .fromTo('#s4 h2',{opacity:0,y:-20},{opacity:1,y:0,duration:.5 * durMultiplier})
    .to('#s4 .card',{x:0,opacity:1,duration:0.6 * durMultiplier,stagger:.18,ease:easeCards})
    .to('#s4',{opacity:0,y:60,duration:.55,ease:'power2.in'},'+=2.2')
    .call(()=>bgEl.style.background=bgs[4])
    .to('#s5',{opacity:1,duration:.1})
    .fromTo('#s5 .recap,#s5 h2,#s5 p',{scale:.7,opacity:0},{scale:1,opacity:1,duration:0.75 * durMultiplier,stagger:.12,ease:easeMain});
  tl.timeScale(tl.duration()/TOTAL);
  return tl;
}

function upd(){if(!tl)return;const p=tl.progress();document.getElementById('pf').style.width=`${p*100}%`;const s=Math.floor(p*TOTAL);const ts=Math.floor(TOTAL/60)+':'+(TOTAL%60).toString().padStart(2,'0');document.getElementById('tm').textContent=`${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')} / ${ts}`;}

document.getElementById('playBtn').addEventListener('click',()=>{
  console.log('Generating Class-Aware Video:',sub,'| Level:',lv,'| Topic:',title);
  gsap.to('#playScreen',{opacity:0,scale:1.1,duration:.6,onComplete:()=>document.getElementById('playScreen').style.display='none'});
  const c=document.getElementById('controls');c.style.opacity='1';c.style.pointerEvents='all';
  buildTl();
});

document.getElementById('pauseBtn').addEventListener('click',()=>{if(!tl)return;if(tl.isActive()){tl.pause();document.getElementById('picoP').style.display='none';document.getElementById('picoR').style.display='block';}else{tl.play();document.getElementById('picoP').style.display='block';document.getElementById('picoR').style.display='none';}});
document.getElementById('replayBtn').addEventListener('click',()=>{if(!tl)return;tl.restart();document.getElementById('picoP').style.display='block';document.getElementById('picoR').style.display='none';});
document.getElementById('pw').addEventListener('click',e=>{if(!tl)return;const r=e.currentTarget.getBoundingClientRect();tl.progress((e.clientX-r.left)/r.width);});
