import type { Gate, CircuitElement } from '../types/circuit';

interface GateParameterEditorProps {
  element: CircuitElement;
  gate: Gate;
  onUpdateParameters: (elementId: string, params: Record<string, number>) => void;
  onClose: () => void;
}

export default function GateParameterEditor({
  element,
  gate,
  onUpdateParameters,
  onClose,
}: GateParameterEditorProps) {
  if (!gate.parameters || gate.parameters.length === 0) {
    return null;
  }

  const currentParams = element.parameterValues ?? {};

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
      default:
        return 'border-slate-500 bg-slate-900/50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className={`rounded-lg p-4 border-2 ${getCategoryColor()} min-w-[300px] max-w-[400px]`}
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

        <div className="space-y-4">
          {gate.parameters.map((param) => {
            const value = currentParams[param.name] ?? param.defaultValue;
            const displayValue = param.unit === 'rad'
              ? `${(value / Math.PI).toFixed(2)}π`
              : value.toFixed(2);

            return (
              <div key={param.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <label className="text-slate-300">
                    {param.symbol}
                    {param.unit && <span className="text-slate-500 ml-1">({param.unit})</span>}
                  </label>
                  <span className="text-white font-mono">{displayValue}</span>
                </div>
                <input
                  type="range"
                  min={param.min ?? -10}
                  max={param.max ?? 10}
                  step={param.step ?? 0.1}
                  value={value}
                  onChange={(e) => handleParamChange(param.name, parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{param.min ?? -10}</span>
                  <span>{param.max ?? 10}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              // Reset to defaults
              const defaults: Record<string, number> = {};
              for (const p of gate.parameters!) {
                defaults[p.name] = p.defaultValue;
              }
              onUpdateParameters(element.id, defaults);
            }}
            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
