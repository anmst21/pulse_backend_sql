const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const UserRepo = require('../repos/user-repo');



passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    UserRepo.findById(id).then((user) => {
        done(null, user);
    });
});

passport.use(
    new LocalStrategy(
        { usernameField: "email" },
        async (email, password, done) => {
            try {
                const user = await UserRepo.findByEmail(email)

                if (!user) return done(null, false, { message: "Incorrect email" });

                const isMatch = await UserRepo.comparePassword(password, user.password);
                if (!isMatch)
                    return done(null, false, { message: "Password incorrect" });

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    )
);
