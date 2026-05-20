content = open('E:/thalium/src/roles/librarian.ts', encoding='utf-8').read()

old = "readAnchor(sessionId);\n  let entries_written = 0;\n  let entries_failed = 0;\n\n  for (const contribution of anchor.contributions) {"
new = "readAnchor(sessionId).catch(() => null);\n  let entries_written = 0;\n  let entries_failed = 0;\n\n  for (const contribution of (anchor?.contributions ?? [])) {"

if old in content:
    open('E:/thalium/src/roles/librarian.ts', 'w', encoding='utf-8').write(content.replace(old, new))
    print('REPLACED OK')
else:
    print('NOT FOUND')
