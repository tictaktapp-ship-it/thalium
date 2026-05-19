[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$Prompt,
    [string]$Model = "qwen2.5-coder:7b"
)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$Body = @{ model = $Model; prompt = $Prompt; stream = $false } | ConvertTo-Json -Depth 5
$Response = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method Post -Body $Body -ContentType "application/json"
Write-Output $Response.response
