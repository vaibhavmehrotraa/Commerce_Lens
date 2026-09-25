/**
 * Live probability engine: decodes the bit-packed event arrays shipped in
 * analytics.json (one bit per session for Purchase / Cart / Discount /
 * Returning / Mobile) and computes any P(A), P(A ∩ B), P(A ∪ B), P(A | B),
 * or independence check the user asks for, entirely client-side.
 */

import { data } from "@/lib/data";

export type EventKey = "P" | "C" | "D" | "R" | "M";

export const EVENT_LABELS: Record<EventKey, string> = {
  P: "Purchase",
  C: "Add to Cart",
  D: "Discount Exposure",
  R: "Returning Customer",
  M: "Mobile User",
};

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function unpackBits(b64: string, n: number): Uint8Array {
  const bytes = base64ToBytes(b64);
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const byte = bytes[i >> 3];
    const bit = (byte >> (7 - (i % 8))) & 1;
    out[i] = bit;
  }
  return out;
}

let cache: { n: number; events: Record<EventKey, Uint8Array> } | null = null;

export function getEvents(): { n: number; events: Record<EventKey, Uint8Array> } {
  if (cache) return cache;
  const raw = data.probability_events_bitpacked as unknown as {
    n: number;
    events: Record<EventKey, string>;
  };
  const n = raw.n;
  const events = {
    P: unpackBits(raw.events.P, n),
    C: unpackBits(raw.events.C, n),
    D: unpackBits(raw.events.D, n),
    R: unpackBits(raw.events.R, n),
    M: unpackBits(raw.events.M, n),
  };
  cache = { n, events };
  return cache;
}

export function pEvent(key: EventKey): number {
  const { n, events } = getEvents();
  let s = 0;
  const arr = events[key];
  for (let i = 0; i < n; i++) s += arr[i];
  return s / n;
}

export function pComplement(key: EventKey): number {
  return 1 - pEvent(key);
}

export function pIntersection(keys: EventKey[]): number {
  const { n, events } = getEvents();
  let s = 0;
  for (let i = 0; i < n; i++) {
    let all = 1;
    for (const k of keys) all &= events[k][i];
    s += all;
  }
  return s / n;
}

export function pUnion(a: EventKey, b: EventKey): number {
  return pEvent(a) + pEvent(b) - pIntersection([a, b]);
}

export function pConditional(target: EventKey[], given: EventKey[]): number {
  const pGiven = pIntersection(given);
  if (pGiven === 0) return 0;
  return pIntersection([...target, ...given]) / pGiven;
}

export function independenceCheck(a: EventKey, b: EventKey) {
  const pA = pEvent(a);
  const pB = pEvent(b);
  const pAB = pIntersection([a, b]);
  const pProduct = pA * pB;
  const absDiff = Math.abs(pAB - pProduct);
  return {
    p_a: pA,
    p_b: pB,
    p_a_and_b: pAB,
    p_a_times_p_b: pProduct,
    absolute_difference: absDiff,
    relative_difference: pProduct > 0 ? absDiff / pProduct : Infinity,
    appears_independent_in_sample: absDiff < 0.01,
  };
}
