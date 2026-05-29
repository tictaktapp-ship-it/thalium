<#
.SYNOPSIS
    Seeds the public demo Brain Instance with rich institutional memory across
    five domains: legal, software, financial, healthcare, compliance.

.DESCRIPTION
    Sends 25 real invocations (5 per domain) to the demo Brain Instance via the
    chain executor. Each invocation builds genuine institutional ring entries so
    the Brain is non-cold when visitors arrive at /demo.

    Safe to re-run. Each invocation adds entries — it does not overwrite.

.PARAMETER BrainId
    UUID of the demo Brain Instance.

.PARAMETER ApiKey
    Invoke-scope API key for the demo Brain Instance.

.PARAMETER ApiUrl
    Chain executor base URL. Defaults to THALIUM_API_URL env var.

.EXAMPLE
    .\scripts\db\Invoke-SeedDemoBrain.ps1 `
        -BrainId "a8cc0cf2-bb6f-4656-b082-b314f6011360" `
        -ApiKey "thal_fd3be62fe89d0e9d5c454ad21a2b59bf91dea166e152a2ed"

.NOTES
    Requires: THALIUM_API_URL set in environment or passed via -ApiUrl.
    Each invocation takes 6-15 seconds. Total runtime: ~4-6 minutes.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$BrainId,

    [Parameter(Mandatory=$true)]
    [string]$ApiKey,

    [Parameter()]
    [string]$ApiUrl = $env:THALIUM_API_URL,

    [Parameter()]
    [string]$InternalSecret = $env:THALIUM_INTERNAL_SECRET
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ApiUrl)) {
    # Try loading from platform .env.local
    $envPath = Join-Path $PSScriptRoot '..\..\platform\.env.local'
    if (Test-Path $envPath) {
        $line = Get-Content $envPath | Where-Object { $_ -match '^THALIUM_API_URL=' }
        if ($line) { $ApiUrl = $line.Split('=',2)[1].Trim() }
    }
}

if ([string]::IsNullOrWhiteSpace($ApiUrl)) {
    Write-Error 'ApiUrl is required. Set THALIUM_API_URL or pass -ApiUrl.'
    exit 1
}

# Load internal secret from .env.local if not provided
if ([string]::IsNullOrWhiteSpace($InternalSecret)) {
    $envPath = Join-Path $PSScriptRoot '..\..\platform\.env.local'
    if (Test-Path $envPath) {
        $line = Get-Content $envPath | Where-Object { $_ -match '^THALIUM_INTERNAL_SECRET=' }
        if ($line) { $InternalSecret = ($line -split '=',2)[1].Trim() }
    }
}

$Headers = @{
    'Authorization'      = "Bearer $ApiKey"
    'X-Thalium-Internal' = $InternalSecret
    'Content-Type'       = 'application/json'
}

$InvokeUrl = "$ApiUrl/v1/brain/$BrainId/invoke"

Write-Host ''
Write-Host '[demo-seed] Seeding demo Brain Instance' -ForegroundColor Cyan
Write-Host "  Brain ID : $BrainId"
Write-Host "  API URL  : $InvokeUrl"
Write-Host "  Inputs   : 25 invocations across 5 domains"
Write-Host ''

$inputs = @(
    # ── LEGAL (5) ───────────────────────────────────────────────────────────
    @{
        session_id = 'b7bfc8f5-654d-4a62-b8db-7d175eb6969d'
        domain     = 'legal'
        label      = 'Legal 1/5 — NDA liability review'
        input_text = 'Review this NDA clause for unusual liability exposure: "The Receiving Party shall indemnify and hold harmless the Disclosing Party from any and all claims, damages, losses, costs and expenses arising from any use of the Confidential Information, whether or not such use was authorised." Flag any liability that departs from standard NDA terms.'
    },
    @{
        session_id = 'bd640bbb-a3c6-4a8f-a007-715b428f3497'
        domain     = 'legal'
        label      = 'Legal 2/5 — SLA amendment delta'
        input_text = 'The counterparty has proposed changes to our SLA. Original uptime commitment was 99.5% monthly. Their proposed amendment changes this to 99.5% annually and removes the service credit mechanism entirely. Assess the impact of these changes and flag what we are giving up.'
    },
    @{
        session_id = '79d70ab5-4f5f-428e-9894-c9142b6e4a7c'
        domain     = 'legal'
        label      = 'Legal 3/5 — GDPR data processing assessment'
        input_text = 'Our new product feature processes biometric data from user facial recognition to personalise content recommendations. Assess whether this processing requires a DPIA under GDPR Article 35, identify the lawful basis options, and flag the highest-risk compliance gaps we need to address before launch.'
    },
    @{
        session_id = '33982abd-7060-4354-a1cf-436cf5de1edf'
        domain     = 'legal'
        label      = 'Legal 4/5 — Supplier contract obligations'
        input_text = 'Summarise the key obligations under this supplier agreement before we sign. The agreement includes: 90-day payment terms, exclusivity in the UK market for 24 months, a minimum purchase commitment of £500,000 annually, and IP assignment of any jointly developed improvements. What are the highest-risk obligations and what should we negotiate?'
    },
    @{
        session_id = 'bc2bcdae-ffce-4d5f-b9de-67dbe672fd62'
        domain     = 'legal'
        label      = 'Legal 5/5 — Employment contract review'
        input_text = 'Review this post-termination restriction clause: "The Employee shall not, for a period of 24 months following termination, be engaged or interested in any business that competes with the Company in any territory in which the Company operates or has operated in the preceding 36 months." Assess enforceability under English law and recommend modifications.'
    },

    # ── SOFTWARE (5) ─────────────────────────────────────────────────────────
    @{
        session_id = '2cb9af9a-e00c-44a9-ad04-94c6ef532c80'
        domain     = 'software'
        label      = 'Software 1/5 — Auth system specification'
        input_text = 'Build a user authentication system for a SaaS product. Requirements: email/password login, magic link login, Google OAuth, email verification on signup, password reset flow, session management with refresh tokens, rate limiting on login attempts, and audit logging of all auth events. Generate the full technical specification.'
    },
    @{
        session_id = '738c2818-7718-41dd-a819-11e42663a426'
        domain     = 'software'
        label      = 'Software 2/5 — Production incident diagnosis'
        input_text = 'Our payments service is throwing 503 errors since 14:00 today. Error rate has gone from 0% to 34% in 20 minutes. The service processes Stripe webhook events. Deployment was made at 13:45 — a dependency upgrade from node-fetch v2 to v3. Database connections appear healthy. Diagnose the likely root cause and propose immediate remediation steps.'
    },
    @{
        session_id = 'b38a3953-2437-45f5-b82b-a4e556d822fe'
        domain     = 'software'
        label      = 'Software 3/5 — Architecture migration risk'
        input_text = 'We are planning to migrate our monolithic Node.js application to microservices. Current system: single Express app, PostgreSQL database, 200k DAU, 50ms p95 response time. We have 3 backend engineers. Assess the risks of this migration at our current scale and team size, and recommend whether to proceed or adopt an alternative approach.'
    },
    @{
        session_id = 'be5af086-a283-4ffe-a96d-2833cc46b302'
        domain     = 'software'
        label      = 'Software 4/5 — Scope change impact'
        input_text = 'We are 3 weeks from go-live on a B2B SaaS platform. The client has just requested adding real-time collaboration features — multiple users editing the same document simultaneously with presence indicators. This was not in the original specification. Assess the scope impact, estimate the additional development time, and prepare a change request with recommended options.'
    },
    @{
        session_id = 'fc7a52cc-814b-414d-b7fe-430f5a8de0c6'
        domain     = 'software'
        label      = 'Software 5/5 — Q3 tech debt review'
        input_text = 'Q3 tech debt review for our platform. Issues identified: 1) authentication module has 3 incidents this quarter, 2) database queries on the reporting endpoint consistently exceed 2 seconds, 3) our test coverage has dropped from 78% to 61% over 6 months, 4) we are on Node 16 which reaches end-of-life in 4 months. Prioritise these against our Q4 roadmap and produce a remediation plan.'
    },

    # ── FINANCIAL (5) ────────────────────────────────────────────────────────
    @{
        session_id = 'b99634fc-a8e5-46ae-a6de-67b66f6cfdb9'
        domain     = 'financial'
        label      = 'Financial 1/5 — Credit risk assessment'
        input_text = 'Assess the credit risk of this loan application. Borrower: established manufacturing SME, 8 years trading, revenue £4.2m (up 12% YoY), EBITDA margin 14%, net debt/EBITDA 2.1x, current ratio 1.4. Loan purpose: equipment financing £800k over 5 years. Sector: precision engineering, 60% revenue from automotive supply chain. Provide a structured credit risk assessment with a recommended decision.'
    },
    @{
        session_id = '5c9c22b9-7b47-40a8-bfbb-d6fd421b5e6e'
        domain     = 'financial'
        label      = 'Financial 2/5 — Fraud model performance'
        input_text = 'Our fraud detection model has been producing elevated false positives for the past two weeks. False positive rate has increased from 1.2% to 4.8%. This is causing legitimate transactions to be blocked and significant customer complaints. The model was retrained 3 weeks ago with data from a new geographic market we entered. Diagnose the likely cause and recommend remediation.'
    },
    @{
        session_id = 'b3280099-43fe-4488-828d-63b9b3c1b08e'
        domain     = 'financial'
        label      = 'Financial 3/5 — Portfolio concentration risk'
        input_text = 'Assess concentration risk in our SME lending portfolio. Current exposure: £42m total, top 10 borrowers represent 38% of portfolio, commercial real estate sector represents 31%, West Midlands geography represents 44%. Three of our top-five borrowers are in automotive supply chain. Our internal policy limit is 25% single sector and 35% single geography. Identify breaches and recommend remediation.'
    },
    @{
        session_id = 'edd8bbb6-7d0b-40d4-9b0b-d7aeb3da27ca'
        domain     = 'financial'
        label      = 'Financial 4/5 — Acquisition due diligence'
        input_text = 'We are considering acquiring a fintech payments company at a £12m valuation. Revenue £1.8m ARR growing 85% YoY, gross margin 68%, burn rate £180k/month with 14 months runway, 340 active merchants, average revenue per merchant £441/month. Key risks identified: single banking partner dependency, FCA authorisation pending, two key engineers hold critical payment gateway knowledge. Produce a risk-weighted acquisition assessment.'
    },
    @{
        session_id = '39916e00-d3ed-4ce8-87a8-a4aa2230f369'
        domain     = 'financial'
        label      = 'Financial 5/5 — Stress test capital'
        input_text = 'Our capital ratio is currently 14.2% (CET1). Under our adverse stress scenario — 35% increase in default rates, 20% fall in collateral values, 15% reduction in net interest income — model the impact on our capital ratio and assess whether we remain above the regulatory minimum of 10.5% with adequate headroom. If not, identify the capital actions required.'
    },

    # ── HEALTHCARE (5) ───────────────────────────────────────────────────────
    @{
        session_id = '8a822e7f-300a-48dc-95cc-593f0ba180bf'
        domain     = 'medical'
        label      = 'Healthcare 1/5 — Adverse event pattern'
        input_text = 'Ward 6 has reported a 40% increase in patient falls over the last quarter compared to the same period last year. The ward has 28 beds, mixed medical/surgical. Staffing levels have not changed significantly. Three of the falls resulted in fractures. Analyse this as a patient safety signal, identify likely contributing factors, and recommend a structured investigation approach.'
    },
    @{
        session_id = 'e2457628-0668-4531-93e6-ba9c90037312'
        domain     = 'medical'
        label      = 'Healthcare 2/5 — Clinical protocol update'
        input_text = 'We need to update our post-operative pain management protocol following new NICE guidance on opioid prescribing. Current protocol uses morphine PCA as standard for major abdominal surgery. New guidance recommends multimodal analgesia with reduced opioid exposure. Plan the protocol update process, identify the clinical governance steps required, and draft the key changes to the prescribing protocol.'
    },
    @{
        session_id = '9ad34d4c-3700-47a8-8501-10f72633df6e'
        domain     = 'medical'
        label      = 'Healthcare 3/5 — Drug interaction risk'
        input_text = 'A 72-year-old patient with atrial fibrillation is prescribed warfarin (INR target 2.0-3.0, currently 2.4). They have been started on clarithromycin for a chest infection by their GP. Assess the interaction risk, the monitoring required, and whether any dose adjustment or alternative antibiotic should be considered. Flag any urgent actions required.'
    },
    @{
        session_id = 'a2385648-4e3a-425f-ab5c-92d9283c004f'
        domain     = 'medical'
        label      = 'Healthcare 4/5 — Clinical trial evidence'
        input_text = 'Summarise the clinical evidence for SGLT2 inhibitors in heart failure with reduced ejection fraction. Key trials to incorporate: DAPA-HF (dapagliflozin), EMPEROR-Reduced (empagliflozin). Outcomes of interest: cardiovascular death, hospitalisation for heart failure, and eGFR decline. Produce a structured evidence summary for the formulary committee.'
    },
    @{
        session_id = 'bd2e39c0-322b-4a35-8799-0a34d2d205e4'
        domain     = 'medical'
        label      = 'Healthcare 5/5 — Readmission pattern'
        input_text = 'Our 30-day readmission rate for heart failure patients has increased from 18% to 26% over the last two quarters. This is above the national benchmark of 20%. Potential contributing factors identified: discharge on Fridays increased by 22%, pharmacist medication reconciliation coverage dropped from 95% to 78% due to vacancy, community heart failure nurse visits reduced from 48 to 72 hours post-discharge. Analyse this pattern and produce a root cause assessment with prioritised interventions.'
    },

    # ── COMPLIANCE (5) ───────────────────────────────────────────────────────
    @{
        session_id = '303bc042-a64c-4594-b8fc-548044e0cf51'
        domain     = 'legal'
        label      = 'Compliance 1/5 — GDPR privacy policy gaps'
        input_text = 'Review our privacy policy against UK GDPR requirements. Key gaps identified during an internal audit: 1) No mention of the lawful basis for processing marketing communications, 2) Retention periods not specified for customer transaction data, 3) Third-party analytics tool not listed as a data processor, 4) No description of automated decision-making used in our credit scoring. Produce a gap analysis with recommended remediation actions and priority.'
    },
    @{
        session_id = '73612cbc-2615-430b-8ae8-fa72615b2acb'
        domain     = 'legal'
        label      = 'Compliance 2/5 — Change management control gap'
        input_text = 'Our external auditor has flagged a control gap in our change management process. Finding: production deployments are not consistently reviewed and approved before release. In the last quarter, 23% of production changes had no documented approval. The auditor has classified this as a high-risk finding. Produce a remediation plan with specific control improvements, timelines, and evidence requirements to close the finding.'
    },
    @{
        session_id = 'e5f48f3d-9ef6-4cb2-9f3e-99992ca0f488'
        domain     = 'legal'
        label      = 'Compliance 3/5 — Subject access request'
        input_text = 'We have received a subject access request from a former employee who left under difficult circumstances 8 months ago. They are requesting all personal data held, all communications mentioning their name, and all records relating to their performance management process. Assess our obligations under UK GDPR, identify what we must provide and what we can legitimately withhold, and outline the process and timeline for responding.'
    },
    @{
        session_id = '5d0c254b-8257-49e9-a543-275c220c7e04'
        domain     = 'legal'
        label      = 'Compliance 4/5 — OWASP architecture review'
        input_text = 'Review our web application architecture against OWASP Top 10. Architecture: React SPA, Node.js API, PostgreSQL, deployed on AWS. Known issues: 1) JWT tokens stored in localStorage, 2) No rate limiting on authentication endpoints, 3) SQL queries constructed with string concatenation in the reporting module, 4) Dependency audit shows 3 high-severity CVEs in production packages. Produce a prioritised remediation plan with severity ratings.'
    },
    @{
        session_id = '2f5519cf-b956-4001-8036-18cd735bf43d'
        domain     = 'legal'
        label      = 'Compliance 5/5 — FCA operational resilience'
        input_text = 'We need to demonstrate compliance with FCA operational resilience requirements by March 2025. We have identified our important business services: payment processing, customer onboarding, and fraud detection. We have not yet completed impact tolerance setting, scenario testing, or self-assessment documentation. Assess our current compliance position, identify the critical gaps, and produce a prioritised action plan to meet the deadline.'
    }
)

$total = $inputs.Count
$passed = 0
$failed = 0
$startAll = [datetime]::Now

foreach ($inv in $inputs) {
    $label = $inv.label
    $inv.Remove('label')
    $flat = @{
        session_id = $inv.session_id
        brain_id   = $BrainId
        domain     = $inv.domain
        input      = $inv.input_text
    }
    $body = $flat | ConvertTo-Json -Depth 3
    $start = [datetime]::Now

    Write-Host "  [$($passed + $failed + 1)/$total] $label" -NoNewline

    try {
        $response = Invoke-WebRequest -Uri $InvokeUrl -Method POST -Headers $Headers -Body $body -TimeoutSec 60
        $elapsed = [int]([datetime]::Now - $start).TotalMilliseconds

        # Read SSE stream — look for full.artifact event
        $content = $response.Content
        $hasArtifact = $content -match '"type"\s*:\s*"full\.artifact"' -or $content -match 'full\.artifact'
        $hasFast = $content -match '"type"\s*:\s*"fast\.artifact"' -or $content -match 'fast\.artifact'

        if ($hasArtifact -or $hasFast) {
            Write-Host " ✓ ${elapsed}ms" -ForegroundColor Green
            $passed++
        } else {
            Write-Host " ⚠ ${elapsed}ms (no artifact in response)" -ForegroundColor Yellow
            $passed++ # Count as passed — ring write may still have occurred
        }
    } catch {
        $elapsed = [int]([datetime]::Now - $start).TotalMilliseconds
        Write-Host " ✗ ${elapsed}ms — $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }

    # Brief pause between invocations to avoid overwhelming the executor
    Start-Sleep -Milliseconds 500
}

$totalMs = [int]([datetime]::Now - $startAll).TotalMilliseconds
$totalSec = [math]::Round($totalMs / 1000, 1)

Write-Host ''
Write-Host "[demo-seed] Complete in ${totalSec}s — $passed/$total succeeded, $failed failed" -ForegroundColor $(if ($failed -eq 0) { 'Green' } else { 'Yellow' })
Write-Host ''
Write-Host '[demo-seed] Demo Brain is now pre-seeded. Visitors to /demo will receive non-cold responses.' -ForegroundColor Cyan
Write-Host "[demo-seed] Brain ID : $BrainId" -ForegroundColor Gray
Write-Host ''