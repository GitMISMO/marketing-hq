#!/usr/bin/env bash
# Runs MISMO Media's browser tests against a fresh build. Needs python3, node and Playwright's Chromium.
#   bash dev/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")"
# The sample records are MISMO's own planning data, so they live in the PRIVATE repo
# (marketing-hq-data/dev/sample-data.html), not here. Copy that file next to this script to run the tests.
if [ ! -f sample-data.html ]; then echo "Skipped: put sample-data.html (from marketing-hq-data/dev/) next to run.sh to run the browser tests."; exit 0; fi
python3 ../build.py >/dev/null
cat sample-data.html ../out/plain.html > preview.html                 # sample records, no saving
python3 mkmerge.py ../shim.html merge.html                            # the relay door's merge rules, for the stand-in
cat sample-data.html merge.html mockdb.html ../out/plain.html > live.html   # sample records + a stand-in for the save relay
fail=0
out=$(node fulltest.js 2>&1); echo "$out" | tail -3; echo "$out" | grep -q "ALL TABS CLEAN" || fail=1
out=$(node interact.js 2>&1); echo "$out" | grep -c "^PASS" | sed 's/$/ interaction checks passed/'; if echo "$out" | grep -q "^FAIL"; then echo "$out" | grep "^FAIL"; fail=1; fi
out=$(node save.js 2>&1); echo "$out"; if echo "$out" | grep -q '": false'; then fail=1; fi; echo "$out" | grep -q "errors \[\]" || fail=1
exit $fail
