/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
CREATE TABLE post_reports (
    id SERIAL PRIMARY KEY,
    audio_id INTEGER NOT NULL,
    reporter_user_id INTEGER NOT NULL,
    owner_user_id INTEGER NOT NULL,
    date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (audio_id) REFERENCES audios(id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);
    `)
};

exports.down = pgm => {
    pgm.sql(`
        DROP TABLE post_reports;
    `)
};
