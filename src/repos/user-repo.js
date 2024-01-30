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

    static async comparePassword(candidatePassword, storedHash) {
        return bcrypt.compare(candidatePassword, storedHash);
    }

}

module.exports = UserRepo;