content = open('E:/thalium/src/roles/devil.ts', encoding='utf-8').read()
idx = content.find('JSON.parse(content)')
print(repr(content[idx-50:idx+100]))
