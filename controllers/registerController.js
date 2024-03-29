const User = require('../model/User');
const bcrypt = require('bcrypt');

const handleNewUser = async (req, res) => {
    const { user, pwd, role } = req.body;
    if (!user || !pwd) return res.status(400).json({ 'message': 'Username and password are required.' });

    // check for duplicate usernames in the db
    const duplicate = await User.findOne({ username: user }).collation({ locale: 'en', strength: 2 }).exec();
    if (duplicate) return res.sendStatus(409); //Conflict 

    try {
        //encrypt the password
        const hashedPwd = await bcrypt.hash(pwd, 10);

        //create and store the new user
        let result = "";
        if (role == "Editor") {
            result = await User.create({
                "username": user,
                "password": hashedPwd,
                "roles": {
                    "Editor": 1984,
                    "User": 2001
                }
            });
        } else if (role == "Admin") {
            result = await User.create({
                "username": user,
                "password": hashedPwd,
                "roles": {
                    "Admin": 5150,
                    "Editor": 1984,
                    "User": 2001
                }
            });
        } else {
            result = await User.create({
                "username": user,
                "password": hashedPwd
            });
        }

        console.log(result);

        res.status(201).json({ 'success': `New user ${user} created!` });
    } catch (err) {
        res.status(500).json({ 'message': err.message });
    }
}

module.exports = { handleNewUser };