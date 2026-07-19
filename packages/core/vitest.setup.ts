// Mock bun:sqlite for Vitest (runs before all imports)

// Use a real function as constructor for proper `new Database()` support
function MockDatabase(this: any, _path?: string) {
  this.run = () => ({ changes: 0, lastInsertRowid: 0 });
  this.query = () => ({
    all: () => [],
    get: () => null,
    values: () => [],
  });
  this.prepare = () => ({
    run: () => ({ changes: 0, lastInsertRowid: 0 }),
    all: () => [],
    get: () => null,
  });
  this.exec = () => {};
  this.close = () => {};
  this.transaction = (fn: Function) => fn();
  this.serialize = () => Buffer.from("");
}

vi.mock("bun:sqlite", () => ({
  Database: MockDatabase,
  default: { Database: MockDatabase },
}));

export {};
