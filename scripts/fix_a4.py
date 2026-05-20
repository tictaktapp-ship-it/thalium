content = open('E:/thalium/src/roles/architect.ts', encoding='utf-8').read()

old1 = "  structured_artifact: unknown;"
new1 = "  structured_artifact: unknown | null;"

old2 = "  structured_artifact: z.unknown(),"
new2 = "  structured_artifact: z.unknown().default(null),"

content = content.replace(old1, new1).replace(old2, new2)
open('E:/thalium/src/roles/architect.ts', 'w', encoding='utf-8').write(content)
print('DONE')
