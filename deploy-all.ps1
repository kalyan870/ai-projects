# Deployment Script for All 5 Projects
# Prerequisites: Vercel CLI, Railway CLI installed and authenticated

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "     Deploying All 5 AI Projects" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ==========================================
# Project 1: Browser Agent
# ==========================================
Write-Host "`n[1/5] Deploying Browser Agent..." -ForegroundColor Yellow

# Backend to Railway
Set-Location -LiteralPath "C:\projects\browser-agent\backend"
Write-Host "  Deploying backend to Railway..." -ForegroundColor Gray
railway up --service browser-agent-api

# Frontend to Vercel
Set-Location -LiteralPath "C:\projects\browser-agent\frontend"
Write-Host "  Deploying frontend to Vercel..." -ForegroundColor Gray
vercel --prod

# ==========================================
# Project 2: Codebase Analyst
# ==========================================
Write-Host "`n[2/5] Deploying Codebase Analyst..." -ForegroundColor Yellow

Set-Location -LiteralPath "C:\projects\codebase-analyst"
Write-Host "  Deploying to Railway..." -ForegroundColor Gray
railway up --service codebase-analyst

# ==========================================
# Project 3: Video AI
# ==========================================
Write-Host "`n[3/5] Deploying Video AI..." -ForegroundColor Yellow

# Backend to Railway
Set-Location -LiteralPath "C:\projects\video-ai"
Write-Host "  Deploying backend to Railway..." -ForegroundColor Gray
railway up --service video-ai-api

# Frontend to Vercel
Set-Location -LiteralPath "C:\projects\video-ai\frontend"
Write-Host "  Deploying frontend to Vercel..." -ForegroundColor Gray
vercel --prod

# ==========================================
# Project 4: Alignment Lab
# ==========================================
Write-Host "`n[4/5] Deploying Alignment Lab..." -ForegroundColor Yellow

Set-Location -LiteralPath "C:\projects\alignment-lab"
Write-Host "  Deploying to Railway..." -ForegroundColor Gray
railway up --service alignment-lab

# ==========================================
# Project 5: Voice Assistant
# ==========================================
Write-Host "`n[5/5] Deploying Voice Assistant..." -ForegroundColor Yellow

Set-Location -LiteralPath "C:\projects\voice-assistant"
Write-Host "  Deploying API to Railway..." -ForegroundColor Gray
railway up --service voice-assistant-api

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "     All Deployments Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nDeployment URLs will be shown by Railway/Vercel output above." -ForegroundColor Green
