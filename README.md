# Thalium

Thalium is a Brain-as-a-Service (BaaS) cognitive API platform. Named after the thalamus — the brain's central relay hub, Thalium provides persistent, trainable, memory-conscious intelligence via API connections to Brain Instances.

## Architecture

- **Two Fly.io apps**: Chain Executor (App 1, port 8080) and Instance Manager (App 2, port 8081)
- **Storage**: Upstash Redis (3 shards), Supabase Postgres + pgvector + ltree
- **Edge**: Cloudflare + API Shield
- **Model gateway**: OpenRouter (primary)
- **11 chain roles**: Triage, Listener, Interrogator, Architect, Devil, Scorer, Validator, Boundary Keeper, Scribe, Auditor, Librarian

## Core principles

1. **Anchor of Truth in Redis Shard A**: Roles get address key references only.
2. **Models are stateless**: Chain state travels in the anchor.
3. **Postgres ltree address-based memory**: No vector search as primary retrieval.
4. **Classification loop max 2**: Same prediction error = novel signal.
5. **Partial failure always produces a structured artifact**: Never return nothing.
6. **Rules emerge from Calibrator**: Never hardcode Scorer rules.
7. **Leaf entries are immutable**: Calibrator writes upward only.
8. **Coverage Map**: Never route silently to empty regions.

## Getting started

- **Prerequisites**: Node.js 20+, PowerShell 7+, Fly.io CLI, Supabase account, Upstash account
- **Environment variables**: 
  - `REDIS_SHARD_A_URL`
  - `REDIS_SHARD_B_URL`
  - `REDIS_SHARD_C_URL`
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
  - `OPENROUTER_API_KEY`
  - `FLY_API_TOKEN`
- **Install**: `npm install`
- **Build**: `npm run build`
- **Test**: `npm test`

## API

- **POST /v1/invoke**: Run a chain invocation
  - **Headers**: `X-Thalium-Internal` required
  - **Body**: `{ input, brain_id, domain, session_id? }`
  - **Returns**: SSE stream of chain events
- **POST /v1/brain**: Create a Brain Instance
- **GET /v1/brain/:id**: Get a Brain Instance
- **POST /v1/brain/:id/pause**: Pause a Brain Instance

## SSE event taxonomy

- `fast.triage`
- `fast.artifact`
- `full.{role}`
- `full.artifact`
- `chain.chunked`
- `chain.novel`
- `chain.partial`
- `chain.timeout`
- `instance.consolidating`
- `instance.domain_uncertainty`
- `instance.resumed`
- `instance.postgres_degraded`
- `chain.novel_queue_full`

## Deployment

Deploy Thalium using the provided deployment scripts. Ensure all environment variables are set correctly before running the deployment commands.

## Testing

- `npm test`: Run full test suite (188 tests)
- `scripts/test/Invoke-ThaliumGoldenPath.ps1`: Golden path test
- `scripts/test/Invoke-ThaliumConsistencyAudit.ps1`: Weekly consistency audit