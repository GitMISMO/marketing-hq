#!/usr/bin/env bash
# Runs MISMO Media's browser tests against a fresh build. Needs python3, node and Playwright's Chromium.
#   bash dev/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")"
# Test records: MISMO's real sample (sample-data.html, kept in the PRIVATE repo marketing-hq-data/dev/) when it
# is next to this script; otherwise fixture.html, the same records with every name, note, link and picture
# made up, so the tests run on every change. Rebuild it with make-fixture.py if the real sample changes shape.
if [ -f sample-data.html ]; then DATA=sample-data.html; echo "Using the private sample records"; else DATA=fixture.html; echo "Using the made-up test records"; fi
python3 ../build.py >/dev/null
cat "$DATA" ../out/plain.html > preview.html                          # sample records, no saving
python3 mkmerge.py ../shim.html merge.html                            # the relay door's merge rules, for the stand-in
cat "$DATA" merge.html mockdb.html ../out/plain.html > live.html      # sample records + a stand-in for the save relay
fail=0
out=$(node fulltest.js 2>&1); echo "$out" | tail -3; echo "$out" | grep -q "ALL TABS CLEAN" || fail=1
out=$(node interact.js 2>&1); echo "$out" | grep -c "^PASS" | sed 's/$/ interaction checks passed/'; if echo "$out" | grep -q "^FAIL"; then echo "$out" | grep "^FAIL"; fail=1; fi
out=$(node save.js 2>&1); echo "$out"; if echo "$out" | grep -q '": false'; then fail=1; fi; echo "$out" | grep -q "errors \[\]" || fail=1
out=$(node unsub.js 2>&1); echo "$out"; echo "$out" | grep -q '"ok":true' || fail=1
out=$(node remind.js 2>&1); echo "$out"; echo "$out" | grep -q '"ok":true' || fail=1
out=$(node sponsors.js 2>&1); echo "$out"; echo "$out" | grep -q '"ok":true' || fail=1
out=$(node downloads.js 2>&1); echo "$out"; echo "$out" | grep -q '"ok":true' || fail=1
out=$(node lilink.js 2>&1); echo "$out"; echo "$out" | grep -q '"ok":true' || fail=1
out=$(node txupload.js 2>&1); echo "$out"; echo "$out" | grep -q '"ok":true' || fail=1
exit $fail
