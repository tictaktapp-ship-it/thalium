content = open('E:/thalium/src/roles/boundary-keeper.ts', encoding='utf-8').read()
idx = content.find('createClient(supabaseUrl')
print(repr(content[idx:idx+400]))
