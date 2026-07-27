declare interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

declare interface D1Database {
  prepare(query: string): unknown;
  batch<T = unknown>(statements: unknown[]): Promise<T[]>;
  exec(query: string): Promise<unknown>;
}

declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
  };
}
