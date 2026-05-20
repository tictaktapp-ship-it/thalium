content = open('E:/thalium/src/jobs/seeder.ts', encoding='utf-8').read()
old = "          await updateCoverageMapEntry(brainId, addressKey, template.confidence);"
new = "          await updateCoverageMapEntry(brainId, addressKey, Math.round(template.confidence * 100));"
if old in content:
    open('E:/thalium/src/jobs/seeder.ts', 'w', encoding='utf-8').write(content.replace(old, new))
    print('REPLACED OK')
else:
    print('NOT FOUND')
