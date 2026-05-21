<#
.SYNOPSIS
    Verifies cross-tenant data isolation between Brain Instances.
    Attempts to read Brain Instance A data using Brain Instance B API key.
    Any non-403 response is a critical failure.
.PARAMETER Environment
    Target environment (staging or production).
.EXAMPLE
    .\Invoke-CrossTenantIsolationTest.ps1 -Environment staging
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('staging', 'production')]
    [string]$Environment,
    [switch]$OutputJson
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$BaseUrl = if ($Environment -eq 'production') {
    "https://thalium-chain-executor.fly.dev"
} else {
    "https://thalium-chain-executor.fly.dev"
}

$InternalSecret = $env:THALIUM_INTERNAL_SECRET
if (-not $InternalSecret) { throw "THALIUM_INTERNAL_SECRET not set" }

$BrainIdA = $env:TEST_BRAIN_ID_A
$BrainIdB = $env:TEST_BRAIN_ID_B
$ApiKeyA = $env:TEST_API_KEY_A
$ApiKeyB = $env:TEST_API_KEY_B

if (-not $BrainIdA -or -not $BrainIdB -or -not $ApiKeyA -or -not $ApiKeyB) {
    throw "TEST_BRAIN_ID_A, TEST_BRAIN_ID_B, TEST_API_KEY_A, TEST_API_KEY_B must all be set"
}

$Results = @()
$Passed = $true

function Test-Isolation {
    param([string]$Description, [string]$Url, [string]$ApiKey)

    try {
        $Headers = @{
            "Authorization" = "Bearer $ApiKey"
            "X-Thalium-Internal" = $InternalSecret
        }
        $Response = Invoke-WebRequest -Uri $Url -Headers $Headers -Method Get -ErrorAction Stop
        $StatusCode = $Response.StatusCode

        if ($StatusCode -ne 403) {
            return @{ name = $Description; passed = $false; status_code = $StatusCode; detail = "Expected 403, got $StatusCode — ISOLATION BREACH" }
        }
        return @{ name = $Description; passed = $true; status_code = $StatusCode; detail = "Correctly returned 403" }
    } catch {
        $StatusCode = $_.Exception.Response.StatusCode.value__
        if ($StatusCode -eq 403) {
            return @{ name = $Description; passed = $true; status_code = 403; detail = "Correctly returned 403" }
        }
        return @{ name = $Description; passed = $false; status_code = $StatusCode; detail = "Unexpected error: $_" }
    }
}

# Test 1: Brain B key cannot read Brain A memory
$Results += Test-Isolation -Description "Brain B key cannot read Brain A memory" `
    -Url "$BaseUrl/v1/brain/$BrainIdA/memory" -ApiKey $ApiKeyB

# Test 2: Brain B key cannot read Brain A artifacts
$Results += Test-Isolation -Description "Brain B key cannot read Brain A artifacts" `
    -Url "$BaseUrl/v1/brain/$BrainIdA/artifacts" -ApiKey $ApiKeyB

# Test 3: Brain B key cannot read Brain A audit log
$Results += Test-Isolation -Description "Brain B key cannot read Brain A audit log" `
    -Url "$BaseUrl/v1/brain/$BrainIdA/audit" -ApiKey $ApiKeyB

# Test 4: Brain B key cannot read Brain A status
$Results += Test-Isolation -Description "Brain B key cannot read Brain A status" `
    -Url "$BaseUrl/v1/brain/$BrainIdA/status" -ApiKey $ApiKeyB

# Test 5: Brain A key cannot read Brain B memory
$Results += Test-Isolation -Description "Brain A key cannot read Brain B memory" `
    -Url "$BaseUrl/v1/brain/$BrainIdB/memory" -ApiKey $ApiKeyA

foreach ($Result in $Results) {
    if (-not $Result.passed) { $Passed = $false }
}

$Report = @{
    passed = $Passed
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    environment = $Environment
    checks = $Results
    blockers = ($Results | Where-Object { -not $_.passed } | ForEach-Object { $_.detail })
}

if ($OutputJson) {
    $Report | ConvertTo-Json -Depth 5
} else {
    if ($Passed) {
        Write-Host "PASSED — All $($Results.Count) isolation checks returned 403" -ForegroundColor Green
    } else {
        Write-Host "FAILED — Isolation breach detected!" -ForegroundColor Red
        $Results | Where-Object { -not $_.passed } | ForEach-Object {
            Write-Host "  BREACH: $($_.detail)" -ForegroundColor Red
        }
        exit 1
    }
}
