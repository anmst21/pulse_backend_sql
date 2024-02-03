/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
        CREATE TABLE notifications (
            id SERIAL PRIMARY KEY,
            to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(255) NOT NULL CHECK (type IN ('follow', 'subscription_request')),
            seen BOOLEAN NOT NULL DEFAULT false,
            date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
           
        );
    `)
};

exports.down = pgm => {
    pgm.sql(`
        DROP TABLE notifications;
    `)
};
