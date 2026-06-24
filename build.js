const fs = require('fs');
const path = require('path');

function parseEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const [key, ...rest] = line.split('=');
    if (key) env[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '');
  });
  return env;
}

const envPath = path.join(__dirname, '.env');
const env = parseEnv(envPath);

const configPath = path.join(__dirname, 'wanderlust_main', 'js', 'firebase-config-template.js');
const outputPath = path.join(__dirname, 'wanderlust_main', 'js', 'firebase-config.js');

if (!fs.existsSync(configPath)) {
  console.error('Missing firebase-config-template.js');
  process.exit(1);
}

let template = fs.readFileSync(configPath, 'utf8');

template = template.replace('{{VITE_FIREBASE_API_KEY}}', env.VITE_FIREBASE_API_KEY || '');
template = template.replace('{{VITE_FIREBASE_AUTH_DOMAIN}}', env.VITE_FIREBASE_AUTH_DOMAIN || '');
template = template.replace('{{VITE_FIREBASE_PROJECT_ID}}', env.VITE_FIREBASE_PROJECT_ID || '');
template = template.replace('{{VITE_FIREBASE_STORAGE_BUCKET}}', env.VITE_FIREBASE_STORAGE_BUCKET || '');
template = template.replace('{{VITE_FIREBASE_MESSAGING_SENDER_ID}}', env.VITE_FIREBASE_MESSAGING_SENDER_ID || '');
template = template.replace('{{VITE_FIREBASE_APP_ID}}', env.VITE_FIREBASE_APP_ID || '');
template = template.replace('{{VITE_FIREBASE_MEASUREMENT_ID}}', env.VITE_FIREBASE_MEASUREMENT_ID || '');

fs.writeFileSync(outputPath, template);
console.log('firebase-config.js generated successfully');
