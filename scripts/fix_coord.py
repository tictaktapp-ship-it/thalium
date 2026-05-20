content = open('E:/thalium/src/chain/coordinator.ts', encoding='utf-8').read()
old1 = "architectResult.output.structured_artifact, triageResult.intent_type, domain"
new1 = "String(architectResult.output.structured_artifact), triageResult.intent_type, domain"
old2 = "architectResult.output.structured_artifact, domain, brainId"
new2 = "String(architectResult.output.structured_artifact), domain, brainId"
content = content.replace(old1, new1).replace(old2, new2)
open('E:/thalium/src/chain/coordinator.ts', 'w', encoding='utf-8').write(content)
print('fix_coord DONE')
