const pool = require('../pool');
const toCamelCase = require('./utils/to-camel-case')
const bcrypt = require('bcrypt')

class UserRepo {


    static async insert(username, bio) {
        const { rows } = await pool.query('INSERT INTO users (username, bio) VALUES ($1, $2) RETURNING *;', [username, bio])
        console.log(rows);
        return toCamelCase(rows)[0];
    }
    static async create(username, password, email) {
        console.log("username, password, email", username, password, email)
        const saltRounds = 10; // Adjust saltRounds as needed
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the user with the hashed password into the database
        // Make sure the order of parameters matches the order of columns in the INSERT statement
        const query = 'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *;';
        const { rows } = await pool.query(query, [username, hashedPassword, email]);

        console.log(rows);
        return toCamelCase(rows)[0]; // Assuming toCamelCase is a function you've defined
    }

    static async login(username, password) {

        const saltRounds = 10; // Adjust saltRounds as needed
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the user with the hashed password into the database
        const query = 'INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING *;';
        const { rows } = await pool.query(query, [username, hashedPassword, email]);

        console.log(rows);
        return toCamelCase(rows)[0]; // Assuming toCamelCase is a function you've defined
    }

    static async findByEmail(email) {
        // Query the database for a user with the given email
        const query = 'SELECT id, username, email, password FROM users WHERE email = $1;';
        const { rows } = await pool.query(query, [email]);

        // If no user is found, return null or handle as appropriate
        if (rows.length === 0) {
            return null;
        }

        // Assuming toCamelCase converts row names to camelCase properties
        return toCamelCase(rows)[0];
    }

    static async findById(id) {
        // Query the database for a user with the given id
        const query = 'SELECT * FROM users WHERE id = $1;';
        const { rows } = await pool.query(query, [id]);

        // If no user is found, return null or handle as appropriate
        if (rows.length === 0) {
            return null;
        }

        // Assuming toCamelCase converts row names to camelCase properties
        return toCamelCase(rows)[0];
    }
    static async userData(userId) {

        const userQuery = await pool.query(
            'SELECT id, username, email, image_link, bio, link FROM users WHERE id = $1',
            [userId]
        );

        const user = userQuery.rows[0];

        if (!user) {
            return null;
        }
        const followingCountQuery = await pool.query(
            'SELECT COUNT(*) FROM followers WHERE leader_id = $1',
            [userId]
        );



        // Query to count the number of following
        const followersCountQuery = await pool.query(
            'SELECT COUNT(*) FROM followers WHERE follower_id = $1',
            [userId]
        );

        const subscriptionsCountQuery = await pool.query(
            'SELECT COUNT(*) FROM followers WHERE leader_id = $1 AND subscribed = \'true\'',
            [userId]
        );

        const subscribersCountQuery = await pool.query(
            'SELECT COUNT(*) FROM followers WHERE follower_id = $1 AND subscribed = \'true\'',
            [userId]
        );

        const postsCountQuery = await pool.query(
            'SELECT COUNT(*) FROM audios WHERE user_id = $1',
            [userId]
        );

        // Adding followers and following counts to the user object
        user.followersCount = parseInt(followersCountQuery.rows[0].count);
        user.followingCount = parseInt(followingCountQuery.rows[0].count);
        user.subscribersCount = parseInt(subscribersCountQuery.rows[0].count);
        user.subscriptionsCount = parseInt(subscriptionsCountQuery.rows[0].count);
        user.postsCount = parseInt(postsCountQuery.rows[0].count);
        return user;
    }

    static async comparePassword(candidatePassword, storedHash) {
        return bcrypt.compare(candidatePassword, storedHash);
    }

}

module.exports = UserRepo;