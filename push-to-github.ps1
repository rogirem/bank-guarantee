# Create repo on GitHub (if missing) and push. Use Personal Access Token.
# Run: $env:GITHUB_TOKEN = "your_token"; .\push-to-github.ps1
# Or: .\push-to-github.ps1 -Token "your_token"
# Create token: https://github.com/settings/tokens (scope: repo)

param([string]$Token = $env:GITHUB_TOKEN)
$ErrorActionPreference = "Stop"
$repo = "bank-guarantee"
$user = "rogirem"

if (-not $Token) {
    Write-Host "Set GITHUB_TOKEN or pass -Token"
    exit 1
}

$base64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${Token}"))
$headers = @{
    Authorization = "Basic $base64"
    "Content-Type" = "application/json"
}
try {
    Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers -Body (@{ name = $repo; private = $false } | ConvertTo-Json)
    Write-Host "Repo $user/$repo created."
} catch {
    if ($_.Exception.Response.StatusCode -eq 422) { Write-Host "Repo already exists." }
    else { throw }
}

$url = "https://${user}:${Token}@github.com/${user}/${repo}.git"
git remote remove origin 2>$null
git remote add origin $url
git push -u origin main
Write-Host "Done. Remove token from remote: git remote set-url origin https://github.com/$user/${repo}.git"
git remote set-url origin "https://github.com/$user/${repo}.git"
