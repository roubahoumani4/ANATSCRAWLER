import re

with open("client/src/pages/OSAuditPage.tsx", "r") as f:
    content = f.read()

# Replace the registrationForm definition
old_registration = """  const [registrationForm, setRegistrationForm] = useState({
    machineName: '',
    ipAddress: '',
    ownerName: '',
    operatingSystem: '',
    machineHostname: '',
    osType: 'linux' as 'linux' | 'windows'
  });"""

new_registration = """  const [registrationForm, setRegistrationForm] = useState({
    companyName: '',
    ownerName: '',
    machineName: 'Pending Agent Audit',
    ipAddress: '0.0.0.0',
    operatingSystem: '',
    machineHostname: '',
    osType: 'linux' as 'linux' | 'windows'
  });"""

content = content.replace(old_registration, new_registration)

# Replace the reset
old_reset = """        setRegistrationForm({
          machineName: '',
          ipAddress: '',
          ownerName: '',
          operatingSystem: '',
          machineHostname: '',
          osType: 'linux' as 'linux' | 'windows'
        });"""

new_reset = """        setRegistrationForm({
          companyName: '',
          ownerName: '',
          machineName: 'Pending Agent Audit',
          ipAddress: '0.0.0.0',
          operatingSystem: '',
          machineHostname: '',
          osType: 'linux' as 'linux' | 'windows'
        });"""

content = content.replace(old_reset, new_reset)

# Replace the form fields
form_regex = re.compile(
    r'<div>\s*<label className="block text-sm font-medium text-coolWhite/80 mb-2">Your Name</label>.*?Machine Hostname \(Optional\)</label>.*?</Input>\s*</div>', 
    re.DOTALL
)

new_form = """<div>
                  <label className="block text-sm font-medium text-coolWhite/80 mb-2">Company Name</label>
                  <Input
                    value={(registrationForm as any).companyName || ''}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, companyName: e.target.value } as any)}
                    placeholder="e.g., Acme Corp"
                    required
                    className="bg-jetBlack border-coolWhite/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-coolWhite/80 mb-2">Person Name (Auditor / Responsible)</label>
                  <Input
                    value={registrationForm.ownerName}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, ownerName: e.target.value })}
                    placeholder="e.g., John Doe"
                    required
                    className="bg-jetBlack border-coolWhite/10"
                  />
                  <p className="text-xs text-coolWhite/50 mt-1">This name will appear in all audit reports for this machine</p>
                </div>"""

content = form_regex.sub(new_form, content)

with open("client/src/pages/OSAuditPage.tsx", "w") as f:
    f.write(content)
