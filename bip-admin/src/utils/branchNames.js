// =============================================================
//  branchNames.js — DISPLAY names only
//  Branch IDs, database values and backend logic stay unchanged.
//  Branch 1 → Vallioor, 2 → Nanguneri, 3 → kadambankulam
// =============================================================

export const BRANCH_LABELS = {
  1: "Vallioor",
  2: "Nanguneri",
  3: "kadambankulam",
};

// Old names kept coming from the database / older records
const OLD_NAMES = {
  "branch a": "Vallioor",
  "branch b": "Nanguneri",
  "branch c": "kadambankulam",
  bra: "Vallioor",
  brb: "Nanguneri",
  brc: "kadambankulam",
};

// Accepts a branch id (1 / "1") or a stored name ("Branch A") and
// returns the name to show. Anything unknown is returned untouched.
export function branchLabel(value) {
  if (value === null || value === undefined || value === "") return value;
  const asId = Number(value);
  if (!Number.isNaN(asId) && BRANCH_LABELS[asId]) return BRANCH_LABELS[asId];
  const key = String(value).trim().toLowerCase();
  return OLD_NAMES[key] || value;
}
