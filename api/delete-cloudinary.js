const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { public_id } = req.body;

        if (!public_id) {
            return res.status(400).json({ error: 'Missing public_id' });
        }

        const result = await cloudinary.uploader.destroy(public_id);

        res.status(200).json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};