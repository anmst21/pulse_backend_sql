/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
     CREATE TYPE subscription_status AS ENUM ('false', 'pending', 'true', 'declined');
      CREATE TABLE followers(
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        leader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(leader_id, follower_id),
        subscribed subscription_status NOT NULL DEFAULT 'false'
);
    `)
};

exports.down = pgm => {
    pgm.sql(`
        DROP TYPE subscription_status;
        DROP TABLE followers;
    `)
};



