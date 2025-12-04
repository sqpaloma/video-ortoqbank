const crypto = require('crypto');

// Get from command line or use defaults
const videoId = process.argv[2] || '4c275c9b-a3b6-438c-b342-fee511355628';
const libraryId = process.argv[3] || '550336';
const securityKey = process.argv[4];

if (!securityKey) {
  console.error('Usage: node generate-token.js [videoId] [libraryId] <securityKey>');
  console.error('Example: node generate-token.js VIDEO_ID LIBRARY_ID YOUR_SECURITY_KEY');
  process.exit(1);
}

// Expiration: 24 hours from now
const expirationTime = Math.floor(Date.now() / 1000) + (24 * 3600);

// Generate token: SHA256(security_key + video_id + expiration)
const signatureString = securityKey + videoId + expirationTime;
const token = crypto.createHash('sha256').update(signatureString).digest('hex');

// Build the URL
const embedUrl = `https://player.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expirationTime}`;

console.log('\n=== Bunny Embed Token ===');
console.log('Video ID:', videoId);
console.log('Library ID:', libraryId);
console.log('Expires:', new Date(expirationTime * 1000).toISOString());
console.log('\nToken:', token);
console.log('\nFull Embed URL:');
console.log(embedUrl);
console.log('\n');
