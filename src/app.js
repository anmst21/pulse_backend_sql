const express = require('express');
const UsersRouter = require('./routes/users')
const FollowsRouter = require('./routes/follows.js')
const passport = require('passport')
const cookieParser = require("cookie-parser");
require("./services/passport.js");



module.exports = () => {
    const app = express();
    app.use(cookieParser());
    app.use(express.json());

    app.use(passport.initialize());
    app.use(UsersRouter)
    app.use(FollowsRouter)
    return app;
}

//DATABASE_URL=postgresql://anmstudios21c:Ars8YcHWNiC7@ep-white-recipe-a54nrzok.us-east-2.aws.neon.tech/pulse-db?sslmode=require yarn run migrate up
//yarn migrate create add-follows-table