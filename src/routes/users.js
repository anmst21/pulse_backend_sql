const UserRepo = require('../repos/user-repo');
const jwt = require("jsonwebtoken");
const passport = require("passport");






module.exports = (app) => {
    app.post('/users', async (req, res) => {
        const { username, bio } = req.body;

        const user = await UserRepo.insert(username, bio)
        console.log(user);
        res.send(user)

    })


    app.post('/user/signup', async (req, res) => {
        try {

            const { userName, password, email } = req.body;

            let user = await UserRepo.findByEmail(email)
            if (user) {
                return res.status(400).json({ message: "User already registered." });
            }
            user = await UserRepo.create(userName, password, email);

            req.logIn(user, { session: false }, async (err) => {
                if (err) return next(err);

                try {
                    const token = jwt.sign({ userId: user.id }, "process.env.JWT_SECRET");
                    console.log(token);
                    res.json({
                        message: "User registered and authenticated successfully.",
                        email: email,
                        userId: user.id.toString(),
                        token,
                        userName,
                    });
                } catch (error) {
                    console.log(error);
                    return next(error);
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server Error" });
        }


    })


    app.post("/user/signin", (req, res, next) => {
        passport.authenticate("local", (err, user, info) => {
            if (err) return next(err);
            if (!user) return res.status(422).send({ error: info.message });

            req.logIn(user, { session: false }, async (err) => {
                if (err) return next(err);

                try {
                    const token = jwt.sign({ userId: user.id }, "process.env.JWT_SECRET");

                    // Send back both the token and the user ID
                    res.send({
                        token,
                        userId: user.id.toString(),
                        userInfo: user,
                    });
                } catch (err) {
                    return next(err);
                }
            });
        })(req, res, next);
    });
}


