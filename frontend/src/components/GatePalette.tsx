import { useState } from 'react';
import type { Gate } from '../types/circuit';
import { QUBIT_GATES, QUMODE_GATES, HYBRID_GATES, CUSTOM_GATES } from '../types/circuit';

interface SavedCustomGate {
  name: string;
  expression: string;
}

interface GatePaletteProps {
  onDragStart: (gate: Gate) => void;
  savedCustomGates?: SavedCustomGate[];
  onRemoveCustomGate?: (name: string) => void;
}

interface GateButtonProps {
  gate: Gate;
  onDragStart: (gate: Gate) => void;
  colorClass: string;
  generatorExpression?: string;
  onRemove?: () => void;
}

function GateButton({ gate, onDragStart, colorClass, generatorExpression, onRemove }: GateButtonProps) {
  const [showRemove, setShowRemove] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowRemove(true)}
      onMouseLeave={() => setShowRemove(false)}
    >
      <div
        draggable
        onDragStart={(e) => {
          const gateData = { ...gate };
          // For saved custom gates, include the expression in the drag data
          if (generatorExpression) {
            (gateData as Gate & { generatorExpression: string }).generatorExpression = generatorExpression;
          }
          e.dataTransfer.setData('gate', JSON.stringify(gateData));
          onDragStart(gate);
        }}
        className={`${colorClass} p-2 rounded-lg cursor-grab active:cursor-grabbing
          flex flex-col items-center justify-center min-w-[60px] h-[60px]
          hover:scale-105 transition-transform border border-white/20`}
        title={generatorExpression ? `${gate.description}\nGenerator: ${generatorExpression}` : gate.description}
      >
        <span className="font-bold text-lg">{gate.symbol}</span>
        <span className="text-[10px] opacity-70 truncate max-w-full">{gate.name}</span>
      </div>
      {/* Remove button for saved custom gates */}
      {onRemove && showRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 hover:bg-red-700 rounded-full text-[10px] flex items-center justify-center"
          title="Remove from palette"
        >
          ×
        </button>
      )}
    </div>
  );
}

interface GateSectionProps {
  title: string;
  gates: Gate[];
  onDragStart: (gate: Gate) => void;
  colorClass: string;
  borderColor: string;
}

function GateSection({ title, gates, onDragStart, colorClass, borderColor }: GateSectionProps) {
  return (
    <div className="mb-4">
      <h3 className={`text-sm font-semibold mb-2 ${borderColor} border-b pb-1`}>{title}</h3>
      <div className="flex flex-wrap gap-2">
        {gates.map((gate) => (
          <GateButton
            key={gate.id}
            gate={gate}
            onDragStart={onDragStart}
            colorClass={colorClass}
          />
        ))}
      </div>
    </div>
  );
}

export default function GatePalette({ onDragStart, savedCustomGates = [], onRemoveCustomGate }: GatePaletteProps) {
  // Convert saved custom gates to Gate objects
  const savedGates: Array<{ gate: Gate; expression: string }> = savedCustomGates.map((saved) => {
    return {
      gate: {
        id: `custom-saved-${saved.name}`,
        name: saved.name,
        symbol: saved.name,
        category: 'custom' as const,
        description: `Custom: ${saved.expression}`,
        parameters: [
          { name: 'theta', symbol: 'θ', defaultValue: Math.PI / 4, min: -2 * Math.PI, max: 2 * Math.PI, step: 0.1, unit: 'rad' },
        ],
      },
      expression: saved.expression,
    };
  });

  return (
    <div className="bg-slate-800 p-4 rounded-xl h-full overflow-y-auto">
      <h2 className="text-lg font-bold mb-4 text-white">Gate Palette</h2>

      <GateSection
        title="Qubit Gates"
        gates={QUBIT_GATES}
        onDragStart={onDragStart}
        colorClass="bg-blue-600 text-white"
        borderColor="border-blue-500"
      />

      <GateSection
        title="Qumode Gates"
        gates={QUMODE_GATES}
        onDragStart={onDragStart}
        colorClass="bg-emerald-600 text-white"
        borderColor="border-emerald-500"
      />

      <GateSection
        title="Hybrid Gates"
        gates={HYBRID_GATES}
        onDragStart={onDragStart}
        colorClass="bg-purple-600 text-white"
        borderColor="border-purple-500"
      />

      {/* Custom Gates section with saved gates */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 border-amber-500 border-b pb-1">Custom Gates</h3>
        <div className="flex flex-wrap gap-2">
          {/* Base custom gate (for creating new ones) */}
          {CUSTOM_GATES.map((gate) => (
            <GateButton
              key={gate.id}
              gate={gate}
              onDragStart={onDragStart}
              colorClass="bg-amber-600 text-white"
            />
          ))}
          {/* Saved custom gates */}
          {savedGates.map(({ gate, expression }) => (
            <GateButton
              key={gate.id}
              gate={gate}
              onDragStart={onDragStart}
              colorClass="bg-amber-700 text-white"
              generatorExpression={expression}
              onRemove={onRemoveCustomGate ? () => onRemoveCustomGate(gate.name) : undefined}
            />
          ))}
        </div>
        {savedGates.length > 0 && (
          <div className="mt-2 text-[10px] text-slate-500">
            Hover over saved gates to remove them
          </div>
        )}
      </div>
    </div>
  );
}
