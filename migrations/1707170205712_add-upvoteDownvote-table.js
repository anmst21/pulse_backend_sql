exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
    CREATE TABLE upvotes_downvotes(
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES audios(id) ON DELETE CASCADE,
    vote_type BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
    `)
};



exports.down = pgm => {
    pgm.sql(`
        DROP TABLE upvotes_downvotes;
    `)
};