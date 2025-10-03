#!/bin/bash

echo "🚀 Setting up Git and pushing to GitHub..."
echo ""

# Initialize git if not already done
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git already initialized"
fi

# Add all files
echo "📝 Adding all files..."
git add .

# Commit
echo "💾 Creating commit..."
git commit -m "Initial commit: Medical AI News Aggregator"

# Add remote (change this to your actual GitHub username if different)
echo "🔗 Connecting to GitHub..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/barhab33/MedNewsAI.git

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ Done! Your code is now on GitHub!"
echo "🌐 Visit: https://github.com/barhab33/MedNewsAI"
echo ""
echo "⚠️ IMPORTANT: Now you need to add the secret key:"
echo "1. Go to https://github.com/barhab33/MedNewsAI/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. Name: SUPABASE_ANON_KEY"
echo "4. Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw"
echo "5. Click 'Add secret'"
