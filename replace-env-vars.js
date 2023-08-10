const fs = require('fs');

// Read the file
const filePath = './script.js'; // Replace with the path to your JS file
let fileContent = fs.readFileSync(filePath, 'utf8');

// Replace placeholders with environment variables
fileContent = fileContent.replace('%%SUPABASE_URL%%', process.env.REACT_APP_SUPABASE_URL);
fileContent = fileContent.replace('%%SUPABASE_KEY%%', process.env.REACT_APP_SUPABASE_KEY);

// Write the modified content back to the file
fs.writeFileSync(filePath, fileContent);
