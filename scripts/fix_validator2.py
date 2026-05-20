content = open('E:/thalium/src/roles/validator.ts', encoding='utf-8').read()

old = "    } else if (scorerPayload.confidence_score >= threshold) {\n      verdict = 'approved';\n      reasoning = 'Confidence score meets threshold';\n    } else {\n      verdict = 'rejected';\n      reasoning = 'Confidence score below threshold';\n    }"

new = "    } else if (scorerPayload.gate_decision === 'pass' || scorerPayload.gate_decision === 'pass_with_warning') {\n      verdict = 'approved';\n      reasoning = scorerPayload.gate_decision === 'pass_with_warning' ? 'Approved with warnings from Devil' : 'Confidence score meets threshold';\n    } else {\n      verdict = 'rejected';\n      reasoning = 'Confidence score below threshold';\n    }"

if old in content:
    open('E:/thalium/src/roles/validator.ts', 'w', encoding='utf-8').write(content.replace(old, new))
    print('REPLACED OK')
else:
    print('NOT FOUND')
