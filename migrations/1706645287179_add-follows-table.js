/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
    CREATE TYPE follower_status AS ENUM ('follows', 'pending', 'accepted', 'declined', 'banned');

      CREATE TABLE followers(
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        leader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       follower_status NOT NULL DEFAULT 'follows'
        UNIQUE(leader_id, follower_id),
);
    `)
};

exports.down = pgm => {
    pgm.sql(`
    DROP TABLE followers;
    DROP TYPE follower_status;   
    `)
};



