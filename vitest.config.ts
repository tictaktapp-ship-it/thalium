import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['platform/**', 'node_modules/**', 'dist/**'],
    env: {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
      REDIS_SHARD_A_URL: 'https://test-a.upstash.io',
      REDIS_SHARD_A_TOKEN: 'test-token-a',
      REDIS_SHARD_B_URL: 'https://test-b.upstash.io',
      REDIS_SHARD_B_TOKEN: 'test-token-b',
      REDIS_SHARD_C_URL: 'https://test-c.upstash.io',
      REDIS_SHARD_C_TOKEN: 'test-token-c',
      THALIUM_INTERNAL_SECRET: 'test-internal-secret',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      APP_NAME: 'thalium-test',
      ACTIVE_BRAIN_IDS: 'brain-001,brain-002',
    },
  },
});

