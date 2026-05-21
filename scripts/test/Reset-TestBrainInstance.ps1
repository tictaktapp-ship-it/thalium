<#
.SYNOPSIS
    Resets the staging test Brain Instance to a known seed state.
    Run before golden path tests to ensure a deterministic starting point.
.DESCRIPTION
    Clears all institutional ring entries for the test Brain Instance,
    then seeds 20 entries across 10 address key regions (2 per region).
.PARAMETER BrainId
    The test Brain Instance ID to reset.
.PARAMETER Environment
    Target environment (staging only — never run against production).
.EXAMPLE
    .\Reset-TestBrainInstance.ps1 -BrainId "55810a1a-6824-4a9f-9057-8ad05dc0b319" -Environment staging
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$BrainId,
    [Parameter(Mandatory)]
    [ValidateSet('staging')]
    [string]$Environment
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "Resetting test Brain Instance $BrainId in $Environment..." -ForegroundColor Yellow

$BaseUrl = "https://thalium-instance-manager.fly.dev"
$InternalSecret = $env:THALIUM_INTERNAL_SECRET
if (-not $InternalSecret) { throw "THALIUM_INTERNAL_SECRET not set" }

$Headers = @{
    "X-Thalium-Internal" = $InternalSecret
    "Content-Type" = "application/json"
}

# Step 1: Clear existing ring entries via Supabase direct
$SupabaseUrl = $env:SUPABASE_URL
$SupabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY
if (-not $SupabaseUrl -or -not $SupabaseKey) { throw "Supabase credentials not set" }

$SupabaseHeaders = @{
    "apikey" = $SupabaseKey
    "Authorization" = "Bearer $SupabaseKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

Write-Host "Clearing existing ring entries..." -ForegroundColor Gray
$DeleteUrl = "$SupabaseUrl/rest/v1/institutional_ring?brain_id=eq.$BrainId"
Invoke-RestMethod -Uri $DeleteUrl -Method Delete -Headers $SupabaseHeaders | Out-Null

# Step 2: Seed 20 entries across 10 address key regions
$Regions = @(
    "specification.project.software.general",
    "change_request.project.software.general",
    "diagnosis.entity.software.general",
    "verification.project.software.general",
    "risk_assessment.project.software.general",
    "retrospective.org.software.general",
    "planning.org.software.general",
    "knowledge_retrieval.entity.software.general",
    "compliance_check.entity.legal.general",
    "knowledge_ingestion.global.medical.general"
)

$EntriesCreated = 0
foreach ($Region in $Regions) {
    for ($i = 1; $i -le 2; $i++) {
        $Entry = @{
            id = [System.Guid]::NewGuid().ToString()
            brain_id = $BrainId
            address_key = $Region
            content = @{ seed = $true; region = $Region; index = $i } | ConvertTo-Json
            entry_level = "leaf"
            avg_confidence = 0.75
            source = "seeding"
            access_count = 0
            created_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        } | ConvertTo-Json

        $InsertUrl = "$SupabaseUrl/rest/v1/institutional_ring"
        Invoke-RestMethod -Uri $InsertUrl -Method Post -Headers $SupabaseHeaders -Body $Entry | Out-Null
        $EntriesCreated++
    }
}

Write-Host "Seed complete: $EntriesCreated entries across $($Regions.Count) regions" -ForegroundColor Green
Write-Host "Brain Instance $BrainId is ready for golden path testing" -ForegroundColor Green
