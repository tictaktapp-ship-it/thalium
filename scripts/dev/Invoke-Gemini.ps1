[CmdletBinding()]
param([Parameter(Mandatory)][string]$Prompt, [string]$Model = "gemini-1.5-flash")
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ApiKey = $env:GEMINI_API_KEY
if (-not $ApiKey) {
    $Line = Get-Content "E:\thalium\.env" | Where-Object { $_ -match "^GEMINI_API_KEY=" }
    if ($Line) { $ApiKey = ($Line -split "=", 2)[1].Trim() }
}
if (-not $ApiKey) { throw "GEMINI_API_KEY not set in E:\thalium\.env" }
$Uri  = "https://generativelanguage.googleapis.com/v1beta/models/${Model}:generateContent?key=$ApiKey"
$Body = @{ contents = @(@{ parts = @(@{ text = $Prompt }) }); generationConfig = @{ temperature = 0.2; maxOutputTokens = 8192 } } | ConvertTo-Json -Depth 10
try {
    $R = Invoke-RestMethod -Uri $Uri -Method Post -Body $Body -ContentType "application/json"
    Write-Output $R.candidates[0].content.parts[0].text
} catch { Write-Error "Gemini error: $_"; exit 1 }
