// Ambient declaration for Cloudflare Workers runtime bindings (kept separate from ES module .d.ts files
// and isolated from worker-configuration.d.ts so HTMLRewriter/DOM Element types never collide).
interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

declare module 'cloudflare:workers' {
  export const env: Record<string, unknown> & {
    APPLE_KV?: KVNamespaceLike;
    GITHUB_TOKEN?: string;
  };
}
