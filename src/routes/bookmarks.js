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

        const { postId } = req.body;
        const userId = req.headers['userid'];

        if (!userId || !postId) {
            return res.status(400).send('Missing user ID or audio ID.');
        }

        try {
            const findQuery = `
            SELECT * FROM bookmarks
            WHERE user_id = $1 AND audio_id = $2;
        `;
            const findResult = await pool.query(findQuery, [userId, postId]);

            if (findResult.rows.length > 0) {
                const deleteQuery = `
                DELETE FROM bookmarks
                WHERE user_id = $1 AND audio_id = $2;
            `;
                await pool.query(deleteQuery, [userId, postId]);

                res.json({ action: 'deleted' });
            } else {
                const insertQuery = `
                INSERT INTO bookmarks (user_id, audio_id)
                VALUES ($1, $2);
            `;
                await pool.query(insertQuery, [userId, postId]);

                res.json({ action: 'added' });
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
            res.status(500).send('Server error while toggling bookmark.');
        }
    });

}