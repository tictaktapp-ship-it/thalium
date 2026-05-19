[CmdletBinding()]
param([Parameter(Mandatory)][string]$Task, [string]$SourceFile, [Parameter(Mandatory)][string]$OutputFile)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$DevDir       = "E:\thalium\scripts\dev"
$ContextFile  = Join-Path $DevDir "thalium-context.txt"
$OllamaScript = Join-Path $DevDir "Invoke-Ollama.ps1"
$Context      = Get-Content $ContextFile -Raw
$SourceBlock  = ""
if ($SourceFile) { $SourceBlock = "`n== EXISTING FILE: $SourceFile ==`n`n$(Get-Content $SourceFile -Raw)`n`n== END ==`n" }
$Prompt = "$Context`n$SourceBlock`n== TASK ==`n`n$Task`n`n== OUTPUT RULES ==`nComplete file only. No markdown fences. No placeholders. No truncation."
Write-Host "Sending to Ollama (qwen2.5-coder:7b): $($Task.Substring(0,[Math]::Min(60,$Task.Length)))..." -ForegroundColor Cyan
$Result = & $OllamaScript -Prompt $Prompt -Model "qwen2.5-coder:7b"
$OutDir = Split-Path -Parent $OutputFile
if ($OutDir -and -not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }
$Result | Out-File -FilePath $OutputFile -Encoding UTF8 -NoNewline
Write-Host "Written: $OutputFile ($($Result.Split([char]10).Count) lines)" -ForegroundColor Green
Write-Host "Run the verification command from the Notion AI block now." -ForegroundColor Yellow



