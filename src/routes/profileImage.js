// const mongoose = require("mongoose");

// const User = mongoose.model("User");
require('dotenv').config();
const pool = require('../pool');





const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");

const s3Client = new S3Client({
    region: "us-east-2",
    credentials: {
        accessKeyId: process.env.AMAZON_ACCESS_KEY,
        secretAccessKey: process.env.AMAZON_SECRET_KEY,
    },
});

module.exports = (app) => {
    app.post("/user/deleteImage", async (req, res) => {
        try {
            const { key } = req.body;

            if (!key) {
                return res.status(400).send("No file key provided");
            }

            // Deleting from Amazon S3
            const deleteCommand = new DeleteObjectCommand({
                Bucket: "my-photo-bucket-111", // Assuming same bucket is used for images
                Key: key,
            });

            await s3Client.send(deleteCommand);

            res
                .status(200)
                .send({ message: "File and database record deleted successfully" });
        } catch (error) {
            console.error("Error deleting file:", error);
            res.status(500).send("Server Error");
        }
    });



    app.post("/user/saveImageLink", async (req, res) => {
        try {
            const { imageLink, userId } = req.body;

            // Check if the user exists
            const userQuery = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

            if (userQuery.rows.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            let user = userQuery.rows[0];

            // Update the existing image link
            const updateQuery = await pool.query(
                'UPDATE users SET image_link = $1 WHERE id = $2 RETURNING *',
                [imageLink, userId]
            );

            user = updateQuery.rows[0];

            res.status(200).json(user);
        } catch (error) {
            console.error("Error saving or updating image:", error);
            res.status(500).send("Server Error");
        }
    });


    app.get("/user/createImage", async (req, res) => {
        try {
            const userId = req.query.userId;
            if (!userId) {
                return res.status(400).send("No userId provided in headers");
            }

            let uuid = uuidv4();
            const key = `${userId}/${uuid}.png`; // Assuming PNG images

            const command = new PutObjectCommand({
                Bucket: "my-photo-bucket-111", // Assuming same bucket is used for images
                Key: key,
                ContentType: "image/jpeg", // Change if not PNG
            });

            const signedUrl = await getSignedUrl(s3Client, command, {
                expiresIn: 3600,
            });

            res.send({ key, url: signedUrl });
        } catch (err) {
            console.error(err);
            res.status(500).send("Failed to generate signed URL");
        }
    });


}