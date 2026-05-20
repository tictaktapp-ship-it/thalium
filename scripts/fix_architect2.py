content = open('E:/thalium/src/roles/architect.ts', encoding='utf-8').read()

old = "    const cleanedStr = contentStr!.replace(/```json\\n?/g, '').replace(/```\\n?/g, '').trim();\n    const parsedOutput = architectOutputSchema.safeParse(JSON.parse(cleanedStr));\n    if (!parsedOutput.success) {\n      throw new LibrarianError('Invalid output structure from model', 'VALIDATION_FAILED');"

new = "    const cleanedStr = contentStr!.replace(/```json\\n?/g, '').replace(/```\\n?/g, '').trim();\n    const parsedOutput = architectOutputSchema.safeParse(JSON.parse(cleanedStr));\n    if (!parsedOutput.success) {\n      console.error('[architect] RAW OUTPUT:', contentStr);\n      console.error('[architect] CLEANED:', cleanedStr);\n      console.error('[architect] ZOD ERRORS:', JSON.stringify(parsedOutput.error.issues));\n      throw new LibrarianError('Invalid output structure from model', 'VALIDATION_FAILED');"

if old in content:
    open('E:/thalium/src/roles/architect.ts', 'w', encoding='utf-8').write(content.replace(old, new))
    print('REPLACED OK')
else:
    print('NOT FOUND')
