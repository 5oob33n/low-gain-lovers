import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, Grid, Zap, Hand, Settings, Music, Sparkles, Image as ImageIcon, Upload, AlertCircle, Loader2, ChevronRight, ChevronDown } from 'lucide-react';

// --- Constants & Data ---
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STRING_BASE_FREQS = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
const STRING_TUNING = [4, 9, 2, 7, 11, 4]; 

const SCALES = {
  'minor_pentatonic': { name: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10] },
  'major_pentatonic': { name: 'Major Pentatonic', intervals: [0, 2, 4, 7, 9] },
  'blues': { name: 'Blues Scale', intervals: [0, 3, 5, 6, 7, 10] },
  'natural_minor': { name: 'Natural Minor', intervals: [0, 2, 3, 5, 7, 8, 10] },
  'major': { name: 'Major (Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  'chromatic': { name: 'Chromatic', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
};

const OPEN_CHORDS = {
  'C_Major': { offsets: [{s:1,f:3,i:3}, {s:2,f:2,i:2}, {s:3,f:0,i:0}, {s:4,f:1,i:1}, {s:5,f:0,i:0}], muted: [0] },
  'G_Major': { offsets: [{s:0,f:3,i:2}, {s:1,f:2,i:1}, {s:2,f:0,i:0}, {s:3,f:0,i:0}, {s:4,f:0,i:0}, {s:5,f:3,i:3}], muted: [] },
  'D_Major': { offsets: [{s:2,f:0,i:0}, {s:3,f:2,i:1}, {s:4,f:3,i:3}, {s:5,f:2,i:2}], muted: [0, 1] },
  'A_Major': { offsets: [{s:1,f:0,i:0}, {s:2,f:2,i:1}, {s:3,f:2,i:2}, {s:4,f:2,i:3}, {s:5,f:0,i:0}], muted: [0] },
  'E_Major': { offsets: [{s:0,f:0,i:0}, {s:1,f:2,i:2}, {s:2,f:2,i:3}, {s:3,f:1,i:1}, {s:4,f:0,i:0}, {s:5,f:0,i:0}], muted: [] },
  'A_Minor': { offsets: [{s:1,f:0,i:0}, {s:2,f:2,i:2}, {s:3,f:2,i:3}, {s:4,f:1,i:1}, {s:5,f:0,i:0}], muted: [0] },
  'E_Minor': { offsets: [{s:0,f:0,i:0}, {s:1,f:2,i:2}, {s:2,f:2,i:3}, {s:3,f:0,i:0}, {s:4,f:0,i:0}, {s:5,f:0,i:0}], muted: [] },
  'D_Minor': { offsets: [{s:2,f:0,i:0}, {s:3,f:2,i:2}, {s:4,f:3,i:3}, {s:5,f:1,i:1}], muted: [0, 1] },
  'F_Major': { offsets: [{s:1,f:3,i:3}, {s:2,f:3,i:4}, {s:3,f:2,i:2}, {s:4,f:1,i:1}, {s:5,f:1,i:1}], muted: [0], barre: { fret: 1, start: 4, end: 5, finger: 1 } },
};

const MOVABLE_SHAPES = {
  '5 (Power)': {
    name: 'Power (5)',
    type: 'root_e', 
    offsets: [{ s: 0, f: 0, finger: 1 }, { s: 1, f: 2, finger: 3 }, { s: 2, f: 2, finger: 4 }],
    muted: [3, 4, 5]
  },
  'Major (Barre)': {
    name: 'Major',
    type: 'root_e',
    offsets: [{ s: 0, f: 0, finger: 1 }, { s: 1, f: 2, finger: 3 }, { s: 2, f: 2, finger: 4 }, { s: 3, f: 1, finger: 2 }, { s: 4, f: 0, finger: 1 }, { s: 5, f: 0, finger: 1 }],
    barre: { fret: 0, finger: 1, start: 0, end: 5 }
  },
  'Minor (Barre)': {
    name: 'Minor',
    type: 'root_e',
    offsets: [{ s: 0, f: 0, finger: 1 }, { s: 1, f: 2, finger: 3 }, { s: 2, f: 2, finger: 4 }, { s: 3, f: 0, finger: 1 }, { s: 4, f: 0, finger: 1 }, { s: 5, f: 0, finger: 1 }],
    barre: { fret: 0, finger: 1, start: 0, end: 5 }
  }
};

const TUNING_PRESETS = {
  'Standard': [
    { note: 'E', label: 'Low E', freq: 82.41 }, { note: 'A', label: 'A', freq: 110.00 }, { note: 'D', label: 'D', freq: 146.83 }, { note: 'G', label: 'G', freq: 196.00 }, { note: 'B', label: 'B', freq: 246.94 }, { note: 'e', label: 'High e', freq: 329.63 },
  ],
  'Drop D': [
    { note: 'D', label: 'Low D', freq: 73.42 }, { note: 'A', label: 'A', freq: 110.00 }, { note: 'D', label: 'D', freq: 146.83 }, { note: 'G', label: 'G', freq: 196.00 }, { note: 'B', label: 'B', freq: 246.94 }, { note: 'e', label: 'High e', freq: 329.63 },
  ],
  'Half-Step Down (Eb)': [
    { note: 'Eb', label: 'Low Eb', freq: 77.78 }, { note: 'Ab', label: 'Ab', freq: 103.83 }, { note: 'Db', label: 'Db', freq: 138.59 }, { note: 'Gb', label: 'Gb', freq: 185.00 }, { note: 'Bb', label: 'Bb', freq: 233.08 }, { note: 'eb', label: 'High eb', freq: 311.13 },
  ],
};

// --- Helper Components ---

// Custom Select Component for cleaner design
const CustomSelect = ({ value, options, onChange, className = "", label = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <span className="text-[9px] uppercase tracking-widest text-neutral-600 block mb-1">{label}</span>}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 w-full bg-black text-white text-lg font-light border-b border-neutral-800 py-2 hover:border-white transition-colors outline-none"
        style={{ fontFamily: "'Bodoni Moda', serif" }}
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={14} className={`text-neutral-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 w-full min-w-[120px] max-h-60 overflow-y-auto bg-black border border-neutral-800 z-50 mt-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {options.map((option) => {
            const optionValue = option.value || option;
            const optionLabel = option.label || option;
            return (
              <div
                key={optionValue}
                onClick={() => { onChange(optionValue); setIsOpen(false); }}
                className={`px-4 py-3 text-sm cursor-pointer transition-colors ${
                  optionValue === value 
                    ? 'bg-white text-black font-bold' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                {optionLabel}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState('scales');
  const [globalBpm, setGlobalBpm] = useState(120);
  const audioCtxRef = useRef(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-black text-white flex flex-col items-center">
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@1,6..96,400..900&family=Manrope:wght@200;300;400;600;800&display=swap');`}
      </style>

      {/* Header */}
      <header className="w-full max-w-3xl pt-12 pb-6 px-6 flex flex-col items-center gap-8 relative z-20">
        <div className="flex flex-col items-center select-none group cursor-default">
          <h1 className="text-4xl md:text-6xl font-normal italic tracking-tight text-white" style={{ fontFamily: "'Bodoni Moda', serif" }}>
            Low Gain Lovers
          </h1>
          <div className="h-[1px] w-8 bg-white mt-4 opacity-30"></div>
        </div>

        <nav className="w-full overflow-x-auto flex gap-8 justify-center pb-2 no-scrollbar" style={{ fontFamily: "'Manrope', sans-serif" }}>
          {[
            { id: 'scales', label: 'Scales' },
            { id: 'chords', label: 'Chords' },
            { id: 'smart-tab', label: 'Reader' }, 
            { id: 'tone-lab', label: 'Tone' }, 
            { id: 'metronome', label: 'BPM' },
            { id: 'tuner', label: 'Tuner' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); initAudio(); }}
              className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] transition-all pb-1 border-b-[1px]
                ${activeTab === tab.id
                  ? 'text-white border-white'
                  : 'text-neutral-500 border-transparent hover:text-neutral-400'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-3xl px-6 pb-12 flex-1 relative z-10" style={{ fontFamily: "'Manrope', sans-serif" }}>
        <div className="w-full min-h-[400px]">
          {activeTab === 'scales' && <ScaleFinder />}
          {activeTab === 'chords' && <ChordLibrary audioCtxRef={audioCtxRef} />}
          {activeTab === 'smart-tab' && <SmartTabTrainer setGlobalBpm={setGlobalBpm} />}
          {activeTab === 'tone-lab' && <AIToneLab />}
          {activeTab === 'metronome' && <Metronome audioCtxRef={audioCtxRef} bpm={globalBpm} setBpm={setGlobalBpm} />}
          {activeTab === 'tuner' && <Tuner audioCtxRef={audioCtxRef} />}
        </div>
      </main>
      
      <footer className="pb-10 text-center text-neutral-800 text-[9px] font-bold uppercase tracking-[0.2em] w-full">
        Designed for minimalists
      </footer>
    </div>
  );
};

// --- Sub-Components ---

const ScaleFinder = () => {
  const [selectedKey, setSelectedKey] = useState('A');
  const [scaleType, setScaleType] = useState('minor_pentatonic');
  const getScaleNotes = () => { const keyIndex = NOTES.indexOf(selectedKey); const intervals = SCALES[scaleType].intervals; return intervals.map(interval => NOTES[(keyIndex + interval) % 12]); };
  const activeNotes = getScaleNotes();
  const isNoteInScale = (noteName) => activeNotes.includes(noteName);
  const isRootNote = (noteName) => noteName === selectedKey;
  const singleDots = [3, 5, 7, 9, 15, 17, 19, 21];
  const doubleDots = [12, 24];

  const scaleOptions = Object.entries(SCALES).map(([key, data]) => ({ value: key, label: data.name }));

  return (
    <div className="space-y-12 w-full animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-end gap-6 border-b border-neutral-900 pb-6">
        <div className="flex gap-6 w-full max-w-md">
          <CustomSelect value={selectedKey} options={NOTES} onChange={setSelectedKey} label="Key" className="w-24" />
          <CustomSelect value={SCALES[scaleType].name} options={scaleOptions} onChange={setScaleType} label="Scale" className="flex-1" />
        </div>
      </div>
      
      <div className="w-full overflow-x-auto pb-4">
        <div className="relative min-w-[650px] bg-black select-none py-8 border-t border-b border-neutral-800">
          <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white z-10"></div>
          {[...Array(6)].map((_, stringIndex) => { 
            const actualStringIndex = 5 - stringIndex; 
            const openNoteIndex = STRING_TUNING[actualStringIndex];
            return (
              <div key={stringIndex} className="relative h-12 flex items-center">
                <div className="absolute left-0 right-0 bg-neutral-800 z-0 pointer-events-none" style={{ height: '1px' }}></div>
                {[...Array(13)].map((_, fretIndex) => {
                  const noteIndex = (openNoteIndex + fretIndex) % 12; 
                  const noteName = NOTES[noteIndex]; 
                  const isInScale = isNoteInScale(noteName); 
                  const isRoot = isRootNote(noteName); 
                  return ( 
                    <div key={fretIndex} className={`flex-1 h-full border-r border-neutral-900 relative flex items-center justify-center z-10 ${fretIndex === 0 ? 'flex-none w-12' : ''}`}> 
                      {isInScale && ( 
                        <div className={`w-6 h-6 flex items-center justify-center text-[9px] font-bold transition-all duration-300 ${isRoot ? 'bg-white text-black' : 'bg-black text-white border border-white'} rounded-full`}> 
                          {noteName} 
                        </div> 
                      )} 
                      {stringIndex === 2 && fretIndex > 0 && ( <> 
                        {singleDots.includes(fretIndex) && <div className="absolute top-full mt-4 w-[2px] h-[2px] bg-neutral-500 rounded-full"></div>} 
                        {doubleDots.includes(fretIndex) && <div className="absolute top-full mt-4 flex gap-1"><div className="w-[2px] h-[2px] bg-neutral-500 rounded-full"></div><div className="w-[2px] h-[2px] bg-neutral-500 rounded-full"></div></div>} 
                      </> )} 
                    </div> 
                  ); 
                })}
              </div>
            );
          })}
          <div className="flex h-6 text-[9px] font-mono text-neutral-700 pl-12 pt-4">{[...Array(12)].map((_, i) => (<div key={i} className="flex-1 text-center">{i + 1}</div>))}</div>
        </div>
      </div>
    </div>
  );
};

const ChordLibrary = ({ audioCtxRef }) => {
  const [root, setRoot] = useState('G');
  const [chordType, setChordType] = useState('5 (Power)'); 
  const [useOpenShape, setUseOpenShape] = useState(false);
  const [isStrumming, setIsStrumming] = useState(false);
  const isOpenAvailable = () => { let key = ''; if (chordType === '5 (Power)') key = `${root}_5 (Power)`; else if (chordType === 'Major') key = `${root}_Major`; else if (chordType === 'Minor') key = `${root}_Minor`; return !!OPEN_CHORDS[key]; };
  const getChordData = () => { if (useOpenShape) { let key = ''; if (chordType === '5 (Power)') key = `${root}_5 (Power)`; else if (chordType === 'Major') key = `${root}_Major`; else if (chordType === 'Minor') key = `${root}_Minor`; if (OPEN_CHORDS[key]) { const chord = OPEN_CHORDS[key]; const points = chord.offsets.map(o => ({ string: o.s, fret: o.f, finger: o.i })); return { points, barre: chord.barre, muted: chord.muted, rootFret: 0, isMovable: false }; } } let shapeKey = chordType; if (chordType === 'Major' || chordType === 'Minor') shapeKey = `${chordType} (Barre)`; const shape = MOVABLE_SHAPES[shapeKey] || MOVABLE_SHAPES['5 (Power)']; const refStringIndex = 0; const openNoteIndex = STRING_TUNING[refStringIndex]; const targetNoteIndex = NOTES.indexOf(root); let rootFret = (targetNoteIndex - openNoteIndex + 12) % 12; if (rootFret === 0 && root === 'E') rootFret = 0; const points = shape.offsets.map(p => ({ string: p.s, fret: rootFret + p.f, finger: p.finger })); let barre = null; if (shape.barre) { barre = { fret: rootFret + shape.barre.fret, startStr: shape.barre.start, endStr: shape.barre.end, finger: shape.barre.finger } } return { points, barre, muted: shape.muted || [], rootFret, isMovable: true }; };
  const { points, barre, muted, rootFret } = getChordData();
  const openAvailable = isOpenAvailable();
  const startFret = rootFret === 0 ? 0 : Math.max(0, rootFret - 1);
  const displayFrets = 5; 
  const playChord = () => { if (!audioCtxRef.current) return; if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume(); setIsStrumming(true); setTimeout(() => setIsStrumming(false), 500); const now = audioCtxRef.current.currentTime; let strumIndex = 0; [0, 1, 2, 3, 4, 5].forEach(strIdx => { if (muted.includes(strIdx)) return; let fret = 0; const point = points.find(p => p.string === strIdx); if (point) { fret = point.fret; } else if (barre && strIdx >= barre.startStr && strIdx <= barre.endStr) { fret = barre.fret; } else { fret = 0; } const baseFreq = STRING_BASE_FREQS[strIdx]; const freq = baseFreq * Math.pow(2, fret / 12); const osc = audioCtxRef.current.createOscillator(); const gain = audioCtxRef.current.createGain(); osc.type = 'triangle'; osc.frequency.value = freq; const startTime = now + (strumIndex * 0.04); gain.gain.setValueAtTime(0, startTime); gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05); gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5); osc.connect(gain); gain.connect(audioCtxRef.current.destination); osc.start(startTime); osc.stop(startTime + 1.5); strumIndex++; }); };

  const chordOptions = [
    { value: '5 (Power)', label: 'Power (5)' },
    { value: 'Major', label: 'Major' },
    { value: 'Minor', label: 'Minor' }
  ];

  return (
    <div className="space-y-12 w-full animate-in fade-in duration-700">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-end border-b border-neutral-900 pb-4">
            <h2 className="text-4xl font-normal text-white flex items-center gap-3" style={{ fontFamily: "'Bodoni Moda', serif" }}>
                {root} <span className="italic opacity-50 text-2xl">{chordType}</span>
            </h2>
            <div className="flex gap-4">
                {openAvailable && (
                    <button onClick={() => setUseOpenShape(!useOpenShape)} className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${useOpenShape ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}>{useOpenShape ? 'Open Shape' : 'Movable'}</button>
                )}
                <button onClick={playChord} className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${isStrumming ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}>{isStrumming ? 'Strumming...' : 'Play'}</button>
            </div>
        </div>
        
        <div className="flex gap-4 w-full max-w-sm">
            <CustomSelect value={root} options={NOTES} onChange={setRoot} className="w-20" />
            <CustomSelect value={chordType} options={chordOptions} onChange={(val) => { setChordType(val); setUseOpenShape(false); }} className="flex-1" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-12 items-start justify-center w-full">
          <div className="flex flex-row sm:flex-col items-center sm:items-start justify-center gap-2">
              <span className="text-neutral-600 text-[9px] font-bold uppercase tracking-widest">Start Fret</span>
              <span className="text-8xl font-thin text-white leading-none" style={{ fontFamily: "'Bodoni Moda', serif" }}>{rootFret === 0 ? '0' : rootFret}</span>
          </div>
          
          <div className="w-full flex-1">
            <div className="w-full relative py-6 border-t border-b border-neutral-900">
                {startFret === 0 && (<div className="absolute top-0 bottom-0 -left-1 w-[2px] bg-white z-10"></div>)}
                <div className="flex flex-col gap-6 relative">
                {[0, 1, 2, 3, 4, 5].map((strIndex) => { const visualStrIndex = 5 - strIndex; const isMuted = muted.includes(visualStrIndex); return ( <div key={strIndex} className="relative h-[1px] bg-neutral-800 w-full flex items-center"><div className={`absolute -left-6 text-[9px] font-mono w-4 text-right ${isMuted ? 'text-neutral-700' : 'text-neutral-400'}`}>{isMuted ? 'x' : 'o'}</div>{[...Array(displayFrets)].map((_, i) => (<div key={i} className="absolute h-6 w-[1px] bg-neutral-900" style={{ left: `${(i / displayFrets) * 100}%`, top: '-12px' }}></div>))}{points.filter(p => p.string === visualStrIndex).map((p, i) => { const relativeFret = p.fret - startFret; if (p.finger === 0 && relativeFret === 0) return null; if (relativeFret < 0 || relativeFret >= displayFrets) return null; return ( <div key={i} className="absolute w-6 h-6 bg-white rounded-full flex items-center justify-center text-black font-bold text-[10px] z-20 shadow-sm" style={{ left: `${(relativeFret / displayFrets) * 100 + (100/displayFrets/2)}%`, transform: 'translateX(-50%)' }}>{p.finger}</div> ) })}</div> ) })}
                {barre && (<div className="absolute bg-white/20 rounded-full pointer-events-none" style={{ left: `calc(${( (barre.fret - startFret) / displayFrets ) * 100}% + ${(100/displayFrets/2)}% - 10px)`, top: `${(5 - barre.endStr) * 24 - 10}px`, height: `${(barre.endStr - barre.startStr) * 24 + 20}px`, width: '20px' }}></div>)}
                </div>
                <div className="flex justify-between px-1 pt-6 border-t border-transparent">{[...Array(displayFrets)].map((_, i) => { const currentFretNum = startFret + i; return ( <span key={i} className={`text-[9px] font-mono w-full text-center text-neutral-600`}>{currentFretNum > 0 ? currentFretNum : ''}</span> ); })}</div>
            </div>
          </div>
      </div>
    </div>
  );
};

const SmartTabTrainer = ({ setGlobalBpm }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const handleImageUpload = (event) => { const file = event.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setSelectedImage(reader.result); setAnalysis(null); }; reader.readAsDataURL(file); } };
  const analyzeImage = async () => { if (!selectedImage) return; setLoading(true); const apiKey = ""; const base64Data = selectedImage.split(',')[1]; const mimeType = selectedImage.split(';')[0].split(':')[1]; const prompt = `Analyze guitar tab. Return JSON: { title, artist, bpm (number), chords (array), difficulty (Easy/Medium/Hard), advice (array of 3 strings Korean) }`; try { const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: mimeType, data: base64Data } }] }], generationConfig: { responseMimeType: "application/json" } }) }); const data = await response.json(); if (data.candidates) { setAnalysis(JSON.parse(data.candidates[0].content.parts[0].text)); } } catch (error) { alert("Error"); } finally { setLoading(false); } };

  return (
    <div className="space-y-12 w-full animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-normal italic text-white" style={{ fontFamily: "'Bodoni Moda', serif" }}>Smart Tab Doctor</h2>
        <p className="text-neutral-500 text-[10px] uppercase tracking-widest">AI analysis for your sheet music</p>
      </div>
      {!selectedImage ? ( <div onClick={() => fileInputRef.current.click()} className="border border-neutral-800 hover:border-white hover:bg-neutral-900/50 transition-all duration-300 rounded-sm p-16 flex flex-col items-center justify-center cursor-pointer w-full group"><Upload className="text-neutral-600 group-hover:text-white mb-6 transition-colors" size={32} strokeWidth={1} /><p className="text-neutral-500 group-hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors">Upload Tab Image</p><input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} /></div> ) : ( <div className="space-y-12 w-full"><div className="relative border border-neutral-800 w-full bg-neutral-900/30"><img src={selectedImage} className="w-full object-contain max-h-[400px] opacity-90" /><button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 bg-black text-white p-2 rounded-full hover:bg-white hover:text-black transition-colors"><AlertCircle size={16} /></button></div>{!analysis ? ( <button onClick={analyzeImage} disabled={loading} className="w-full border border-white text-white font-bold uppercase text-[10px] tracking-widest py-4 hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-3">{loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} Analyzing...</button> ) : ( <div className="border-t border-white pt-8 w-full"><div className="flex justify-between items-baseline mb-8"><div><h3 className="text-3xl font-light italic text-white" style={{ fontFamily: "'Bodoni Moda', serif" }}>{analysis.title}</h3><p className="text-neutral-500 text-[10px] uppercase tracking-widest mt-2">{analysis.artist}</p></div>{analysis.bpm && <button onClick={() => setGlobalBpm(analysis.bpm)} className="text-xl font-light text-white hover:underline flex items-center gap-2">{analysis.bpm} BPM</button>}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12"><div><span className="text-neutral-600 text-[9px] font-bold uppercase tracking-widest mb-4 block">Chords</span><div className="flex flex-wrap gap-3">{analysis.chords?.map((c, i) => <span key={i} className="text-white border border-neutral-800 px-4 py-2 text-xs">{c}</span>)}</div></div><div><span className="text-neutral-600 text-[9px] font-bold uppercase tracking-widest mb-4 block">Difficulty</span><span className="text-white border border-neutral-800 px-4 py-2 text-xs uppercase">{analysis.difficulty}</span></div></div><div className="pt-8 border-t border-neutral-900"><span className="text-neutral-600 text-[9px] font-bold uppercase tracking-widest mb-6 block">Practice Routine</span><ul className="space-y-6">{analysis.advice?.map((step, i) => <li key={i} className="flex gap-6 text-sm text-neutral-300 font-light leading-relaxed"><span className="text-white font-bold text-xs pt-1">0{i+1}</span>{step}</li>)}</ul></div></div> )}</div> )}
    </div>
  );
};

const AIToneLab = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const analyzeTone = async () => { if (!query) return; setLoading(true); setResult(null); const apiKey = ""; const prompt = `Analyze guitar tone for: "${query}". Return JSON: bandOrSong, ampSettings {gain, bass, mid, treble}, pedals, tip (in Korean).`; try { const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }) }); const data = await response.json(); if (data.candidates) setResult(JSON.parse(data.candidates[0].content.parts[0].text)); } catch (e) { alert("Failed"); } finally { setLoading(false); } };

  return (
    <div className="space-y-12 w-full animate-in fade-in duration-700">
      <div className="text-center space-y-4"><h2 className="text-3xl font-normal italic text-white" style={{ fontFamily: "'Bodoni Moda', serif" }}>Tone Lab</h2><p className="text-neutral-500 text-[10px] uppercase tracking-widest">AI Powered Sound Engineer</p></div>
      <div className="flex gap-0 border-b border-white w-full"><input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Green Day Basket Case" className="flex-1 bg-black text-white px-0 py-4 text-sm outline-none placeholder:text-neutral-700 font-light" onKeyDown={(e) => e.key === 'Enter' && analyzeTone()} /><button onClick={analyzeTone} disabled={loading} className="text-white hover:text-neutral-400 transition-colors">{loading ? <Loader2 className="animate-spin" size={20} /> : <ChevronRight size={20} />}</button></div>
      {result && ( <div className="mt-12 w-full"><h3 className="text-3xl font-light italic text-white mb-12 text-center" style={{ fontFamily: "'Bodoni Moda', serif" }}>{result.bandOrSong}</h3><div className="grid grid-cols-4 gap-4 mb-12">{Object.entries(result.ampSettings).map(([k, v]) => <div key={k} className="flex flex-col items-center gap-4"><div className="relative w-full aspect-square border border-neutral-800 rounded-full flex items-center justify-center"><div className="absolute w-[1px] h-1/2 bg-white top-0 origin-bottom transition-transform duration-1000" style={{ transform: `rotate(${(v/10)*270 - 135}deg)` }}></div></div><div className="text-center"><span className="block text-xl font-light text-white mb-1">{v}</span><span className="text-[9px] uppercase text-neutral-600 tracking-widest">{k}</span></div></div>)}</div><div className="flex flex-col gap-8 border-t border-neutral-900 pt-8"><div className="flex flex-col gap-2"><span className="text-neutral-600 text-[9px] font-bold uppercase tracking-widest">Pedals</span><span className="text-sm text-white font-light leading-relaxed">{result.pedals}</span></div><div className="flex flex-col gap-2"><span className="text-neutral-600 text-[9px] font-bold uppercase tracking-widest">Pro Tip</span><span className="text-sm text-white font-light leading-relaxed">{result.tip}</span></div></div></div> )}
    </div>
  );
};

const Metronome = ({ audioCtxRef, bpm, setBpm }) => {
  const [localBpm, setLocalBpm] = useState(bpm); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const timerRef = useRef(null); const nextNoteTimeRef = useRef(0); const beatCountRef = useRef(0); const lookahead = 25.0; const scheduleAheadTime = 0.1;
  useEffect(() => { setLocalBpm(bpm); }, [bpm]);
  const handleBpmChange = (newBpm) => { const val = Math.min(240, Math.max(40, newBpm)); setLocalBpm(val); setBpm(val); };
  const playClick = (time, isStrong) => { const osc = audioCtxRef.current.createOscillator(); const gainNode = audioCtxRef.current.createGain(); osc.connect(gainNode); gainNode.connect(audioCtxRef.current.destination); osc.type = 'square'; osc.frequency.value = isStrong ? 800 : 400; gainNode.gain.setValueAtTime(0, time); gainNode.gain.linearRampToValueAtTime(0.3, time + 0.001); gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05); osc.start(time); osc.stop(time + 0.06); };
  const scheduler = useCallback(() => { while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) { playClick(nextNoteTimeRef.current, beatCountRef.current % 4 === 0); const currentBeat = beatCountRef.current % 4; setTimeout(() => setBeat(currentBeat), (nextNoteTimeRef.current - audioCtxRef.current.currentTime) * 1000); const secondsPerBeat = 60.0 / localBpm; nextNoteTimeRef.current += secondsPerBeat; beatCountRef.current++; } timerRef.current = setTimeout(scheduler, lookahead); }, [localBpm]);
  useEffect(() => { if (isPlaying) { if (audioCtxRef.current.state === 'suspended') { audioCtxRef.current.resume(); } nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05; beatCountRef.current = 0; scheduler(); } else { clearTimeout(timerRef.current); setBeat(-1); } return () => clearTimeout(timerRef.current); }, [isPlaying, scheduler]);

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-16 w-full animate-in fade-in duration-700">
      <div className="flex gap-4">{[0, 1, 2, 3].map((i) => (<div key={i} className={`w-2 h-2 rounded-full transition-all duration-100 ${beat === i ? 'bg-white scale-150' : 'bg-neutral-800'}`}></div>))}</div>
      <div className="text-center cursor-pointer" onClick={() => setIsPlaying(!isPlaying)}>
         <span className="text-9xl font-thin text-white tracking-tighter tabular-nums select-none block" style={{ fontFamily: "'Bodoni Moda', serif" }}>{localBpm}</span>
         <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500 mt-4 block">{isPlaying ? 'Playing' : 'BPM'}</span>
      </div>
      <div className="w-full max-w-xs space-y-12"><input type="range" min="40" max="240" value={localBpm} onChange={(e) => handleBpmChange(Number(e.target.value))} className="w-full h-[1px] bg-neutral-800 appearance-none rounded-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer hover:[&::-webkit-slider-thumb]:scale-150 transition-all" /><div className="flex justify-between w-full px-2"><button onClick={() => handleBpmChange(localBpm - 1)} className="text-xl text-neutral-500 hover:text-white transition-colors">-</button><button onClick={() => setIsPlaying(!isPlaying)} className={`w-16 h-16 flex items-center justify-center rounded-full border border-white hover:bg-white hover:text-black transition-all duration-300`}>{isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}</button><button onClick={() => handleBpmChange(localBpm + 1)} className="text-xl text-neutral-500 hover:text-white transition-colors">+</button></div></div>
    </div>
  );
};

const Tuner = ({ audioCtxRef }) => {
  const [activeNote, setActiveNote] = useState(null);
  const [currentTuning, setCurrentTuning] = useState('Standard');
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const stopTone = () => { if (oscillatorRef.current) { try { const now = audioCtxRef.current.currentTime; gainNodeRef.current.gain.exponentialRampToValueAtTime(0.001, now + 0.1); oscillatorRef.current.stop(now + 0.1); } catch (e) { console.log(e) } oscillatorRef.current = null; } setActiveNote(null); };
  const playTone = (freq, note) => { if (activeNote === note) { stopTone(); return; } if (oscillatorRef.current) oscillatorRef.current.stop(); if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume(); const osc = audioCtxRef.current.createOscillator(); const gain = audioCtxRef.current.createGain(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime); gain.gain.setValueAtTime(0, audioCtxRef.current.currentTime); gain.gain.linearRampToValueAtTime(0.1, audioCtxRef.current.currentTime + 0.1); osc.connect(gain); gain.connect(audioCtxRef.current.destination); osc.start(); oscillatorRef.current = osc; gainNodeRef.current = gain; setActiveNote(note); };
  useEffect(() => { return () => stopTone(); }, []);
  const tuningStrings = TUNING_PRESETS[currentTuning];
  const tuningOptions = Object.keys(TUNING_PRESETS).map(preset => ({ value: preset, label: preset }));

  return (
    <div className="flex flex-col items-center justify-center py-8 w-full animate-in fade-in duration-700">
      <div className="mb-16 w-full max-w-xs relative">
        <CustomSelect value={currentTuning} options={tuningOptions} onChange={(val) => { stopTone(); setCurrentTuning(val); }} className="w-full text-center" label="Tuning Preset" />
      </div>
      <div className="grid grid-cols-2 gap-x-16 gap-y-12 w-full max-w-md">{tuningStrings.map((item, index) => { const stringNum = 6 - index; return ( <button key={`${item.note}-${index}`} onClick={() => playTone(item.freq, item.note)} className={`flex items-center justify-between group py-2 border-b border-neutral-800 hover:border-white transition-colors`}> <span className={`text-[9px] font-bold uppercase tracking-widest ${activeNote === item.note ? 'text-white' : 'text-neutral-600 group-hover:text-neutral-400'}`}>NO. {stringNum}</span> <span className={`text-5xl font-thin italic transition-colors ${activeNote === item.note ? 'text-white' : 'text-neutral-500 group-hover:text-white'}`} style={{ fontFamily: "'Bodoni Moda', serif" }}>{item.note}</span> </button> ); })}</div>
    </div>
  );
};

export default App;