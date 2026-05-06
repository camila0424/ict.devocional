export type Level = {
  id: string;
  name: string;
  emoji: string;
  minDays: number;
  maxDays: number;
};

export const LEVELS: Level[] = [
  { id: 'seed', name: 'Semilla', emoji: '🌰', minDays: 0, maxDays: 14 },
  { id: 'sprout', name: 'Brote', emoji: '🌱', minDays: 15, maxDays: 29 },
  { id: 'bamboo', name: 'Bambú', emoji: '🎋', minDays: 30, maxDays: 44 },
  { id: 'bonsai', name: 'Bonsái', emoji: '🪴', minDays: 45, maxDays: 59 },
  { id: 'bush', name: 'Arbusto', emoji: '🌿', minDays: 60, maxDays: 89 },
  { id: 'youngTree', name: 'Árbol joven', emoji: '🌳', minDays: 90, maxDays: 179 },
  { id: 'pine', name: 'Pino', emoji: '🌲', minDays: 180, maxDays: 364 },
  { id: 'olive', name: 'Olivo', emoji: '🫒', minDays: 365, maxDays: 729 },
  { id: 'centenaryOak', name: 'Roble centenario', emoji: '🌳✨', minDays: 730, maxDays: Infinity },
];

export function getCurrentLevel(totalDays: number): Level {
  return (
    LEVELS.find((level) => totalDays >= level.minDays && totalDays <= level.maxDays) ?? LEVELS[0]!
  );
}

export function getNextLevel(totalDays: number): Level | null {
  const currentLevel = getCurrentLevel(totalDays);
  const currentIndex = LEVELS.indexOf(currentLevel);
  return currentIndex < LEVELS.length - 1 ? (LEVELS[currentIndex + 1] ?? null) : null;
}

export function getDaysUntilNextLevel(totalDays: number): number {
  const nextLevel = getNextLevel(totalDays);
  return nextLevel ? nextLevel.minDays - totalDays : 0;
}

export function getLevelProgress(totalDays: number): { current: number; max: number } {
  const currentLevel = getCurrentLevel(totalDays);
  if (currentLevel.maxDays === Infinity) return { current: 1, max: 1 };
  const range = currentLevel.maxDays - currentLevel.minDays + 1;
  const progress = totalDays - currentLevel.minDays + 1;
  return { current: Math.max(0, Math.min(progress, range)), max: range };
}
