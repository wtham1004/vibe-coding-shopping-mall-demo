# GitHub: https://github.com/wtham1004/vibe-coding-shopping-mall-demo.git
# Typical clone path (GitHub Desktop / OneDrive):
#   C:\Users\colin\OneDrive\Documents\GitHub\vibe-coding-shopping-mall-demo
#
# Run in PowerShell from repo root (Git for Windows required).
# https://git-scm.com/download/win
# GitHub HTTPS push uses a Personal Access Token (not the account password).

Set-Location $PSScriptRoot

git --version
if ($LASTEXITCODE -ne 0) {
  Write-Error "Git is not installed or not in PATH."
  exit 1
}

git init
git config user.name "wtham123"
git config user.email "colin.ham@masters.ab.ca"
git add -A
git status
git commit -m "Initial commit: shopping mall demo (client + server)"
git branch -M main
git remote remove origin 2>$null
git remote add origin https://github.com/wtham1004/vibe-coding-shopping-mall-demo.git
git push -u origin main
