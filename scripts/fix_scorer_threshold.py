content = open('E:/thalium/src/roles/scorer.ts', encoding='utf-8').read()

old = "export const DEFAULT_PASS_THRESHOLD = 60;"
new = "export const DEFAULT_PASS_THRESHOLD = 50;"

if old in content:
    open('E:/thalium/src/roles/scorer.ts', 'w', encoding='utf-8').write(content.replace(old, new))
    print('REPLACED OK')
else:
    print('NOT FOUND')
