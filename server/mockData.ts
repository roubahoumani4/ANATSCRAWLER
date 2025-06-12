// Mock credentials for testing
export const credentials = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    email: "admin@anatsecurity.com",
    fullName: "Admin User",
    organization: "ANAT Security",
    department: "IT Administration",
    jobPosition: "System Administrator",
    roles: ["admin"]
  },
  {
    id: 2,
    username: "jsmith",
    password: "password123",
    email: "jsmith@anatsecurity.com",
    fullName: "John Smith",
    organization: "ANAT Security",
    department: "Threat Research",
    jobPosition: "Security Analyst",
    roles: ["analyst"]
  },
  {
    id: 3,
    username: "mjohnson",
    password: "secure456",
    email: "mjohnson@anatsecurity.com",
    fullName: "Maria Johnson",
    organization: "ANAT Security",
    department: "Forensics",
    jobPosition: "Digital Forensic Investigator",
    roles: ["investigator"]
  }
];

// Mock search results for testing
export const searchResults = [
  {
    id: 1,
    collection: "Email Archives",
    folder: "Company/HR",
    fileName: "recruitment_2023.eml",
    content: "Username: recruiter1 Password: Summer2023! Server: mail.example.com"
  },
  {
    id: 2,
    collection: "Source Code",
    folder: "Projects/WebApp",
    fileName: "config.js",
    content: "const API_KEY = 'a1b2c3d4e5f6g7h8i9j0'; const DB_PASSWORD = 'SecureDB123!';"
  },
  {
    id: 3,
    collection: "Documentation",
    folder: "Internal/Access",
    fileName: "server_access.docx",
    content: "SSH credentials for prod server: username=sysadmin password=Pr0d@ccess2023"
  },
  {
    id: 4,
    collection: "Cloud Storage",
    folder: "Backups/Database",
    fileName: "backup_script.sh",
    content: "# Backup script using credentials\n# username: backup-user\n# password: BackM3Up!"
  },
  {
    id: 5,
    collection: "Network Scans",
    folder: "Quarterly/Q2_2023",
    fileName: "discovered_devices.csv",
    content: "Device,IP,Access,Credentials\nRouter1,192.168.1.1,Admin,admin:router@123"
  },
  {
    id: 6,
    collection: "Chat Logs",
    folder: "Teams/IT_Support",
    fileName: "march_chat.log",
    content: "John: I created a temporary account for the consultant\nUsername: temp_user\nPassword: Spring2023!"
  },
  {
    id: 7,
    collection: "Configuration Files",
    folder: "Servers/Web",
    fileName: "apache2.conf",
    content: "# Basic auth credentials\nAuthUser webmaster\nAuthPassword W3bAdmin2023!"
  },
  {
    id: 8,
    collection: "Client Data",
    folder: "Projects/Acme_Corp",
    fileName: "deployment_notes.txt",
    content: "Client portal credentials:\nURL: https://portal.acmecorp.com\nLogin: acme_admin\nPassword: AcmePortal2023!"
  }
];