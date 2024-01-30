const express = require('express');
const router = express.Router();
const pool = require('../pool');


router.get('/user/:userId/audios', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId); // Get userId from URL params and convert it to integer
        console.log(userId);

        // Check if userId is a valid number
        if (isNaN(userId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        const query = `
            SELECT * FROM audios 
            WHERE user_id = $1
            ORDER BY date_created 
        `;
        const { rows } = await pool.query(query, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "No audios found for the given user." });
        }

        res.json(rows);
    } catch (error) {
        console.error("Error fetching audios:", error);
        res.status(500).send("Server error");
    }
});



module.exports = router