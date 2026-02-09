const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const querystring = require("querystring");



const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const stateKey = "spotify_auth_state";

module.exports = (app) => {
    app.post("/spotify/refresh", async (req, res) => {
        const { refreshToken } = req.body; // You might be sending the refresh token in the body

        const authOptions = {
            method: "post",
            url: "https://accounts.spotify.com/api/token",
            data: querystring.stringify({
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization:
                    "Basic " +
                    Buffer.from(`${client_id}:${client_secret}`).toString("base64"),
            },
        };

        try {
            const response = await axios(authOptions);
            if (response.status === 200) {
                const access_token = response.data.access_token;
                const expires_in = response.data.expires_in;
                res.json({
                    accessToken: access_token,
                    expiresIn: expires_in,
                });
                console.log("token has been refreshe! ", access_token);
            } else {
                // Handle any response that isn't a success
                res.status(response.status).send("Error refreshing token");
            }
        } catch (error) {
            console.error("Error refreshing access token:", error);
            res.status(500).send("Internal Server Error");
        }
    });

    app.get("/spotify/callback", async (req, res) => {
        var code = req.query.code || null;
        var state = req.query.state || null;
        const authOptions = {
            method: "post",
            url: "https://accounts.spotify.com/api/token",
            data: querystring.stringify({
                code: code,
                redirect_uri: redirect_uri,
                grant_type: "authorization_code",
            }),
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                Authorization:
                    "Basic " +
                    new Buffer.from(client_id + ":" + client_secret).toString("base64"),
            },
        };

        try {
            const response = await axios(authOptions);
            if (response.status === 200) {
                const access_token = response.data.access_token;
                const refresh_token = response.data.refresh_token;
                const expires_in = response.data.expires_in;

                // Redirect to the app with the tokens
                res.redirect(
                    `pulse://callback?access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}`
                );
            }
        } catch (error) {
            console.error(error);
        }
    });

    app.get("/spotify/login", (req, res) => {
        const state = uuidv4();
        const scope = "user-read-private user-read-email";
        res.cookie(stateKey, state);
        res.redirect(
            "https://accounts.spotify.com/authorize?" +
            querystring.stringify({
                response_type: "code",
                client_id,
                scope,
                redirect_uri,
                state,
                show_dialog: true,
            })
        );
    });

}