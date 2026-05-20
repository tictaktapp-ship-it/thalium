content = open('E:/thalium/src/roles/librarian.ts', encoding='utf-8').read()
idx = content.find('readAnchor(sessionId)')
print(repr(content[idx:idx+200]))
