/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
CREATE TABLE post_seen (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    audio_id INTEGER NOT NULL,
    seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (audio_id) REFERENCES audios(id) ON DELETE CASCADE,
    UNIQUE(user_id, audio_id) 
);
    `)
};

exports.down = pgm => {
    pgm.sql(`
        DROP TABLE post_seen;
    `)
};
