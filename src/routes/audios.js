const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const pool = require('../pool');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");
const UserRepo = require('../repos/user-repo');
const axios = require("axios")


const s3Client = new S3Client({
    region: "us-east-2",
    credentials: {
        accessKeyId: process.env.AMAZON_ACCESS_KEY,
        secretAccessKey: process.env.AMAZON_SECRET_KEY,
    },
});



module.exports = (app) => {
    // app.post("/audios/img/save", async (req, res) => {
    //     try {
    //         const { imageLink, userId } = req.body;
    //         // Check if the user exists
    //         const userQuery = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

    //         if (userQuery.rows.length === 0) {
    //             return res.status(404).json({ message: "User not found" });
    //         }

    //         let user = userQuery.rows[0];

    //         // Update the existing image link
    //         const updateQuery = await pool.query(
    //             'UPDATE users SET image_link = $1 WHERE id = $2 RETURNING *',
    //             [imageLink, userId]
    //         );

    //         user = updateQuery.rows[0];

    //         res.status(200).json(user);
    //     } catch (error) {
    //         console.error("Error saving or updating image:", error);
    //         res.status(500).send("Server Error");
    //     }
    // });
    app.post("/audios/img/delete", async (req, res) => {
        try {
            const { keys } = req.body;

            if (!keys) {
                return res.status(400).send("No file keys provided");
            }

            const deleteCommandSmall = new DeleteObjectCommand({
                Bucket: "post-photo-bucket",
                Key: keys.small,
            });
            await s3Client.send(deleteCommandSmall);
            const deleteCommandMedium = new DeleteObjectCommand({
                Bucket: "post-photo-bucket",
                Key: keys.medium,
            });
            await s3Client.send(deleteCommandMedium);
            const deleteCommandLarge = new DeleteObjectCommand({
                Bucket: "post-photo-bucket",
                Key: keys.large,
            });
            await s3Client.send(deleteCommandLarge);
            res
                .status(200)
                .send({ message: "File and database record deleted successfully" });
        } catch (error) {
            console.error("Error deleting file:", error);
            res.status(500).send("Server Error");
        }
    });


    app.post("/audios/img", async (req, res) => {
        try {
            const { size } = req.body;
            const userId = req.headers['userid'];

            if (!userId) {
                return res.status(400).send("No userId provided in headers");
            }

            let uuid = uuidv4();
            const key = `${userId}/${size}/${uuid}.png`;
            const command = new PutObjectCommand({
                Bucket: "post-photo-bucket",
                Key: key,
                ContentType: "image/jpeg",
            });

            const signedUrl = await getSignedUrl(s3Client, command, {
                expiresIn: 3600,
            });
            console.log({ key, url: signedUrl })
            res.send({ key, url: signedUrl });
        } catch (err) {
            console.error(err);
            res.status(500).send("Failed to generate signed URL");
        }
    });

    app.post('/audios/seen', async (req, res) => {
        const { audioId } = req.body;
        const userId = req.headers['userid'];

        try {
            // Check if the seen record already exists
            const existingSeenResult = await pool.query(
                'SELECT * FROM post_seen WHERE user_id = $1 AND audio_id = $2',
                [userId, audioId]
            );
            const existingSeen = existingSeenResult.rows[0];

            if (!existingSeen) {
                // Record doesn't exist, add a new seen record
                await pool.query(
                    'INSERT INTO post_seen (user_id, audio_id) VALUES ($1, $2)',
                    [userId, audioId]
                );
                res.json({ message: 'Seen record added.', action: 'seen' });
            } else {
                // Record exists, optionally handle this scenario, e.g., update the seen_at timestamp or simply return a message
                // For this example, we'll just return a message indicating the audio has already been marked as seen
                res.json({ message: 'Audio has already been seen by this user.', action: 'already_seen' });
            }
        } catch (err) {
            console.error('Error handling the seen action', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    });


    app.get('/audios', async (req, res) => {
        const userId = req.headers['userid'];

        try {
            const query = `
            SELECT
                audios.*,
                users.username,
                (SELECT image_link FROM users WHERE users.id = audios.user_id) AS image_link,
                COUNT(DISTINCT CASE WHEN general_upvotes_downvotes.vote_type = true THEN general_upvotes_downvotes.id END) AS upvotes,
                COUNT(DISTINCT CASE WHEN general_upvotes_downvotes.vote_type = false THEN general_upvotes_downvotes.id END) AS downvotes,
                COUNT(DISTINCT CASE WHEN comments.parent_id IS NULL THEN comments.id END) AS comment_count,
                user_vote.vote_type AS user_vote_type,
                CASE
                    WHEN followers.follower_id IS NOT NULL THEN 'true'
                    ELSE 'false'
                END AS follows,
                followers.subscribed AS subscribed,
                CASE
                    WHEN bookmarks.id IS NOT NULL THEN 'true'
                    ELSE 'false'
                END AS bookmarked,
                location.district AS location,
                COALESCE(ps.seen_count, 0) AS seen, -- Count of all seen records for the post
                CASE
                    WHEN ps_user.is_seen IS NOT NULL THEN true
                    ELSE false
                END AS isSeen -- Whether the current user has seen the post
            FROM audios
            JOIN users ON audios.user_id = users.id
            LEFT JOIN upvotes_downvotes AS general_upvotes_downvotes ON audios.id = general_upvotes_downvotes.post_id
            LEFT JOIN comments ON audios.id = comments.post_id
            LEFT JOIN (
                SELECT post_id, vote_type
                FROM upvotes_downvotes
                WHERE user_id = $1
            ) AS user_vote ON audios.id = user_vote.post_id
            LEFT JOIN followers ON followers.leader_id = $1 AND followers.follower_id = audios.user_id
            LEFT JOIN bookmarks ON bookmarks.audio_id = audios.id AND bookmarks.user_id = $1
            LEFT JOIN location ON audios.id = location.audio_id
            LEFT JOIN (
                SELECT audio_id, COUNT(*) AS seen_count
                FROM post_seen
                GROUP BY audio_id
            ) AS ps ON audios.id = ps.audio_id
            LEFT JOIN (
                SELECT audio_id, true AS is_seen
                FROM post_seen
                WHERE user_id = $1
                GROUP BY audio_id
            ) AS ps_user ON audios.id = ps_user.audio_id
            GROUP BY audios.id, users.username, user_vote.vote_type, followers.follower_id, followers.subscribed, bookmarks.id, location.district, ps.seen_count, ps_user.is_seen
            ORDER BY audios.date_created DESC
            LIMIT 10;
        `;

            const { rows } = await pool.query(query, [userId]);

            if (rows.length === 0) {
                return res.status(404).json({ message: "No audios found." });
            }

            const enhancedRows = await Promise.all(rows.map(async (row) => {
                const tagsQuery = `
                SELECT genres.id, genres.name
                FROM genres
                JOIN tags ON tags.genre_id = genres.id
                WHERE tags.audio_id = $1;
            `;
                const tagsResult = await pool.query(tagsQuery, [row.id]);
                const tags = tagsResult.rows;

                return {
                    ...row,
                    upvotes: parseInt(row.upvotes, 10),
                    downvotes: parseInt(row.downvotes, 10),
                    comment_count: parseInt(row.comment_count, 10),
                    vote_type: row.user_vote_type,
                    bookmarked: row.bookmarked === "true",
                    tags, // Append the fetched tags here
                    isSeen: row.isseen, // Add isSeen property
                    seen: parseInt(row.seen, 10) // Add seen property
                };
            }));

            res.json(enhancedRows);
        } catch (error) {
            console.error("Error fetching audios:", error)
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
                COUNT(DISTINCT general_upvotes_downvotes.id) FILTER (WHERE general_upvotes_downvotes.vote_type = true) AS upvotes,
                COUNT(DISTINCT general_upvotes_downvotes.id) FILTER (WHERE general_upvotes_downvotes.vote_type = false) AS downvotes,
                COUNT(DISTINCT comments.id) AS comment_count, -- Count of comments for each audio
                user_vote.vote_type AS user_vote_type
            FROM audios
            JOIN users ON audios.user_id = users.id
            LEFT JOIN upvotes_downvotes AS general_upvotes_downvotes ON audios.id = general_upvotes_downvotes.post_id
            LEFT JOIN comments ON audios.id = comments.post_id -- Join with comments table
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
            if (rows.length === 0) {
                return res.status(404).json({ message: "No audios found." });
            }
            const result = rows.map(row => ({
                ...row,
                upvotes: parseInt(row.upvotes, 10),
                downvotes: parseInt(row.downvotes, 10),
                comment_count: parseInt(row.comment_count, 10), // Parse comment count to integer
                vote_type: row.user_vote_type
            }));


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

    // {
    //     "id": 27,
    //         "duration": 1416,
    //             "audio_link": "https://my-audio-bucket-111.s3.us-east-2.amazonaws.com/17/e96787f4-9145-4c09-8507-72d418fa96e2.m4a",
    //                 "file_name": "recording-F99C847E-6329-4418-A751-BC19E2E747EA.m4a",
    //                     "size": "0.06 MB",
    //                         "date_created": "2024-02-21T16:06:33.928Z",
    //                             "bpm": null,
    //                                 "track": { },
    //     "sound_levels": [
    //      
    //     ],
    //         "extension": "m4a",
    //   
    // },

    // savedAudiosavedAudiosavedAudio {
    //     id: 28,
    //         duration: 1253,
    //             audio_link: 'https://my-audio-bucket-111.s3.us-east-2.amazonaws.com/17/07adf688-627f-41d0-bfc5-106915b4d223.m4a',
    //                 file_name: 'recording-E2B32C3D-A709-4A45-86F3-FBF2EEE95506.m4a',
    //                     size: '0.06 MB',
    //                         date_created: 2024-02 - 21T16: 11: 54.538Z,
    //                             bpm: null,
    //                                 track: { },
    //     sound_levels: [
    //       
    //     ],
    //         extension: 'm4a',
    //             user_id: 17,
    //                 type: 'recording'

    //     "username": "13",
    //     "image_link": {
    //        "small": "https://my-photo-bucket-111.s3.us-east-2.amazonaws.com/17/small/bff9a320-f869-4bd9-b1ee-413f3835d406.png",
    //        "medium": "https://my-photo-bucket-111.s3.us-east-2.amazonaws.com/17/medium/c8d37e41-4606-42cf-89d4-6840d79cbeba.png",
    //        "large": "https://my-photo-bucket-111.s3.us-east-2.amazonaws.com/17/large/a33ec954-e218-4609-824f-8bb2369712b4.png"
    //     },
    //     "upvotes": 0,
    //     "downvotes": 0,
    //     "user_vote_type": null,
    //     "vote_type": null
    // }

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
                tagIds,
                lat,
                lng,
                locName,
                locDist,
                img
            } = req.body;

            console.log("oiiiiii", img)
            let query = `
            INSERT INTO audios (audio_link, duration, user_id, bpm, size, sound_levels, type, file_name, extension, track, img)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *;
        `;
            let values;

            if (type === "spotify") {
                values = [audioLink, duration, user, bpm, null, null, type, null, null, JSON.stringify(track), JSON.stringify(img)];
            } else {
                values = [audioLink, duration, user, bpm, size, JSON.stringify(soundLevels), type, fileName, extension, JSON.stringify({}), JSON.stringify(img)]; // Assuming track isn't provided for non-Spotify links either
            }
            const { rows } = await pool.query(query, values);
            const savedAudio = rows[0];
            // Now, for each tagId in tagIds, insert a new record into the tags table
            const insertTagQuery = `
                INSERT INTO tags (audio_id, genre_id)
                VALUES ($1, $2)
            `;

            // Use Promise.all to execute all insert queries in parallel (or sequentially if preferred)
            await Promise.all(tagIds.map(tagId =>
                pool.query(insertTagQuery, [savedAudio.id, tagId])
            ));


            const genreDetailsQuery = `
            SELECT g.* FROM genres g
            JOIN tags t ON g.id = t.genre_id
            WHERE t.audio_id = $1 AND t.genre_id = ANY($2::int[])
        `;
            const genresResult = await pool.query(genreDetailsQuery, [savedAudio.id, tagIds]);
            const genres = genresResult.rows;

            // Modify response to include genre details
            const response = {
                ...savedAudio,
                tags: genres
            };
            if (lat && lng) {
                const insertLocationQuery = `
                INSERT INTO location (lat, lng, name, district, audio_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING district;
            `;
                const locationValues = [lat, lng, locName, locDist, savedAudio.id];
                const locationResult = await pool.query(insertLocationQuery, locationValues);
                const locationDistrict = locationResult.rows[0].district;

                // Add location property to response object
                response.location = locationDistrict;
            }

            res.status(200).json(response);
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