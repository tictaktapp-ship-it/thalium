import sys
content = sys.stdin.read()
with open(sys.argv[1], 'w', encoding='utf-8') as f:
    f.write(content)
print(f"Written: {sys.argv[1]}")
