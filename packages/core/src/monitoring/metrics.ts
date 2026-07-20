export class Metrics {
  private counters = new Map<string, number>();
  
  increment(name: string) {
    this.counters.set(name, (this.counters.get(name) || 0) + 1);
  }
  
  get(name: string): number {
    return this.counters.get(name) || 0;
  }
  
  snapshot(): Record<string, number> {
    return Object.fromEntries(this.counters);
  }
}

export const metrics = new Metrics();
