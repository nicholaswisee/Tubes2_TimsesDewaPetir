# Deployment script for Windows Server
# Usage: .\scripts\deploy.ps1

Write-Host "--- Syncing Commits and Redeploying ---" -ForegroundColor Cyan

# 1. Pull latest changes from Git
Write-Host "Step 1: Pulling latest changes..." -ForegroundColor Yellow
git pull origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Git pull failed. Make sure you are in the repo directory and Git is configured." -ForegroundColor Red
    exit $LASTEXITCODE
}

# 2. Rebuild and restart containers
Write-Host "Step 2: Restarting Docker containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker-compose failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "--- Deployment Successful! ---" -ForegroundColor Green
Write-Host "Your app should be live at: http://$(curl -s ifconfig.me)"
