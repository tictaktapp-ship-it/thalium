content = open('E:/thalium/src/roles/architect.ts', encoding='utf-8').read()
old = "    const parsed = JSON.parse(cleanedStr);\n    if (!parsed.structured_artifact) parsed.structured_artifact = parsed;\n    const parsedOutput = architectOutputSchema.safeParse(parsed);"
new = "    const parsed = JSON.parse(cleanedStr);\n    const parsedOutput = architectOutputSchema.safeParse(parsed);"
if old in content:
    open('E:/thalium/src/roles/architect.ts', 'w', encoding='utf-8').write(content.replace(old, new))
    print('fix_a3 REPLACED OK')
else:
    old2 = "    const parsedOutput = architectOutputSchema.safeParse(JSON.parse(cleanedStr));"
    new2 = "    const parsed = JSON.parse(cleanedStr);\n    const parsedOutput = architectOutputSchema.safeParse(parsed);"
    if old2 in content:
        open('E:/thalium/src/roles/architect.ts', 'w', encoding='utf-8').write(content.replace(old2, new2))
        print('fix_a3 alt REPLACED OK')
    else:
        print('NOT FOUND')
