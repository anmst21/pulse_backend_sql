const pool = require('../pool');


module.exports = (app) => {

    app.get("/notifications/fetch", async (req, res) => {
        try {
            const userId = req.body.userId; // Ensure the userId is provided as a query parameter

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
}