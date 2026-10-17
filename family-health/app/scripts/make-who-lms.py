import csv, sys, os
src = sys.argv[1]
def load(f): return list(csv.DictReader(open(os.path.join(src, f)), delimiter='\t'))
def fmt(h):
    s = f"{h:.1f}"
    return s[:-2] if s.endswith('.0') else s
def bysex(rows, keycol, keys, keyfmt):
    res = {}
    for sex in ('1', '2'):
        idx = {r[keycol]: r for r in rows if r['sex'] == sex}
        res[sex] = [f"[{float(idx[keyfmt(k)]['l']):g},{float(idx[keyfmt(k)]['m']):g},{float(idx[keyfmt(k)]['s']):g}]" for k in keys]
    return res
out = ['// สร้างอัตโนมัติจาก WHO Child Growth Standards (github.com/WorldHealthOrganization/anthro, data-raw/growthstandards)',
       '// [L, M, S] — อายุรายเดือน 0–60 (จากตารางรายวัน), ความยาว/ส่วนสูงทุก 0.5 ซม. — sex 1 = ชาย, 2 = หญิง',
       'export type LMS = [number, number, number]', '']
for name, f in (('WFA', 'weianthro.txt'), ('LHFA', 'lenanthro.txt'), ('HCFA', 'hcanthro.txt')):
    r = bysex(load(f), 'age', range(61), lambda m: str(round(m * 30.4375)))
    out += [f"/** {name}: index = อายุ (เดือน) */",
            f"export const {name}: Record<1 | 2, LMS[]> = {{\n  1: [{','.join(r['1'])}],\n  2: [{','.join(r['2'])}],\n}}"]
for name, f, col, lo, hi in (('WFL', 'wflanthro.txt', 'length', 45, 110), ('WFH', 'wfhanthro.txt', 'height', 65, 120)):
    rows = load(f)
    for row in rows: row[col] = fmt(float(row[col]))
    keys = [lo + i * 0.5 for i in range(int((hi - lo) * 2) + 1)]
    r = bysex(rows, col, keys, fmt)
    out += [f"/** {name}: index = (ซม. − {lo}) × 2 */", f"export const {name}_START = {lo}",
            f"export const {name}: Record<1 | 2, LMS[]> = {{\n  1: [{','.join(r['1'])}],\n  2: [{','.join(r['2'])}],\n}}"]
print('\n'.join(out))
