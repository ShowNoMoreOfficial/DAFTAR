#!/bin/bash
# Daftar API Tests — Gamification Module
# Prerequisites: Server running at localhost:3000, valid session cookie
# Assumes seed data from tests/seed/seed-test-data.ts has been run

BASE_URL="http://localhost:3000"
COOKIE="next-auth.session-token=YOUR_TOKEN_HERE"
PASS=0
FAIL=0
TOTAL=0

test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local expected_status="$4"
    local body="$5"

    TOTAL=$((TOTAL + 1))

    if [ -n "$body" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$url" \
            -H "Cookie: $COOKIE" \
            -H "Content-Type: application/json" \
            -d "$body")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$url" \
            -H "Cookie: $COOKIE")
    fi

    status=$(echo "$response" | tail -1)
    body_response=$(echo "$response" | sed '$d')

    if [ "$status" = "$expected_status" ]; then
        echo "✅ PASS: $name (HTTP $status)"
        PASS=$((PASS + 1))
    else
        echo "❌ FAIL: $name (Expected $expected_status, got $status)"
        echo "   Response: $(echo "$body_response" | head -3)"
        FAIL=$((FAIL + 1))
    fi
}

# Helper: check JSON field exists in last response
check_field() {
    local field="$1"
    echo "$body_response" | jq -e ".$field" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "  ✓ Field '$field' present"
    else
        echo "  ⚠ Field '$field' missing"
    fi
}

echo "=========================================="
echo "  Daftar API Tests — Gamification Module"
echo "=========================================="
echo ""

# ---- Happy Path Tests ----

echo "--- Happy Path ---"

# GET /api/gamification/me — get own gamification profile
test_endpoint "Get gamification profile" "GET" "/api/gamification/me" "200"
echo "  --- Verifying response shape ---"
check_field "totalXp"
check_field "level"
check_field "xpInLevel"
check_field "xpNeeded"
check_field "currentStreak"
check_field "longestStreak"
check_field "achievements"
check_field "newUnlocks"

# Verify numeric fields
TOTAL_XP=$(echo "$body_response" | jq '.totalXp')
LEVEL=$(echo "$body_response" | jq '.level')
CURRENT_STREAK=$(echo "$body_response" | jq '.currentStreak')

if [ "$TOTAL_XP" != "null" ] && [ "$TOTAL_XP" -ge 0 ] 2>/dev/null; then
    echo "  ✓ totalXp is a valid number: $TOTAL_XP"
else
    echo "  ⚠ totalXp is not a valid number: $TOTAL_XP"
fi

if [ "$LEVEL" != "null" ] && [ "$LEVEL" -ge 1 ] 2>/dev/null; then
    echo "  ✓ level is a valid number >= 1: $LEVEL"
else
    echo "  ⚠ level is not a valid number >= 1: $LEVEL"
fi

if [ "$CURRENT_STREAK" != "null" ] && [ "$CURRENT_STREAK" -ge 0 ] 2>/dev/null; then
    echo "  ✓ currentStreak is a valid number: $CURRENT_STREAK"
else
    echo "  ⚠ currentStreak is not a valid number: $CURRENT_STREAK"
fi

# GET /api/gamification/leaderboard — get leaderboard
test_endpoint "Get leaderboard" "GET" "/api/gamification/leaderboard" "200"

# Verify leaderboard structure (array of ranked users)
FIRST_RANK=$(echo "$body_response" | jq '.[0].rank // empty')
if [ -n "$FIRST_RANK" ]; then
    check_field "[0].rank"
    check_field "[0].user"
    check_field "[0].totalXp"
    check_field "[0].level"
    check_field "[0].currentStreak"
    echo "  ✓ Leaderboard has ranked entries"
else
    echo "  (Leaderboard may be empty — no streak data in seed)"
fi

# GET /api/gamification/achievements — list all achievements
test_endpoint "List achievements" "GET" "/api/gamification/achievements" "200"

# Verify achievement structure
FIRST_ACH_KEY=$(echo "$body_response" | jq -r '.[0].key // empty')
if [ -n "$FIRST_ACH_KEY" ]; then
    check_field "[0].key"
    check_field "[0].name"
    check_field "[0].description"
    check_field "[0].category"
    check_field "[0].points"
    check_field "[0].unlocked"
    echo "  ✓ Achievements list has proper structure"
else
    echo "  (No achievements found — gamification seed may not have run)"
fi

# GET /api/gamification/challenges — list challenges
test_endpoint "List challenges" "GET" "/api/gamification/challenges" "200"

# GET /api/gamification/rewards — list rewards
test_endpoint "List rewards" "GET" "/api/gamification/rewards" "200"

# ---- Error / Edge Case Tests ----

echo ""
echo "--- Error / Edge Cases ---"

# No cookie → 401 on gamification/me
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/gamification/me")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: Gamification profile without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: Gamification profile without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# No cookie → 401 on leaderboard
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/gamification/leaderboard")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: Leaderboard without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: Leaderboard without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# No cookie → 401 on achievements
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/gamification/achievements")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: Achievements without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: Achievements without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# ---- Summary ----

echo ""
echo "=========================================="
echo "Results: $PASS passed, $FAIL failed out of $TOTAL tests"
echo "=========================================="

exit $FAIL
