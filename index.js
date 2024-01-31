require('dotenv').config();
const express = require('express');
const http = require("http");
const socketIo = require("socket.io");
const passport = require("passport");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("./src/services/passport.js");

const app = express();
const pool = require('./src/pool.js')

const server = http.createServer(app);
const io = socketIo(server);

const userSockets = {};

io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("setUserId", (userId) => {
        userSockets[userId] = socket.id;
    });

    socket.on("disconnect", () => {
        // Removing user from the userSockets map on disconnection
        const userIdToRemove = Object.keys(userSockets).find(
            (userId) => userSockets[userId] === socket.id
        );
        if (userIdToRemove) {
            delete userSockets[userIdToRemove];
        }
        console.log("User disconnected");
    });

    socket.on("connect_error", (error) => {
        console.log("Connection Error", error);
    });
});

app.use(express.json());
app.use(passport.initialize());
app.use(cors());
app.use(cookieParser());

require("./src/routes/audios.js")(app);
require("./src/routes/follows.js")(app, io, userSockets);
require("./src/routes/subscribes.js")(app, io, userSockets);
require("./src/routes/profileImage.js")(app);
require("./src/routes/users.js")(app);
require("./src/routes/spotify.js")(app);
require("./src/routes/notifications.js")(app);


pool.connect({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        require: true,
    },
}).then(() => {
    server.listen(3005, () => {
        console.log("Listening on port 3005");
    })
}).catch((err) => console.error(err))

