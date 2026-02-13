import { useState, useEffect } from 'react';
import type { Gate, CircuitElement, Wire } from '../types/circuit';
import { parseGeneratorExpression, buildGeneratorMatrix } from '../simulation/customGenerator';

interface GateParameterEditorProps {
  element: CircuitElement;
  gate: Gate;
  onUpdateParameters: (elementId: string, params: Record<string, number>) => void;
  onUpdateGeneratorExpression?: (elementId: string, expression: string) => void;
  onUpdateTargetWire?: (elementId: string, targetWireIndex: number) => void;
  onSaveCustomGate?: (name: string, expression: string) => void;
  wires?: Wire[];
  onClose: () => void;
}

export default function GateParameterEditor({
  element,
  gate,
  onUpdateParameters,
  onUpdateGeneratorExpression,
  onUpdateTargetWire,
  onSaveCustomGate,
  wires,
  onClose,
}: GateParameterEditorProps) {
  const isCustomGate = gate.category === 'custom';
  const currentParams = element.parameterValues ?? {};

  // State for custom generator expression
  const [expression, setExpression] = useState(element.generatorExpression || '');
  const [saveName, setSaveName] = useState('');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    type?: 'cv' | 'dv' | 'hybrid';
    isHermitian?: boolean;
    error?: string;
  }>({ isValid: false });

  // Validate expression when it changes
  useEffect(() => {
    if (!isCustomGate || !expression.trim()) {
      setValidationResult({ isValid: false });
      return;
    }

    try {
      const parsed = parseGeneratorExpression(expression);
      if (!parsed.isValid) {
        setValidationResult({ isValid: false, error: parsed.error });
        return;
      }

      // Try to build the matrix to check Hermiticity
      // Use a small fockDim for validation
      const { type, isHermitian } = buildGeneratorMatrix(expression, 4);
      setValidationResult({
        isValid: true,
        type,
        isHermitian,
        error: isHermitian ? undefined : 'Generator is not Hermitian',
      });
    } catch (err) {
      setValidationResult({
        isValid: false,
        error: err instanceof Error ? err.message : 'Validation error',
      });
    }
  }, [expression, isCustomGate]);

  // Save expression when it changes and is valid
  useEffect(() => {
    if (isCustomGate && onUpdateGeneratorExpression && validationResult.isValid && validationResult.isHermitian) {
      onUpdateGeneratorExpression(element.id, expression);
    }
  }, [expression, validationResult, isCustomGate, onUpdateGeneratorExpression, element.id]);

  const handleParamChange = (paramName: string, value: number) => {
    const newParams = { ...currentParams, [paramName]: value };
    onUpdateParameters(element.id, newParams);
  };

  const getCategoryColor = () => {
    switch (gate.category) {
      case 'qubit':
        return 'border-blue-500 bg-blue-900/50';
      case 'qumode':
        return 'border-emerald-500 bg-emerald-900/50';
      case 'hybrid':
        return 'border-purple-500 bg-purple-900/50';
      case 'custom':
        return 'border-amber-500 bg-amber-900/50';
      default:
        return 'border-slate-500 bg-slate-900/50';
    }
  };

  const getTypeLabel = (type: 'cv' | 'dv' | 'hybrid') => {
    switch (type) {
      case 'cv':
        return { label: 'Continuous Variable (Qumode)', color: 'text-emerald-400' };
      case 'dv':
        return { label: 'Discrete Variable (Qubit)', color: 'text-blue-400' };
      case 'hybrid':
        return { label: 'Hybrid (Qubit + Qumode)', color: 'text-purple-400' };
    }
  };

  // Get available wires for hybrid target selection
  const currentWire = wires?.[element.wireIndex];
  const availableTargetWires = wires?.filter((w, idx) => {
    if (idx === element.wireIndex) return false;
    // For hybrid, need opposite type
    if (validationResult.type === 'hybrid') {
      return w.type !== currentWire?.type;
    }
    return false;
  }) ?? [];

  if (!gate.parameters?.length && !isCustomGate) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className={`rounded-lg p-4 border-2 ${getCategoryColor()} min-w-[350px] max-w-[450px]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">
            {gate.name} ({gate.symbol})
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-slate-300 mb-4">{gate.description}</p>

        {/* Custom Generator Expression Input */}
        {isCustomGate && (
          <div className="mb-4 space-y-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Generator Expression (G)
              </label>
              <input
                type="text"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="e.g., a + ad, z * n, x + y"
                className={`w-full px-3 py-2 bg-slate-800 border rounded text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
                  expression && !validationResult.isValid
                    ? 'border-red-500 focus:ring-red-500'
                    : validationResult.isValid && validationResult.isHermitian
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-slate-600 focus:ring-amber-500'
                }`}
              />
              <div className="mt-1 text-xs text-slate-500">
                CV: a, ad, n | DV: x, y, z | Ops: +, -, *, i
              </div>
            </div>

            {/* Validation feedback */}
            {expression && (
              <div className="p-2 rounded bg-slate-800/50">
                {validationResult.isValid ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Type:</span>
                      <span className={`text-xs font-medium ${getTypeLabel(validationResult.type!).color}`}>
                        {getTypeLabel(validationResult.type!).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">Hermitian:</span>
                      {validationResult.isHermitian ? (
                        <span className="text-xs text-green-400">Yes (valid generator)</span>
                      ) : (
                        <span className="text-xs text-red-400">No (invalid - must be Hermitian)</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-red-400">
                    {validationResult.error || 'Invalid expression'}
                  </div>
                )}
              </div>
            )}

            {/* Target wire selection for hybrid gates */}
            {validationResult.type === 'hybrid' && validationResult.isHermitian && onUpdateTargetWire && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Target Wire ({currentWire?.type === 'qubit' ? 'Qumode' : 'Qubit'})
                </label>
                <select
                  value={element.targetWireIndices?.[0] ?? ''}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value, 10);
                    if (!isNaN(idx)) {
                      onUpdateTargetWire(element.id, idx);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select target wire...</option>
                  {availableTargetWires.map((w) => {
                    const idx = wires!.indexOf(w);
                    return (
                      <option key={w.id} value={idx}>
                        {w.type === 'qubit' ? `q${w.index}` : `m${w.index}`}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Save to palette */}
            {validationResult.isValid && validationResult.isHermitian && onSaveCustomGate && (
              <div className="pt-2 border-t border-slate-700">
                <label className="block text-sm text-slate-300 mb-1">
                  Save to Palette
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Gate name (e.g., Dx, Dp)"
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (saveName.trim() && expression.trim()) {
                        onSaveCustomGate(saveName.trim(), expression.trim());
                        setSaveName('');
                      }
                    }}
                    disabled={!saveName.trim()}
                    className={`px-3 py-2 rounded text-sm font-medium ${
                      saveName.trim()
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-slate-600 cursor-not-allowed'
                    }`}
                  >
                    Save
                  </button>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Saves this generator to the palette for quick reuse
                </div>
              </div>
            )}
          </div>
        )}

        {/* Parameter inputs */}
        {gate.parameters && gate.parameters.length > 0 && (
          <div className="space-y-4">
            {gate.parameters.map((param) => {
              const value = currentParams[param.name] ?? param.defaultValue;

              return (
                <div key={param.name} className="space-y-2">
                  <label className="block text-sm text-slate-300">
                    {param.symbol}
                    {param.unit && <span className="text-slate-500 ml-1">({param.unit})</span>}
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      step="any"
                      value={value}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          handleParamChange(param.name, val);
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {/* Quick preset buttons for common values */}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleParamChange(param.name, Math.PI / 4)}
                        className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded"
                        title="π/4"
                      >
                        π/4
                      </button>
                      <button
                        type="button"
                        onClick={() => handleParamChange(param.name, Math.PI / 2)}
                        className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded"
                        title="π/2"
                      >
                        π/2
                      </button>
                      <button
                        type="button"
                        onClick={() => handleParamChange(param.name, Math.PI)}
                        className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded"
                        title="π"
                      >
                        π
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    ≈ {(value / Math.PI).toFixed(4)}π
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              // Reset to defaults
              const defaults: Record<string, number> = {};
              if (gate.parameters) {
                for (const p of gate.parameters) {
                  defaults[p.name] = p.defaultValue;
                }
              }
              onUpdateParameters(element.id, defaults);
              if (isCustomGate) {
                setExpression('');
              }
            }}
            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className={`flex-1 py-2 rounded text-sm font-medium ${
              isCustomGate && (!validationResult.isValid || !validationResult.isHermitian)
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
            disabled={isCustomGate && (!validationResult.isValid || !validationResult.isHermitian)}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
