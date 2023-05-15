const User = require('../model/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const handleLogin = async (req, res) => {
    const { user, pwd, persist } = req.body;
    if (!user || !pwd) return res.status(400).json({ 'message': 'Username and password are required.' });

    const foundUser = await User.findOne({ username: user }).exec();
    if (!foundUser) return res.sendStatus(401); //Unauthorized 
    // evaluate password 
    const match = await bcrypt.compare(pwd, foundUser.password);
    if (match) {
        const roles = Object.values(foundUser.roles).filter(Boolean);
        // create JWTs
        const accessToken = jwt.sign(
            {
                "UserInfo": {
                    "username": foundUser.username,
                    "roles": roles
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '10m' }
        );
        const hashedUsername1 = await bcrypt.hash(foundUser.username, 10);
        const refreshTokenCookie = jwt.sign(
            { "username": hashedUsername1 },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '10d'}
        );
        const hashedUsername2 = await bcrypt.hash(foundUser.username, 10);
        const refreshTokenApp = jwt.sign(
            { "username": hashedUsername2 },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '10d'}
        );

        foundUser.persistLogin = persist;
        foundUser.refreshTokenCookie = refreshTokenCookie;
        foundUser.refreshTokenApp = refreshTokenApp;
        const result = await foundUser.save();
        // console.log(result);
        
        res.cookie('jwt', refreshTokenCookie, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 10 * 24 * 60 * 60 * 1000, overwrite: true });

        res.json({ user, roles, accessToken, refreshTokenApp });

    } else {
        res.sendStatus(401);
    }
}

module.exports = { handleLogin };