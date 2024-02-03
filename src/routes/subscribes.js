const pool = require('../pool');


module.exports = (app, io, userSockets) => {
    app.post('/user/acceptSubscriptionRequest', async (req, res) => {
        try {
            const { leaderId, followerId, notificationId } = req.body;


            // Check if there's a pending subscription request
            const existingRequest = await pool.query('SELECT id FROM followers WHERE leader_id = $2 AND follower_id = $1 AND subscribed = $3', [leaderId, followerId, 'pending']);
            const updateQuery = `
                    UPDATE notifications 
                    SET seen = true 
                    WHERE id = $1;
                `;

            await pool.query(updateQuery, [notificationId]);
            console.log("acceptSubscriptionRequest", leaderId, followerId, notificationId, existingRequest);
            const query = 'SELECT * FROM users WHERE id = $1';
            const { rows } = await pool.query(query, [leaderId]);

            const targetSocketId = userSockets[followerId];
            if (targetSocketId) {
                io.to(targetSocketId).emit("notification", {
                    message: `User ${rows[0].username} has accepted your subscription request`,
                });
            }

            if (existingRequest.rows.length > 0) {
                // Update the subscribed field to true
                await pool.query('UPDATE followers SET subscribed = $1 WHERE leader_id = $3 AND follower_id = $2', [true, leaderId, followerId]);
                res.status(200).json({ message: "Subscription request accepted" });
            } else {
                res.status(400).json({ message: "No pending subscription request found." });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    });
    // app.post('/user/acceptSubscriptionRequest', async (req, res) => {
    //     try {
    //         const { leaderId, followerId } = req.body;

    //         // Check if there's a pending subscription request
    //         const existingRequest = await pool.query(
    //             'SELECT id FROM followers WHERE leader_id = $1 AND follower_id = $2 AND subscribed = $3',
    //             [leaderId, followerId, 'pending']
    //         );

    //         if (existingRequest.rows.length > 0) {
    //             // Update the subscribed field to true
    //             await pool.query(
    //                 'UPDATE followers SET subscribed = $1 WHERE leader_id = $2 AND follower_id = $3',
    //                 ['true', leaderId, followerId]
    //             );
    //             return res.status(200).json({ message: "Subscription request accepted" });
    //         } else {
    //             return res.status(400).json({ message: "No pending subscription request found." });
    //         }
    //     } catch (error) {
    //         console.error('Full error:', error);
    //         // It's important to return here to prevent trying to send another response
    //         return res.status(500).json({ message: "Server error", error: error.toString() });
    //     }
    // });
    app.post('/user/declineSubscriptionRequest', async (req, res) => {
        try {
            const { leaderId, followerId, notificationId } = req.body;

            // Check if there's a pending subscription request
            const existingRequest = await pool.query('SELECT id FROM followers WHERE leader_id = $2 AND follower_id = $1 AND subscribed = $3', [leaderId, followerId, 'pending']);
            const updateQuery = `
                    UPDATE notifications 
                    SET seen = true 
                    WHERE id = $1;
                `;

            await pool.query(updateQuery, [notificationId]);

            if (existingRequest.rows.length > 0) {
                // Update the subscribed field to 'declined'
                await pool.query('UPDATE followers SET subscribed = $1 WHERE leader_id = $2 AND follower_id = $3', ['declined', leaderId, followerId]);
                res.status(200).json({ message: "Subscription request declined" });
            } else {
                res.status(400).json({ message: "No pending subscription request found." });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    });
    app.post('/user/sendSubscriptionRequest', async (req, res) => {
        try {
            const { leaderId, followerId } = req.body;

            // Check if the follower relationship exists
            const existingFollow = await pool.query('SELECT id FROM followers WHERE leader_id = $1 AND follower_id = $2', [leaderId, followerId]);

            if (existingFollow.rows.length > 0) {
                // Update the subscribed field to true
                await pool.query('UPDATE followers SET subscribed = $1 WHERE leader_id = $2 AND follower_id = $3', ["pending", leaderId, followerId]);
                res.status(200).json({ message: "Request sent" });
            } else {
                res.status(400).json({ message: "Follower relationship does not exist." });
            }

            await pool.query(`
                INSERT INTO notifications (to_user_id, from_user_id, type)
                VALUES ($1, $2, $3)
            `, [followerId, leaderId, 'subscription_request']);
            const query = 'SELECT * FROM users WHERE id = $1';
            const { rows } = await pool.query(query, [leaderId]);

            const targetSocketId = userSockets[followerId];
            if (targetSocketId) {
                io.to(targetSocketId).emit("notification", {
                    message: `User ${rows[0].username} has sent you a subscription request`,
                });
            }


        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    });

    // Unsubscribe Route
    app.post('/user/unsubscribe', async (req, res) => {
        try {
            const { leaderId, followerId } = req.body;

            // Check if the follower relationship exists
            const existingFollow = await pool.query('SELECT id FROM followers WHERE leader_id = $1 AND follower_id = $2', [leaderId, followerId]);

            if (existingFollow.rows.length > 0) {
                // Update the subscribed field to the string value 'false' (matching the enum type)
                await pool.query('UPDATE followers SET subscribed = $1 WHERE leader_id = $2 AND follower_id = $3', ['false', leaderId, followerId]);
                res.status(200).json({ message: "Unsubscribed successfully" });
            } else {
                res.status(400).json({ message: "Follower relationship does not exist." });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    });


    app.get('/user/:id/subscribers', async (req, res) => {
        try {
            const userId = parseInt(req.params.id);

            const subscribersQuery = await pool.query(
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
                WHERE f.follower_id = $1 AND f.subscribed = 'true'
                ORDER BY f.created_at DESC;`,
                [userId]
                //     SELECT
                //         u.id,
                //     u.email,
                //     u.username,
                //     u.image_link,
                //     f2.created_at,
                //     CASE
                //             WHEN f2.leader_id IS NOT NULL THEN 'true'
                //             ELSE 'false'
                //         END AS follows,
                //     f2.subscribed
                //     FROM followers f
                //     INNER JOIN users u ON f.leader_id = u.id
                //     LEFT JOIN followers f2 ON f2.follower_id = u.id AND f2.leader_id = $1
                //     WHERE f.follower_id = $1
                //  ORDER BY f.created_at DESC;
            );

            res.json(subscribersQuery.rows);
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error');
        }
    });

    app.get('/user/:id/subscribing', async (req, res) => {
        try {
            const userId = parseInt(req.params.id);

            const subscriptionsQuery = await pool.query(
                `SELECT
                    u.id,
                    u.email,
                    u.username,
                    u.image_link,
                    f.created_at,
                    CASE
                        WHEN f2.leader_id IS NOT NULL THEN 'true'
                        ELSE 'false'
                    END AS follows,
                    f2.subscribed
                FROM followers f
                INNER JOIN users u ON f.follower_id = u.id
                LEFT JOIN followers f2 ON f2.follower_id = u.id AND f2.leader_id = $1
                WHERE f.leader_id = $1 AND f.subscribed = 'true'
                ORDER BY f.created_at DESC;`,
                [userId]
            );

            res.json(subscriptionsQuery.rows);
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error');
        }
    });
};