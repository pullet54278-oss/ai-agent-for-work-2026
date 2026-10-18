#!/bin/sh
# สร้าง src/data/who-lms.ts ใหม่จากตาราง LMS ทางการของ WHO
set -e
TMP=$(mktemp -d)
for f in weianthro lenanthro wflanthro wfhanthro hcanthro; do
  curl -sSL -o "$TMP/$f.txt" "https://raw.githubusercontent.com/WorldHealthOrganization/anthro/master/data-raw/growthstandards/$f.txt"
done
# อายุ 5–19 ปี: WHO Growth Reference 2007 (github.com/WorldHealthOrganization/anthroplus)
for f in bfawho2007 hfawho2007 wfawho2007; do
  curl -sSL -o "$TMP/$f.txt" "https://raw.githubusercontent.com/WorldHealthOrganization/anthroplus/master/data-raw/growthstandards/$f.txt"
done
python3 "$(dirname "$0")/make-who-lms.py" "$TMP" > "$(dirname "$0")/../src/data/who-lms.ts"
echo "wrote src/data/who-lms.ts"
