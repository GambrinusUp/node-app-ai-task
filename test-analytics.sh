#!/bin/bash
# Analytics API Quick Test Script

echo "🚀 Photo Gallery Analytics API - Quick Test"
echo "=============================================="
echo ""

BASE_URL="http://localhost:3000"

echo "ℹ️  Make sure the application is running on port 3000"
echo ""

# Test 1: Summary
echo "📊 Test 1: Getting Summary..."
curl -s "$BASE_URL/analytics/summary" | jq '.data.summary' 2>/dev/null || echo "Could not connect to $BASE_URL"
echo ""

# Test 2: Stats
echo "📈 Test 2: Getting Statistics..."
curl -s "$BASE_URL/analytics/stats" | jq '.data' 2>/dev/null || echo "Error fetching stats"
echo ""

# Test 3: Usage (Daily)
echo "📅 Test 3: Getting Daily Usage..."
curl -s "$BASE_URL/analytics/usage?period=daily" | jq '.data | length' 2>/dev/null | xargs echo "Days with data:" || echo "Error fetching usage"
echo ""

# Test 4: Usage (Monthly)
echo "🗓️  Test 4: Getting Monthly Usage..."
curl -s "$BASE_URL/analytics/usage?period=monthly" | jq '.data | length' 2>/dev/null | xargs echo "Months with data:" || echo "Error fetching monthly usage"
echo ""

# Test 5: Authors
echo "👥 Test 5: Getting Author Statistics..."
curl -s "$BASE_URL/analytics/authors" | jq '.count' 2>/dev/null | xargs echo "Total authors:" || echo "Error fetching authors"
echo ""

# Test 6: Timeline
echo "⏰ Test 6: Getting Timeline..."
curl -s "$BASE_URL/analytics/timeline" | jq '.count' 2>/dev/null | xargs echo "Timeline entries:" || echo "Error fetching timeline"
echo ""

echo "✅ Tests complete!"
echo ""
echo "💡 Tips:"
echo "  • Visit http://localhost:3000/public/analytics.html for interactive dashboard"
echo "  • Check ANALYTICS.md for detailed API documentation"
echo "  • See ANALYTICS_QUICK.md for quick reference"
echo ""
