content = open('E:/thalium/src/roles/validator.ts', encoding='utf-8').read()

old = "export const MAX_RECLASSIFICATION_ATTEMPTS = 2;"
new = "export const MAX_RECLASSIFICATION_ATTEMPTS = 1;"

if old in content:
    open('E:/thalium/src/roles/validator.ts', 'w', encoding='utf-8').write(content.replace(old, new))
    print('REPLACED OK')
else:
    print('NOT FOUND')
