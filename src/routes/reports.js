const pool = require('../pool');


module.exports = (app) => {
    app.post('/report/bug', async (req, res) => {
        const userId = req.headers['userid'];

        const { reportReason, reportDetails } = req.body;

        if (!userId || !reportReason || !reportDetails) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        try {
            const insertBugReportQuery = `
            INSERT INTO bug_reports (user_id, report_reason, report_details, date_created)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            RETURNING id;  -- Returning the id of the new bug report for confirmation
        `;

            const { rows } = await pool.query(insertBugReportQuery, [userId, reportReason, reportDetails]);

            if (rows.length) {
                return res.status(201).json({ message: "Bug report successfully submitted", reportId: rows[0].id });
            } else {
                return res.status(500).json({ message: "Failed to submit bug report" });
            }
        } catch (error) {
            console.error("Error submitting bug report:", error);
            res.status(500).send("Server error");
        }
    });

    app.post('/report/post', async (req, res) => {
        const userId = req.headers['userid'];

        const { audioId, ownerUserId, reportReason, reportDetails } = req.body;

        if (!userId || !audioId || !ownerUserId) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        try {
            const insertReportQuery = `
            INSERT INTO post_reports (audio_id, reporter_user_id, owner_user_id, report_reason, report_details, date_created)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            RETURNING id; 
        `;

            const { rows } = await pool.query(insertReportQuery, [audioId, userId, ownerUserId, reportReason, reportDetails]);

            if (rows.length) {
                return res.status(201).json({ message: "Report successfully submitted", reportId: rows[0].id });
            } else {
                return res.status(500).json({ message: "Failed to submit report" });
            }
        } catch (error) {
            console.error("Error submitting report:", error);
            res.status(500).send("Server error");
        }
    });
}