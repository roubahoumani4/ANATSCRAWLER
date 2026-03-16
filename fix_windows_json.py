import re

with open("client/src/pages/OSAuditPage.tsx", "r") as f:
    text = f.read()

payload_old = """      auditData = [PSCustomObject]@{
        operatingSystem = "$os (Build $osBuild)"
        auditScore = $Parsed.score"""

payload_new = """      auditData = [PSCustomObject]@{
        operatingSystem = "$os (Build $osBuild)"
        kernelVersion = $osVersion
        hostname = $hostname
        auditScore = $Parsed.score"""

text = text.replace(payload_old, payload_new)

with open("client/src/pages/OSAuditPage.tsx", "w") as f:
    f.write(text)
