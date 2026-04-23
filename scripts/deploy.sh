#!/bin/bash
# Deployment script for Linux/WSL
# Usage: ./scripts/deploy.sh

echo -e "\e[36m--- Syncing Commits and Redeploying ---\e[0m"

# 1. Pull latest changes
echo -e "\e[33mStep 1: Pulling latest changes...\e[0m"
git pull origin main

# 2. Rebuild and restart containers
echo -e "\e[33mStep 2: Restarting Docker containers...\e[0m"
docker-compose -f docker-compose.prod.yml up -d --build

echo -e "\e[32m--- Deployment Successful! ---\e[0m"
echo "Your app should be live at: http://$(curl -s ifconfig.me)"
