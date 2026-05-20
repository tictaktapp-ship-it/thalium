import sys, re
c = sys.stdin.read()
m = re.search(r'```typescript\r?\n(.*?)```', c, re.DOTALL)
print(m.group(1) if m else c)
