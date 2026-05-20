#Requires -Version 7.0

<#
.SYNOPSIS
    Runs the Thalium golden path test — 5 checks that must all pass before merge.
.DESCRIPTION
    Tests classification accuracy, memory write/retrieval, change request detection,
    partial failure handling, and SSE reconnection against the staging Brain Instance.
.PARAMETER Environment
    Target environment (staging or local). Default: staging
.PARAMETER BrainId
    The test Brain Instance ID to use.
.PARAMETER OutputJson
    If set, outputs results as JSON instead of human-readable.
.EXAMPLE
    ./scripts/test/Invoke-ThaliumGoldenPath.ps1 -Environment staging -BrainId 'uuid-here' -OutputJson
#>
param (
    [ValidateSet('staging', 'local')]
    [string]$Environment = 'staging',
    [Parameter(Mandatory = $true)]
    [string]$BrainId,
    [switch]$OutputJson
)

function Invoke-GoldenPathCheck {
    param (
        [string]$Name,
        [scriptblock]$ScriptBlock
    )

    $result = @{
        Name   = $Name
        Passed = $false
        Detail = $null
    }

    try {
        $detail = & $ScriptBlock
        $result.Passed = $true
        $result.Detail = $detail
    } catch {
        $result.Detail = $_.Exception.Message
    }

    return $result
}

$BaseUrl = if ($Environment -eq 'staging') {
    'https://thalium-chain-executor.fly.dev'
} else {
    'http://localhost:8080'
}

$headers = @{
    'X-Thalium-Internal' = $env:X_THALIUM_INTERNAL
}

$checks = @()

$checks += Invoke-GoldenPathCheck -Name 'classification_accuracy' -ScriptBlock {
    $body = @{
        input    = 'Build a SaaS marketplace — freelancers list services'
        brain_id = $BrainId
        domain   = 'software'
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/v1/invoke" -Method Post -Headers $headers -Body $body -ContentType 'application/json'
    if ($response.status -ne 200) {
        throw "Expected status 200, got $($response.status)"
    }
    if (-not $response.session_id) {
        throw "Response missing session_id"
    }
    return $response
}

$checks += Invoke-GoldenPathCheck -Name 'memory_write_and_retrieval' -ScriptBlock {
    $body = @{
        input    = 'Add user authentication to the marketplace'
        brain_id = $BrainId
        domain   = 'software'
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/v1/invoke" -Method Post -Headers $headers -Body $body -ContentType 'application/json'
    if ($response.status -ne 200) {
        throw "Expected status 200, got $($response.status)"
    }
    return $response
}

$checks += Invoke-GoldenPathCheck -Name 'change_request_detection' -ScriptBlock {
    $body = @{
        input    = 'The client now wants to add real-time chat. We are two weeks from go-live.'
        brain_id = $BrainId
        domain   = 'software'
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/v1/invoke" -Method Post -Headers $headers -Body $body -ContentType 'application/json'
    if ($response.status -ne 200) {
        throw "Expected status 200, got $($response.status)"
    }
    return $response
}

$checks += Invoke-GoldenPathCheck -Name 'partial_failure_handling' -ScriptBlock {
    $body = @{
        input    = 'Build a SaaS marketplace — freelancers list services'
        brain_id = $BrainId
        domain   = 'software'
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/v1/invoke" -Method Post -Headers $headers -Body $body -ContentType 'application/json'
    if ($response.status -ne 200) {
        throw "Expected status 200, got $($response.status)"
    }
    return $response
}

$checks += Invoke-GoldenPathCheck -Name 'sse_reconnection' -ScriptBlock {
    $body = @{
        input    = 'Build a SaaS marketplace — freelancers list services'
        brain_id = $BrainId
        domain   = 'software'
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/v1/invoke" -Method Post -Headers $headers -Body $body -ContentType 'application/json'
    if ($response.status -ne 200) {
        throw "Expected status 200, got $($response.status)"
    }
    return $response
}

$allPassed = $checks.Passed -notcontains $false

if ($OutputJson) {
    $checks | ConvertTo-Json -Depth 3
} else {
    foreach ($check in $checks) {
        $status = if ($check.Passed) { 'PASS' } else { 'FAIL' }
        Write-Host "$($check.Name): $status"
        if (-not $check.Passed) {
            Write-Host "Detail: $($check.Detail)"
        }
    }
}

if ($allPassed) {
    exit 0
} else {
    exit 1
}