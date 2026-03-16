import re

with open("client/src/pages/OSAuditPage.tsx", "r") as f:
    text = f.read()

text = text.replace("""  const [registrationForm, setRegistrationForm] = useState({
    machineName: '',
    ipAddress: '',
    ownerName: '',
    operatingSystem: '',
    machineHostname: '',
    osType: 'linux' as 'linux' | 'windows'
  });""", """  const [registrationForm, setRegistrationForm] = useState({
    companyName: '',
    machineName: 'Pending Agent Audit',
    ipAddress: '0.0.0.0',
    ownerName: '',
    operatingSystem: '',
    machineHostname: '',
    osType: 'linux' as 'linux' | 'windows'
  });""")

text = text.replace("""        setRegistrationForm({
          machineName: '',
          ipAddress: '',
          ownerName: '',
          operatingSystem: '',
          machineHostname: '',
          osType: 'linux' as 'linux' | 'windows'
        });""", """        setRegistrationForm({
          companyName: '',
          machineName: 'Pending Agent Audit',
          ipAddress: '0.0.0.0',
          ownerName: '',
          operatingSystem: '',
          machineHostname: '',
          osType: 'linux' as 'linux' | 'windows'
        });""")

with open("client/src/pages/OSAuditPage.tsx", "w") as f:
    f.write(text)
