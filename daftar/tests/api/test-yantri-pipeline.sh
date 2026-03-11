#!/bin/bash
# Daftar API Tests — Yantri Pipeline Module
# Prerequisites: Server running at localhost:3000, valid session cookie
# Assumes seed data from tests/seed/seed-test-data.ts has been run
#
# FIXED (Session B/D): SkillOrchestrator now wired and loading .md skill files.
# FIXED: TypeScript build compiles clean (ignoreBuildErrors removed).

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
echo "  Daftar API Tests — Yantri Pipeline"
echo "=========================================="
echo ""

# ---- Happy Path Tests ----

echo "--- Happy Path ---"

# GET /api/yantri/narrative-trees — list trees
test_endpoint "List narrative trees" "GET" "/api/yantri/narrative-trees" "200"

# Check if we got any trees to work with
FIRST_TREE_ID=$(echo "$body_response" | jq -r '.[0].id // empty')
if [ -n "$FIRST_TREE_ID" ]; then
    echo "  → First tree ID: $FIRST_TREE_ID"
    check_field "[0].id"
    check_field "[0]._count"
    check_field "[0].nodes"
else
    echo "  (No existing narrative trees found in seed data)"
fi

# GET /api/yantri/narrative-trees/[treeId] — get tree with narratives, dossier
if [ -n "$FIRST_TREE_ID" ]; then
    test_endpoint "Get narrative tree by ID" "GET" "/api/yantri/narrative-trees/$FIRST_TREE_ID" "200"
    check_field "id"
fi

# GET /api/yantri/deliverables — list deliverables
test_endpoint "List deliverables" "GET" "/api/yantri/deliverables" "200"

# Check if we got deliverables to work with
FIRST_DELIVERABLE_ID=$(echo "$body_response" | jq -r '.[0].id // (.data[0].id) // empty')
if [ -n "$FIRST_DELIVERABLE_ID" ]; then
    echo "  → First deliverable ID: $FIRST_DELIVERABLE_ID"
fi

# GET /api/yantri/deliverables/[id] — get deliverable with assets
if [ -n "$FIRST_DELIVERABLE_ID" ]; then
    test_endpoint "Get deliverable by ID" "GET" "/api/yantri/deliverables/$FIRST_DELIVERABLE_ID" "200"
    check_field "id"
fi

# PATCH /api/yantri/deliverables/[id] — update status (approve/reject)
if [ -n "$FIRST_DELIVERABLE_ID" ]; then
    test_endpoint "Update deliverable status (approve)" "PATCH" "/api/yantri/deliverables/$FIRST_DELIVERABLE_ID" "200" '{"status":"APPROVED"}'
fi

# GET /api/yantri/narrative-trees?status=ACTIVE — filtered
test_endpoint "List narrative trees (filtered by ACTIVE status)" "GET" "/api/yantri/narrative-trees?status=ACTIVE" "200"

# GET /api/yantri/stats — pipeline stats
test_endpoint "Get Yantri stats" "GET" "/api/yantri/stats" "200"

# GET /api/yantri/narratives — list narratives
test_endpoint "List Yantri narratives" "GET" "/api/yantri/narratives" "200"

# ---- Error / Edge Case Tests ----

echo ""
echo "--- Error / Edge Cases ---"

# GET /api/yantri/narrative-trees?status=INVALID → 400
test_endpoint "List trees with invalid status → 400" "GET" "/api/yantri/narrative-trees?status=INVALID" "400"

# No cookie → 401 on deliverables
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/yantri/deliverables")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: List deliverables without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: List deliverables without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# No cookie → 401 on narratives
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/yantri/narratives")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: List narratives without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: List narratives without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# ---- Summary ----

echo ""
echo "=========================================="
echo "Results: $PASS passed, $FAIL failed out of $TOTAL tests"
echo "=========================================="

exit $FAIL
