content = open('E:/thalium/src/roles/router.ts', encoding='utf-8').read()

old = "const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);"
new = "const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { global: { fetch: fetch.bind(globalThis) }, realtime: { timeout: 0 } as never });"

if old in content:
    open('E:/thalium/src/roles/router.ts', 'w', encoding='utf-8').write(content.replace(old, new))
    print('REPLACED OK')
else:
    print('NOT FOUND')
