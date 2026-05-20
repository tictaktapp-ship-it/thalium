import sys
c = open('src/config/triage-system-prompt.ts', encoding='utf-8').read()
c = c.replace(
    "if (!VALID_INTENT_TYPES.includes(parsed.intent_type)) {",
    "if (!VALID_INTENT_TYPES.includes(parsed.intent_type as typeof VALID_INTENT_TYPES[number])) {"
)
c = c.replace(
    "if (!VALID_SCOPES.includes(parsed.scope)) {",
    "if (!VALID_SCOPES.includes(parsed.scope as typeof VALID_SCOPES[number])) {"
)
open('src/config/triage-system-prompt.ts', 'w', encoding='utf-8').write(c)
print("Done")
