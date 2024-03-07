/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
CREATE TABLE bug_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    report_reason TEXT NOT NULL,
    report_details TEXT NOT NULL,
    date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
    `)
};

exports.down = pgm => {
    pgm.sql(`
        DROP TABLE bug_reports;
    `)
};
