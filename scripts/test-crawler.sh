#!/bin/bash

# Test script for Medical AI News Crawler
# This script manually triggers the news crawler and displays results

echo "🔍 Testing Medical AI News Crawler..."
echo "======================================"
echo ""

# Load environment variables
source .env 2>/dev/null || true

if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env"
    exit 1
fi

# Remove VITE_ prefix for API calls
SUPABASE_URL="${VITE_SUPABASE_URL}"
SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY}"

echo "📡 Triggering crawler..."
echo "URL: ${SUPABASE_URL}/functions/v1/crawl-medical-news"
echo ""

# Trigger the crawler
RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/crawl-medical-news" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json")

echo "📥 Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Crawler executed successfully!"
    COUNT=$(echo "$RESPONSE" | jq -r '.count' 2>/dev/null)
    echo "📰 Articles crawled: $COUNT"
else
    echo "❌ Crawler encountered an error"
    exit 1
fi

echo ""
echo "🎉 Test completed!"