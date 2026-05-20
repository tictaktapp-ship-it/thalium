content = open('E:/thalium/src/roles/validator.ts', encoding='utf-8').read()

old = "export const DEFAULT_CONFIDENCE_THRESHOLD = 60;"
new = "export const DEFAULT_CONFIDENCE_THRESHOLD = 50;"

if old in content:
    open('E:/thalium/src/roles/validator.ts', 'w', encoding='utf-8').write(content.replace(old, new))
    print('REPLACED OK')
else:
    print('NOT FOUND')
