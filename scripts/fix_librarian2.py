content = open('E:/thalium/src/roles/librarian.ts', encoding='utf-8').read()

old = "  await writeContribution(sessionId, librarianContribution);"
new = "  if (anchor !== null) {\n    await writeContribution(sessionId, librarianContribution);\n  }"

if old in content:
    open('E:/thalium/src/roles/librarian.ts', 'w', encoding='utf-8').write(content.replace(old, new))
    print('REPLACED OK')
else:
    print('NOT FOUND')
