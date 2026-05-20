content = open('E:/thalium/src/roles/architect.ts', encoding='utf-8').read()

old = "  structured_artifact: string;"
new = "  structured_artifact: unknown;"

if old in content:
    open('E:/thalium/src/roles/architect.ts', 'w', encoding='utf-8').write(content.replace(old, new))
    print('REPLACED OK')
else:
    print('NOT FOUND')
