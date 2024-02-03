/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
        CREATE TABLE audios (
            id SERIAL PRIMARY KEY,
            duration INTEGER,
            audio_link TEXT NOT NULL,
            file_name TEXT,
            size TEXT,
            date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            bpm INTEGER DEFAULT NULL,
            track JSONB, -- JSONB type is used for storing JSON objects
            sound_levels JSONB, -- JSONB type for storing the array of sound level objects
            extension TEXT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(255) NOT NULL CHECK (type IN ('spotify', 'file', 'recording')),
            FOREIGN KEY (user_id) REFERENCES users(id) -- Assuming a 'users' table exists
        );
    `)
};

exports.down = pgm => {
    pgm.sql(`
        DROP TABLE audios;
    `)
};



