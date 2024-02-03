const UserRepo = require('../repos/user-repo');
const jwt = require("jsonwebtoken");
const passport = require("passport");
const pool = require('../pool');





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

            console.log("userName, password, email", userName, password, email)
            let user = await UserRepo.findByEmail(email)
            if (user) {
                return res.status(400).json({ message: "User already registered." });
            }
            user = await UserRepo.create(userName, password, email);
            const userWithData = await UserRepo.userData(user.id)
            req.logIn(user, { session: false }, async (err) => {
                if (err) return next(err);

                try {
                    const token = jwt.sign({ userId: user.id }, "process.env.JWT_SECRET");
                    res.json({
                        message: "User registered and authenticated successfully.",
                        email: email,
                        userId: user.id.toString(),
                        token,
                        userName,
                        userInfo: userWithData
                    });
                } catch (error) {
                    console.error(error)
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server Error" });
        }


    })


    app.post("/user/signin", async (req, res, next) => {
        passport.authenticate("local", (err, user, info) => {
            if (err) return next(err);
            if (!user) return res.status(422).send({ error: info.message });
            // axios.get(`http://localhost:3005/user/${user.i}`)
            req.logIn(user, { session: false }, async (err) => {
                if (err) return next(err);

                try {
                    const token = jwt.sign({ userId: user.id }, "process.env.JWT_SECRET");
                    const userWithData = await UserRepo.userData(user.id)
                    // Send back both the token and the user ID
                    res.send({
                        token,
                        userId: user.id.toString(),
                        userInfo: userWithData,
                    });
                } catch (err) {
                    return next(err);
                }
            });
        })(req, res, next);
    });



    app.get('/user/:id', async (req, res) => {
        try {
            const userId = parseInt(req.params.id);

            // Query to fetch the user details

            // If user not found


            const userWithData = await UserRepo.userData(userId)
            if (userWithData === null) {
                return res.status(404).json({ message: "User not found" });
            }
            // Query to count the number of followers


            res.json(userWithData);
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error');
        }
    });

}


