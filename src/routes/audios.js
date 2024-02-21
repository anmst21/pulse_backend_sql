const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const pool = require('../pool');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");
const UserRepo = require('../repos/user-repo');


const s3Client = new S3Client({
    region: "us-east-2",
    credentials: {
        accessKeyId: process.env.AMAZON_ACCESS_KEY,
        secretAccessKey: process.env.AMAZON_SECRET_KEY,
    },
});



module.exports = (app) => {
    app.get('/audios', async (req, res) => {
        const userId = req.headers['userid'];



        try {
            const query = `
      SELECT
    audios.*,
    users.username,
    (SELECT image_link FROM users WHERE users.id = audios.user_id) AS image_link,
    COUNT(CASE WHEN general_upvotes_downvotes.vote_type = true THEN 1 END) AS upvotes,
    COUNT(CASE WHEN general_upvotes_downvotes.vote_type = false THEN 1 END) AS downvotes,
    user_vote.vote_type AS user_vote_type
FROM audios
JOIN users ON audios.user_id = users.id
LEFT JOIN upvotes_downvotes AS general_upvotes_downvotes ON audios.id = general_upvotes_downvotes.post_id
LEFT JOIN (
    SELECT post_id, vote_type
    FROM upvotes_downvotes
    WHERE user_id = $1
) AS user_vote ON audios.id = user_vote.post_id
GROUP BY audios.id, users.username, user_vote.vote_type
ORDER BY audios.date_created DESC
        `;
            const { rows } = await pool.query(query, [userId]);

            if (rows.length === 0) {
                return res.status(404).json({ message: "No audios found." });
            }

            const result = rows.map(row => ({
                ...row,
                upvotes: parseInt(row.upvotes, 10),
                downvotes: parseInt(row.downvotes, 10),
                vote_type: row.user_vote_type,

            }))

            console.log("resultresultresult", result)


            res.json(rows.map(row => ({
                ...row,
                upvotes: parseInt(row.upvotes, 10),
                downvotes: parseInt(row.downvotes, 10),
                vote_type: row.user_vote_type,

            })));
        } catch (error) {
            console.error("Error fetching audios:", error);
            res.status(500).send("Server error");
        }
    });


    app.get('/user/:userId/audios', async (req, res) => {
        try {
            const userId = req.params.userId;



            const query = `
             SELECT
                    audios.*,
                    users.username,
                     (SELECT image_link FROM users WHERE users.id = audios.user_id) AS image_link,
                    COUNT(CASE WHEN general_upvotes_downvotes.vote_type = true THEN 1 END) AS upvotes,
                    COUNT(CASE WHEN general_upvotes_downvotes.vote_type = false THEN 1 END) AS downvotes,
                    user_vote.vote_type AS user_vote_type
                FROM audios
                JOIN users ON audios.user_id = users.id
                LEFT JOIN upvotes_downvotes AS general_upvotes_downvotes ON audios.id = general_upvotes_downvotes.post_id
                LEFT JOIN (
                    SELECT post_id, vote_type
                    FROM upvotes_downvotes
                    WHERE user_id = $1  -- This subquery still filters votes made by the provided user ID
                ) AS user_vote ON audios.id = user_vote.post_id
                WHERE audios.user_id = $1  -- Filter the main query to only include audios by the provided user ID
                GROUP BY audios.id, users.username, user_vote.vote_type
                ORDER BY audios.date_created DESC;
        `;
            const { rows } = await pool.query(query, [userId]);
            console.log("rowsrowsrows", rows)
            if (rows.length === 0) {
                return res.status(404).json({ message: "No audios found." });
            }



            const result = rows.map(row => ({
                ...row,
                upvotes: parseInt(row.upvotes, 10),
                downvotes: parseInt(row.downvotes, 10),
                vote_type: row.user_vote_type
            }))

            console.log("resultresultresult", result)

            res.json(result);
        } catch (error) {
            console.error("Error fetching audios:", error);
            res.status(500).send("Server error");
        }
    });

    app.post("/audio/delete", async (req, res) => {
        try {
            const { id, user } = req.body; // Assuming id is the ID of the audio in your database

            // Find the audio in the database
            const { rows } = await pool.query('SELECT * FROM audios WHERE id = $1', [id]);
            const audio = rows[0];
            if (!audio) {
                return res.status(404).send("Audio not found");
            }

            if (audio.type === "spotify") {
                // Deleting the audio record from the database for Spotify type
                await pool.query('DELETE FROM audios WHERE id = $1', [id]);
                res.status(200).send({ message: "Database record deleted successfully" });
            } else {
                // Extract the key from the audioLink for non-Spotify types
                const key = audio.audio_link.replace("https://my-audio-bucket-111.s3.us-east-2.amazonaws.com/", "");

                // Deleting from Amazon S3
                const deleteCommand = new DeleteObjectCommand({
                    Bucket: "my-audio-bucket-111",
                    Key: key,
                });
                await s3Client.send(deleteCommand);

                // Deleting the audio record from the database
                await pool.query('DELETE FROM audios WHERE id = $1', [id]);

                res.status(200).send({ message: "File and database record deleted successfully" });
            }
        } catch (error) {
            console.error("Error deleting file:", error);
            res.status(500).send("Server Error");
        }
    });


    app.post("/audio/save", async (req, res) => {
        try {
            const {
                audioLink,
                duration,
                user, // Assuming this is the user_id
                bpm,
                size,
                soundLevels, // JSON format
                type,
                fileName,
                extension,
                track,
            } = req.body;


            let query = `
            INSERT INTO audios (audio_link, duration, user_id, bpm, size, sound_levels, type, file_name, extension, track)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *;
        `;
            let values;

            if (type === "spotify") {
                values = [audioLink, duration, user, bpm, null, null, type, null, null, JSON.stringify(track)]; // Assuming track isn't provided for Spotify links
            } else {
                values = [audioLink, duration, user, bpm, size, JSON.stringify(soundLevels), type, fileName, extension, JSON.stringify({})]; // Assuming track isn't provided for non-Spotify links either
            }

            const { rows } = await pool.query(query, values);
            const savedAudio = rows[0];

            res.status(200).json(savedAudio);
        } catch (error) {
            console.error("Error saving audio:", error);
            res.status(500).send("Server Error");
        }
    });


    app.get("/audio/upload", async (req, res) => {
        try {
            const userId = req.query.userId;
            const dataType = req.query.dataType;
            const extension = req.query.extension;
            if (!userId) {
                return res.status(400).send("No userId provided in headers");
            }

            let uuid = uuidv4();

            const key = `${userId}/${uuid}.${extension}`;
            const command = new PutObjectCommand({
                Bucket: "my-audio-bucket-111",
                Key: key,
                ContentType: dataType,
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