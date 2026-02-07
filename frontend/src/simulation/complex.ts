// Complex number operations for quantum simulation

export interface Complex {
  re: number;
  im: number;
}

export const complex = (re: number, im: number = 0): Complex => ({ re, im });

export const ZERO: Complex = { re: 0, im: 0 };
export const ONE: Complex = { re: 1, im: 0 };
export const I: Complex = { re: 0, im: 1 };

export function add(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function sub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function mul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

export function div(a: Complex, b: Complex): Complex {
  const denom = b.re * b.re + b.im * b.im;
  return {
    re: (a.re * b.re + a.im * b.im) / denom,
    im: (a.im * b.re - a.re * b.im) / denom,
  };
}

export function scale(a: Complex, s: number): Complex {
  return { re: a.re * s, im: a.im * s };
}

export function conj(a: Complex): Complex {
  return { re: a.re, im: -a.im };
}

export function abs(a: Complex): number {
  return Math.sqrt(a.re * a.re + a.im * a.im);
}

export function abs2(a: Complex): number {
  return a.re * a.re + a.im * a.im;
}

export function exp(a: Complex): Complex {
  const r = Math.exp(a.re);
  return { re: r * Math.cos(a.im), im: r * Math.sin(a.im) };
}

export function fromPolar(r: number, theta: number): Complex {
  return { re: r * Math.cos(theta), im: r * Math.sin(theta) };
}

export function sqrt(a: Complex): Complex {
  const r = Math.sqrt(abs(a));
  const theta = Math.atan2(a.im, a.re) / 2;
  return fromPolar(r, theta);
}

// Matrix operations for state vectors
export type StateVector = Complex[];
export type Matrix = Complex[][];

export function dotProduct(a: StateVector, b: StateVector): Complex {
  let result = ZERO;
  for (let i = 0; i < a.length; i++) {
    result = add(result, mul(conj(a[i]), b[i]));
  }
  return result;
}

export function matVecMul(mat: Matrix, vec: StateVector): StateVector {
  const result: StateVector = [];
  for (let i = 0; i < mat.length; i++) {
    let sum = ZERO;
    for (let j = 0; j < vec.length; j++) {
      sum = add(sum, mul(mat[i][j], vec[j]));
    }
    result.push(sum);
  }
  return result;
}

export function normalize(vec: StateVector): StateVector {
  let norm = 0;
  for (const c of vec) {
    norm += abs2(c);
  }
  norm = Math.sqrt(norm);
  if (norm === 0) return vec.map(() => ZERO);
  return vec.map((c) => scale(c, 1 / norm));
}

export function tensorProduct(a: StateVector, b: StateVector): StateVector {
  const result: StateVector = [];
  for (const ai of a) {
    for (const bi of b) {
      result.push(mul(ai, bi));
    }
  }
  return result;
}

// Kronecker product for matrices
export function kronecker(A: Matrix, B: Matrix): Matrix {
  const m = A.length;
  const n = A[0].length;
  const p = B.length;
  const q = B[0].length;

  const result: Matrix = [];
  for (let i = 0; i < m * p; i++) {
    result[i] = [];
    for (let j = 0; j < n * q; j++) {
      const ai = Math.floor(i / p);
      const bi = i % p;
      const aj = Math.floor(j / q);
      const bj = j % q;
      result[i][j] = mul(A[ai][aj], B[bi][bj]);
    }
  }
  return result;
}

// Identity matrix
export function identity(n: number): Matrix {
  const result: Matrix = [];
  for (let i = 0; i < n; i++) {
    result[i] = [];
    for (let j = 0; j < n; j++) {
      result[i][j] = i === j ? ONE : ZERO;
    }
  }
  return result;
}
