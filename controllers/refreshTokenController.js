const User = require('../model/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshTokenCookie = cookies.jwt;

    const foundUser = await User.findOne({ refreshTokenCookie }).exec();
    if (!foundUser) return res.sendStatus(403); //Forbidden 
    // evaluate jwt 
    //  prvi if je da li 
    if (foundUser.persistLogin) {
        jwt.verify(
            refreshTokenCookie,
            process.env.REFRESH_TOKEN_SECRET,
            async (err, decoded) => {
                const match = await bcrypt.compare(foundUser.username,decoded.username);
                // console.log(new Date(decoded.exp * 1000)) datum kada prolazi, oduzmi datume 
                const calculatedExpiresIn = Math.floor((decoded.exp * 1000 - (new Date()).getTime())/1000);
               
                if (err || !match) return res.sendStatus(403);
                const roles = Object.values(foundUser.roles);
                const accessToken = jwt.sign(
                    {
                        "UserInfo": {
                            "username": decoded.username,
                            "roles": roles
                        }
                    },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: '10m' }
                );
                const hashedUsername1 = await bcrypt.hash(foundUser.username, 10);

                const newRefreshTokenCookie = jwt.sign(
                    { "username": hashedUsername1 },
                    process.env.REFRESH_TOKEN_SECRET,
                    { expiresIn: calculatedExpiresIn}
                );
                const hashedUsername2 = await bcrypt.hash(foundUser.username, 10);

                const refreshTokenApp = jwt.sign(
                    { "username": hashedUsername2 },
                    process.env.REFRESH_TOKEN_SECRET,
                    { expiresIn: calculatedExpiresIn}
                );

                const user = foundUser.username;
                // console.log(user);

                foundUser.refreshTokenCookie = newRefreshTokenCookie;
                foundUser.refreshTokenApp = refreshTokenApp;
                const result = await foundUser.save();
                // console.log(result);

                res.cookie('jwt', newRefreshTokenCookie, { httpOnly: true, secure: true, sameSite: 'None', maxAge: calculatedExpiresIn*1000, overwrite: true });

                // Send authorization roles and access token to user
                return res.json({ user, roles, accessToken, refreshTokenApp });
            }
        );
    }
    else if(req.body?.refreshTokenApp){
        jwt.verify(
            // ok big brain idea, da bi ostao ulogovan dok se browser ne ugasi, stavi refresh token app u cookie session storage i eto bum tras ananas, takodje stavi svuda datetime.now - 10d za novi refresh
            req.body.refreshTokenApp,
            process.env.REFRESH_TOKEN_SECRET,
            async (err, decoded) => {
                const match = await bcrypt.compare(foundUser.username,decoded.username);
                // mozda sad trebam da nadjem usera po body.refreshtokenapp , / mislmi da sam to sredio sa trecom stavkom u ifu
                // console.log('provera match')

                const calculatedExpiresIn = Math.floor((decoded.exp * 1000 - (new Date()).getTime())/1000);


                if (err || !match ) return res.sendStatus(403);
                if(foundUser.refreshTokenApp!=req.body.refreshTokenApp) return res.sendStatus(498);
                const roles = Object.values(foundUser.roles);
                const accessToken = jwt.sign(
                    {
                        "UserInfo": {
                            "username": decoded.username,
                            "roles": roles
                        }
                    },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: '10m' }
                );
                
                const hashedUsername2 = await bcrypt.hash(foundUser.username, 10);

                const refreshTokenApp = jwt.sign(
                    { "username": hashedUsername2 },
                    process.env.REFRESH_TOKEN_SECRET,
                    { expiresIn: calculatedExpiresIn}
                );

                const user = foundUser.username;
                console.log(user)

                foundUser.refreshTokenCookie = req.body.refreshTokenApp;
                foundUser.refreshTokenApp = refreshTokenApp;
                const result = await foundUser.save();
                console.log(result);

                res.cookie('jwt', req.body.refreshTokenApp, { httpOnly: true, secure: true, sameSite: 'None', maxAge: calculatedExpiresIn*1000, overwrite: true });

                // Send authorization roles and access token to user
                return res.json({ user, roles, accessToken, refreshTokenApp });
            }
        );
    } else{
        console.log(req.body?.refreshTokenApp)
        console.log('bigL 499')
        return res.json({ "message":"L" }).status(499);
    }

}

module.exports = { handleRefreshToken }
// kasnije dodaj u niz refresh tokene, ako neko koristi stariji od poslednja dva odmah ga logout iz svih uredjaja