/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
        CREATE TABLE notifications (
            id SERIAL PRIMARY KEY,
            to_user_id INTEGER NOT NULL,
            from_user_id INTEGER NOT NULL,
            type VARCHAR(255) NOT NULL CHECK (type IN ('follow', 'subscription_request')),
            seen BOOLEAN NOT NULL DEFAULT false,
            date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (to_user_id) REFERENCES users(id),
            FOREIGN KEY (from_user_id) REFERENCES users(id)
        );
    `)
};

exports.down = pgm => {
    pgm.sql(`
        DROP TABLE notifications;
    `)
};
