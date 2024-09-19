const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  const commitSha = execSync('git rev-parse HEAD').toString().trim();
  const filePath = path.join(__dirname, 'commit-sha.json');
  fs.writeFileSync(filePath, JSON.stringify({ commitSha }));
  console.log(`Current commit SHA: ${commitSha}`);
} catch (error) {
  console.error('Error getting commit SHA:', error);
}