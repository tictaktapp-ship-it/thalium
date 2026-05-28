import { marked } from 'marked';

export interface DocPage {
  slug: string;
  section: string;
  title: string;
  excerpt: string;
  html: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  html: string;
}

let docsCache: DocPage[] | null = null;
let changelogCache: ChangelogEntry[] | null = null;

function initializeDocs(): DocPage[] {
  const quickstartMarkdown = `
## Quickstart

### 1. Get API Key
Navigate to the platform dashboard under **API Keys** to retrieve your key.

### 2. Make First Request
\`\`\`bash
curl -X POST https://thalium-chain-executor.fly.dev/v1/brain/{brainId}/invoke \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id": "session_123",
    "input": {
      "type": "text",
      "content": "What is Thalium?"
    }
  }'
\`\`\`

### 3. SSE Response Flow
- **fast.artifact**: Returns in 1-3s with initial classification
- **full.artifact**: Returns in 6-15s with complete response

### 4. Artifact Structure
\`\`\`json
{
  "trace_id": "trace_123",
  "status": "completed",
  "address_key": "knowledge_retrieval.global.thalium.introduction",
  "confidence_score": 87,
  "gate_decision": "pass",
  "provenance": ["memory_ring:entity_123"],
  "anchor_trace": "redis://shard-a/abc123"
}
\`\`\`

### 5. TypeScript Example
\`\`\`typescript
const response = await fetch(\`https://thalium-chain-executor.fly.dev/v1/brain/\${brainId}/invoke\`, {
  method: 'POST',
  headers: {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    session_id: 'session_123',
    input: { type: 'text', content: 'What is Thalium?' }
  })
});

const reader = response.body?.getReader();
while (reader) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = new TextDecoder().decode(value);
  text.split('\\n').forEach(line => {
    if (line.startsWith('data:')) {
      const data = JSON.parse(line.substring(5));
      if (data.event === 'fast.artifact') {
        console.log('Fast artifact:', data);
      } else if (data.event === 'full.artifact') {
        console.log('Full artifact:', data);
      }
    }
  });
}
\`\`\`

### Next Steps
- [Core Concepts](/docs/concepts)
- [API Reference](/docs/api)
`;

  const conceptsMarkdown = `
## Core Concepts

### Brain Instances
Isolated persistent intelligence layer with:
- Domain-specific configuration
- 33 baseline entries created on initialization

### Memory Rings
Three persistence tiers:
1. **Session Ring**: Resets per \`session_id\`
2. **Entity Ring**: Persists by \`entity_id\`
3. **Institutional Ring**: Permanent org-scoped with ltree address keys

### Intent Classification
11 intent types:
- specification | change_request | diagnosis | verification
- risk_assessment | retrospective | planning | knowledge_retrieval
- compliance_check | knowledge_ingestion | intent_clarification

Address key format:
\`intent_type.scope.domain.specificity\` (exactly 4 levels)

### Confidence Scoring
- 0-100 score with gate decisions:
  - **pass** (â¥80)
  - **review** (50-79)
  - **block** (<50)
- Coverage Map tracks entry count per address key

### The Calibrator
- Runs during consolidation windows
- Derives Scorer rule weights
- Writes to branch and root keys only
- Leaf entries immutable
- Cross-validation rollback on worse performance
`;

  const apiMarkdown = `
## API Reference

### Base URL
\`https://thalium-chain-executor.fly.dev\`

### Authentication
\`X-API-Key\` header with scopes:
- invoke | memory:read | memory:write | memory:admin
- audit:read | config:write | admin

### Endpoints

#### POST /v1/brain/{brainId}/invoke
Request body:
\`\`\`json
{
  "session_id": "string (required)",
  "entity_id": "string (optional)",
  "input": {
    "type": "text | image | audio",
    "content": "string"
  },
  "role_config": "object (optional)"
}
\`\`\`

#### SSE Events
| Event | Timing | Description |
|-------|--------|-------------|
| fast.triage | 0.5-2s | Initial classification |
| fast.artifact | 1-3s | First structured response |
| full.artifact | 6-15s | Complete response |
| chain.partial | varies | Partial failure artifact |
| chain.novel | varies | Novel signal detected |

#### GET /v1/brain/{brainId}/status
Returns operational status

#### GET /v1/brain/{brainId}/memory
Params:
- \`ring\`: session | entity | institutional
- \`address_key\`: ltree path filter


## Partial failure handling

When any role fails, Thalium always returns a structured partial artifact. The chain.partial SSE event is emitted before full.artifact.

\`\`\`json
{
  "type": "chain.partial",
  "status": "partial",
  "failed_roles": [{ "role": "devil", "reason": "timeout" }],
  "completed_roles": ["triage", "listener", "architect", "scorer"],
  "anchor_trace": {
    "triage": { "status": "complete" },
    "devil": { "status": "failed", "reason": "timeout" },
    "scorer": { "status": "complete" }
  }
}
\`\`\`

The Librarian always runs in the finally block. Ring writes from completed roles are committed even on partial failure.

Role failure impact:
- devil failed: output not stress-tested, treat as unchallenged
- scorer failed: no confidence score or gate decision, do not gate on confidence
- boundary_keeper failed: guardrails not applied, surface for human review
- librarian failed: ring write not committed, memory not updated

### Error Responses
| Code | Meaning |
|------|---------|
| 401 | Invalid API key |
| 403 | Insufficient scope |
| 404 | Brain not found |
| 413 | Payload too large |
| 429 | Rate limited |
| 402 | Payment required |
`;

  return [
    {
      slug: 'quickstart',
      section: 'quickstart',
      title: 'Quickstart',
      excerpt: 'First invocation in under 60 seconds.',
      html: marked.parse(quickstartMarkdown),
    },
    {
      slug: 'concepts',
      section: 'concepts',
      title: 'Core concepts',
      excerpt: 'Brain Instances, memory rings, intent classification, confidence scoring, and the Calibrator.',
      html: marked.parse(conceptsMarkdown),
    },
    {
      slug: 'api',
      section: 'api',
      title: 'API reference',
      excerpt: 'All endpoints, SSE events, request and response schemas.',
      html: marked.parse(apiMarkdown),
    },
  ];
}

function initializeChangelog(): ChangelogEntry[] {
  return [
    {
      version: '0.4.0',
      date: '2026-05-28',
      html: marked.parse(`
## Platform
- Interactive architecture diagram on /product
- Marketing site complete

## Backend
- Artifacts screen live
- Stripe webhook live
- Redis env fix
- Golden path test 5/5 passing
`),
    },
    {
      version: '0.3.0',
      date: '2026-05-26',
      html: marked.parse(`
## Platform
- Billing screen wired to real data
- Team management with email invites
- Brain Instance seeding 33 entries on creation

## Backend
- Chain executor fully operational on /v1/invoke
- Stripe migration 021
- Brevo email integration
- Billing-enforcer rewrite
`),
    },
    {
      version: '0.2.0',
      date: '2026-05-25',
      html: marked.parse(`
## Platform
- Auth complete (password, magic link, Google OAuth)
- Signup wizard 3-step
- All core platform screens live
- Playwright E2E 20 tests passing

## Backend
- 437 unit tests passing
- Supabase tables live
- Redis 3-shard cluster operational
`),
    },
  ];
}

export function getDocPage(slug: string): DocPage | null {
  if (!docsCache) {
    docsCache = initializeDocs();
  }
  return docsCache.find(doc => doc.slug === slug) || null;
}

export function getChangelogEntries(): ChangelogEntry[] {
  if (!changelogCache) {
    changelogCache = initializeChangelog();
  }
  return [...changelogCache];
}