<#
.SYNOPSIS
    Assembles a Thalium build prompt and sends it to OpenRouter.
.PARAMETER Task
    Plain English description of what to build.
.PARAMETER SourceFile
    Optional: path to an existing file to include as context.
.PARAMETER OutputFile
    Where to save the output.
.PARAMETER Model
    OpenRouter model. Default: deepseek/deepseek-chat
.EXAMPLE
    .\Invoke-ThaliumBuildOR.ps1 `
        -Task "Write the Librarian write function..." `
        -OutputFile .\src\lib\librarian-write.ts
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$Task,

    [string]$SourceFile,

    [Parameter(Mandatory)]
    [string]$OutputFile,

    [string]$Model = 'deepseek/deepseek-chat'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptDir    = Split-Path -Parent $MyInvocation.MyCommand.Path
$ContextFile  = Join-Path $ScriptDir 'thalium-context.txt'
$InvokeOR     = Join-Path $ScriptDir 'Invoke-OpenRouter.ps1'

if (-not (Test-Path $ContextFile)) {
    throw "Context file not found: $ContextFile"
}

$Context = Get-Content $ContextFile -Raw

$SourceBlock = ''
if ($SourceFile) {
    if (-not (Test-Path $SourceFile)) {
        throw "Source file not found: $SourceFile"
    }
    $SourceContent = Get-Content $SourceFile -Raw
    $SourceBlock = @"

== EXISTING FILE: $SourceFile ==

$SourceContent

== END EXISTING FILE ==
"@
}

$Prompt = @"
$Context
$SourceBlock

== TASK ==

$Task

== OUTPUT ==

Produce the complete file only. No explanation before or after. No markdown fences.
Start with the first line of the file and end with the last line of the file.
"@

Write-Host "Sending to OpenRouter ($Model)..." -ForegroundColor Cyan
Write-Host "Task: $Task" -ForegroundColor Gray

$Result = & $InvokeOR -Prompt $Prompt -Model $Model

$OutputDir = Split-Path -Parent $OutputFile
if ($OutputDir -and -not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$Result | Out-File -FilePath $OutputFile -Encoding UTF8 -NoNewline

Write-Host "Output saved to: $OutputFile" -ForegroundColor Green
Write-Host "Lines: $($Result.Split("`n").Count)" -ForegroundColor Gray
