#!/bin/bash
# Daftar API Tests — Tasks (PMS) Module
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
echo "  Daftar API Tests — Tasks (PMS) Module"
echo "=========================================="
echo ""

# ---- Happy Path Tests ----

echo "--- Happy Path ---"

# GET /api/tasks — list tasks (paginated)
test_endpoint "List tasks" "GET" "/api/tasks" "200"
check_field "data"
check_field "total"
check_field "page"
check_field "limit"

# GET /api/tasks — with status filter
test_endpoint "List tasks filtered by status" "GET" "/api/tasks?status=IN_PROGRESS" "200"
check_field "data"

# POST /api/tasks — create (title required, creatorId auto-set from session)
TIMESTAMP=$(date +%s)
CREATE_BODY="{\"title\":\"Test Task ${TIMESTAMP}\",\"description\":\"API test task\",\"priority\":\"MEDIUM\"}"
test_endpoint "Create task" "POST" "/api/tasks" "201" "$CREATE_BODY"
check_field "id"
check_field "title"
check_field "status"
check_field "priority"
check_field "creator"

# Store created task ID for subsequent tests and cleanup
CREATED_TASK_ID=$(echo "$body_response" | jq -r '.id')
echo "  → Created task ID: $CREATED_TASK_ID"

# GET /api/tasks/[id] — get by ID with comments, activities
if [ -n "$CREATED_TASK_ID" ] && [ "$CREATED_TASK_ID" != "null" ]; then
    test_endpoint "Get task by ID" "GET" "/api/tasks/$CREATED_TASK_ID" "200"
    check_field "id"
    check_field "title"
    check_field "comments"
    check_field "activities"
    check_field "creator"
    check_field "tags"
fi

# PATCH /api/tasks/[id] — update priority
if [ -n "$CREATED_TASK_ID" ] && [ "$CREATED_TASK_ID" != "null" ]; then
    test_endpoint "Update task priority" "PATCH" "/api/tasks/$CREATED_TASK_ID" "200" '{"priority":"HIGH"}'
    check_field "priority"
fi

# PATCH /api/tasks/[id]/status — update status (CREATED → ASSIGNED requires assigneeId first)
# Task is in CREATED status; valid transition is CREATED → ASSIGNED or CREATED → CANCELLED
if [ -n "$CREATED_TASK_ID" ] && [ "$CREATED_TASK_ID" != "null" ]; then
    test_endpoint "Update task status (CREATED → CANCELLED)" "PATCH" "/api/tasks/$CREATED_TASK_ID/status" "200" '{"status":"CANCELLED"}'
    check_field "status"
fi

# Transition back: CANCELLED → CREATED
if [ -n "$CREATED_TASK_ID" ] && [ "$CREATED_TASK_ID" != "null" ]; then
    test_endpoint "Update task status (CANCELLED → CREATED)" "PATCH" "/api/tasks/$CREATED_TASK_ID/status" "200" '{"status":"CREATED"}'
fi

# GET /api/tasks — with multiple filters
test_endpoint "List tasks with multiple filters" "GET" "/api/tasks?status=CREATED&priority=MEDIUM" "200"
check_field "data"

# ---- Error / Edge Case Tests ----

echo ""
echo "--- Error / Edge Cases ---"

# POST /api/tasks — missing title → 400
test_endpoint "Create task missing title → 400" "POST" "/api/tasks" "400" '{"description":"No title provided"}'

# GET /api/tasks/invalid-id → 404
test_endpoint "Get task with invalid ID → 404" "GET" "/api/tasks/nonexistent-id-12345" "404"

# PATCH /api/tasks/[id]/status — invalid transition → 400
if [ -n "$CREATED_TASK_ID" ] && [ "$CREATED_TASK_ID" != "null" ]; then
    test_endpoint "Invalid status transition → 400" "PATCH" "/api/tasks/$CREATED_TASK_ID/status" "400" '{"status":"DONE"}'
fi

# PATCH /api/tasks/[id]/status — missing status field → 400
if [ -n "$CREATED_TASK_ID" ] && [ "$CREATED_TASK_ID" != "null" ]; then
    test_endpoint "Status update missing status → 400" "PATCH" "/api/tasks/$CREATED_TASK_ID/status" "400" '{}'
fi

# No cookie → 401
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/tasks")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: List tasks without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: List tasks without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# POST without auth → 401
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/tasks" \
    -H "Content-Type: application/json" \
    -d '{"title":"Unauthorized Task"}')
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: Create task without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: Create task without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# ---- Cleanup ----

echo ""
echo "--- Cleanup ---"

if [ -n "$CREATED_TASK_ID" ] && [ "$CREATED_TASK_ID" != "null" ]; then
    echo "  → Cleaning up created task: $CREATED_TASK_ID"
    cleanup_response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/tasks/$CREATED_TASK_ID" \
        -H "Cookie: $COOKIE")
    cleanup_status=$(echo "$cleanup_response" | tail -1)
    if [ "$cleanup_status" = "200" ] || [ "$cleanup_status" = "204" ]; then
        echo "  ✓ Task cleaned up successfully"
    else
        echo "  ⚠ Could not auto-delete task $CREATED_TASK_ID (HTTP $cleanup_status) — manual cleanup may be needed"
    fi
fi

# ---- Summary ----

echo ""
echo "=========================================="
echo "Results: $PASS passed, $FAIL failed out of $TOTAL tests"
echo "=========================================="

exit $FAIL
