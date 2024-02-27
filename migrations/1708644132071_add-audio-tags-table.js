/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
   CREATE TABLE tags(
    audio_id INT,
    genre_id INT,
    PRIMARY KEY (audio_id, genre_id),
    FOREIGN KEY (audio_id) REFERENCES audios(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);
    `)
};

exports.down = pgm => {
    pgm.sql(`
        DROP TABLE tags;
    `)
};





