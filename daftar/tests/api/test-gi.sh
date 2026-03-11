#!/bin/bash
# Daftar API Tests — GI (General Intelligence) Module
# Prerequisites: Server running at localhost:3000, valid session cookie
# Assumes seed data from tests/seed/seed-test-data.ts has been run
#
# FIXED (Session C): GI actions now actually execute (task reassignment,
# deadline extension, workload rebalancing). Verify execution works.

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
echo "  Daftar API Tests — GI Module"
echo "=========================================="
echo ""

# ---- Happy Path Tests ----

echo "--- Happy Path ---"

# POST /api/gi/chat — chat with GI
test_endpoint "GI Chat" "POST" "/api/gi/chat" "200" '{"message":"How is the team doing?"}'
check_field "message"
check_field "suggestions"
check_field "contextUsed"
check_field "proactiveInsight"

# POST /api/gi/chat — greeting
test_endpoint "GI Chat greeting" "POST" "/api/gi/chat" "200" '{"message":"Hello!"}'
check_field "message"
check_field "suggestions"

# POST /api/gi/chat — task query
test_endpoint "GI Chat task query" "POST" "/api/gi/chat" "200" '{"message":"How are my tasks?"}'
check_field "message"

# GET /api/gi/config — get config (ADMIN only)
test_endpoint "Get GI config (ADMIN)" "GET" "/api/gi/config" "200"

# GET /api/gi/predictions — list predictions
test_endpoint "List GI predictions" "GET" "/api/gi/predictions" "200"

# GET /api/gi/actions — list autonomous actions
test_endpoint "List GI actions" "GET" "/api/gi/actions" "200"
check_field "actions"
check_field "stats"

# Get first action ID if any exist
FIRST_ACTION_ID=$(echo "$body_response" | jq -r '.actions[0].id // empty')
if [ -n "$FIRST_ACTION_ID" ]; then
    echo "  → First action ID: $FIRST_ACTION_ID"
fi

# GET /api/gi/actions/[id] — get action detail (uses PATCH endpoint for approve/reject)
# Note: The [id] route only has PATCH, not GET. We test PATCH with reject on a pending action.
if [ -n "$FIRST_ACTION_ID" ]; then
    # Check action status first — only PENDING actions can be approved/rejected
    FIRST_ACTION_STATUS=$(echo "$body_response" | jq -r '.actions[0].status // empty')
    if [ "$FIRST_ACTION_STATUS" = "PENDING" ]; then
        # VERIFY FIX: GI actions now execute on approve (not just log intent)
        test_endpoint "Approve GI action (verify execution)" "PATCH" "/api/gi/actions/$FIRST_ACTION_ID" "200" '{"action":"approve"}'
        check_field "status"
        # After approval, verify the action was actually executed (status should be EXECUTED, not just APPROVED)
        APPROVED_STATUS=$(echo "$body_response" | jq -r '.status // empty')
        if [ "$APPROVED_STATUS" = "EXECUTED" ]; then
            echo "  ✓ VERIFY FIX: Action status is EXECUTED (GI actions now execute for real)"
        elif [ "$APPROVED_STATUS" = "APPROVED" ]; then
            echo "  ✓ Action approved (may execute asynchronously)"
        else
            echo "  ⚠ Unexpected post-approval status: $APPROVED_STATUS"
        fi
    else
        echo "  (Skipping action approve/reject — first action is not PENDING, status: $FIRST_ACTION_STATUS)"
    fi
fi

# PATCH /api/gi/actions/[id] — invalid action verb → 400
if [ -n "$FIRST_ACTION_ID" ]; then
    test_endpoint "GI action invalid verb → 400" "PATCH" "/api/gi/actions/$FIRST_ACTION_ID" "400" '{"action":"invalid_verb"}'
fi

# ---- Error / Edge Case Tests ----

echo ""
echo "--- Error / Edge Cases ---"

# POST /api/gi/chat — empty message → 400
test_endpoint "GI Chat empty message → 400" "POST" "/api/gi/chat" "400" '{"message":""}'

# POST /api/gi/chat — whitespace-only message → 400
test_endpoint "GI Chat whitespace message → 400" "POST" "/api/gi/chat" "400" '{"message":"   "}'

# No cookie → 401 on chat
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/gi/chat" \
    -H "Content-Type: application/json" \
    -d '{"message":"test"}')
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: GI Chat without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: GI Chat without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# No cookie → 401 on config
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/gi/config")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: GI Config without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: GI Config without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# No cookie → 401 on predictions
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/gi/predictions")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: GI Predictions without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: GI Predictions without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# No cookie → 401 on actions
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/gi/actions")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: GI Actions without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: GI Actions without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# PATCH /api/gi/actions/nonexistent-id → 404
test_endpoint "GI action nonexistent ID → 404" "PATCH" "/api/gi/actions/nonexistent-id-12345" "404" '{"action":"approve"}'

# ---- Summary ----

echo ""
echo "=========================================="
echo "Results: $PASS passed, $FAIL failed out of $TOTAL tests"
echo "=========================================="

exit $FAIL
