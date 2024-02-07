const pool = require('../pool');


module.exports = (app) => {

    app.post('/comments', async (req, res) => {
        const { contents, user_id, post_id } = req.body;

        if (!contents || !user_id || !post_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        try {
            // Step 1: Insert the comment
            const insertResult = await pool.query(
                'INSERT INTO comments (contents, user_id, post_id) VALUES ($1, $2, $3) RETURNING *;',
                [contents, user_id, post_id]
            );

            const newComment = insertResult.rows[0];

            // Step 2: Fetch the user details
            const userResult = await pool.query(
                'SELECT username, image_link FROM users WHERE id = $1;',
                [newComment.user_id]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = userResult.rows[0];

            // Combine the comment and user details
            const response = {
                ...newComment,
                username: user.username,
                image_link: user.image_link,
                liked: false,
                likes_count: 0
            };

            // Respond with the inserted comment and user details
            res.status(201).json(response);
        } catch (err) {
            console.error('Error inserting comment', err.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    });


    app.get('/comments/:postId/:userId', async (req, res) => {
        const { postId, userId } = req.params;

        try {
            const query = `
        SELECT comments.id, comments.contents, comments.created_at, comments.updated_at, comments.post_id, comments.user_id,
               users.username, users.image_link,
               (SELECT COUNT(*) FROM comment_likes WHERE comment_likes.comment_id = comments.id) AS likes_count,
               EXISTS(SELECT 1 FROM comment_likes WHERE comment_likes.comment_id = comments.id AND comment_likes.user_id = $2) AS liked
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.post_id = $1
        ORDER BY comments.created_at DESC;
        `;
            const { rows } = await pool.query(query, [postId, userId]);

            res.json({
                success: true,
                comments: rows.map(row => ({
                    ...row,
                    liked: row.liked === true,
                    likes_count: parseInt(row.likes_count)
                })),
            });
        } catch (error) {
            console.error('Error fetching comments:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    });


    app.delete('/comments/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const deleteOp = await pool.query('DELETE FROM comments WHERE id = $1 RETURNING *', [id]);
            if (deleteOp.rowCount === 0) {
                return res.status(404).json({ message: "Comment not found" });
            }
            res.json({ message: "Comment deleted successfully", deletedComment: deleteOp.rows[0] });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    });

    app.put('/comments/:id', async (req, res) => {
        const { id } = req.params;
        const { contents } = req.body; // Assuming the new contents are provided in the body

        if (!contents) {
            return res.status(400).json({ message: "Please provide new content for the comment." });
        }

        try {
            const updateOp = await pool.query(
                'UPDATE comments SET contents = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                [contents, id]
            );
            if (updateOp.rowCount === 0) {
                return res.status(404).json({ message: "Comment not found" });
            }
            res.json({ message: "Comment updated successfully", updatedComment: updateOp.rows[0] });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    });


    app.post('/comments/like', async (req, res) => {
        const { user_id, comment_id } = req.body; // Assuming the front end sends user_id and comment_id

        try {
            // Check if the like already exists
            const existingLikeResult = await pool.query(
                'SELECT * FROM comment_likes WHERE user_id = $1 AND comment_id = $2',
                [user_id, comment_id]
            );
            const existingLike = existingLikeResult.rows[0];

            if (existingLike) {
                // Like exists, so unlike (delete the like)
                await pool.query(
                    'DELETE FROM comment_likes WHERE id = $1',
                    [existingLike.id]
                );
                res.json({ message: 'Like removed.', action: 'unlike' });
            } else {
                // Like doesn't exist, add a new like
                await pool.query(
                    'INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)',
                    [comment_id, user_id]
                );
                res.json({ message: 'Like added.', action: 'like' });
            }
        } catch (err) {
            console.error('Error handling the like/unlike action', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
}