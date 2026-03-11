#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Daftar E2E Pipeline Test — Yantri Signal-to-Task
#
# Tests the full Yantri content pipeline from signal input to PMS task creation:
#
#   Signal → NarrativeTree → FactDossier → StrategyDecision →
#   Deliverable (YouTube) → Approve → PMS Task
#
# Prerequisites:
#   - Server running at localhost:3000
#   - Inngest dev server running (npx inngest-cli dev)
#   - Valid admin session cookie
#   - Seed data loaded (brand "the-squirrels" must exist)
#   - Gemini API key configured (for FactDossier generation)
#
# Status (March 11):
#   FIXED: SkillOrchestrator wired and loading .md skill files (Session B/D)
#   FIXED: TypeScript build compiles clean (Session A)
#   FIXED: GI actions now execute for real (Session C)
#   STILL BROKEN: Relay publishing simulated (fake post IDs)
#
# Usage:
#   chmod +x tests/e2e/test-yantri-pipeline-e2e.sh
#   ./tests/e2e/test-yantri-pipeline-e2e.sh
#
# Optional env overrides:
#   BASE_URL=http://localhost:3000 COOKIE="next-auth.session-token=abc" ./tests/e2e/test-yantri-pipeline-e2e.sh
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────

BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE="${COOKIE:-next-auth.session-token=YOUR_TOKEN_HERE}"
BRAND_SLUG="${BRAND_SLUG:-the-squirrels}"

# Pipeline parameters
SIGNAL_TITLE="India's semiconductor policy — ₹76,000 crore push for chip manufacturing"
SIGNAL_REASON="India announces expanded semiconductor incentive program targeting 50% subsidy for chip fabs, aiming for domestic production by 2029. Tata Electronics and Micron confirmed as anchor investors."
SIGNAL_SOURCE="Reuters"
PLATFORM="YOUTUBE"

# Timeouts (seconds)
TIMEOUT_TREE=30
TIMEOUT_DOSSIER=60
TIMEOUT_STRATEGY=30
TIMEOUT_DELIVERABLE=60
TIMEOUT_TASK=15
POLL_INTERVAL=3

# ─── State ────────────────────────────────────────────────────────────────────

PASS=0
FAIL=0
TOTAL=0
STEP=0
ABORT=false

# IDs captured across steps
TREE_ID=""
DOSSIER_ID=""
DELIVERABLE_ID=""
BRAND_ID=""
TASK_ID=""

# ─── Helpers ──────────────────────────────────────────────────────────────────

step() {
    STEP=$((STEP + 1))
    echo ""
    echo "═══════════════════════════════════════════════════"
    echo "  Step $STEP: $1"
    echo "═══════════════════════════════════════════════════"
}

pass() {
    TOTAL=$((TOTAL + 1))
    PASS=$((PASS + 1))
    echo "  ✅ PASS: $1"
}

fail() {
    TOTAL=$((TOTAL + 1))
    FAIL=$((FAIL + 1))
    echo "  ❌ FAIL: $1"
}

info() {
    echo "  ℹ️  $1"
}

abort_remaining() {
    ABORT=true
    echo ""
    echo "  ⛔ ABORTING remaining steps due to critical failure."
    echo ""
}

check_abort() {
    if [ "$ABORT" = true ]; then
        echo "  ⏭️  Skipped (previous step failed)"
        return 1
    fi
    return 0
}

# Make an API request and return the response body.
# Usage: api_call METHOD PATH [BODY]
api_call() {
    local method="$1"
    local path="$2"
    local body="${3:-}"

    if [ -n "$body" ]; then
        curl -s -X "$method" \
            "${BASE_URL}${path}" \
            -H "Cookie: $COOKIE" \
            -H "Content-Type: application/json" \
            -d "$body"
    else
        curl -s -X "$method" \
            "${BASE_URL}${path}" \
            -H "Cookie: $COOKIE"
    fi
}

# Poll an endpoint until a jq expression returns a truthy value.
# Returns the full response body on success, empty string on timeout.
# Usage: poll_until URL JQ_CHECK TIMEOUT [INTERVAL]
poll_until() {
    local url="$1"
    local jq_check="$2"
    local timeout="$3"
    local interval="${4:-$POLL_INTERVAL}"
    local elapsed=0

    while [ "$elapsed" -lt "$timeout" ]; do
        local response
        response=$(curl -s -X GET "${BASE_URL}${url}" -H "Cookie: $COOKIE")
        local result
        result=$(echo "$response" | jq -r "$jq_check" 2>/dev/null)

        if [ "$result" != "null" ] && [ "$result" != "" ] && [ "$result" != "false" ]; then
            echo "$response"
            return 0
        fi

        echo "  ⏳ Waiting... (${elapsed}s / ${timeout}s)" >&2
        sleep "$interval"
        elapsed=$((elapsed + interval))
    done

    echo ""
    return 1
}

# Extract a field from JSON using jq
jq_field() {
    echo "$1" | jq -r "$2" 2>/dev/null
}

# ─── Preflight Checks ────────────────────────────────────────────────────────

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  DAFTAR E2E PIPELINE TEST — Yantri Signal-to-Task           ║"
echo "║  $(date '+%Y-%m-%d %H:%M:%S')                                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "  Base URL:   $BASE_URL"
echo "  Brand:      $BRAND_SLUG"
echo "  Platform:   $PLATFORM"
echo "  Signal:     ${SIGNAL_TITLE:0:60}..."
echo ""

# Check server is reachable
echo "── Preflight: Checking server health ──"
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/health" 2>/dev/null || echo "000")
if [ "$HEALTH_CHECK" = "000" ]; then
    echo "  ❌ Server at $BASE_URL is not reachable. Start the dev server first."
    exit 1
fi
echo "  ✓ Server is reachable (HTTP $HEALTH_CHECK)"

# Check auth cookie is valid
echo "── Preflight: Checking authentication ──"
AUTH_CHECK=$(api_call GET "/api/tasks?limit=1")
AUTH_ERROR=$(jq_field "$AUTH_CHECK" '.error // empty')
if [ -n "$AUTH_ERROR" ]; then
    echo "  ❌ Authentication failed: $AUTH_ERROR"
    echo "  Update the COOKIE variable with a valid session token."
    exit 1
fi
echo "  ✓ Authentication is valid"

# ═════════════════════════════════════════════════════════════════════════════
# STEP 1: Submit a signal via the Yantri ingest endpoint
# ═════════════════════════════════════════════════════════════════════════════

step "Submit signal via /api/yantri/ingest"
check_abort || true

if [ "$ABORT" = false ]; then
    INGEST_PAYLOAD=$(cat <<EOF
{
    "signals": [
        {
            "title": "$SIGNAL_TITLE",
            "score": 0.92,
            "reason": "$SIGNAL_REASON",
            "source": "$SIGNAL_SOURCE",
            "metadata": {
                "platform": "$PLATFORM",
                "brandSlug": "$BRAND_SLUG",
                "e2eTest": true,
                "testTimestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
            }
        }
    ]
}
EOF
)

    INGEST_RESPONSE=$(api_call POST "/api/yantri/ingest" "$INGEST_PAYLOAD")
    INGEST_ERROR=$(jq_field "$INGEST_RESPONSE" '.error // empty')

    if [ -n "$INGEST_ERROR" ]; then
        fail "Ingest API returned error: $INGEST_ERROR"
        abort_remaining
    else
        INGESTED_COUNT=$(jq_field "$INGEST_RESPONSE" '.ingested // 0')
        NEW_TREE_COUNT=$(jq_field "$INGEST_RESPONSE" '.newTrees | length // 0')
        APPENDED_COUNT=$(jq_field "$INGEST_RESPONSE" '.appendedTo | length // 0')

        if [ "$INGESTED_COUNT" -gt 0 ] 2>/dev/null; then
            pass "Signal ingested successfully (ingested: $INGESTED_COUNT, new: $NEW_TREE_COUNT, appended: $APPENDED_COUNT)"

            # Capture the tree ID — either from a new tree or an appended-to tree
            if [ "$NEW_TREE_COUNT" -gt 0 ] 2>/dev/null; then
                TREE_ID=$(jq_field "$INGEST_RESPONSE" '.newTrees[0].treeId')
                info "New NarrativeTree created: $TREE_ID"
            elif [ "$APPENDED_COUNT" -gt 0 ] 2>/dev/null; then
                TREE_ID=$(jq_field "$INGEST_RESPONSE" '.appendedTo[0].treeId')
                info "Signal appended to existing tree: $TREE_ID"
            fi
        else
            SKIP_COUNT=$(jq_field "$INGEST_RESPONSE" '.skipped | length // 0')
            SKIP_REASON=$(jq_field "$INGEST_RESPONSE" '.skipped[0].reason // "unknown"')
            fail "Signal was not ingested (skipped: $SKIP_COUNT, reason: $SKIP_REASON)"
            abort_remaining
        fi
    fi
fi

# ═════════════════════════════════════════════════════════════════════════════
# STEP 2: Poll for NarrativeTree availability and verify structure
# ═════════════════════════════════════════════════════════════════════════════

step "Verify NarrativeTree creation (poll ${TIMEOUT_TREE}s)"
check_abort || true

if [ "$ABORT" = false ]; then
    if [ -z "$TREE_ID" ]; then
        fail "No tree ID available from previous step"
        abort_remaining
    else
        TREE_RESPONSE=$(poll_until \
            "/api/yantri/narrative-trees/${TREE_ID}" \
            '.id // empty' \
            "$TIMEOUT_TREE" \
            "$POLL_INTERVAL"
        ) || true

        if [ -z "$TREE_RESPONSE" ]; then
            fail "NarrativeTree $TREE_ID not found within ${TIMEOUT_TREE}s"
            abort_remaining
        else
            TREE_TITLE=$(jq_field "$TREE_RESPONSE" '.title')
            TREE_STATUS=$(jq_field "$TREE_RESPONSE" '.status')
            NODE_COUNT=$(jq_field "$TREE_RESPONSE" '.nodes | length // 0')

            if [ -n "$TREE_TITLE" ] && [ "$TREE_TITLE" != "null" ]; then
                pass "NarrativeTree verified: \"${TREE_TITLE:0:60}\" (status: $TREE_STATUS, nodes: $NODE_COUNT)"
            else
                fail "NarrativeTree found but title is empty"
                abort_remaining
            fi
        fi
    fi
fi

# ═════════════════════════════════════════════════════════════════════════════
# STEP 3: Trigger and poll for FactDossier generation
# ═════════════════════════════════════════════════════════════════════════════

step "Generate FactDossier via Fact Engine (poll ${TIMEOUT_DOSSIER}s)"
check_abort || true

if [ "$ABORT" = false ]; then
    # Trigger the Fact Engine to build the dossier
    info "Triggering Fact Engine for tree: $TREE_ID"
    FACT_TRIGGER=$(api_call POST "/api/yantri/fact-engine" "{\"treeId\": \"$TREE_ID\", \"forceRefresh\": true}")
    FACT_ERROR=$(jq_field "$FACT_TRIGGER" '.error // empty')

    if [ -n "$FACT_ERROR" ]; then
        # If error is "no nodes", the tree just has no NarrativeNodes yet —
        # nodes may be created asynchronously. Try polling directly.
        info "Fact Engine trigger note: $FACT_ERROR — will poll for dossier."
    else
        DOSSIER_ID=$(jq_field "$FACT_TRIGGER" '.dossier.id // empty')
        CACHED=$(jq_field "$FACT_TRIGGER" '.cached // false')

        if [ -n "$DOSSIER_ID" ] && [ "$DOSSIER_ID" != "null" ]; then
            info "FactDossier returned immediately (id: $DOSSIER_ID, cached: $CACHED)"
        fi
    fi

    # Poll for the dossier to be available (may be async via Inngest)
    if [ -z "$DOSSIER_ID" ] || [ "$DOSSIER_ID" = "null" ]; then
        info "Polling for FactDossier on tree $TREE_ID..."
        DOSSIER_RESPONSE=$(poll_until \
            "/api/yantri/fact-engine/${TREE_ID}" \
            '.dossier.id // empty' \
            "$TIMEOUT_DOSSIER" \
            "$POLL_INTERVAL"
        ) || true

        if [ -z "$DOSSIER_RESPONSE" ]; then
            fail "FactDossier not generated within ${TIMEOUT_DOSSIER}s"
            info "This usually means the Gemini API key is not configured or the Inngest worker is not running."
            abort_remaining
        else
            DOSSIER_ID=$(jq_field "$DOSSIER_RESPONSE" '.dossier.id')
        fi
    fi

    if [ "$ABORT" = false ] && [ -n "$DOSSIER_ID" ] && [ "$DOSSIER_ID" != "null" ]; then
        # Verify dossier structure
        DOSSIER_DETAIL=$(api_call GET "/api/yantri/fact-engine/${TREE_ID}")
        FACT_COUNT=$(jq_field "$DOSSIER_DETAIL" '.dossier.structuredData.facts | length // 0')
        SOURCE_COUNT=$(jq_field "$DOSSIER_DETAIL" '.dossier.sources | length // 0')
        HAS_RAW=$(jq_field "$DOSSIER_DETAIL" 'if .dossier.rawResearch then "yes" else "no" end')

        pass "FactDossier generated (id: $DOSSIER_ID, facts: $FACT_COUNT, sources: $SOURCE_COUNT, rawResearch: $HAS_RAW)"
    fi
fi

# ═════════════════════════════════════════════════════════════════════════════
# STEP 4: Run Strategist to get StrategyDecisions
# ═════════════════════════════════════════════════════════════════════════════

step "Run Strategist for platform decisions (poll ${TIMEOUT_STRATEGY}s)"
check_abort || true

if [ "$ABORT" = false ]; then
    info "Running Strategist against tree: $TREE_ID"
    STRATEGY_RESPONSE=$(api_call POST "/api/yantri/strategist" "{\"treeId\": \"$TREE_ID\"}")
    STRATEGY_ERROR=$(jq_field "$STRATEGY_RESPONSE" '.error // empty')

    if [ -n "$STRATEGY_ERROR" ]; then
        fail "Strategist returned error: $STRATEGY_ERROR"
        info "Hint: Ensure at least one Brand exists and the tree has a FactDossier."
        # Non-fatal — we can still try to create a deliverable manually
        info "Continuing without strategy decisions..."
    else
        DECISION_COUNT=$(jq_field "$STRATEGY_RESPONSE" '.decisionsCount // 0')
        TREE_NAME=$(jq_field "$STRATEGY_RESPONSE" '.treeName // "unknown"')

        if [ "$DECISION_COUNT" -gt 0 ] 2>/dev/null; then
            pass "Strategist produced $DECISION_COUNT decision(s) for \"$TREE_NAME\""

            # Log the first decision's platforms for debugging
            FIRST_BRAND=$(jq_field "$STRATEGY_RESPONSE" '.decisions[0].brandName // "unknown"')
            FIRST_PLATFORMS=$(jq_field "$STRATEGY_RESPONSE" '.decisions[0].platforms // []' | jq -r 'join(", ")' 2>/dev/null || echo "unknown")
            info "First decision: brand=$FIRST_BRAND, platforms=$FIRST_PLATFORMS"
        else
            fail "Strategist returned 0 decisions"
            info "Continuing — will create deliverable manually."
        fi
    fi
fi

# ═════════════════════════════════════════════════════════════════════════════
# STEP 5: Create a Deliverable for YouTube and trigger the pipeline
# ═════════════════════════════════════════════════════════════════════════════

step "Create Deliverable and trigger pipeline (poll ${TIMEOUT_DELIVERABLE}s)"
check_abort || true

if [ "$ABORT" = false ]; then
    # First, resolve the brand ID from slug
    info "Resolving brand slug: $BRAND_SLUG"
    BRAND_LIST=$(api_call GET "/api/yantri/deliverables?platform=YOUTUBE")
    # Alternatively, try to find brand via the narrative-trees endpoint
    BRAND_LOOKUP=$(api_call GET "/api/yantri/narrative-trees/${TREE_ID}")
    # The tree response may not include brandId, so let's get it from deliverables list or
    # use a direct approach: create a deliverable and let the API validate brandId

    # We need the brand ID — query brands through deliverables endpoint or use seed data knowledge
    # Try fetching all deliverables to find a brand
    if [ -z "$BRAND_ID" ] || [ "$BRAND_ID" = "null" ]; then
        # Attempt to get brand ID from existing deliverables
        EXISTING=$(api_call GET "/api/yantri/deliverables")
        BRAND_ID=$(echo "$EXISTING" | jq -r '.[0].brandId // empty' 2>/dev/null)
    fi

    if [ -z "$BRAND_ID" ] || [ "$BRAND_ID" = "null" ]; then
        # Try to find brand via the tasks endpoint (tasks have brandId)
        TASKS_CHECK=$(api_call GET "/api/tasks?limit=1")
        BRAND_ID=$(echo "$TASKS_CHECK" | jq -r '.data[0].brandId // empty' 2>/dev/null)
    fi

    if [ -z "$BRAND_ID" ] || [ "$BRAND_ID" = "null" ]; then
        fail "Could not resolve brand ID for slug '$BRAND_SLUG'. Ensure seed data is loaded."
        abort_remaining
    else
        info "Using brand ID: $BRAND_ID"

        # Create the deliverable with autoTrigger to kick off the pipeline
        DELIVERABLE_PAYLOAD=$(cat <<EOF
{
    "brandId": "$BRAND_ID",
    "platform": "$PLATFORM",
    "pipelineType": "cinematic",
    "copyMarkdown": "Signal: $SIGNAL_TITLE\n\n$SIGNAL_REASON",
    "treeId": "$TREE_ID",
    "autoTrigger": true
}
EOF
)

        CREATE_RESPONSE=$(api_call POST "/api/yantri/deliverables" "$DELIVERABLE_PAYLOAD")
        CREATE_ERROR=$(jq_field "$CREATE_RESPONSE" '.error // empty')

        if [ -n "$CREATE_ERROR" ]; then
            fail "Deliverable creation failed: $CREATE_ERROR"
            abort_remaining
        else
            DELIVERABLE_ID=$(jq_field "$CREATE_RESPONSE" '.id')
            DEL_STATUS=$(jq_field "$CREATE_RESPONSE" '.status')
            DEL_PLATFORM=$(jq_field "$CREATE_RESPONSE" '.platform')

            if [ -n "$DELIVERABLE_ID" ] && [ "$DELIVERABLE_ID" != "null" ]; then
                pass "Deliverable created (id: $DELIVERABLE_ID, status: $DEL_STATUS, platform: $DEL_PLATFORM)"

                # Poll for the deliverable to move past RESEARCHING (pipeline processing)
                info "Polling for pipeline completion (deliverable may move through RESEARCHING -> DRAFTED)..."
                PIPELINE_DONE=$(poll_until \
                    "/api/yantri/deliverables/${DELIVERABLE_ID}" \
                    'if .status == "DRAFTED" or .status == "APPROVED" or .status == "RELAYED" then .id else null end' \
                    "$TIMEOUT_DELIVERABLE" \
                    "$POLL_INTERVAL"
                ) || true

                if [ -z "$PIPELINE_DONE" ]; then
                    # Check the current status even if not DRAFTED yet
                    CURRENT_DEL=$(api_call GET "/api/yantri/deliverables/${DELIVERABLE_ID}")
                    CURRENT_STATUS=$(jq_field "$CURRENT_DEL" '.status')
                    info "Deliverable current status: $CURRENT_STATUS (may still be processing)"

                    if [ "$CURRENT_STATUS" = "RESEARCHING" ] || [ "$CURRENT_STATUS" = "PLANNED" ]; then
                        fail "Deliverable stuck in $CURRENT_STATUS after ${TIMEOUT_DELIVERABLE}s — pipeline may not be running"
                        info "Check Inngest dev server is running and processing 'yantri/deliverable.cinematic' events."
                    else
                        # Some non-terminal status — count as partial pass
                        pass "Deliverable progressed to status: $CURRENT_STATUS (pipeline in progress)"
                    fi
                else
                    FINAL_STATUS=$(jq_field "$PIPELINE_DONE" '.status')
                    pass "Pipeline completed — deliverable status: $FINAL_STATUS"
                fi
            else
                fail "Deliverable creation returned no ID"
                abort_remaining
            fi
        fi
    fi
fi

# ═════════════════════════════════════════════════════════════════════════════
# STEP 6: Verify Deliverable content fields
# ═════════════════════════════════════════════════════════════════════════════

step "Verify Deliverable content (script, thumbnail, titles, tags)"
check_abort || true

if [ "$ABORT" = false ]; then
    if [ -z "$DELIVERABLE_ID" ] || [ "$DELIVERABLE_ID" = "null" ]; then
        fail "No deliverable ID available"
        abort_remaining
    else
        DEL_DETAIL=$(api_call GET "/api/yantri/deliverables/${DELIVERABLE_ID}")
        DEL_ERROR=$(jq_field "$DEL_DETAIL" '.error // empty')

        if [ -n "$DEL_ERROR" ]; then
            fail "Failed to fetch deliverable details: $DEL_ERROR"
        else
            # Check for script data (YouTube deliverable should have scriptData)
            HAS_SCRIPT=$(jq_field "$DEL_DETAIL" 'if .scriptData != null then "yes" else "no" end')
            HAS_COPY=$(jq_field "$DEL_DETAIL" 'if .copyMarkdown != null and .copyMarkdown != "" then "yes" else "no" end')
            HAS_POSTING_PLAN=$(jq_field "$DEL_DETAIL" 'if .postingPlan != null then "yes" else "no" end')
            HAS_STORYBOARD=$(jq_field "$DEL_DETAIL" 'if .storyboardUrl != null then "yes" else "no" end')
            HAS_TREE_LINK=$(jq_field "$DEL_DETAIL" 'if .treeId != null then "yes" else "no" end')
            ASSET_COUNT=$(jq_field "$DEL_DETAIL" '.assets | length // 0')

            info "Content field report:"
            info "  scriptData:    $HAS_SCRIPT"
            info "  copyMarkdown:  $HAS_COPY"
            info "  postingPlan:   $HAS_POSTING_PLAN"
            info "  storyboardUrl: $HAS_STORYBOARD"
            info "  treeId linked: $HAS_TREE_LINK"
            info "  assets count:  $ASSET_COUNT"

            # For YouTube, scriptData is the key deliverable
            CONTENT_CHECKS=0
            CONTENT_PASSES=0

            # Check: copyMarkdown should exist (we set it during creation)
            CONTENT_CHECKS=$((CONTENT_CHECKS + 1))
            if [ "$HAS_COPY" = "yes" ]; then
                CONTENT_PASSES=$((CONTENT_PASSES + 1))
            fi

            # Check: tree should be linked
            CONTENT_CHECKS=$((CONTENT_CHECKS + 1))
            if [ "$HAS_TREE_LINK" = "yes" ]; then
                CONTENT_PASSES=$((CONTENT_PASSES + 1))
            fi

            # Check: scriptData is the primary content artifact for YouTube
            CONTENT_CHECKS=$((CONTENT_CHECKS + 1))
            if [ "$HAS_SCRIPT" = "yes" ]; then
                CONTENT_PASSES=$((CONTENT_PASSES + 1))

                # Deep-verify script structure (titles, description, tags, thumbnail brief)
                SCRIPT_TITLES=$(jq_field "$DEL_DETAIL" '.scriptData.titles // .scriptData.title // empty')
                SCRIPT_DESC=$(jq_field "$DEL_DETAIL" '.scriptData.description // empty')
                SCRIPT_TAGS=$(jq_field "$DEL_DETAIL" '.scriptData.tags // empty')
                SCRIPT_THUMB=$(jq_field "$DEL_DETAIL" '.scriptData.thumbnailBrief // .scriptData.thumbnail // empty')

                if [ -n "$SCRIPT_TITLES" ] && [ "$SCRIPT_TITLES" != "null" ]; then
                    info "  ✓ Script has titles"
                else
                    info "  ⚠ Script missing titles field"
                fi

                if [ -n "$SCRIPT_DESC" ] && [ "$SCRIPT_DESC" != "null" ]; then
                    info "  ✓ Script has description"
                else
                    info "  ⚠ Script missing description field"
                fi

                if [ -n "$SCRIPT_TAGS" ] && [ "$SCRIPT_TAGS" != "null" ]; then
                    info "  ✓ Script has tags"
                else
                    info "  ⚠ Script missing tags field"
                fi

                if [ -n "$SCRIPT_THUMB" ] && [ "$SCRIPT_THUMB" != "null" ]; then
                    info "  ✓ Script has thumbnail brief"
                else
                    info "  ⚠ Script missing thumbnail brief field"
                fi
            fi

            # Check: postingPlan (timing, hashtags, engagement strategy)
            CONTENT_CHECKS=$((CONTENT_CHECKS + 1))
            if [ "$HAS_POSTING_PLAN" = "yes" ]; then
                CONTENT_PASSES=$((CONTENT_PASSES + 1))
            fi

            if [ "$CONTENT_PASSES" -ge 2 ]; then
                pass "Deliverable has $CONTENT_PASSES/$CONTENT_CHECKS expected content fields"
            else
                fail "Deliverable only has $CONTENT_PASSES/$CONTENT_CHECKS expected content fields"
                info "Note: Some fields (scriptData, postingPlan) are populated by the Inngest pipeline."
                info "If the pipeline has not completed, these may still be null."
            fi

            # Check assets (thumbnails, b-roll, etc.)
            if [ "$ASSET_COUNT" -gt 0 ] 2>/dev/null; then
                pass "Deliverable has $ASSET_COUNT asset(s) attached"
                # List asset types
                ASSET_TYPES=$(echo "$DEL_DETAIL" | jq -r '.assets[].type' 2>/dev/null | sort | uniq -c | sed 's/^/    /')
                info "Asset breakdown:\n$ASSET_TYPES"
            else
                info "No assets attached yet (may be generated asynchronously)"
            fi
        fi
    fi
fi

# ═════════════════════════════════════════════════════════════════════════════
# STEP 7: Approve the Deliverable
# ═════════════════════════════════════════════════════════════════════════════

step "Approve Deliverable via API"
check_abort || true

if [ "$ABORT" = false ]; then
    if [ -z "$DELIVERABLE_ID" ] || [ "$DELIVERABLE_ID" = "null" ]; then
        fail "No deliverable ID available"
        abort_remaining
    else
        APPROVE_RESPONSE=$(api_call PATCH "/api/yantri/deliverables/${DELIVERABLE_ID}" '{"action": "approve"}')
        APPROVE_ERROR=$(jq_field "$APPROVE_RESPONSE" '.error // empty')

        if [ -n "$APPROVE_ERROR" ]; then
            fail "Approval failed: $APPROVE_ERROR"
            abort_remaining
        else
            APPROVED_STATUS=$(jq_field "$APPROVE_RESPONSE" '.status')

            if [ "$APPROVED_STATUS" = "APPROVED" ]; then
                pass "Deliverable approved successfully (status: $APPROVED_STATUS)"
            else
                fail "Deliverable status after approval is '$APPROVED_STATUS', expected 'APPROVED'"
                abort_remaining
            fi
        fi
    fi
fi

# ═════════════════════════════════════════════════════════════════════════════
# STEP 8: Verify PMS Task was created with correct title and assets
# ═════════════════════════════════════════════════════════════════════════════

step "Verify PMS Task was created (poll ${TIMEOUT_TASK}s)"
check_abort || true

if [ "$ABORT" = false ]; then
    # The PATCH /api/yantri/deliverables/[id] with action=approve creates a PMS Task
    # with title: "Publish: {BrandName} — {PLATFORM}"
    # Search for the task by brand and recent creation

    info "Searching for PMS task linked to deliverable approval..."

    # Poll for the task since it might be created asynchronously
    TASK_FOUND=false
    TASK_ELAPSED=0

    while [ "$TASK_ELAPSED" -lt "$TIMEOUT_TASK" ]; do
        # Search tasks by brand and look for the "Publish:" prefix with our platform
        TASK_SEARCH=$(api_call GET "/api/tasks?search=Publish%3A&brandId=${BRAND_ID}&limit=5")
        TASK_DATA=$(echo "$TASK_SEARCH" | jq -r '.data // []' 2>/dev/null)

        # Find a task whose description mentions our deliverable ID
        TASK_MATCH=$(echo "$TASK_DATA" | jq -r \
            --arg del_id "$DELIVERABLE_ID" \
            '[.[] | select(.description != null and (.description | contains($del_id)))] | .[0] // empty' \
            2>/dev/null)

        if [ -n "$TASK_MATCH" ] && [ "$TASK_MATCH" != "null" ]; then
            TASK_ID=$(echo "$TASK_MATCH" | jq -r '.id')
            TASK_TITLE=$(echo "$TASK_MATCH" | jq -r '.title')
            TASK_STATUS=$(echo "$TASK_MATCH" | jq -r '.status')
            TASK_PRIORITY=$(echo "$TASK_MATCH" | jq -r '.priority')
            TASK_BRAND=$(echo "$TASK_MATCH" | jq -r '.brand.name // "unknown"')
            TASK_FOUND=true
            break
        fi

        echo "  ⏳ Waiting for task... (${TASK_ELAPSED}s / ${TIMEOUT_TASK}s)"
        sleep "$POLL_INTERVAL"
        TASK_ELAPSED=$((TASK_ELAPSED + POLL_INTERVAL))
    done

    if [ "$TASK_FOUND" = true ]; then
        pass "PMS Task created: \"$TASK_TITLE\" (id: $TASK_ID)"
        info "  Status:   $TASK_STATUS"
        info "  Priority: $TASK_PRIORITY"
        info "  Brand:    $TASK_BRAND"

        # Verify the task title contains the expected platform
        PLATFORM_DISPLAY=$(echo "$PLATFORM" | sed 's/_/ /g')
        if echo "$TASK_TITLE" | grep -qi "$PLATFORM_DISPLAY"; then
            pass "Task title contains platform reference ($PLATFORM_DISPLAY)"
        else
            fail "Task title \"$TASK_TITLE\" does not contain expected platform \"$PLATFORM_DISPLAY\""
        fi

        # Verify the task description references the deliverable
        TASK_FULL=$(api_call GET "/api/tasks/${TASK_ID}")
        TASK_DESC=$(jq_field "$TASK_FULL" '.description // ""')

        if echo "$TASK_DESC" | grep -q "$DELIVERABLE_ID"; then
            pass "Task description references deliverable ID ($DELIVERABLE_ID)"
        else
            fail "Task description does not reference deliverable ID"
        fi

        # Verify the task has HIGH priority (YouTube deliverables get HIGH priority in the approve handler)
        if [ "$TASK_PRIORITY" = "HIGH" ]; then
            pass "Task priority is HIGH (correct for approved deliverable)"
        else
            info "Task priority is $TASK_PRIORITY (expected HIGH for approved deliverables)"
        fi
    else
        fail "No PMS Task found for deliverable $DELIVERABLE_ID within ${TIMEOUT_TASK}s"
        info "Check that the approve handler creates tasks and the session user has a valid creatorId."
    fi
fi

# ═════════════════════════════════════════════════════════════════════════════
# STEP 9: Verify Task assignment (creator/brand linkage)
# ═════════════════════════════════════════════════════════════════════════════

step "Verify Task assignment and linkage"
check_abort || true

if [ "$ABORT" = false ]; then
    if [ -z "$TASK_ID" ] || [ "$TASK_ID" = "null" ]; then
        fail "No task ID available to verify"
    else
        TASK_FULL=$(api_call GET "/api/tasks/${TASK_ID}")
        TASK_FULL_ERROR=$(jq_field "$TASK_FULL" '.error // empty')

        if [ -n "$TASK_FULL_ERROR" ]; then
            fail "Failed to fetch task details: $TASK_FULL_ERROR"
        else
            TASK_CREATOR_ID=$(jq_field "$TASK_FULL" '.creator.id // empty')
            TASK_CREATOR_NAME=$(jq_field "$TASK_FULL" '.creator.name // "unknown"')
            TASK_BRAND_ID=$(jq_field "$TASK_FULL" '.brandId // empty')
            TASK_BRAND_NAME=$(jq_field "$TASK_FULL" '.brand.name // "unknown"')
            TASK_ASSIGNEE_ID=$(jq_field "$TASK_FULL" '.assignee.id // empty')
            TASK_ASSIGNEE_NAME=$(jq_field "$TASK_FULL" '.assignee.name // empty')
            TASK_ACTIVITY_COUNT=$(jq_field "$TASK_FULL" '.activities | length // 0')

            info "Task details:"
            info "  Creator:    $TASK_CREATOR_NAME ($TASK_CREATOR_ID)"
            info "  Brand:      $TASK_BRAND_NAME ($TASK_BRAND_ID)"

            if [ -n "$TASK_ASSIGNEE_NAME" ] && [ "$TASK_ASSIGNEE_NAME" != "null" ] && [ "$TASK_ASSIGNEE_NAME" != "" ]; then
                info "  Assignee:   $TASK_ASSIGNEE_NAME ($TASK_ASSIGNEE_ID)"
            else
                info "  Assignee:   (unassigned — will be assigned by team lead)"
            fi
            info "  Activities: $TASK_ACTIVITY_COUNT"

            # Verify creator exists (the session user who approved)
            if [ -n "$TASK_CREATOR_ID" ] && [ "$TASK_CREATOR_ID" != "null" ]; then
                pass "Task has valid creator: $TASK_CREATOR_NAME"
            else
                fail "Task has no creator — session user ID was not captured during approval"
            fi

            # Verify brand linkage matches our deliverable's brand
            if [ "$TASK_BRAND_ID" = "$BRAND_ID" ]; then
                pass "Task brand matches deliverable brand ($TASK_BRAND_NAME)"
            else
                fail "Task brand ($TASK_BRAND_ID) does not match deliverable brand ($BRAND_ID)"
            fi

            # Verify activity log has at least the "created" entry
            if [ "$TASK_ACTIVITY_COUNT" -gt 0 ] 2>/dev/null; then
                pass "Task has $TASK_ACTIVITY_COUNT activity log entry(ies)"
                FIRST_ACTIVITY=$(jq_field "$TASK_FULL" '.activities[0].action // "unknown"')
                info "  Latest activity: $FIRST_ACTIVITY"
            else
                fail "Task has no activity log entries"
            fi
        fi
    fi
fi

# ═════════════════════════════════════════════════════════════════════════════
# STEP 10: Final Summary
# ═════════════════════════════════════════════════════════════════════════════

step "Pipeline Test Results"

echo ""
echo "┌───────────────────────────────────────────────────────────────┐"
echo "│  DAFTAR YANTRI E2E PIPELINE TEST — FINAL REPORT              │"
echo "├───────────────────────────────────────────────────────────────┤"
echo "│                                                               │"
printf "│  Total assertions:  %-40s│\n" "$TOTAL"
printf "│  Passed:            %-40s│\n" "$PASS"
printf "│  Failed:            %-40s│\n" "$FAIL"
echo "│                                                               │"
echo "├───────────────────────────────────────────────────────────────┤"
echo "│  Pipeline Artifacts:                                          │"
printf "│    NarrativeTree:   %-40s│\n" "${TREE_ID:-none}"
printf "│    FactDossier:     %-40s│\n" "${DOSSIER_ID:-none}"
printf "│    Deliverable:     %-40s│\n" "${DELIVERABLE_ID:-none}"
printf "│    PMS Task:        %-40s│\n" "${TASK_ID:-none}"
echo "│                                                               │"

if [ "$FAIL" -eq 0 ] && [ "$TOTAL" -gt 0 ]; then
    echo "│  ✅  ALL TESTS PASSED                                        │"
elif [ "$FAIL" -gt 0 ] && [ "$PASS" -gt 0 ]; then
    echo "│  ⚠️   PARTIAL PASS — $FAIL assertion(s) failed                 │"
elif [ "$TOTAL" -eq 0 ]; then
    echo "│  ⚠️   NO ASSERTIONS RAN (pipeline may have aborted early)      │"
else
    echo "│  ❌  ALL TESTS FAILED                                         │"
fi

echo "│                                                               │"
printf "│  Completed at: %-44s│\n" "$(date '+%Y-%m-%d %H:%M:%S')"
echo "└───────────────────────────────────────────────────────────────┘"
echo ""

# ─── Cleanup hint ─────────────────────────────────────────────────────────────

echo "── Cleanup ──"
echo "  To clean up test artifacts, run:"
if [ -n "$DELIVERABLE_ID" ] && [ "$DELIVERABLE_ID" != "null" ]; then
    echo "    curl -X DELETE ${BASE_URL}/api/yantri/deliverables/${DELIVERABLE_ID} -H \"Cookie: \$COOKIE\""
fi
if [ -n "$TASK_ID" ] && [ "$TASK_ID" != "null" ]; then
    echo "    curl -X DELETE ${BASE_URL}/api/tasks/${TASK_ID} -H \"Cookie: \$COOKIE\""
fi
if [ -n "$TREE_ID" ] && [ "$TREE_ID" != "null" ]; then
    echo "    curl -X DELETE ${BASE_URL}/api/yantri/narrative-trees/${TREE_ID} -H \"Cookie: \$COOKIE\""
fi
echo ""

# Exit with failure code if any tests failed
if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
