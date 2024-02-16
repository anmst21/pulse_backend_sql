exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
CREATE TABLE genres(
    id SERIAL PRIMARY KEY,
    name VARCHAR(240) NOT NULL
);
    `)
};



exports.down = pgm => {
    pgm.sql(`
        DROP TABLE genres;
    `)
};

