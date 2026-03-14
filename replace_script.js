const fs = require('fs');
let data = fs.readFileSync('backend/config/constants.js', 'utf8');
data = data.replace(
  /const ALLOWED_DEPARTMENT_NAMES = \[\s*[\s\S]*?\s*\];/,
  "const ALLOWED_DEPARTMENT_NAMES = [\n  'Affiliation dept',\n  'Dean Department',\n  'VC Office',\n  'PVC Office',\n  'Exam Department',\n  'Accounts Departments',\n  'NSS Department',\n  'Registrar Office',\n  'Student Development',\n  'Engineering Dept',\n  'Hingoli',\n  'Parbhani',\n  'Latur',\n  'Kinwat',\n  'Other',\n];"
);
fs.writeFileSync('backend/config/constants.js', data);
