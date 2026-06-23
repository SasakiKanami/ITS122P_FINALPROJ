const functions = require('firebase-functions');
const cloudinary = require('cloudinary').v2;

const cloudinaryConfig = functions.config().cloudinary || {};
cloudinary.config({
  cloud_name: cloudinaryConfig.cloud_name,
  api_key: cloudinaryConfig.api_key,
  api_secret: cloudinaryConfig.api_secret
});

function setCorsHeaders(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

exports.deleteCloudinaryImage = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { public_id } = req.body;
    if (!public_id) {
      return res.status(400).json({ error: 'Missing public_id' });
    }

    const result = await cloudinary.uploader.destroy(public_id);
    return res.status(200).json({ result });
  } catch (error) {
    console.error('Cloudinary delete failed:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete image' });
  }
});
