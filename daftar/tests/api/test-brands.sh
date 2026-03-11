#!/bin/bash
# Daftar API Tests — Brands Module
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
echo "  Daftar API Tests — Brands Module"
echo "=========================================="
echo ""

# ---- Setup: get a clientId for brand creation ----

echo "--- Setup ---"

# Fetch clients to get a valid clientId
setup_response=$(curl -s -X GET "$BASE_URL/api/clients" -H "Cookie: $COOKIE")
CLIENT_ID=$(echo "$setup_response" | jq -r '.[0].id // empty')

if [ -z "$CLIENT_ID" ]; then
    # Try paginated response shape
    CLIENT_ID=$(echo "$setup_response" | jq -r '.data[0].id // empty')
fi

if [ -z "$CLIENT_ID" ]; then
    echo "  ⚠ No client found in seed data. Brand creation tests will use a placeholder."
    CLIENT_ID="placeholder-client-id"
fi
echo "  → Using client ID: $CLIENT_ID"

# ---- Happy Path Tests ----

echo ""
echo "--- Happy Path ---"

# GET /api/brands — list (role-scoped)
test_endpoint "List brands" "GET" "/api/brands" "200"
check_field "[0].id"
check_field "[0].name"
check_field "[0].client"
check_field "[0].platforms"

# Capture first brand's ID for subsequent tests
FIRST_BRAND_ID=$(echo "$body_response" | jq -r '.[0].id')
echo "  → First brand ID: $FIRST_BRAND_ID"

# POST /api/brands — create (ADMIN only, needs name, slug, clientId)
TIMESTAMP=$(date +%s)
BRAND_SLUG="test-brand-${TIMESTAMP}"
CREATE_BODY="{\"name\":\"Test Brand ${TIMESTAMP}\",\"slug\":\"${BRAND_SLUG}\",\"clientId\":\"${CLIENT_ID}\"}"
test_endpoint "Create brand (ADMIN)" "POST" "/api/brands" "201" "$CREATE_BODY"
check_field "id"
check_field "name"
check_field "slug"
check_field "clientId"

# Store created brand ID for cleanup
CREATED_BRAND_ID=$(echo "$body_response" | jq -r '.id')
echo "  → Created brand ID: $CREATED_BRAND_ID"

# GET /api/brands/[id] — get brand platforms by ID
# Note: The route is /api/brands/[id]/platforms based on actual file structure
if [ -n "$FIRST_BRAND_ID" ] && [ "$FIRST_BRAND_ID" != "null" ]; then
    test_endpoint "Get brand platforms by ID" "GET" "/api/brands/$FIRST_BRAND_ID/platforms" "200"
fi

# ---- Error / Edge Case Tests ----

echo ""
echo "--- Error / Edge Cases ---"

# POST /api/brands — duplicate slug → 400 (or Prisma unique constraint error)
test_endpoint "Create brand duplicate slug → 400/500" "POST" "/api/brands" "400" "$CREATE_BODY"
# Note: If Prisma throws on unique constraint, status might be 500; adjust expected status if needed

# POST /api/brands — missing required fields → 400
test_endpoint "Create brand missing fields → 400" "POST" "/api/brands" "400" '{"name":"Incomplete Brand"}'

# No cookie → 401
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/brands")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: List brands without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: List brands without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# ---- Cleanup ----

echo ""
echo "--- Cleanup ---"

if [ -n "$CREATED_BRAND_ID" ] && [ "$CREATED_BRAND_ID" != "null" ]; then
    echo "  → Cleaning up created brand: $CREATED_BRAND_ID"
    # No direct brand DELETE endpoint exists; attempt it anyway
    cleanup_response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/brands/$CREATED_BRAND_ID" \
        -H "Cookie: $COOKIE")
    cleanup_status=$(echo "$cleanup_response" | tail -1)
    if [ "$cleanup_status" = "200" ] || [ "$cleanup_status" = "204" ]; then
        echo "  ✓ Brand cleaned up successfully"
    else
        echo "  ⚠ Could not auto-delete brand $CREATED_BRAND_ID (HTTP $cleanup_status) — manual cleanup may be needed"
    fi
fi

# ---- Summary ----

echo ""
echo "=========================================="
echo "Results: $PASS passed, $FAIL failed out of $TOTAL tests"
echo "=========================================="

exit $FAIL
