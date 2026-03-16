import re

with open("server/scripts/generate_windows_audit_report.py", "r") as f:
    text = f.read()

# I will just replace the deduplication block

dedup_old = """            # Deduplicate by ID (or by name if ID is empty)
            dedup_key = finding_id or name
            if dedup_key in seen_ids:"""

dedup_new = """            # Better deduplication for ASR, Policy, and Intune
            def get_dedup_key(i, n):
                nl = n.lower()
                if "asr" in nl or "attack surface reduction" in nl:
                    m = __import__('re').search(r'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', nl)
                    if m: return "asr_" + m.group(1)
                # Remove spaces/punctuation for Intune or Policy to catch duplicates
                if "intune" in nl or "policy" in nl:
                    base = __import__('re').sub(r'[^a-z0-9]', '', nl)
                    return base
                return i or n

            dedup_key = get_dedup_key(finding_id, name)
            if dedup_key in seen_ids:"""

text = text.replace(dedup_old, dedup_new)

with open("server/scripts/generate_windows_audit_report.py", "w") as f:
    f.write(text)
