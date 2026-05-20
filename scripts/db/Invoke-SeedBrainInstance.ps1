<#
.SYNOPSIS
    Seeds a Thalium Brain Instance with synthetic institutional ring entries.

.DESCRIPTION
    Runs the cold-start seeding pipeline (src/jobs/seeder.ts) against a
    target Brain Instance. Generates 20–30 synthetic leaf entries across all
    10 standard address key regions, pre-warming the Coverage Map so the
    instance goes live with a non-empty ring.

    Run this after creating a new Brain Instance, before the first live
    invocation. Re-running is safe (idempotent — adds new leaf entries,
    does not overwrite existing ones).

    After seeding:
    - Listener prediction_error_score drops from ~0.9 to < threshold
    - Interrogator no longer activates on first invocation
    - Coverage Map shows sparse (not empty) across all 10 regions
    - full.artifact is produced without requiring subscriber interaction

.PARAMETER BrainId
    UUID of the Brain Instance to seed. Defaults to the TEST_BRAIN_ID env var
    if set.

.PARAMETER Domain
    Domain to seed (e.g. software, legal, financial, medical). Must match the
    Brain Instance's configured domain. Defaults to 'software'.

.PARAMETER Environment
    Target environment: staging | production. Controls which .env file is
    loaded. Default: staging.

.PARAMETER DryRun
    If specified, prints the entries that would be written without executing.

.EXAMPLE
    # Seed the test Brain Instance
    .\scripts\db\Invoke-SeedBrainInstance.ps1 -BrainId 55810a1a-6824-4a9f-9057-8ad05dc0b319 -Domain software

.EXAMPLE
    # Seed with explicit environment
    .\scripts\db\Invoke-SeedBrainInstance.ps1 -BrainId $env:TEST_BRAIN_ID -Domain software -Environment staging

.EXAMPLE
    # Dry run — preview only
    .\scripts\db\Invoke-SeedBrainInstance.ps1 -BrainId $env:TEST_BRAIN_ID -DryRun

.NOTES
    Dependencies: Node.js 20+, ts-node (via npx), E:\thalium\.env
    The seeder writes directly to the Supabase institutional_ring table via
    librarianWrite(). Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are
    set in .env before running.
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$BrainId = $env:TEST_BRAIN_ID,

    [Parameter()]
    [ValidateSet('software', 'legal', 'financial', 'medical', 'operations', 'hr', 'research', 'product', 'engineering', 'governance', 'creative', 'general')]
    [string]$Domain = 'software',

    [Parameter()]
    [ValidateSet('staging', 'production')]
    [string]$Environment = 'staging',

    [Parameter()]
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

if ([string]::IsNullOrWhiteSpace($BrainId)) {
    Write-Error 'BrainId is required. Pass -BrainId or set TEST_BRAIN_ID environment variable.'
    exit 1
}

# Basic UUID format check
if ($BrainId -notmatch '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') {
    Write-Error "BrainId '$BrainId' does not appear to be a valid UUID."
    exit 1
}

# ---------------------------------------------------------------------------
# Environment setup
# ---------------------------------------------------------------------------

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$EnvFile = Join-Path $ProjectRoot '.env'

if (-not (Test-Path $EnvFile)) {
    Write-Error ".env file not found at $EnvFile. Cannot proceed without environment variables."
    exit 1
}

Write-Host "[seed] Loading environment from $EnvFile" -ForegroundColor Cyan

# Load .env into current session (key=value pairs, skip comments and blanks)
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and $line -notmatch '^#') {
        $parts = $line -split '=', 2
        if ($parts.Count -eq 2) {
            $key   = $parts[0].Trim()
            $value = $parts[1].Trim().Trim('"').Trim("'")
            [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
}

# Verify required env vars are present
$RequiredVars = @('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'REDIS_SHARD_C_URL', 'REDIS_SHARD_C_TOKEN')
$Missing = $RequiredVars | Where-Object { [string]::IsNullOrWhiteSpace([System.Environment]::GetEnvironmentVariable($_)) }
if (@($Missing).Count -gt 0) {
    Write-Error "Missing required environment variables: $($Missing -join ', ')"
    exit 1
}

# ---------------------------------------------------------------------------
# Dry-run preview
# ---------------------------------------------------------------------------

if ($DryRun) {
    Write-Host ''
    Write-Host '[seed] DRY RUN — no writes will be executed' -ForegroundColor Yellow
    Write-Host ''
    Write-Host "Brain ID : $BrainId"
    Write-Host "Domain   : $Domain"
    Write-Host "Env      : $Environment"
    Write-Host ''
    Write-Host 'Address keys that would be populated:' -ForegroundColor Cyan

    $Regions = @(
        'specification.project',
        'change_request.project',
        'diagnosis.entity',
        'verification.project',
        'risk_assessment.project',
        'retrospective.org',
        'planning.org',
        'knowledge_retrieval.entity',
        'compliance_check.org',
        'knowledge_ingestion.global'
    )

    $Regions | ForEach-Object {
        $key = "$_.$Domain.general"
        Write-Host "  $key (3 entries)" -ForegroundColor Gray
    }

    Write-Host ''
    Write-Host "Total: 30 entries across $($Regions.Count) address key regions" -ForegroundColor Green
    Write-Host '[seed] Dry run complete. Re-run without -DryRun to execute.' -ForegroundColor Yellow
    exit 0
}

# ---------------------------------------------------------------------------
# Execute seeder
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host "[seed] Seeding Brain Instance" -ForegroundColor Cyan
Write-Host "  Brain ID   : $BrainId"
Write-Host "  Domain     : $Domain"
Write-Host "  Environment: $Environment"
Write-Host "  Timestamp  : $(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ' -AsUTC)"
Write-Host ''

$SeederScript = Join-Path $ProjectRoot 'src/jobs/seeder.ts'

if (-not (Test-Path $SeederScript)) {
    Write-Error "Seeder script not found at $SeederScript"
    exit 1
}

$StartTime = Get-Date

try {
    # Run the seeder via ts-node (ESM mode)
    $Output = & npx --yes tsx $SeederScript $BrainId $Domain 2>&1
    $ExitCode = $LASTEXITCODE

    # Print output
    $Output | ForEach-Object { Write-Host $_ }

    if ($ExitCode -ne 0) {
        Write-Error "[seed] Seeder exited with code $ExitCode"
        exit $ExitCode
    }
} catch {
    Write-Error "[seed] Failed to execute seeder: $_"
    exit 1
}

$ElapsedMs = [int](Get-Date - $StartTime).TotalMilliseconds

Write-Host ''
Write-Host "[seed] Seeding complete in ${ElapsedMs}ms" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Post-seed verification — spot check Coverage Map
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host '[seed] Running post-seed Coverage Map verification...' -ForegroundColor Cyan

$VerifyUrl = "$($env:SUPABASE_URL)/rest/v1/coverage_map?brain_id=eq.$BrainId&select=address_key,entry_count,avg_confidence&order=address_key.asc"
$Headers = @{
    'apikey'        = $env:SUPABASE_SERVICE_ROLE_KEY
    'Authorization' = "Bearer $($env:SUPABASE_SERVICE_ROLE_KEY)"
    'Content-Type'  = 'application/json'
}

try {
    $CoverageData = Invoke-RestMethod -Uri $VerifyUrl -Method Get -Headers $Headers -ErrorAction Stop

    if ($CoverageData.Count -eq 0) {
        Write-Warning '[seed] Coverage Map appears empty after seeding — check Supabase connection and librarian-write.ts'
    } else {
        Write-Host "[seed] Coverage Map entries found: $($CoverageData.Count)" -ForegroundColor Green
        $CoverageData | ForEach-Object {
            $bar = '█' * [Math]::Min([int]($_.avg_confidence * 10), 10)
            Write-Host ("  {0,-50} entries={1,3}  conf={2:F2}  {3}" -f $_.address_key, $_.entry_count, $_.avg_confidence, $bar) -ForegroundColor Gray
        }
    }
} catch {
    Write-Warning "[seed] Could not verify Coverage Map via Supabase REST API: $_"
    Write-Warning "[seed] This does not indicate seeding failed — check the ring directly if needed."
}

Write-Host ''
Write-Host '[seed] Next step: invoke the chain and confirm full.artifact is produced without Interrogator activation.' -ForegroundColor Cyan
Write-Host "       Expected: prediction_error_score < 0.7, Interrogator: skipped" -ForegroundColor Gray
Write-Host ''
