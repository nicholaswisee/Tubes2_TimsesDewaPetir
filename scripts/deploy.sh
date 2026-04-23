#!/bin/bash
# Deployment script for Linux/WSL
# Usage: ./scripts/deploy.sh

echo -e "\e[36m--- Syncing Commits and Redeploying ---\e[0m"

# 1. Pull latest changes
echo -e "\e[33mStep 1: Pulling latest changes...\e[0m"
git pull origin main

# 2. Rebuild and restart containers
echo -e "\e[33mStep 2: Restarting Docker containers...\e[0m"

if docker compose version >/dev/null 2>&1; then
    DOCKER_CMD="docker compose"
else
    DOCKER_CMD="docker-compose"
fi

if ! $DOCKER_CMD -f docker-compose.prod.yml up -d --build; then
    echo -e "\e[31mError: Docker build/deployment failed.\e[0m"
    exit 1
fi

echo -e "\e[32m--- Deployment Successful! ---\e[0m"
echo "Your app should be live at: http://$(curl -s ifconfig.me)"
