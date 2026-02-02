import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, Grid, Zap, Hand, Settings, Music, Sparkles, Image as ImageIcon, Upload, AlertCircle, Loader2 } from 'lucide-react';

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
    name: 'Power Chord (5)',
    type: 'root_e', 
    offsets: [{ s: 0, f: 0, finger: 1 }, { s: 1, f: 2, finger: 3 }, { s: 2, f: 2, finger: 4 }],
    muted: [3, 4, 5]
  },
  'Major (Barre)': {
    name: 'Major (Barre)',
    type: 'root_e',
    offsets: [{ s: 0, f: 0, finger: 1 }, { s: 1, f: 2, finger: 3 }, { s: 2, f: 2, finger: 4 }, { s: 3, f: 1, finger: 2 }, { s: 4, f: 0, finger: 1 }, { s: 5, f: 0, finger: 1 }],
    barre: { fret: 0, finger: 1, start: 0, end: 5 }
  },
  'Minor (Barre)': {
    name: 'Minor (Barre)',
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
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-black text-white font-sans selection:bg-[#ff007f] selection:text-white flex flex-col items-center">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,900&display=swap');`}</style>

      {/* Header */}
      <header className="w-full max-w-4xl pt-6 pb-2 px-4 flex flex-col md:flex-row justify-between items-center gap-3 relative z-20">
        <div className="flex items-center gap-2 select-none group cursor-default">
          <div className="bg-[#ff007f] px-1.5 py-0.5 rounded-sm">
            <h1 className="text-base font-black italic text-black leading-none tracking-tighter" style={{ fontFamily: "'Playfair Display', serif" }}>LOW GAIN</h1>
          </div>
          <h1 className="text-base font-black italic text-white leading-none tracking-tighter border-b-2 border-[#ff007f] pb-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>LOVERS</h1>
        </div>

        <nav className="w-full md:w-auto overflow-x-auto flex gap-1 justify-start md:justify-end pb-2 md:pb-0 scrollbar-hide no-scrollbar">
          {[{ id: 'scales', icon: Grid, label: 'Scales' }, { id: 'chords', icon: Hand, label: 'Chords' }, { id: 'smart-tab', icon: ImageIcon, label: 'Reader' }, { id: 'tone-lab', icon: Sparkles, label: 'Tone' }, { id: 'metronome', icon: Zap, label: 'BPM' }, { id: 'tuner', icon: Volume2, label: 'Tuner' }].map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); initAudio(); }} className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase transition-all border border-transparent rounded-sm whitespace-nowrap ${activeTab === tab.id ? 'text-[#ff007f] border-[#ff007f] bg-[#ff007f]/10' : 'text-neutral-500 hover:text-white'}`}>
              <tab.icon size={14} /><span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl px-4 pb-10 flex-1 relative z-10">
        <div className="border border-neutral-800 bg-[#0a0a0a] p-4 sm:p-6 rounded-sm relative min-h-[400px] w-full shadow-sm">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff007f] to-transparent opacity-50"></div>
          {activeTab === 'scales' && <ScaleFinder />}
          {activeTab === 'chords' && <ChordLibrary audioCtxRef={audioCtxRef} />}
          {activeTab === 'smart-tab' && <SmartTabTrainer setGlobalBpm={setGlobalBpm} />}
          {activeTab === 'tone-lab' && <AIToneLab />}
          {activeTab === 'metronome' && <Metronome audioCtxRef={audioCtxRef} bpm={globalBpm} setBpm={setGlobalBpm} />}
          {activeTab === 'tuner' && <Tuner audioCtxRef={audioCtxRef} />}
        </div>
      </main>
      
      <footer className="py-6 text-center text-neutral-600 text-[10px] font-mono uppercase tracking-widest w-full">Practice untill you bleed</footer>
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

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-3 w-full sm:w-auto"><select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)} className="bg-neutral-900 text-white font-bold text-sm px-3 py-2 outline-none border border-neutral-700 focus:border-[#ff007f] rounded-sm">{NOTES.map(note => <option key={note} value={note}>{note}</option>)}</select><select value={scaleType} onChange={(e) => setScaleType(e.target.value)} className="bg-neutral-900 text-white font-bold text-sm px-3 py-2 outline-none border border-neutral-700 focus:border-[#ff007f] w-full sm:w-auto rounded-sm">{Object.entries(SCALES).map(([key, data]) => <option key={key} value={key}>{data.name}</option>)}</select></div>
        <div className="flex gap-4 text-xs font-bold uppercase tracking-wider text-neutral-500"><div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-[#ff007f]"></div> Root</div><div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-white rounded-full"></div> Note</div></div>
      </div>
      
      {/* FIX: 스크롤 컨테이너 제거 및 w-full 적용. Flexbox가 화면 너비에 맞춰 자동으로 프렛 너비를 줄임 */}
      <div className="w-full">
        <div className="relative w-full bg-[#111] border border-neutral-800 select-none">
          <div className="absolute left-0 top-0 bottom-0 w-[2px] md:w-1.5 bg-[#ff007f] z-10"></div>
          {[...Array(6)].map((_, stringIndex) => { 
            const actualStringIndex = 5 - stringIndex; 
            const openNoteIndex = STRING_TUNING[actualStringIndex];
            return (
              <div key={stringIndex} className="relative h-8 md:h-10 flex items-center border-b border-[#222] last:border-0"><div className="absolute left-0 right-0 bg-[#444] z-0 pointer-events-none" style={{ height: `${Math.max(1, stringIndex * 0.5 + 1)}px` }}></div>{[...Array(13)].map((_, fretIndex) => { // 16 -> 13 frets for better mobile fit
                  const noteIndex = (openNoteIndex + fretIndex) % 12; const noteName = NOTES[noteIndex]; const isInScale = isNoteInScale(noteName); const isRoot = isRootNote(noteName); 
                  return ( <div key={fretIndex} className={`flex-1 h-full border-r border-[#333] relative flex items-center justify-center z-10 ${fretIndex === 0 ? 'flex-none w-8 md:w-12 bg-neutral-900' : ''}`}> {isInScale && ( <div className={`w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-[8px] md:text-[10px] font-bold cursor-pointer transition-transform hover:scale-110 ${isRoot ? 'bg-[#ff007f] text-white shadow-[0_0_10px_#ff007f]' : 'bg-white text-black rounded-full'}`}> {noteName} </div> )} {stringIndex === 2 && fretIndex > 0 && ( <> {singleDots.includes(fretIndex) && <div className="absolute top-full w-1 h-1 md:w-1.5 md:h-1.5 bg-[#333] rounded-full translate-y-2 md:translate-y-3"></div>} {doubleDots.includes(fretIndex) && <div className="absolute top-full translate-y-2 md:translate-y-3 flex gap-1"><div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-[#333] rounded-full"></div><div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-[#333] rounded-full"></div></div>} </> )} </div> ); })}</div>
            );
          })}
          <div className="flex h-5 md:h-6 text-[8px] md:text-[10px] font-mono text-[#444] bg-[#0a0a0a] pl-8 md:pl-12 border-t border-[#222]">{[...Array(12)].map((_, i) => (<div key={i} className="flex-1 text-center pt-1">{i + 1}</div>))}</div>
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
  const { points, barre, muted, rootFret, isMovable } = getChordData();
  const openAvailable = isOpenAvailable();
  const startFret = rootFret === 0 ? 0 : Math.max(0, rootFret - 1);
  const displayFrets = 5; 
  const playChord = () => { if (!audioCtxRef.current) return; if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume(); setIsStrumming(true); setTimeout(() => setIsStrumming(false), 500); const now = audioCtxRef.current.currentTime; let strumIndex = 0; [0, 1, 2, 3, 4, 5].forEach(strIdx => { if (muted.includes(strIdx)) return; let fret = 0; const point = points.find(p => p.string === strIdx); if (point) { fret = point.fret; } else if (barre && strIdx >= barre.startStr && strIdx <= barre.endStr) { fret = barre.fret; } else { fret = 0; } const baseFreq = STRING_BASE_FREQS[strIdx]; const freq = baseFreq * Math.pow(2, fret / 12); const osc = audioCtxRef.current.createOscillator(); const gain = audioCtxRef.current.createGain(); osc.type = 'triangle'; osc.frequency.value = freq; const startTime = now + (strumIndex * 0.04); gain.gain.setValueAtTime(0, startTime); gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05); gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5); osc.connect(gain); gain.connect(audioCtxRef.current.destination); osc.start(startTime); osc.stop(startTime + 1.5); strumIndex++; }); };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"><div className="flex flex-col gap-2"><h2 className="text-2xl font-black italic text-white uppercase flex items-center gap-2"><Hand className="text-[#ff007f]" size={28} /> {root} <span className="text-[#ff007f]">{chordType}</span></h2><div className="flex items-center gap-3">{openAvailable && (<button onClick={() => setUseOpenShape(!useOpenShape)} className={`text-xs font-bold px-2 py-1 rounded-sm border ${useOpenShape ? 'bg-[#ff007f] text-black border-[#ff007f]' : 'text-neutral-500 border-neutral-700 hover:border-white'}`}>{useOpenShape ? 'Switch to Movable' : 'Switch to Open'}</button>)}<button onClick={playChord} className={`flex items-center gap-2 px-3 py-1 rounded-sm font-bold text-xs uppercase border transition-all active:scale-95 ${isStrumming ? 'bg-[#ff007f] text-black border-[#ff007f] shadow-[0_0_10px_#ff007f]' : 'bg-neutral-800 border-neutral-600 text-white hover:border-white'}`}><Music size={14} />{isStrumming ? 'Playing...' : 'Strum Code'}</button></div></div><div className="flex gap-2"><select value={root} onChange={(e) => setRoot(e.target.value)} className="bg-neutral-900 text-white font-bold text-lg px-3 py-2 border border-neutral-700 focus:border-[#ff007f] outline-none rounded-sm">{NOTES.map(n => <option key={n} value={n}>{n}</option>)}</select><select value={chordType} onChange={(e) => { setChordType(e.target.value); setUseOpenShape(false); }} className="bg-neutral-900 text-white font-bold text-sm px-3 py-2 border border-neutral-700 focus:border-[#ff007f] outline-none rounded-sm"><option value="5 (Power)">Power (5)</option><option value="Major">Major</option><option value="Minor">Minor</option></select></div></div>
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
          <div className="flex flex-row sm:flex-col items-center justify-center gap-2 p-4 bg-[#111] border-2 border-neutral-800 rounded-sm min-w-[100px]"><span className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest text-center">Start Fret</span><span className="text-5xl font-black text-[#ff007f] tabular-nums leading-none">{rootFret === 0 ? '0' : rootFret}</span><span className="text-neutral-600 text-[10px] uppercase">{rootFret === 0 ? 'Open' : `Position`}</span></div>
          {/* FIX: Chord Diagram - Use width 100% and flexbox for internal scaling instead of fixed min-width */}
          <div className="bg-[#111] p-4 md:p-6 border-2 border-white shadow-[4px_4px_0px_0px_#ff007f] relative w-full max-w-md mx-auto box-border">
            <div className="w-full relative ml-2 md:ml-4">
                {startFret === 0 && (<div className="absolute top-0 bottom-0 -left-1 w-1.5 md:w-2 bg-neutral-600 border-r-2 border-black z-10"></div>)}
                <div className="flex flex-col gap-4 md:gap-6 relative">
                {[0, 1, 2, 3, 4, 5].map((strIndex) => { const visualStrIndex = 5 - strIndex; const isMuted = muted.includes(visualStrIndex); return ( <div key={strIndex} className="relative h-1 bg-[#333] w-full flex items-center"><div className={`absolute -left-6 md:-left-8 text-xs font-mono w-4 text-right font-bold ${isMuted ? 'text-neutral-600' : 'text-white'}`}>{isMuted ? 'X' : 'O'}</div>{[...Array(displayFrets)].map((_, i) => (<div key={i} className="absolute h-6 md:h-8 w-px bg-neutral-800" style={{ left: `${(i / displayFrets) * 100}%`, top: '-12px' }}></div>))}{points.filter(p => p.string === visualStrIndex).map((p, i) => { const relativeFret = p.fret - startFret; if (p.finger === 0 && relativeFret === 0) return null; if (relativeFret < 0 || relativeFret >= displayFrets) return null; return ( <div key={i} className="absolute w-5 h-5 md:w-7 md:h-7 bg-[#ff007f] rounded-full flex items-center justify-center text-white font-black text-[10px] md:text-sm border-2 border-white z-20 shadow-md" style={{ left: `${(relativeFret / displayFrets) * 100 + (100/displayFrets/2)}%`, transform: 'translateX(-50%)' }}>{p.finger}</div> ) })}</div> ) })}
                {barre && (<div className="absolute bg-[#ff007f] opacity-40 rounded-full pointer-events-none" style={{ left: `calc(${( (barre.fret - startFret) / displayFrets ) * 100}% + ${(100/displayFrets/2)}% - 12px)`, top: `${(5 - barre.endStr) * 20 - 4}px`, height: `${(barre.endStr - barre.startStr) * 20 + 8}px`, width: '20px' }}></div>)}
                </div>
                <div className="flex justify-between px-1 md:px-2 pt-4 border-t border-neutral-700 mt-2">{[...Array(displayFrets)].map((_, i) => { const currentFretNum = startFret + i; const isRootFret = currentFretNum === rootFret && rootFret !== 0; return ( <span key={i} className={`text-[10px] md:text-xs font-mono w-full text-center transition-colors ${isRootFret ? 'text-[#ff007f] font-black scale-125' : 'text-neutral-600'}`}>{currentFretNum > 0 ? currentFretNum : ''}</span> ); })}</div>
            </div>
          </div>
      </div>
      <div className="text-center text-xs text-neutral-500 font-bold uppercase tracking-widest mt-2">Dots indicate finger positions • Click Strum to hear</div>
    </div>
  );
};

const SmartTabTrainer = ({ setGlobalBpm }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const handleImageUpload = (event) => { const file = event.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setSelectedImage(reader.result); setAnalysis(null); }; reader.readAsDataURL(file); } };
  const analyzeImage = async () => { if (!selectedImage) return; setLoading(true); const apiKey = ""; const base64Data = selectedImage.split(',')[1]; const mimeType = selectedImage.split(';')[0].split(':')[1]; const prompt = `Analyze guitar tab/sheet music. Return JSON: { title, artist, bpm (number), chords (array), difficulty (Easy/Medium/Hard), advice (array of 3 strings in Korean) }`; try { const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: mimeType, data: base64Data } }] }], generationConfig: { responseMimeType: "application/json" } }) }); const data = await response.json(); if (data.candidates) { setAnalysis(JSON.parse(data.candidates[0].content.parts[0].text)); } } catch (error) { alert("Analysis failed"); } finally { setLoading(false); } };

  return (
    <div className="space-y-6 w-full">
      <div className="text-center space-y-2"><h2 className="text-2xl font-black italic text-white uppercase flex items-center justify-center gap-2"><ImageIcon className="text-[#ff007f]" size={24} /> SMART TAB DOCTOR</h2><p className="text-neutral-500 text-xs">Upload your sheet music for AI analysis.</p></div>
      {!selectedImage ? ( <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-neutral-700 rounded-sm p-10 flex flex-col items-center justify-center cursor-pointer hover:border-[#ff007f] hover:bg-neutral-900 transition-colors w-full"><Upload className="text-neutral-500 mb-4" size={48} /><p className="text-neutral-400 font-bold uppercase text-sm">Click to Upload Tab Image</p><input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} /></div> ) : ( <div className="space-y-6 w-full"><div className="relative border-2 border-neutral-700 rounded-sm overflow-hidden max-h-[300px] w-full"><img src={selectedImage} className="w-full object-contain opacity-80" /><button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 bg-black/80 text-white p-1 rounded-full"><AlertCircle size={16} /></button></div>{!analysis ? ( <button onClick={analyzeImage} disabled={loading} className="w-full bg-[#ff007f] text-black font-black uppercase py-3 rounded-sm hover:bg-white transition-colors flex items-center justify-center gap-2">{loading ? <Loader2 className="animate-spin" /> : <Sparkles />} Analyze with AI</button> ) : ( <div className="bg-[#111] border-2 border-[#ff007f] p-6 shadow-[4px_4px_0px_#ff007f] animate-in slide-in-from-bottom-4 w-full max-w-full"><div className="flex justify-between items-start mb-4 border-b border-neutral-800 pb-4"><div><h3 className="text-xl font-black italic text-white uppercase">{analysis.title}</h3><p className="text-[#ff007f] font-bold text-sm">{analysis.artist}</p></div>{analysis.bpm && <div className="text-right"><p className="text-neutral-500 text-[10px] font-bold uppercase">Detected BPM</p><button onClick={() => setGlobalBpm(analysis.bpm)} className="text-2xl font-black text-white hover:text-[#ff007f] flex items-center gap-1 group">{analysis.bpm} <Zap size={16} /></button></div>}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><span className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-2 block">Chords</span><div className="flex flex-wrap gap-2">{analysis.chords?.map((c, i) => <span key={i} className="bg-neutral-800 text-white border border-neutral-600 px-3 py-1 text-xs font-bold rounded-sm">{c}</span>)}</div></div><div><span className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-2 block">Difficulty</span><span className="text-sm font-bold uppercase px-2 py-1 rounded-sm bg-neutral-800 text-white">{analysis.difficulty}</span></div></div><div className="mt-6 pt-4 border-t border-dashed border-neutral-800"><ul className="space-y-3">{analysis.advice?.map((step, i) => <li key={i} className="flex gap-3 text-sm text-neutral-300"><span className="bg-[#ff007f] text-black w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0">{i+1}</span>{step}</li>)}</ul></div></div> )}</div> )}
    </div>
  );
};

const AIToneLab = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const analyzeTone = async () => { if (!query) return; setLoading(true); setResult(null); const apiKey = ""; const prompt = `Analyze guitar tone for: "${query}". Return JSON: bandOrSong, ampSettings {gain, bass, mid, treble}, pedals, tip (in Korean).`; try { const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }) }); const data = await response.json(); if (data.candidates) setResult(JSON.parse(data.candidates[0].content.parts[0].text)); } catch (e) { alert("Failed"); } finally { setLoading(false); } };

  return (
    <div className="space-y-8 w-full">
      <div className="text-center space-y-2"><h2 className="text-2xl font-black italic text-white uppercase flex items-center justify-center gap-2"><Sparkles className="text-[#ff007f]" size={24} /> AI TONE LAB</h2><p className="text-neutral-500 text-xs">Find perfect settings</p></div>
      <div className="flex gap-2 w-full"><input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Green Day Basket Case" className="flex-1 bg-neutral-900 border border-neutral-700 text-white px-4 py-3 text-sm outline-none rounded-sm" onKeyDown={(e) => e.key === 'Enter' && analyzeTone()} /><button onClick={analyzeTone} disabled={loading} className="bg-[#ff007f] text-black px-6 py-2 font-bold uppercase text-xs rounded-sm">{loading ? <Loader2 className="animate-spin" /> : <Sparkles />}</button></div>
      {result && ( <div className="bg-[#111] border-2 border-white p-6 shadow-[4px_4px_0px_#ff007f] animate-in slide-in-from-bottom-4 w-full max-w-full"><h3 className="text-xl font-black italic text-white mb-6 border-b border-neutral-800 pb-2">{result.bandOrSong} <span className="text-[#ff007f] text-sm not-italic ml-2">PRESET</span></h3><div className="grid grid-cols-4 gap-4 mb-6">{Object.entries(result.ampSettings).map(([k, v]) => <div key={k} className="flex flex-col items-center"><div className="relative w-12 h-12 rounded-full border-2 border-neutral-600 bg-neutral-900 flex items-center justify-center"><div className="absolute w-1 h-3 bg-[#ff007f] top-1 origin-bottom" style={{ transform: `translateY(50%) rotate(${(v/10)*270 - 135}deg)` }}></div><span className="z-10 text-white font-bold">{v}</span></div><span className="text-[10px] uppercase mt-1 text-neutral-500">{k}</span></div>)}</div><div className="space-y-2"><div className="flex gap-2"><span className="bg-neutral-800 text-white px-2 py-1 text-[10px] font-bold rounded-sm">Pedals</span><span className="text-sm text-neutral-300">{result.pedals}</span></div><div className="flex gap-2"><span className="bg-[#ff007f] text-black px-2 py-1 text-[10px] font-bold rounded-sm">Tip</span><span className="text-sm text-white">{result.tip}</span></div></div></div> )}
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
    <div className="flex flex-col items-center justify-center py-4 space-y-8 w-full">
      <div className="flex gap-3">{[0, 1, 2, 3].map((i) => (<div key={i} className={`w-3 h-3 rounded-full transition-all duration-75 ${beat === i ? 'bg-[#ff007f] scale-125 shadow-[0_0_8px_#ff007f]' : 'bg-[#333]'}`}></div>))}</div>
      <div className="relative group cursor-pointer" onClick={() => setIsPlaying(!isPlaying)}>
         <span className="text-6xl md:text-8xl font-black text-white tracking-tighter tabular-nums select-none">{localBpm}</span>
        <div className={`absolute -right-8 top-2 ${isPlaying ? 'animate-pulse text-[#ff007f]' : 'text-neutral-700'}`}><Zap size={24} fill="currentColor" /></div>
        <p className="text-center text-neutral-500 text-xs font-bold uppercase tracking-[0.2em] -mt-2">Beats Per Minute</p>
      </div>
      <div className="w-full max-w-xs space-y-6"><input type="range" min="40" max="240" value={localBpm} onChange={(e) => handleBpmChange(Number(e.target.value))} className="w-full h-1 bg-[#333] appearance-none rounded-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#ff007f] [&::-webkit-slider-thumb]:hover:scale-125 cursor-pointer transition-all" /><div className="flex justify-center gap-6 items-center"><button onClick={() => handleBpmChange(localBpm - 1)} className="w-8 h-8 rounded-full border border-neutral-700 text-neutral-500 hover:text-white hover:border-white flex items-center justify-center transition-colors">-1</button><button onClick={() => setIsPlaying(!isPlaying)} className={`w-14 h-14 flex items-center justify-center transition-all rounded-full ${isPlaying ? 'bg-white text-black' : 'bg-[#ff007f] text-white hover:scale-105 shadow-[0_0_15px_rgba(255,0,127,0.4)]'}`}>{isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}</button><button onClick={() => handleBpmChange(localBpm + 1)} className="w-8 h-8 rounded-full border border-neutral-700 text-neutral-500 hover:text-white hover:border-white flex items-center justify-center transition-colors">+1</button></div></div>
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

  return (
    <div className="flex flex-col items-center justify-center py-6 w-full">
      <div className="mb-8 w-full max-w-xs"><label className="text-xs text-neutral-500 font-bold uppercase mb-2 block text-center">Select Tuning Preset</label><div className="relative"><Settings className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} /><select value={currentTuning} onChange={(e) => { stopTone(); setCurrentTuning(e.target.value); }} className="w-full bg-neutral-900 text-white font-bold text-sm pl-10 pr-4 py-3 border border-neutral-700 focus:border-[#ff007f] outline-none rounded-sm appearance-none">{Object.keys(TUNING_PRESETS).map(preset => <option key={preset} value={preset}>{preset}</option>)}</select></div></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-md">{tuningStrings.map((item, index) => { const stringNum = 6 - index; return ( <button key={`${item.note}-${index}`} onClick={() => playTone(item.freq, item.note)} className={`relative h-24 border transition-all flex flex-col items-center justify-center overflow-hidden rounded-sm group ${activeNote === item.note ? 'bg-[#ff007f] border-[#ff007f] text-white' : 'bg-transparent border-neutral-800 text-neutral-400 hover:border-white hover:text-white'}`}><span className={`absolute top-2 left-3 text-[10px] font-bold uppercase tracking-wider ${activeNote === item.note ? 'text-black/50' : 'text-neutral-600 group-hover:text-neutral-400'}`}>{stringNum}번 줄</span><span className="text-3xl font-black italic z-10">{item.note}</span><span className={`text-[10px] font-bold uppercase tracking-widest z-10 mt-1 ${activeNote === item.note ? 'text-white' : 'text-neutral-600 group-hover:text-white'}`}>{item.label}</span>{activeNote === item.note && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}</button> ); })}</div>
      <div className="mt-8 flex flex-col items-center gap-2 text-neutral-600 text-xs font-mono uppercase text-center"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ff007f] animate-pulse"></div>Click string to hear tone</div><p className="text-neutral-700">Tune your string until it matches the sound</p></div>
    </div>
  );
};

export default App;