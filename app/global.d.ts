import type { KVNamespace } from '@cloudflare/workers-types';
import type { ExtendedInit, LiffMockApi } from '@line/liff-mock';
import type {} from 'hono';

declare module 'hono' {
  interface Env {
    // Variables: {};
    Bindings: {
      TRAIN_LINE: KVNamespace;
    };
  }
}

declare module '@line/liff' {
  interface Liff {
    init: ExtendedInit;
    $mock: LiffMockApi;
  }
}
