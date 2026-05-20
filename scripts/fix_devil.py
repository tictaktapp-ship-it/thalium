content = open('E:/thalium/src/roles/devil.ts', encoding='utf-8').read()

old = "      devilOutput = JSON.parse(content);"
new = "      const cleanedContent = content.replace(/```json\\n?/g, '').replace(/```\\n?/g, '').trim();\n      devilOutput = JSON.parse(cleanedContent);"

if old in content:
    open('E:/thalium/src/roles/devil.ts', 'w', encoding='utf-8').write(content.replace(old, new))
    print('REPLACED OK')
else:
    print('NOT FOUND')
