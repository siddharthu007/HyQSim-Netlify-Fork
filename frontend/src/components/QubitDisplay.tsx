import { useState } from 'react';
import type { QubitState } from '../types/circuit';

type DisplayMode = 'bloch' | 'expectations';

interface QubitDisplayProps {
  qubitIndex: number;
  wireIndex: number;
  state?: QubitState;
}

export default function QubitDisplay({
  qubitIndex,
  wireIndex,
  state,
}: QubitDisplayProps) {
  const [mode, setMode] = useState<DisplayMode>('bloch');

  // Use provided state or default to |0⟩
  const blochVector = state?.blochVector ?? { x: 0, y: 0, z: 1 };
  const expectations = state?.expectations ?? { sigmaX: 0, sigmaY: 0, sigmaZ: 1 };

  // Simple 2D projection of Bloch sphere
  const sphereRadius = 60;
  const centerX = 80;
  const centerY = 80;

  // Project 3D point to 2D (simple orthographic projection)
  const projectedX = centerX + blochVector.x * sphereRadius;
  const projectedY = centerY - blochVector.z * sphereRadius; // Invert Y for screen coords
  const pointDepth = blochVector.y; // Use for visual depth cue

  return (
    <div className="bg-slate-800 rounded-lg p-3">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-semibold text-blue-400">
          |q{qubitIndex}⟩ <span className="text-xs text-slate-500">(wire {wireIndex})</span>
        </h4>
        <div className="flex gap-1">
          <button
            onClick={() => setMode('bloch')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              mode === 'bloch'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Bloch
          </button>
          <button
            onClick={() => setMode('expectations')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              mode === 'expectations'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            ⟨σ⟩
          </button>
        </div>
      </div>

      {/* State amplitude display */}
      {state && (
        <div className="text-xs text-slate-400 mb-2 font-mono">
          |ψ⟩ = {formatComplex(state.amplitude[0])}|0⟩ + {formatComplex(state.amplitude[1])}|1⟩
        </div>
      )}

      {mode === 'bloch' ? (
        <svg width="160" height="160" className="mx-auto">
          {/* Sphere outline */}
          <circle
            cx={centerX}
            cy={centerY}
            r={sphereRadius}
            fill="none"
            stroke="#475569"
            strokeWidth={1}
          />
          {/* Equator (XY plane) */}
          <ellipse
            cx={centerX}
            cy={centerY}
            rx={sphereRadius}
            ry={sphereRadius * 0.3}
            fill="none"
            stroke="#475569"
            strokeWidth={0.5}
            strokeDasharray="4,4"
          />
          {/* Z-axis */}
          <line
            x1={centerX}
            y1={centerY - sphereRadius}
            x2={centerX}
            y2={centerY + sphereRadius}
            stroke="#475569"
            strokeWidth={0.5}
          />
          {/* X-axis */}
          <line
            x1={centerX - sphereRadius}
            y1={centerY}
            x2={centerX + sphereRadius}
            y2={centerY}
            stroke="#475569"
            strokeWidth={0.5}
          />

          {/* Labels */}
          <text x={centerX} y={centerY - sphereRadius - 5} fill="#94a3b8" fontSize={10} textAnchor="middle">
            |0⟩
          </text>
          <text x={centerX} y={centerY + sphereRadius + 12} fill="#94a3b8" fontSize={10} textAnchor="middle">
            |1⟩
          </text>
          <text x={centerX + sphereRadius + 8} y={centerY + 4} fill="#94a3b8" fontSize={10}>
            +x
          </text>
          <text x={centerX - sphereRadius - 12} y={centerY + 4} fill="#94a3b8" fontSize={10}>
            -x
          </text>

          {/* State vector line */}
          <line
            x1={centerX}
            y1={centerY}
            x2={projectedX}
            y2={projectedY}
            stroke="#3b82f6"
            strokeWidth={2}
          />

          {/* State point */}
          <circle
            cx={projectedX}
            cy={projectedY}
            r={6}
            fill={pointDepth > 0 ? '#3b82f6' : '#1d4ed8'}
            stroke="white"
            strokeWidth={2}
          />

          {/* Bloch vector coordinates */}
          <text x={centerX} y={160} fill="#64748b" fontSize={8} textAnchor="middle">
            ({blochVector.x.toFixed(2)}, {blochVector.y.toFixed(2)}, {blochVector.z.toFixed(2)})
          </text>
        </svg>
      ) : (
        <div className="space-y-2 p-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 w-12 text-sm">⟨σx⟩:</span>
            <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden relative">
              <div
                className="absolute top-0 left-1/2 h-full w-0.5 bg-slate-600"
              />
              <div
                className="h-full bg-blue-500 transition-all absolute"
                style={{
                  left: expectations.sigmaX >= 0 ? '50%' : `${50 + expectations.sigmaX * 50}%`,
                  width: `${Math.abs(expectations.sigmaX) * 50}%`,
                }}
              />
            </div>
            <span className="text-sm w-14 text-right font-mono">{expectations.sigmaX.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 w-12 text-sm">⟨σy⟩:</span>
            <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden relative">
              <div
                className="absolute top-0 left-1/2 h-full w-0.5 bg-slate-600"
              />
              <div
                className="h-full bg-green-500 transition-all absolute"
                style={{
                  left: expectations.sigmaY >= 0 ? '50%' : `${50 + expectations.sigmaY * 50}%`,
                  width: `${Math.abs(expectations.sigmaY) * 50}%`,
                }}
              />
            </div>
            <span className="text-sm w-14 text-right font-mono">{expectations.sigmaY.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 w-12 text-sm">⟨σz⟩:</span>
            <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden relative">
              <div
                className="absolute top-0 left-1/2 h-full w-0.5 bg-slate-600"
              />
              <div
                className="h-full bg-purple-500 transition-all absolute"
                style={{
                  left: expectations.sigmaZ >= 0 ? '50%' : `${50 + expectations.sigmaZ * 50}%`,
                  width: `${Math.abs(expectations.sigmaZ) * 50}%`,
                }}
              />
            </div>
            <span className="text-sm w-14 text-right font-mono">{expectations.sigmaZ.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function formatComplex(c: { re: number; im: number }): string {
  const re = c.re.toFixed(2);
  const im = c.im.toFixed(2);
  if (Math.abs(c.im) < 0.01) return re;
  if (Math.abs(c.re) < 0.01) return `${im}i`;
  return `(${re}${c.im >= 0 ? '+' : ''}${im}i)`;
}
