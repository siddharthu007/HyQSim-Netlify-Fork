import { useState, useEffect, useCallback } from 'react';
import type { Wire, CircuitElement } from '../types/circuit';
import { importBosonicQiskit, exportBosonicQiskit } from '../api/backend';

interface QiskitIOModalProps {
  mode: 'import' | 'export';
  wires: Wire[];
  elements: CircuitElement[];
  fockTruncation: number;
  onImport: (wires: Wire[], elements: CircuitElement[]) => void;
  onClose: () => void;
  backendAvailable: boolean;
}

export default function QiskitIOModal({
  mode: initialMode,
  wires,
  elements,
  fockTruncation,
  onImport,
  onClose,
  backendAvailable,
}: QiskitIOModalProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>(initialMode);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [exportedCode, setExportedCode] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ wires: Wire[]; elements: CircuitElement[] } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExport = useCallback(async () => {
    if (!backendAvailable) return;
    setLoading(true);
    setError(null);
    try {
      const result = await exportBosonicQiskit(wires, elements, fockTruncation);
      if (result.success) {
        setExportedCode(result.code);
      } else {
        setError(result.error || 'Export failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  }, [wires, elements, fockTruncation, backendAvailable]);

  // Auto-export when switching to export tab
  useEffect(() => {
    if (activeTab === 'export' && !exportedCode && !loading) {
      handleExport();
    }
  }, [activeTab, exportedCode, loading, handleExport]);

  const handleImport = async () => {
    if (!code.trim()) {
      setError('Please paste some bosonic qiskit code.');
      return;
    }
    setLoading(true);
    setError(null);
    setWarnings([]);
    setImportResult(null);
    try {
      const result = await importBosonicQiskit(code);
      if (result.success) {
        setImportResult({ wires: result.wires, elements: result.elements });
        setWarnings(result.warnings || []);
      } else {
        setError(result.error || 'Import failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadCircuit = () => {
    if (importResult) {
      onImport(importResult.wires, importResult.elements);
      onClose();
    }
  };

  const handleCopy = async () => {
    if (!exportedCode) return;
    try {
      await navigator.clipboard.writeText(exportedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the textarea
      const textarea = document.querySelector('#export-code') as HTMLTextAreaElement;
      if (textarea) {
        textarea.select();
      }
    }
  };

  const handleTabSwitch = (tab: 'import' | 'export') => {
    setActiveTab(tab);
    setError(null);
    setWarnings([]);
    if (tab === 'import') {
      setImportResult(null);
    }
  };

  if (!backendAvailable) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-slate-800 rounded-xl p-6 w-[500px] border border-slate-600" onClick={(e) => e.stopPropagation()}>
          <p className="text-slate-300 text-center">
            Python backend is required for import/export. Please start the backend server.
          </p>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-slate-800 rounded-xl w-[640px] max-h-[80vh] flex flex-col border border-slate-600 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with tabs */}
        <div className="flex items-center justify-between border-b border-slate-700 px-4 pt-4 pb-0">
          <div className="flex gap-1">
            <button
              onClick={() => handleTabSwitch('import')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'import'
                  ? 'bg-slate-900 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Import
            </button>
            <button
              onClick={() => handleTabSwitch('export')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'export'
                  ? 'bg-slate-900 text-white border-b-2 border-purple-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Export
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none pb-2"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'import' ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-400">
                Paste bosonic qiskit (c2qa) Python code below. The circuit will be parsed and loaded into the editor.
              </p>
              <textarea
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                  setImportResult(null);
                }}
                placeholder={`import c2qa\nimport qiskit\n\nqmr = c2qa.QumodeRegister(num_qumodes=1, num_qubits_per_qumode=4)\nqbr = qiskit.QuantumRegister(1)\ncircuit = c2qa.CVCircuit(qmr, qbr)\n\ncircuit.h(qbr[0])\ncircuit.cv_d(1.0, qmr[0])\ncircuit.cv_c_d(complex(1, 0.5), qmr[0], qbr[0])`}
                className="w-full h-[300px] bg-slate-950 text-green-400 font-mono text-sm p-3 rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none resize-none"
                spellCheck={false}
              />

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-300">
                  {error}
                </div>
              )}

              {importResult && (
                <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg text-sm text-green-300">
                  <p className="font-medium">
                    Parsed successfully: {importResult.wires.length} wire{importResult.wires.length !== 1 ? 's' : ''}, {importResult.elements.length} gate{importResult.elements.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs mt-1 text-green-400">
                    {importResult.wires.filter(w => w.type === 'qubit').length} qubit(s), {importResult.wires.filter(w => w.type === 'qumode').length} qumode(s)
                  </p>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-sm text-yellow-300">
                  <p className="font-medium mb-1">Warnings:</p>
                  <ul className="list-disc list-inside text-xs space-y-0.5">
                    {warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                {importResult && (
                  <button
                    onClick={handleLoadCircuit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Load Circuit
                  </button>
                )}
                <button
                  onClick={handleImport}
                  disabled={loading || !code.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                >
                  {loading ? 'Parsing...' : 'Parse Code'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-400">
                Generated bosonic qiskit (c2qa) Python code for your circuit.
              </p>

              {loading && (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating code...
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-300">
                  {error}
                </div>
              )}

              {exportedCode && (
                <>
                  <textarea
                    id="export-code"
                    value={exportedCode}
                    readOnly
                    className="w-full h-[300px] bg-slate-950 text-green-400 font-mono text-sm p-3 rounded-lg border border-slate-700 resize-none"
                    spellCheck={false}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleExport}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                  </div>
                </>
              )}

              {!loading && !exportedCode && !error && (
                <p className="text-center text-slate-500 py-8">
                  No circuit to export. Add some gates first.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
