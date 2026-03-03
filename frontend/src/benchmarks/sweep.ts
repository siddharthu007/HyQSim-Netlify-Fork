/**
 * Benchmark sweep utilities — run a benchmark circuit for k = 0..nSteps
 * and record expectation values at each step, for time-series visualisation.
 */

import { ALL_GATES } from '../types/circuit';
import { runSimulation } from '../simulation/simulator';
import { jcTrotterCircuit } from './circuits';

export interface JCSweepPoint {
  step: number;
  t: number;       // = step * g * tau
  nSim: number;    // ⟨n̂⟩ from simulator
  nExact: number;  // sin²(t)  — exact for coupling-only JC, independent of ω
  szSim: number;   // ⟨σ_z⟩ from simulator (QC convention: |1⟩ → ⟨Z⟩ = −1)
  szExact: number; // −cos(2t) — same convention
}

/**
 * Run the JC Trotter circuit for k = 0, 1, ..., nSteps steps,
 * extracting ⟨n̂⟩ and ⟨σ_z⟩ at each step.
 *
 * The exact formulas sin²(k·g·τ) and −cos(2k·g·τ) hold for any ω:
 * R(ω·τ) commutes with n̂, and Rz(ω·τ) commutes with Z, so free evolution
 * adds only phases and leaves the photon-number and population inversion unchanged.
 */
export function runJCSweep(
  nSteps: number,
  g: number,
  omega: number,
  tau: number,
  fockDim: number,
): JCSweepPoint[] {
  const gatesMap = new Map(ALL_GATES.map(gate => [gate.id, gate]));
  const points: JCSweepPoint[] = [];

  for (let k = 0; k <= nSteps; k++) {
    const { wires, elements } = jcTrotterCircuit(k, g, omega, tau, fockDim);
    const t = k * g * tau;

    const result = runSimulation(wires, elements, gatesMap, fockDim);

    const qumodeIdx = wires.findIndex(w => w.type === 'qumode');
    const qubitIdx  = wires.findIndex(w => w.type === 'qubit');

    const nSim  = result.qumodeStates.get(qumodeIdx)?.meanPhotonNumber ?? 0;
    const szSim = result.qubitStates.get(qubitIdx)?.expectations.sigmaZ ?? 0;

    points.push({
      step:    k,
      t,
      nSim,
      nExact:  Math.sin(t) ** 2,
      szSim,
      szExact: -Math.cos(2 * t),
    });
  }

  return points;
}
