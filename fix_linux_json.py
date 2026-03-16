import re

with open("client/src/pages/OSAuditPage.tsx", "r") as f:
    text = f.read()

payload_old = """  # Escape values
  TOKEN_JSON=$(json_escape "$AGENT_TOKEN")
  MACHINE_JSON=$(json_escape "$MACHINE_NAME")
  OWNER_JSON=$(json_escape "$OWNER_NAME")
  IP_JSON=$(json_escape "$IP_ADDRESS")
  OS_JSON=$(json_escape "$OS_INFO")"""

payload_new = """  # Escape values
  TOKEN_JSON=$(json_escape "$AGENT_TOKEN")
  MACHINE_JSON=$(json_escape "$MACHINE_NAME")
  OWNER_JSON=$(json_escape "$OWNER_NAME")
  IP_JSON=$(json_escape "$IP_ADDRESS")
  OS_JSON=$(json_escape "$OS_INFO")
  KERNEL_JSON=$(json_escape "$KERNEL_VERSION")
  HOSTNAME_JSON=$(json_escape "$HOSTNAME")"""

text = text.replace(payload_old, payload_new)

payload2_old = """  cat > "$TEMP_JSON" << EOF_JSON
  {
    "agentInstallationToken": $TOKEN_JSON,
    "machineName": $MACHINE_JSON,
    "ipAddress": $IP_JSON,
    "ownerName": $OWNER_JSON,
    "auditData": {
      "operatingSystem": $OS_JSON,"""

payload2_new = """  cat > "$TEMP_JSON" << EOF_JSON
  {
    "agentInstallationToken": $TOKEN_JSON,
    "machineName": $MACHINE_JSON,
    "ipAddress": $IP_JSON,
    "ownerName": $OWNER_JSON,
    "auditData": {
      "operatingSystem": $OS_JSON,
      "kernelVersion": $KERNEL_JSON,
      "hostname": $HOSTNAME_JSON,"""

text = text.replace(payload2_old, payload2_new)

with open("client/src/pages/OSAuditPage.tsx", "w") as f:
    f.write(text)
