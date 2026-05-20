content = open('E:/thalium/src/jobs/seeder.ts', encoding='utf-8').read()
old1 = "`[seeder]   \u2713 ${addressKey} [${i + 1}/${templates.length}] entry=${entryId.slice(0, 8)}`,"
new1 = "`[seeder]   \u2713 ${addressKey} [${displayIndex}/${templates.length}] entry=${entryId.slice(0, 8)}`,"
old2 = "errors.push({ addressKey, entryIndex: i, message });"
new2 = "errors.push({ addressKey, entryIndex: templateIndex, message });"
old3 = "`[seeder]   \u2717 ${addressKey} [${i + 1}/${templates.length}]: ${message}`"
new3 = "`[seeder]   \u2717 ${addressKey} [${displayIndex}/${templates.length}]: ${message}`"
old4 = "    }"
new4 = "\n      templateIndex++;\n    }"

content = content.replace(old1, new1).replace(old2, new2).replace(old3, new3)
open('E:/thalium/src/jobs/seeder.ts', 'w', encoding='utf-8').write(content)
print('DONE')
