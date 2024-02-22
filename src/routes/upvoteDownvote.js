const pool = require('../pool');


module.exports = (app) => {

    app.post('/vote', async (req, res) => {
        const { post_id, vote_type } = req.body;
        const user_id = req.headers['userid'];

        try {
            const existingVoteResult = await pool.query(
                'SELECT * FROM upvotes_downvotes WHERE user_id = $1 AND post_id = $2',
                [user_id, post_id]
            );

            const existingVote = existingVoteResult.rows[0];

            let responseVoteType = vote_type; // Default to the vote_type in the request

            if (existingVote) {
                if (existingVote.vote_type === vote_type) {
                    // Same vote type, remove the record
                    await pool.query(
                        'DELETE FROM upvotes_downvotes WHERE id = $1',
                        [existingVote.id]
                    );
                    responseVoteType = null; // Since the vote is removed, set response vote_type to null
                    res.json({ message: 'Vote removed.', vote_type: responseVoteType, action: "delete" });
                } else {
                    // Different vote type, update the record
                    await pool.query(
                        'UPDATE upvotes_downvotes SET vote_type = $1, updated_at = NOW() WHERE id = $2',
                        [vote_type, existingVote.id]
                    );
                    // Response vote_type remains the same as the request
                    res.json({ message: 'Vote updated.', vote_type: responseVoteType, action: "update" });
                }
            } else {
                // No existing vote, insert a new record
                await pool.query(
                    'INSERT INTO upvotes_downvotes (user_id, post_id, vote_type, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
                    [user_id, post_id, vote_type]
                );
                // Response vote_type remains the same as the request
                res.json({ message: 'Vote added.', vote_type: responseVoteType, action: "add" });
            }
        } catch (err) {
            console.error('Error handling the vote', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    });


    app.get('/vote/:postId', async (req, res) => {
        const { postId } = req.params;

        try {
            // Query to count true (upvotes) and false (downvotes) values for the given post_id
            const voteCountsResult = await pool.query(
                `SELECT 
                COUNT(*) FILTER (WHERE vote_type = true) AS upvotes,
                COUNT(*) FILTER (WHERE vote_type = false) AS downvotes
             FROM upvotes_downvotes
             WHERE post_id = $1`,
                [postId]
            );

            // Assuming only one row will be returned as we are doing aggregate functions across all records for a post_id
            const { upvotes, downvotes } = voteCountsResult.rows[0];

            res.json({
                postId,
                upvotes: parseInt(upvotes, 10),
                downvotes: parseInt(downvotes, 10)
            });
        } catch (err) {
            console.error('Error fetching vote counts', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
}