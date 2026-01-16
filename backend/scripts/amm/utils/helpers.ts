export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomChoice<T>(items: T[]): T {
  if (!items.length) {
    throw new Error("Cannot choose from empty array");
  }
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
