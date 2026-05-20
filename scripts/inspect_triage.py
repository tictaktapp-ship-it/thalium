content = open('E:/thalium/src/roles/triage.ts', encoding='utf-8').read()
idx = content.find('return `Classify')
print(repr(content[idx:idx+800]))
