import type { Gate } from '../types/circuit';
import { QUBIT_GATES, QUMODE_GATES, HYBRID_GATES } from '../types/circuit';

interface GatePaletteProps {
  onDragStart: (gate: Gate) => void;
}

interface GateButtonProps {
  gate: Gate;
  onDragStart: (gate: Gate) => void;
  colorClass: string;
}

function GateButton({ gate, onDragStart, colorClass }: GateButtonProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('gate', JSON.stringify(gate));
        onDragStart(gate);
      }}
      className={`${colorClass} p-2 rounded-lg cursor-grab active:cursor-grabbing
        flex flex-col items-center justify-center min-w-[60px] h-[60px]
        hover:scale-105 transition-transform border border-white/20`}
      title={gate.description}
    >
      <span className="font-bold text-lg">{gate.symbol}</span>
      <span className="text-[10px] opacity-70 truncate max-w-full">{gate.name}</span>
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

export default function GatePalette({ onDragStart }: GatePaletteProps) {
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
    </div>
  );
}
