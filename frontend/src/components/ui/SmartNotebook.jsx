import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, CheckCircle2, Sparkles, Lightbulb, 
  BrainCircuit, Zap, Bookmark, Info, GraduationCap,
  Beaker, Calculator, Globe, Languages, Play, Maximize2, Minimize2,
  FileText, ClipboardList, Star, Award, Target, PenTool, Cpu, Loader2, Wand2
} from 'lucide-react';
import './Notebook.css';

const SmartNotebook = ({ data, classId, subject, chapterName, topicName, videoUrl }) => {
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [videoState, setVideoState] = useState('idle'); // idle | generating | ready
  const [generationProgress, setGenerationProgress] = useState(0);

  if (!data) return null;

  // Handle Video Generation Simulation
  const handleGenerateVideo = () => {
    setVideoState('generating');
    setGenerationProgress(0);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => setVideoState('ready'), 500);
      }
      setGenerationProgress(progress);
    }, 800); // Approximately 10 seconds total
  };

  const classNum = parseInt(classId?.split('-')[1]?.replace(/^0+/, '') || '10');
  
  // Subject-aware theme selection
  const theme = useMemo(() => {
    const s = subject?.toLowerCase() || '';
    if (s.includes('math')) return { id: 'math', accent: '#3b82f6', icon: Calculator, class: 'accent-math' };
    if (s.includes('science') || s.includes('physics') || s.includes('chemistry') || s.includes('biology')) 
      return { id: 'science', accent: '#10b981', icon: Beaker, class: 'accent-science' };
    if (s.includes('social') || s.includes('history') || s.includes('geography')) 
      return { id: 'social', accent: '#f59e0b', icon: Globe, class: 'accent-social' };
    if (s.includes('hindi') || s.includes('kannada') || s.includes('sanskrit')) 
      return { id: 'lang', accent: '#8b5cf6', icon: Languages, class: 'accent-lang' };
    return { id: 'english', accent: '#f43f5e', icon: BookOpen, class: 'accent-english' };
  }, [subject]);

  const containerVariants = {
    hidden: { opacity: 0, rotateY: -5 },
    visible: { 
      opacity: 1, 
      rotateY: 0,
      transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  // Generate spiral rings
  const rings = Array.from({ length: 20 });

  return (
    <div className={`notebook-container ${theme.class}`}>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="notebook-page"
      >
        {/* Spiral Binding */}
        <div className="notebook-spiral">
          {rings.map((_, i) => (
            <div key={i} className="spiral-ring" />
          ))}
        </div>

        {/* Layered Effect for Depth */}
        <div className="absolute -right-2 top-2 w-full h-full bg-white border border-slate-200 rounded-16 z-[-1] opacity-50" />
        <div className="absolute -right-4 top-4 w-full h-full bg-white border border-slate-200 rounded-16 z-[-2] opacity-30" />

        <div className="notebook-content-wrapper">
          <div className="notebook-paper-texture" />

          {/* TOPPER HEADER SECTION */}
          <motion.div variants={itemVariants} className="mb-12 border-b-2 border-slate-100 pb-8 relative">
            <div className="absolute -top-10 -right-4 flex gap-2">
              <Star className="text-amber-400 fill-amber-400" size={24} />
              <Award className="text-blue-500" size={24} />
            </div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <PenTool size={14} /> Digital Study Notes — {classId?.toUpperCase()}
            </div>
            <div className="inline-block px-3 py-1 bg-slate-100 rounded text-[10px] font-black text-slate-500 uppercase mb-4">
              {chapterName}
            </div>
            <h1 className="text-5xl font-extrabold handwritten-title mb-2">
              {topicName}
            </h1>
            <div className="w-48 h-1.5 bg-gradient-to-r from-blue-500 to-transparent rounded-full" />
          </motion.div>

          {/* CONCEPT OVERVIEW CARD */}
          {data.description && (
            <motion.section variants={itemVariants} className="mb-12">
              <div className="section-header">Concept Overview</div>
              <div className="note-card">
                <div className="academic-body space-y-8">
                  {data.description.split('\n\n').map((p, i) => (
                    <p key={i} className={i === 0 ? "first-letter:text-4xl first-letter:font-bold first-letter:mr-1 first-letter:text-blue-600" : ""}>
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {/* GRID: KEY POINTS & MEMORY TRICKS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {data.key_points?.length > 0 && (
              <motion.div variants={itemVariants}>
                <div className="section-header">Essential Points</div>
                <div className="space-y-4">
                  {data.key_points.map((pt, i) => (
                    <div key={i} className="flex gap-4 items-start bg-white p-4 rounded-xl border-b-2 border-slate-100 shadow-sm hover:translate-x-2 transition-transform">
                      <div className="w-6 h-6 rounded bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mt-1">
                        <Target size={14} />
                      </div>
                      <span className="academic-body font-medium leading-normal">{pt}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {data.shortcut_tricks?.length > 0 && (
              <motion.div variants={itemVariants}>
                <div className="section-header">Topper Tricks</div>
                <div className="space-y-4">
                  {data.shortcut_tricks.map((trick, i) => (
                    <div key={i} className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-2xl relative overflow-hidden">
                      <Zap className="absolute -right-4 -bottom-4 text-amber-200/30" size={80} />
                      <p className="text-amber-900 font-bold italic academic-body leading-normal">{trick}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* TOOLKIT: FORMULAS & UNITS */}
          {(data.formulas?.length > 0 || data.si_units?.length > 0) && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {data.formulas?.length > 0 && (
                <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Calculator size={60} className="text-white" />
                  </div>
                  <h4 className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Star size={14} fill="currentColor" /> Formula Bank
                  </h4>
                  <div className="space-y-4">
                    {data.formulas.map((f, i) => (
                      <div key={i} className="font-mono text-2xl text-white bg-blue-500/10 p-5 rounded-2xl border border-blue-500/30 text-center shadow-inner">
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.si_units?.length > 0 && (
                <div className="bg-teal-900 p-8 rounded-3xl shadow-2xl relative">
                  <h4 className="text-teal-400 text-xs font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Info size={14} fill="currentColor" /> Standard Units
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {data.si_units.map((unit, i) => (
                      <span key={i} className="px-5 py-3 bg-white/10 text-teal-100 rounded-xl border border-white/20 text-lg font-bold backdrop-blur-sm">
                        {unit}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* SUMMARY SECTION */}
          {data.summary && (
            <motion.section variants={itemVariants} className="mb-12">
              <div className="section-header">Subject Summary</div>
              <div className="note-card bg-slate-50 border-dashed border-2 border-slate-200">
                <p className="academic-body italic text-slate-600 leading-loose">
                  {data.summary}
                </p>
              </div>
            </motion.section>
          )}

          {/* ═══════════════════════════════════════════════
              GEN-Z AI VIDEO GENERATION INTERFACE
              ═══════════════════════════════════════════════ */}
          <motion.div variants={itemVariants} className="mt-16 mb-16">
            <AnimatePresence mode="wait">
              {videoState === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center gap-6"
                >
                  <div className="relative group">
                    <div className="absolute inset-0 bg-blue-600 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                    <button 
                      onClick={handleGenerateVideo}
                      className="relative px-12 py-6 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white rounded-full font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group border border-blue-500/30"
                    >
                      <div className="p-2 bg-blue-500 rounded-full group-hover:rotate-12 transition-transform">
                        <Wand2 size={24} />
                      </div>
                      Generate AI Visual Explanation
                    </button>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Cpu size={12} /> Powered by Pragna Vistara Immersive Engine
                  </p>
                </motion.div>
              )}

              {videoState === 'generating' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-slate-900 p-12 rounded-[2rem] shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse" />
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                  
                  <div className="flex flex-col items-center gap-8 relative z-10">
                    <div className="relative">
                      <Loader2 className="text-blue-500 animate-spin" size={64} />
                      <div className="absolute inset-0 animate-ping opacity-20">
                        <Loader2 className="text-blue-500" size={64} />
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <h4 className="text-white text-2xl font-black mb-2 tracking-tight">Building Immersive Explanation...</h4>
                      <p className="text-blue-400 font-bold uppercase text-[10px] tracking-[0.4em] animate-pulse">Syncing Pedagogical Assets</p>
                    </div>

                    <div className="w-full max-w-md h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${generationProgress}%` }}
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {videoState === 'ready' && videoUrl && (
                <motion.div 
                  key="video"
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ${isVideoExpanded ? 'fixed inset-4 z-[100] bg-black/90 p-4 backdrop-blur-xl' : 'relative z-20'}`}
                >
                  <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse" />
                      <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Live Visual Learning Session</span>
                    </div>
                    <button onClick={() => setIsVideoExpanded(!isVideoExpanded)} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg">
                      {isVideoExpanded ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                    </button>
                  </div>
                  <div className="relative" style={{ paddingBottom: isVideoExpanded ? '50%' : '56.25%', height: 0 }}>
                    <iframe 
                      key={videoUrl}
                      src={videoUrl ? `${videoUrl}${videoUrl.includes('?') ? '&' : '?'}autoplay=1` : ''} 
                      title="Animation" 
                      className="absolute inset-0 w-full h-full border-0" 
                      allow="autoplay; fullscreen" 
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* EXAM MASTER TIP */}
          {data.remember_this && (
            <motion.section variants={itemVariants} className="mt-20">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative bg-white border-2 border-blue-600 p-10 rounded-3xl flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-20 h-20 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg shrink-0 -rotate-3 group-hover:rotate-0 transition-transform">
                    <BrainCircuit className="text-white" size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-blue-900 mb-2 uppercase tracking-tighter">Ultimate Exam Strategy</h3>
                    <p className="text-xl text-blue-800 font-bold academic-body">
                      {typeof data.remember_this === 'string' ? data.remember_this : data.remember_this[0]}
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
          
          <div className="mt-20 text-center opacity-40">
            <div className="w-full h-px bg-slate-200 mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pragna Vistara AI Learning Ecosystem — {new Date().getFullYear()}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SmartNotebook;
