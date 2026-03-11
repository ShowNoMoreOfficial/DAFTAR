#!/bin/bash
# Daftar API Tests — HOCCR Module (HR Ops, Culture, Capacity)
# Prerequisites: Server running at localhost:3000, valid session cookie
# Assumes seed data from tests/seed/seed-test-data.ts has been run
#
# FIXED (Session C): HOCCR sentiment is now bidirectional — increments on
# task completion, streaks, and recognition. Verify positive sentiment tracking works.

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
echo "  Daftar API Tests — HOCCR Module"
echo "=========================================="
echo ""
echo "NOTE: HOCCR sentiment is now bidirectional (fixed) — verify positive tracking works"
echo ""

# ---- Setup: get a positionId for candidate creation ----

echo "--- Setup ---"

# Get an existing hiring position for candidate creation
setup_response=$(curl -s -X GET "$BASE_URL/api/hoccr/positions" -H "Cookie: $COOKIE")
POSITION_ID=$(echo "$setup_response" | jq -r '.[0].id // empty')

if [ -z "$POSITION_ID" ]; then
    # Try paginated response shape
    POSITION_ID=$(echo "$setup_response" | jq -r '.data[0].id // empty')
fi

if [ -z "$POSITION_ID" ]; then
    echo "  ⚠ No hiring position found. Candidate creation test will use a placeholder."
    POSITION_ID="placeholder-position-id"
fi
echo "  → Using position ID: $POSITION_ID"

# ---- Happy Path Tests ----

echo ""
echo "--- Happy Path ---"

# GET /api/hoccr/operations/capacity — department capacity
test_endpoint "Get department capacity" "GET" "/api/hoccr/operations/capacity" "200"

# GET /api/hoccr/culture/sentiment — sentiment data
test_endpoint "Get culture sentiment" "GET" "/api/hoccr/culture/sentiment" "200"

# GET /api/hoccr/culture/recognition — recognitions
test_endpoint "Get culture recognitions" "GET" "/api/hoccr/culture/recognition" "200"

# GET /api/hoccr/intelligence/charts — department charts
test_endpoint "Get intelligence charts" "GET" "/api/hoccr/intelligence/charts" "200"

# GET /api/hoccr/candidates — hiring pipeline candidates
test_endpoint "List candidates" "GET" "/api/hoccr/candidates" "200"

# POST /api/hoccr/candidates — create candidate
TIMESTAMP=$(date +%s)
CREATE_CANDIDATE_BODY="{\"name\":\"Test Candidate ${TIMESTAMP}\",\"email\":\"candidate-${TIMESTAMP}@test.com\",\"positionId\":\"${POSITION_ID}\",\"phone\":\"+91-9876543210\",\"notes\":\"API test candidate\"}"
test_endpoint "Create candidate" "POST" "/api/hoccr/candidates" "201" "$CREATE_CANDIDATE_BODY"
check_field "id"
check_field "name"
check_field "email"
check_field "position"

CREATED_CANDIDATE_ID=$(echo "$body_response" | jq -r '.id')
echo "  → Created candidate ID: $CREATED_CANDIDATE_ID"

# GET /api/hoccr/operations — operations overview
test_endpoint "Get operations overview" "GET" "/api/hoccr/operations" "200"

# GET /api/hoccr/culture/engagement — engagement data
test_endpoint "Get culture engagement" "GET" "/api/hoccr/culture/engagement" "200"

# GET /api/hoccr/culture/metrics — culture metrics
test_endpoint "Get culture metrics" "GET" "/api/hoccr/culture/metrics" "200"

# GET /api/hoccr/intelligence — intelligence overview
test_endpoint "Get HOCCR intelligence" "GET" "/api/hoccr/intelligence" "200"

# GET /api/hoccr/operations/bottlenecks — bottleneck data
test_endpoint "Get operations bottlenecks" "GET" "/api/hoccr/operations/bottlenecks" "200"

# GET /api/hoccr/positions — hiring positions
test_endpoint "List hiring positions" "GET" "/api/hoccr/positions" "200"

# PATCH /api/hoccr/candidates — update candidate status
if [ -n "$CREATED_CANDIDATE_ID" ] && [ "$CREATED_CANDIDATE_ID" != "null" ]; then
    test_endpoint "Update candidate status" "PATCH" "/api/hoccr/candidates" "200" \
        "{\"id\":\"${CREATED_CANDIDATE_ID}\",\"status\":\"SCREENING\",\"rating\":4}"
    check_field "status"
fi

# ---- Error / Edge Case Tests ----

echo ""
echo "--- Error / Edge Cases ---"

# POST /api/hoccr/candidates — missing required fields → 400
test_endpoint "Create candidate missing fields → 400" "POST" "/api/hoccr/candidates" "400" \
    '{"name":"Incomplete Candidate"}'

# No cookie → 401 on capacity
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/hoccr/operations/capacity")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: Capacity without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: Capacity without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# No cookie → 401 on sentiment
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/hoccr/culture/sentiment")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: Sentiment without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: Sentiment without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# No cookie → 401 on candidates
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/hoccr/candidates")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: Candidates without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: Candidates without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# No cookie → 401 on intelligence charts
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/hoccr/intelligence/charts")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: Intelligence charts without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: Intelligence charts without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# ---- Cleanup ----

echo ""
echo "--- Cleanup ---"

if [ -n "$CREATED_CANDIDATE_ID" ] && [ "$CREATED_CANDIDATE_ID" != "null" ]; then
    echo "  → Created candidate $CREATED_CANDIDATE_ID — no dedicated DELETE endpoint; manual cleanup may be needed"
fi

# ---- Summary ----

echo ""
echo "=========================================="
echo "Results: $PASS passed, $FAIL failed out of $TOTAL tests"
echo "=========================================="

exit $FAIL
