content = open('E:/thalium/src/jobs/seeder.ts', encoding='utf-8').read()
idx = content.find('for (let i')
print(repr(content[idx:idx+200]))
