import React, { useState } from 'react';
import { SHAPES, DEFAULT_SPEEDS } from './constants';
import HyperShapeCanvas from './components/HyperShapeCanvas';
import { getShapeInsight } from './services/geminiService';
import { RotationSpeeds } from './types';

// Icons
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L19 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>;
const DiceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M16 8h.01" /><path d="M8 8h.01" /><path d="M8 16h.01" /><path d="M16 16h.01" /><path d="M12 12h.01" /></svg>;
const ResetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>;

// Presets
type PresetKey = 'custom' | 'slow' | 'normal' | 'fast' | 'chaotic' | 'focus3d' | 'focus4d';

const PRESETS: Record<Exclude<PresetKey, 'custom'>, { label: string, speeds: RotationSpeeds }> = {
  normal: {
    label: 'Normal Rotation',
    speeds: DEFAULT_SPEEDS
  },
  slow: {
    label: 'Slow & Hypnotic',
    speeds: { xy: 0.002, xz: 0.002, xw: 0.002, yz: 0.002, yw: 0.002, zw: 0.002 }
  },
  fast: {
    label: 'Fast',
    speeds: { xy: 0.02, xz: 0.02, xw: 0.02, yz: 0.02, yw: 0.02, zw: 0.02 }
  },
  chaotic: {
    label: 'Chaotic',
    speeds: { xy: 0.03, xz: -0.02, xw: 0.04, yz: -0.03, yw: 0.01, zw: -0.04 }
  },
  focus3d: {
    label: '3D Focus (No 4D)',
    speeds: { xy: 0.01, xz: 0.01, xw: 0, yz: 0.01, yw: 0, zw: 0 }
  },
  focus4d: {
    label: '4D Focus (Only W)',
    speeds: { xy: 0, xz: 0, xw: 0.01, yz: 0, yw: 0.01, zw: 0.01 }
  }
};

const App: React.FC = () => {
  const [currentShapeKey, setCurrentShapeKey] = useState<string>('tesseract');
  const [isPlaying, setIsPlaying] = useState(true);
  const [scale, setScale] = useState(1);
  const [speeds, setSpeeds] = useState<RotationSpeeds>(DEFAULT_SPEEDS);
  const [currentPreset, setCurrentPreset] = useState<PresetKey>('normal');

  // Gemini State
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  const currentShape = SHAPES[currentShapeKey];

  const handleSpeedChange = (axis: keyof RotationSpeeds, val: number) => {
    setSpeeds(prev => ({ ...prev, [axis]: val }));
    setCurrentPreset('custom');
  };

  const handlePresetChange = (key: PresetKey) => {
    setCurrentPreset(key);
    if (key !== 'custom') {
      setSpeeds(PRESETS[key].speeds);
    }
  };

  const handleRandomize = () => {
    // Random Shape
    const keys = Object.keys(SHAPES);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    setCurrentShapeKey(randomKey);
    setAiInsight(null);

    // Random Speeds
    const randS = () => (Math.random() * 0.06) - 0.03; // Slightly reduced range for sanity
    setSpeeds({
      xy: randS(), xz: randS(), xw: randS(),
      yz: randS(), yw: randS(), zw: randS(),
    });
    setCurrentPreset('custom');

    // Ensure we are playing
    setIsPlaying(true);
  };

  const handleResetView = () => {
    setSpeeds(DEFAULT_SPEEDS);
    setCurrentPreset('normal');
    setScale(1);
    setIsPlaying(true);
    setAiInsight(null);
  };

  const fetchInsight = async () => {
    setIsLoadingInsight(true);
    setAiInsight(null);
    const insight = await getShapeInsight(currentShape.name, `The user is viewing the ${currentShape.name} with rotation speeds: ${JSON.stringify(speeds)}`);
    setAiInsight(insight);
    setIsLoadingInsight(false);
  };

  return (
    <div className="relative w-screen h-screen bg-slate-900 flex flex-col md:flex-row text-slate-200 overflow-hidden font-sans">

      {/* Sidebar Controls */}
      <aside className="w-full md:w-80 bg-slate-800/80 backdrop-blur-md border-r border-slate-700 flex flex-col z-10 overflow-y-auto">

        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            HyperView 4D
          </h1>
          <p className="text-xs text-slate-400 mt-1">Interactive 4D Visualizer</p>
        </div>

        {/* Shape Selector */}
        <div className="p-6 space-y-4 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Polytope</label>
            <button
              onClick={handleRandomize}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 rounded-full hover:shadow-lg hover:brightness-110 transition-all"
              title="Random Shape & Motion"
            >
              <DiceIcon />
              Surprise Me
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
            {Object.entries(SHAPES).map(([key, shape]) => (
              <button
                key={key}
                onClick={() => {
                  setCurrentShapeKey(key);
                  setAiInsight(null); // Clear old insight
                }}
                className={`px-4 py-3 rounded-lg text-left transition-all ${currentShapeKey === key
                    ? 'bg-slate-700 text-cyan-400 border border-slate-600 shadow-lg'
                    : 'bg-slate-800/50 hover:bg-slate-700 text-slate-400 border border-transparent'
                  }`}
              >
                {shape.name}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-400 leading-relaxed min-h-[4rem]">
            {currentShape.description}
          </p>
        </div>

        {/* Rotation Controls */}
        <div className="p-6 space-y-6 flex-1">
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Rotation</label>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-cyan-600 hover:bg-cyan-500 rounded-full text-white transition-colors"
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
          </div>

          {/* Preset Dropdown */}
          <div className="mb-4">
            <select
              value={currentPreset}
              onChange={(e) => handlePresetChange(e.target.value as PresetKey)}
              className="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
            >
              <option value="custom">Custom Configuration</option>
              {Object.entries(PRESETS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Standard 3D Rotations */}
            <div className="space-y-3">
              <span className="text-xs text-slate-500 block mb-2">3D Planes</span>
              {(['xy', 'xz', 'yz'] as const).map(axis => (
                <div key={axis} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>{axis.toUpperCase()}</span>
                    <span>{speeds[axis].toFixed(3)}</span>
                  </div>
                  <input
                    type="range" min="-0.05" max="0.05" step="0.001"
                    value={speeds[axis]}
                    onChange={(e) => handleSpeedChange(axis, parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              ))}
            </div>

            {/* 4D Specific Rotations */}
            <div className="space-y-3">
              <span className="text-xs text-purple-400 block mb-2 font-semibold">4D Planes (Magic)</span>
              {(['xw', 'yw', 'zw'] as const).map(axis => (
                <div key={axis} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-purple-300">
                    <span>{axis.toUpperCase()}</span>
                    <span>{speeds[axis].toFixed(3)}</span>
                  </div>
                  <input
                    type="range" min="-0.05" max="0.05" step="0.001"
                    value={speeds[axis]}
                    onChange={(e) => handleSpeedChange(axis, parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700 space-y-4">
            <div>
              <label className="text-xs font-mono text-slate-500 mb-1 block">Zoom / Scale</label>
              <input
                type="range" min="0.5" max="3" step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-400"
              />
            </div>

            <button
              onClick={handleResetView}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs text-slate-300 font-mono flex items-center justify-center gap-2 transition-all"
            >
              <ResetIcon />
              Reset View Parameters
            </button>
          </div>
        </div>

        {/* AI Insight Button */}
        <div className="p-6 border-t border-slate-700 bg-slate-800">
          <button
            onClick={fetchInsight}
            disabled={isLoadingInsight}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
          >
            <SparklesIcon />
            {isLoadingInsight ? 'Consulting Hyper-Intelligence...' : 'Ask AI About This Shape'}
          </button>

          {aiInsight && (
            <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-purple-500/30 text-sm text-purple-200 leading-relaxed animate-in fade-in slide-in-from-bottom-2">
              {aiInsight}
            </div>
          )}
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 relative bg-gradient-to-br from-slate-900 via-[#0a0f1e] to-black">
        <HyperShapeCanvas
          shape={currentShape}
          speeds={speeds}
          isPlaying={isPlaying}
          scale={scale}
        />

        {/* Overlay Instructions */}
        <div className="absolute top-6 right-6 pointer-events-none text-right opacity-50">
          <p className="text-xs text-slate-500 font-mono">
            X, Y, Z = Spatial Dimensions<br />
            W = The Fourth Dimension
          </p>
        </div>

        <div className="absolute bottom-6 left-6 pointer-events-none">
          <p className="text-[10px] text-slate-600 font-mono">
            Rendered with HTML5 Canvas + TypeScript
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;