content = open('E:/thalium/src/roles/architect.ts', encoding='utf-8').read()

old = "    const parsedOutput = architectOutputSchema.safeParse(JSON.parse(contentStr!));"

new = "    const cleanedStr = contentStr!.replace(/```json\\n?/g, '').replace(/```\\n?/g, '').trim();\n    const parsedOutput = architectOutputSchema.safeParse(JSON.parse(cleanedStr));"

if old in content:
    open('E:/thalium/src/roles/architect.ts', 'w', encoding='utf-8').write(content.replace(old, new))
    print('REPLACED OK')
else:
    print('NOT FOUND')
