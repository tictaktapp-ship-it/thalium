content = open('E:/thalium/src/roles/boundary-keeper.ts', encoding='utf-8').read()
old = "import { createClient } from '@supabase/supabase-js';\n"
new = ""
if old in content:
    open('E:/thalium/src/roles/boundary-keeper.ts', 'w', encoding='utf-8').write(content.replace(old, new))
    print('REPLACED OK')
else:
    print('NOT FOUND')
