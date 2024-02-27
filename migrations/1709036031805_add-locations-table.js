/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
CREATE TABLE location (
    id SERIAL PRIMARY KEY,
    lat DECIMAL(9, 6),
    lng DECIMAL(9, 6),
    name VARCHAR(255),
    district VARCHAR(255),
    audio_id INTEGER NOT NULL,
    FOREIGN KEY (audio_id) REFERENCES audios(id) ON DELETE CASCADE
);
    `)
};

exports.down = pgm => {
    pgm.sql(`
        DROP TABLE location;
    `)
};


