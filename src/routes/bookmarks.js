const pool = require('../pool');


module.exports = (app) => {
    app.get('/bookmarks/fetch', async (req, res) => {
        const userId = req.headers['userid']; // Assuming the user ID is sent in the request headers

        // Input validation: Ensure a user ID is provided
        if (!userId) {
            return res.status(400).send('User ID is required');
        }

        try {
            const query = `
              SELECT a.*
            FROM audios a
            JOIN bookmarks b ON a.id = b.audio_id
            WHERE b.user_id = $1
            ORDER BY a.date_created DESC;
        `;

            const { rows } = await pool.query(query, [userId]);

            if (rows.length > 0) {
                res.json(rows); // Send the fetched audios as the response
            } else {
                res.status(404).send('No bookmarked audios found for the user');
            }
        } catch (error) {
            console.error('Error fetching bookmarked audios:', error);
            res.status(500).send('Server error occurred while fetching bookmarked audios');
        }
    });


    app.post('/bookmarks/toggle', async (req, res) => {
        // const userId = req.headers['userid']; // Extracting user ID from request headers
        const { audioId, userId } = req.body; // Extracting audio ID from request body

        // Input validation
        if (!userId || !audioId) {
            return res.status(400).send('Missing user ID or audio ID.');
        }

        try {
            // First, try to find a record
            const findQuery = `
            SELECT * FROM bookmarks
            WHERE user_id = $1 AND audio_id = $2;
        `;
            const findResult = await pool.query(findQuery, [userId, audioId]);

            if (findResult.rows.length > 0) {
                // If a record exists, delete it
                const deleteQuery = `
                DELETE FROM bookmarks
                WHERE user_id = $1 AND audio_id = $2;
            `;
                await pool.query(deleteQuery, [userId, audioId]);

                res.json({ action: 'deleted' }); // Indicate that a record was deleted
            } else {
                // If no record exists, insert a new one
                const insertQuery = `
                INSERT INTO bookmarks (user_id, audio_id)
                VALUES ($1, $2);
            `;
                await pool.query(insertQuery, [userId, audioId]);

                res.json({ action: 'added' }); // Indicate that a record was added
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
            res.status(500).send('Server error while toggling bookmark.');
        }
    });

}