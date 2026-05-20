content = open('E:/thalium/src/jobs/seeder.ts', encoding='utf-8').read()

old = "for (let i = 0; i < templates.length; i++) {\n      const template = templates[i];\n      const entryId = crypto.randomUUID();"

new = "let templateIndex = 0;\n    for (const template of templates) {\n      const entryId = crypto.randomUUID();\n      const displayIndex = templateIndex + 1;"

if old in content:
    open('E:/thalium/src/jobs/seeder.ts', 'w', encoding='utf-8').write(content.replace(old, new))
    print('REPLACED OK')
else:
    print('NOT FOUND')
