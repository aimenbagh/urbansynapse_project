const CLASS_ORDER = ["G", "F", "E", "D", "C", "B", "A"];

// Chaque mesure fait gagner ~1 cran de classe (plafonné à A)
export function improvedClass(current: string, measuresCount: number): string {
  const idx = CLASS_ORDER.indexOf(current);
  if (idx < 0) return current;
  const improved = Math.min(idx + measuresCount, CLASS_ORDER.length - 1);
  return CLASS_ORDER[improved];
}
