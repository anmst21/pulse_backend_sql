const pool = require('../pool');


module.exports = (app) => {
  app.post("/add/genre", async (req, res) => {
    const { user_id, genre_id } = req.body;

    if (!user_id || !genre_id) {
      return res.status(400).send("Missing user_id or genre_id in request body.");
    }

    const checkQuery = `
    SELECT EXISTS (
      SELECT 1 FROM user_genre
      WHERE user_id = $1 AND genre_id = $2
    );
  `;

    try {
      const checkResult = await pool.query(checkQuery, [user_id, genre_id]);
      const exists = checkResult.rows[0].exists;

      if (exists) {
        // Record exists, delete it
        const deleteQuery = `
        DELETE FROM user_genre
        WHERE user_id = $1 AND genre_id = $2;
      `;
        await pool.query(deleteQuery, [user_id, genre_id]);
        res.status(200).send({ action: 'deleted', user_id, genre_id });
      } else {
        // Record does not exist, insert it
        const insertQuery = `
        INSERT INTO user_genre (user_id, genre_id)
        VALUES ($1, $2)
        RETURNING *;
      `;
        const insertResult = await pool.query(insertQuery, [user_id, genre_id]);
        res.status(201).json({ action: 'inserted', record: insertResult.rows[0] });
      }
    } catch (error) {
      console.error('Error executing toggle operation for user_genre', error.stack);
      res.status(500).send('Internal Server Error');
    }
  });
  app.get("/fetch/genres", async (req, res) => {
    const userId = parseInt(req.query.userId); // Assuming userId is passed as a query parameter
    const baseIdsToFetch = [39, 91, 138, 209, 457, 478, 480, 500, 498, 583, 780, 659, 664, 677, 8, 688, 718, 722, 592, 1258, 1313, 1288, 1334];

    const query = `
    WITH user_genres AS (
      SELECT g.id, g.name, true AS active
      FROM genres g
      JOIN user_genre ug ON ug.genre_id = g.id
      WHERE ug.user_id = $1
    ), base_genres AS (
      SELECT id, name
      FROM genres
      WHERE id = ANY($2)
    ), combined AS (
      SELECT id, name, active
      FROM user_genres
      UNION
      SELECT bg.id, bg.name, false AS active
      FROM base_genres bg
      LEFT JOIN user_genres ug ON bg.id = ug.id
      WHERE ug.id IS NULL
    )
    SELECT * FROM combined ORDER BY id;
  `;

    try {
      const { rows } = await pool.query(query, [userId, baseIdsToFetch]);
      res.json(rows);
    } catch (error) {
      console.error('Error executing fetch genres query', error.stack);
      res.status(500).send('Internal Server Error');
    }
  });

  app.get("/search/genres", async (req, res) => {
    const searchQuery = req.query.searchQuery; // Retrieve the search query from query parameters

    // SQL query to select genres with a name that matches the regex search pattern
    const query = `
        SELECT
          id,
          name
        FROM
          genres
        WHERE
          name ~* $1
        ORDER BY
          name;
    `;

    try {
      // The regex pattern for searchQuery, you might need to adjust it based on your needs
      const regexPattern = searchQuery; // For example, '.*' + searchQuery + '.*' for a contains search
      const { rows } = await pool.query(query, [regexPattern]);

      // Send the results back to the client
      res.json(rows);
    } catch (error) {
      console.error('Error executing search genres query', error.stack);
      res.status(500).send('Internal Server Error');
    }
  });

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