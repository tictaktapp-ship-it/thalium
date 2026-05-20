content = open("E:/thalium/src/jobs/consolidation-monitor.ts", encoding="utf-8").read()
# Strip markdown fences
import re
match = re.search(r"```typescript\r?\n(.*?)```", content, re.DOTALL)
if match:
    open("E:/thalium/src/jobs/consolidation-monitor.ts", "w", encoding="utf-8").write(match.group(1))
    print("STRIPPED OK")
else:
    print("NO FENCE FOUND - file content starts with:")
    print(repr(content[:100]))
