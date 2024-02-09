const pool = require('../pool');


module.exports = (app) => {
  app.get("/search/profiles", async (req, res) => {
    const loggedInUserId = req.query.loggedInUserId;
    const searchQuery = req.query.searchQuery; // Retrieve the search query from query parameters

    // Use ILIKE for case-insensitive matching and '%' wildcards to find matches containing the searchQuery
    const query = `
        SELECT
          u.id,
          u.email,
          u.username,
          u.image_link,
          u.date_created,
          CASE
            WHEN f1.follower_id IS NOT NULL THEN 'true'
            ELSE 'false'
          END AS follows,
          f1.subscribed
        FROM
          users u
        LEFT JOIN followers f1 ON f1.leader_id = $1  AND f1.follower_id = u.id
        WHERE
          u.username ILIKE $2 -- Use ILIKE for case-insensitive search and '%' for partial matches
        ORDER BY
          u.date_created DESC;
    `;

    try {
      // Use '%' wildcards to match any profiles that contain the searchQuery
      const searchPattern = `%${searchQuery}%`;
      const { rows } = await pool.query(query, [loggedInUserId, searchPattern]);

      // Send the results back to the client
      res.json(rows);
    } catch (error) {
      console.error('Error executing query', error.stack);
      res.status(500).send('Internal Server Error');
    }
  });
  app.get("/search/fetchInitialProfiles", async (req, res) => {
    const loggedInUserId = req.query.loggedInUserId;
    const query = `
            SELECT
              u.id,
              u.email,
              u.username,
              u.image_link,
              u.date_created,
              CASE
                WHEN f1.follower_id IS NOT NULL THEN 'true'
                ELSE 'false'
              END AS follows,
              f1.subscribed
            FROM
              users u
            LEFT JOIN followers f1 ON f1.leader_id = $1 AND f1.follower_id = u.id
            ORDER BY
              u.date_created DESC;
        `;

    try {
      // Execute the query
      const { rows } = await pool.query(query, [loggedInUserId]);
      // Send the results back to the client
      res.json(rows);
    } catch (error) {
      console.error('Error executing query', error.stack);
      res.status(500).send('Internal Server Error');
    }

  })
}