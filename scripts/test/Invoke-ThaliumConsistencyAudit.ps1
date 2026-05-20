<#
.SYNOPSIS
    Runs the Thalium consistency audit — 6 audits run weekly and before every release.
.DESCRIPTION
    Audits: ring coherence sample, coverage map sync, calibrator accuracy trend,
    cross-tenant isolation, anchor orphan check, SSE event sequence validation.
.PARAMETER Environment
    Target environment. Default: staging
.PARAMETER OutputJson
    If set, outputs results as JSON.
.EXAMPLE
    ./scripts/test/Invoke-ThaliumConsistencyAudit.ps1 -Environment staging -OutputJson
#>
param (
    [string]$Environment = 'staging',
    [switch]$OutputJson
)

Set-StrictMode -Version Latest

function Invoke-AuditCheck {
    param (
        [string]$Name,
        [scriptblock]$ScriptBlock
    )

    $result = @{
        Name = $Name
        Passed = $false
        Warnings = @()
        Blockers = @()
        Detail = $null
    }

    try {
        $response = & $ScriptBlock
        $result.Detail = $response

        switch ($Name) {
            'ring_coherence_sample' {
                if ($response.pass_rate -ge 0.99) {
                    $result.Passed = $true
                } elseif ($response.pass_rate -lt 0.95) {
                    $result.Blockers += "Pass rate below 0.95: $($response.pass_rate)"
                } else {
                    $result.Warnings += "Pass rate below 0.99: $($response.pass_rate)"
                }
            }
            'coverage_map_sync' {
                if ($response.max_discrepancy -le 0.05) {
                    $result.Passed = $true
                } elseif ($response.max_discrepancy -gt 0.15) {
                    $result.Blockers += "Max discrepancy above 0.15: $($response.max_discrepancy)"
                } else {
                    $result.Warnings += "Max discrepancy above 0.05: $($response.max_discrepancy)"
                }
            }
            'calibrator_accuracy_trend' {
                if ($response.rollback_rate -le 0.20) {
                    $result.Passed = $true
                } elseif ($response.rollback_rate -gt 0.40) {
                    $result.Blockers += "Rollback rate above 0.40: $($response.rollback_rate)"
                } else {
                    $result.Warnings += "Rollback rate above 0.20: $($response.rollback_rate)"
                }
            }
            'cross_tenant_isolation' {
                if ($response.non_403_count -eq 0) {
                    $result.Passed = $true
                } else {
                    $result.Blockers += "Non-403 responses found: $($response.non_403_count)"
                }
            }
            'anchor_orphan_check' {
                if ($response.orphan_count -eq 0) {
                    $result.Passed = $true
                } elseif ($response.orphan_count -ge 5) {
                    $result.Blockers += "Orphan count >= 5: $($response.orphan_count)"
                } else {
                    $result.Warnings += "Orphan count < 5: $($response.orphan_count)"
                }
            }
            'sse_event_sequence' {
                if ($response.violation_rate -le 0.02) {
                    $result.Passed = $true
                } else {
                    $result.Blockers += "Violation rate above 0.02: $($response.violation_rate)"
                }
            }
        }
    } catch {
        $result.Blockers += "Failed to execute audit: $_"
    }

    return $result
}

$BaseUrl = switch ($Environment) {
    'staging' { 'https://thalium-instance-manager.fly.dev' }
    'local' { 'http://localhost:8081' }
    default { throw "Invalid environment: $Environment" }
}

$audits = @(
    @{ Name = 'ring_coherence_sample'; ScriptBlock = { Invoke-RestMethod -Uri "$BaseUrl/v1/audit/ring-coherence" -Method Get } },
    @{ Name = 'coverage_map_sync'; ScriptBlock = { Invoke-RestMethod -Uri "$BaseUrl/v1/audit/coverage-map-sync" -Method Get } },
    @{ Name = 'calibrator_accuracy_trend'; ScriptBlock = { Invoke-RestMethod -Uri "$BaseUrl/v1/audit/calibrator-trend" -Method Get } },
    @{ Name = 'cross_tenant_isolation'; ScriptBlock = { Invoke-RestMethod -Uri "$BaseUrl/v1/audit/isolation" -Method Get } },
    @{ Name = 'anchor_orphan_check'; ScriptBlock = { Invoke-RestMethod -Uri "$BaseUrl/v1/audit/anchor-orphans" -Method Get } },
    @{ Name = 'sse_event_sequence'; ScriptBlock = { Invoke-RestMethod -Uri "$BaseUrl/v1/audit/sse-sequences" -Method Get } }
)

$results = @()
$blockersFound = $false

foreach ($audit in $audits) {
    $result = Invoke-AuditCheck -Name $audit.Name -ScriptBlock $audit.ScriptBlock
    $results += $result
    if ($result.Blockers.Count -gt 0) {
        $blockersFound = $true
    }
}

$summary = @{
    Passed = -not $blockersFound
    Warnings = $results | ForEach-Object { $_.Warnings } | Where-Object { $_ }
    Blockers = $results | ForEach-Object { $_.Blockers } | Where-Object { $_ }
    Details = $results | ForEach-Object { @{ $_.Name = $_.Detail } }
}

if ($OutputJson) {
    $summary | ConvertTo-Json -Depth 3
} else {
    if ($summary.Passed) {
        Write-Host "All audits passed."
    } else {
        Write-Host "Audits failed with blockers:"
        $summary.Blockers | ForEach-Object { Write-Host "  - $_" }
    }

    if ($summary.Warnings.Count -gt 0) {
        Write-Host "Warnings:"
        $summary.Warnings | ForEach-Object { Write-Host "  - $_" }
    }
}

exit ($blockersFound ? 1 : 0)