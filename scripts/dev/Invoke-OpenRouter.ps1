<#
.SYNOPSIS
    Sends a prompt to OpenRouter and returns the response.
.DESCRIPTION
    Calls OpenRouter API from PowerShell using OPENROUTER_API_KEY.
    Supports any model available on OpenRouter.
.PARAMETER Prompt
    The full prompt string to send.
.PARAMETER Model
    OpenRouter model to use. Default: deepseek/deepseek-chat
.EXAMPLE
    $code = Invoke-OpenRouter -Prompt (Get-Content ./prompts/build-librarian.txt -Raw)
    $code | Out-File ./src/lib/librarian-write.ts
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$Prompt,

    [string]$Model = 'deepseek/deepseek-chat'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ApiKey = $env:OPENROUTER_API_KEY
if (-not $ApiKey) {
    throw 'OPENROUTER_API_KEY environment variable is not set.'
}

$Uri = 'https://openrouter.ai/api/v1/chat/completions'

$Body = @{
    model    = $Model
    messages = @(
        @{ role = 'user'; content = $Prompt }
    )
    temperature = 0.2
} | ConvertTo-Json -Depth 10

try {
    $Response = Invoke-RestMethod -Uri $Uri -Method Post -Body $Body `
        -ContentType 'application/json' `
        -Headers @{ Authorization = "Bearer $ApiKey" }
    $Text = $Response.choices[0].message.content
    Write-Output $Text
}
catch {
    $StatusCode = $_.Exception.Response.StatusCode.value__
    Write-Error "OpenRouter API error ($StatusCode): $_"
    exit 1
}
