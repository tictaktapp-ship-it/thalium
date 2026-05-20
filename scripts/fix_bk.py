content = open('E:/thalium/src/roles/boundary-keeper.ts', encoding='utf-8').read()

old = "  const supabase = createClient(supabaseUrl, supabaseKey);"
new = "  const supabase = createClient(supabaseUrl, supabaseKey, { realtime: { transport: undefined as unknown as typeof WebSocket } });"

if old in content:
    open('E:/thalium/src/roles/boundary-keeper.ts', 'w', encoding='utf-8').write(content.replace(old, new))
    print('REPLACED OK')
else:
    print('NOT FOUND')
