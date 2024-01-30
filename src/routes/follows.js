const express = require('express');
const router = express.Router();
const FollowsRepo = require('../repos/follows-repo');
const pool = require('../pool');

router.post('/user/follow', async (req, res) => {

    try {
        const { leaderId, followerId } = req.body; // IDs of the users involved in the follow action

        // Check if the follower relationship already exists
        const existingFollow = await pool.query('SELECT id FROM followers WHERE leader_id = $1 AND follower_id = $2', [leaderId, followerId]);
        if (existingFollow.rows.length > 0) {
            return res.status(400).json({ message: "Already following this user." });
        }

        // Insert the new follower relationship
        await pool.query('INSERT INTO followers (leader_id, follower_id) VALUES ($1, $2)', [leaderId, followerId]);

        res.status(200).json({ message: "Followed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }

})

router.post('/user/unfollow', async (req, res) => {
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

router.get('/user/:id/stats', async (req, res) => {
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

router.get('/user/:id/following', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Query to fetch the list of users the specified user is following
        const followingQuery = await pool.query(
            'SELECT users.* FROM users INNER JOIN followers ON users.id = followers.leader_id WHERE followers.follower_id = $1',
            [userId]
        );

        res.json(followingQuery.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

router.get('/user/:id/followers', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Query to fetch the list of users who follow the specified user
        const followersQuery = await pool.query(
            'SELECT users.* FROM users INNER JOIN followers ON users.id = followers.follower_id WHERE followers.leader_id = $1',
            [userId]
        );

        res.json(followersQuery.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
})


router.get('/user/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Query to fetch the user details
        const userQuery = await pool.query(
            'SELECT id, username, email, image_link FROM users WHERE id = $1',
            [userId]
        );
        // If user not found
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = userQuery.rows[0];

        // Query to count the number of followers
        const followersCountQuery = await pool.query(
            'SELECT COUNT(*) FROM followers WHERE leader_id = $1',
            [userId]
        );

        // Query to count the number of following
        const followingCountQuery = await pool.query(
            'SELECT COUNT(*) FROM followers WHERE follower_id = $1',
            [userId]
        );

        const postsCountQuery = await pool.query(
            'SELECT COUNT(*) FROM audios WHERE user_id = $1',
            [userId]
        );

        // Adding followers and following counts to the user object
        user.followersCount = parseInt(followersCountQuery.rows[0].count);
        user.followingCount = parseInt(followingCountQuery.rows[0].count);
        user.postsCount = parseInt(postsCountQuery.rows[0].count);

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});


module.exports = router