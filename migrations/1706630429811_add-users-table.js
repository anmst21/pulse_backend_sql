/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
      CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    username VARCHAR(255) UNIQUE DEFAULT NULL,
    image_link JSON DEFAULT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    bio VARCHAR(90) DEFAULT NULL, 
    link JSON DEFAULT NULL
);
    `)
};

exports.down = pgm => {
    pgm.sql(`
        DROP TABLE users;
    `)
};

