/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
    CREATE TABLE bookmarks(
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    audio_id INTEGER NOT NULL,
    date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, audio_id), --Ensures a user can bookmark an audio only once
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(audio_id) REFERENCES audios(id) ON DELETE CASCADE
);
    `)
};

exports.down = pgm => {
    pgm.sql(`
        DROP TABLE bookmarks;
    `)
};

