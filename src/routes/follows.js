const pool = require('../pool');


module.exports = (app, io, userSockets) => {
    app.post('/user/follow', async (req, res) => {
        try {
            const { leaderId, followerId } = req.body; // IDs of the users involved in the follow action
            console.log("leaderId, followerId", leaderId, followerId);
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



            const targetSocketId = userSockets[followerId];

            if (targetSocketId) {
                io.to(targetSocketId).emit("notification", {
                    message: `User ${updatedUser.userName} is now following you`,
                });
            }


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
                `SELECT u.*, 
                    f_subscribed.subscribed as subscribed,
                    CASE WHEN f_reverse.follower_id IS NOT NULL THEN 'true' ELSE 'false' END as follows
             FROM users u
             INNER JOIN followers f ON u.id = f.follower_id
             LEFT JOIN followers f_subscribed ON f_subscribed.follower_id = f.leader_id AND f_subscribed.leader_id = f.follower_id
             LEFT JOIN followers f_reverse ON f_reverse.follower_id = f.leader_id AND f_reverse.leader_id = u.id
             WHERE f.leader_id = $1`,
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
                `SELECT u.*, 
                    f_subscribed.subscribed as subscribed,
                    CASE WHEN f_reverse.follower_id IS NOT NULL THEN 'true' ELSE 'false' END as follows
             FROM users u
             INNER JOIN followers f ON u.id = f.leader_id
             LEFT JOIN followers f_subscribed ON f_subscribed.leader_id = f.follower_id AND f_subscribed.follower_id = f.leader_id
             LEFT JOIN followers f_reverse ON f_reverse.leader_id = f.follower_id AND f_reverse.follower_id = u.id
             WHERE f.follower_id = $1`,
                [userId]
            );

            res.json(followersQuery.rows);
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error');
        }
    })



}