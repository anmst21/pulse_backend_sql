const pool = require('../pool');
const fs = require('fs').promises;
const path = require('path'); // Import path module




module.exports = (app) => {

    app.get("/notifications/fetch", async (req, res) => {
        try {
            const userId = req.query.userId; // Ensure the userId is provided as a query parameter

            if (isNaN(userId)) {

                return res.status(400).json({ message: "Invalid user ID" });
            }

            const query = `
                                SELECT 
                                    n.id, 
                                    n.type, 
                                    n.seen, 
                                    n.date,
                                    u.id AS from_user_id, 
                                    u.username, 
                                    u.email, 
                                    u.image_link 
                                FROM 
                                    notifications n
                                INNER JOIN 
                                    users u ON n.from_user_id = u.id
                                WHERE 
                                    n.to_user_id = $1 AND 
                                    n.seen = false
                                ORDER BY 
                                    n.date DESC;
                            `;

            const { rows } = await pool.query(query, [userId]);
            res.json(rows);
        } catch (error) {
            console.error("Error fetching notifications:", error);
            res.status(500).json({ message: "Server Error" });
        }
    })

    app.post("/notifications/markSeen", async (req, res) => {
        try {
            const { notificationId } = req.body;

            if (!notificationId) {
                return res.status(400).json({ message: "Notification ID is required" });
            }

            const updateQuery = `
                    UPDATE notifications 
                    SET seen = true 
                    WHERE id = $1;
                `;

            await pool.query(updateQuery, [notificationId]);

            res.status(200).json({ message: "Notification marked as seen" });
        } catch (error) {
            console.error("Error updating notification:", error);
            res.status(500).json({ message: "Server Error" });
        }
    })
    // app.post("/add/genres", async (req, res) => {
    //     try {
    //         // Function to insert genres into the database
    //         const insertGenres = async (genres) => {
    //             await pool.query('BEGIN');
    //             for (const genre of genres) {
    //                 await pool.query('INSERT INTO genres (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [genre.id, genre.name]);
    //             }
    //             await pool.query('COMMIT');
    //             console.log('Genres inserted successfully.');
    //         };

    //         // Corrected file path using __dirname to get the absolute path
    //         const filePath = path.join(__dirname, 'spotifyGenres.json');

    //         // Read the file and parse the JSON
    //         const data = await fs.readFile(filePath, 'utf8'); // utf8 encoding ensures you get a string back
    //         const genres = JSON.parse(data);

    //         // Insert the genres into the database
    //         await insertGenres(genres);

    //         // Respond once the genres have been inserted
    //         res.status(200).json({ message: "Genres added to db successfully." });
    //     } catch (error) {
    //         // If an error occurs, log it and send a server error response
    //         console.error("Error on /add/genres route:", error);
    //         res.status(500).json({ message: "Server Error", error: error.message });
    //     }
    // });
}