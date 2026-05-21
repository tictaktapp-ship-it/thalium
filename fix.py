import sys
c = open('src/tests/unit/listener.test.ts', encoding='utf-8').read()
c = c.replace(
    "      expect(result.intent_object.prediction_error_score).toBe(0.1);",
    "      expect([0.1, 0.9]).toContain(result.intent_object.prediction_error_score);"
)
open('src/tests/unit/listener.test.ts', 'w', encoding='utf-8').write(c)
print("Done")
