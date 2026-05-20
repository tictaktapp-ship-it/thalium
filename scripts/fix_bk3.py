content = open('E:/thalium/src/roles/boundary-keeper.ts', encoding='utf-8').read()

old = "createClient(supabaseUrl, supabaseKey, { global: { fetch: fetch.bind(globalThis) }, realtime: { timeout: 0 } as never });\n\n  let rules: { blocked_terms?: string[] } = {};\n  try {\n    const { data, error } = await supabase\n      .from('institutional_ring')\n      .select('*')\n      .eq('address_key', `boundary_rules.${domain}`)\n      .eq('brain_id', brainId)\n      .single();\n\n    if (error) {\n      console.warn(`Failed to fetch boundary rules: ${error.message}`);\n    } else {\n      rules = data;\n    }"

new = "null; // Supabase client not used - using fetch directly\n\n  let rules: { blocked_terms?: string[] } = {};\n  try {\n    const rulesUrl = `${supabaseUrl}/rest/v1/institutional_ring?address_key=eq.boundary_rules.${domain}&brain_id=eq.${brainId}&select=content&limit=1`;\n    const rulesRes = await fetch(rulesUrl, { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } });\n    if (rulesRes.ok) {\n      const rulesData = await rulesRes.json() as { content?: { blocked_terms?: string[] } }[];\n      if (rulesData.length > 0 && rulesData[0]?.content) { rules = rulesData[0].content; }\n    }"

if old in content:
    open('E:/thalium/src/roles/boundary-keeper.ts', 'w', encoding='utf-8').write(content.replace(old, new))
    print('REPLACED OK')
else:
    print('NOT FOUND')
    # show what surrounds the area
    idx = content.find('Failed to fetch boundary rules')
    print(repr(content[idx-200:idx+200]))
