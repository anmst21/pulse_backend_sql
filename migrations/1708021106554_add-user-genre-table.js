exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
CREATE TABLE user_genre(
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    genre_id INTEGER NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_genre FOREIGN KEY(genre_id) REFERENCES genres(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_genre UNIQUE(user_id, genre_id)
);
    `)
};



exports.down = pgm => {
    pgm.sql(`
        DROP TABLE user_genre;
    `)
};

