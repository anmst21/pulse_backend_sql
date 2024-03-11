const pool = require('../pool');


module.exports = (app) => {
    app.post('/ban/toggle', async (req, res) => {
        const { targetId } = req.body;
        const userId = req.headers['userid'];
        // First, find the existing record
        const findQuery = `
            SELECT * FROM followers
            WHERE leader_id = $1 AND follower_id = $2;
        `;

        try {
            const findResult = await pool.query(findQuery, [userId, targetId]);

            if (findResult.rows.length > 0) {
                // If the record exists, toggle the banned status
                const toggleBanQuery = `
                    UPDATE followers
                    SET banned = NOT banned
                    WHERE leader_id = $1 AND follower_id = $2
                    RETURNING *;
                `;
                const updateResult = await pool.query(toggleBanQuery, [userId, targetId]);
                const action = updateResult.rows[0].banned ? 'ban' : 'unban';

                res.json({
                    message: "Successfully toggled ban status.",
                    action,
                    follower: updateResult.rows[0]
                });
            } else {
                // If no record exists, insert a new one with banned set to true
                const insertQuery = `
                    INSERT INTO followers (leader_id, follower_id, banned, subscribed)
                    VALUES ($1, $2, true, 'false')
                    RETURNING *;
                `;
                const insertResult = await pool.query(insertQuery, [userId, targetId]);
                console.log({
                    message: "Follower added with ban status true.",
                    follower: insertResult.rows[0]
                })
                res.json({
                    message: "Follower added with ban status true.",
                    follower: insertResult.rows[0]
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error processing your request." });
        }
    });
}