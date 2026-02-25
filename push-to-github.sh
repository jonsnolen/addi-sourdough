#!/bin/bash
# Run this after creating the repo on GitHub
# Replace YOUR_GITHUB_USERNAME with your actual GitHub username

echo "Enter your GitHub username:"
read USERNAME

cd "$(dirname "$0")"
git remote add origin "https://github.com/${USERNAME}/addi-sourdough.git" 2>/dev/null || git remote set-url origin "https://github.com/${USERNAME}/addi-sourdough.git"
git push -u origin main

echo "Done! Now go to vercel.com/new to deploy."
