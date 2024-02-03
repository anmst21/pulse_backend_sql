const pool = require('../pool');


module.exports = (app, io, userSockets) => {
    app.post('/user/follow', async (req, res) => {
        try {
            const { leaderId, followerId } = req.body; // IDs of the users involved in the follow action
            // Check if the follower relationship already exists
            const existingFollow = await pool.query('SELECT id FROM followers WHERE leader_id = $1 AND follower_id = $2', [leaderId, followerId]);
            if (existingFollow.rows.length > 0) {
                return res.status(400).json({ message: "Already following this user." });
            }
            await pool.query('INSERT INTO followers (leader_id, follower_id) VALUES ($1, $2)', [leaderId, followerId]);
            // Insert the new follower relationship
            await pool.query(`
                INSERT INTO notifications (to_user_id, from_user_id, type)
                VALUES ($1, $2, $3)
            `, [followerId, leaderId, 'follow']);

            const query = 'SELECT * FROM users WHERE id = $1';
            const { rows } = await pool.query(query, [leaderId]);
            console.log("user", rows[0].username)

            const targetSocketId = userSockets[followerId];

            if (targetSocketId) {
                io.to(targetSocketId).emit("notification", {
                    message: `User  ${rows[0].username} is now following you`,
                });
            }
            //${updatedUser.userName}

            res.status(200).json({ message: "Followed successfully" });
        } catch (error) {
            console.error('Full error:', error);
            res.status(500).json({ message: "Server error", error: error.toString() });

        }
    })

    app.post('/user/unfollow', async (req, res) => {
        try {
            const { leaderId, followerId } = req.body; // IDs of the users involved in the unfollow action

            // Delete the follower relationship
            await pool.query('DELETE FROM followers WHERE leader_id = $1 AND follower_id = $2', [leaderId, followerId]);

            res.status(200).json({ message: "Unfollowed successfully" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    });

    app.get('/user/:id/stats', async (req, res) => {
        try {
            const userId = parseInt(req.params.id);
            const followersQuery = await pool.query(
                'SELECT COUNT(*) FROM followers WHERE follower_id = $1',
                [userId]
            );
            // Query to count followers
            const followingQuery = await pool.query(
                'SELECT COUNT(*) FROM followers WHERE leader_id = $1',
                [userId]
            );
            const followersCount = followersQuery.rows[0].count;

            // Query to count following

            const followingCount = followingQuery.rows[0].count;

            res.json({
                userId: userId,
                followers: parseInt(followersCount),
                following: parseInt(followingCount)
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error');
        }
    });

    app.get('/user/:id/following', async (req, res) => {
        try {
            const userId = parseInt(req.params.id);

            // Query to fetch the list of users the specified user is following
            const followingQuery = await pool.query(
                `SELECT
                    u.id,
                    u.email,
                    u.username,
                    u.image_link,
                    u.date_created,
                    CASE
                        WHEN f2.leader_id IS NOT NULL THEN 'true'
                        ELSE 'false'
                    END AS follows,
                    f2.subscribed
                FROM followers f
                INNER JOIN users u ON f.follower_id = u.id
                LEFT JOIN followers f2 ON f2.follower_id = u.id AND f2.leader_id = $1
                WHERE f.leader_id = $1
                ORDER BY f.created_at DESC;`,
                [userId]
            );

            res.json(followingQuery.rows);
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error');
        }
    });

    app.get('/user/:id/followers', async (req, res) => {
        try {
            const userId = parseInt(req.params.id);
            const followersQuery = await pool.query(
                `SELECT
                    u.id,
                    u.email,
                    u.username,
                    u.image_link,
                    f2.created_at,
                    CASE
                        WHEN f2.leader_id IS NOT NULL THEN 'true'
                        ELSE 'false'
                    END AS follows,
                    f2.subscribed
                FROM followers f
                INNER JOIN users u ON f.leader_id = u.id
                LEFT JOIN followers f2 ON f2.follower_id = u.id AND f2.leader_id = $1
                WHERE f.follower_id = $1
             ORDER BY f.created_at DESC;`,
                [userId]
            );

            res.json(followersQuery.rows);
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error');
        }
    })



}