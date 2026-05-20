content = open('E:/thalium/src/roles/boundary-keeper.ts', encoding='utf-8').read()

old = "  const supabase = createClient(supabaseUrl, supabaseKey, { realtime: { transport: undefined as unknown as typeof WebSocket } });"
new = "  const supabase = createClient(supabaseUrl, supabaseKey, { global: { fetch: fetch.bind(globalThis) }, realtime: { timeout: 0 } as never });"

if old in content:
    open('E:/thalium/src/roles/boundary-keeper.ts', 'w', encoding='utf-8').write(content.replace(old, new))
    print('REPLACED OK')
else:
    print('NOT FOUND')
