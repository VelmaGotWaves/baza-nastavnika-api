const User = require('../model/User');

const getAllUsers = async (req, res) => {
    const users = await User.find();
    if (!users) return res.status(204).json({ 'message': 'No users found' });
    const usersWithoutPassword = users?.map(user =>
        {
            user.password = undefined; 
            return user;
        });
    res.json(usersWithoutPassword);
}

const deleteUser = async (req, res) => {
    if (!req?.body?.id) return res.status(400).json({ "message": 'User ID required' });
    console.log(req)
    if(req.body.id.length != 24){
        return res.status(204).json({ "message": `No user matches ID ${req.body.id}.` });
    }
    const user = await User.findOne({ _id: req.body.id }).exec();
    if (!user) {
        return res.status(404).json({ 'message': `User ID ${req.body.id} not found` });
    }
    if(user.username == req.body.user){
        return res.status(401).json({'message': `User cannot delete themself`});
    }
    const result = await user.deleteOne({ _id: req.body.id });
    res.json(result);
}

const getUser = async (req, res) => {
    if (!req?.params?.id) return res.status(400).json({ "message": 'User ID required' });
    if(req.body.id.length != 24){
        return res.status(204).json({ "message": `No user matches ID ${req.body.id}.` });
    }
    const user = await User.findOne({ _id: req.params.id }).exec();
    if (!user) {
        return res.status(204).json({ 'message': `User ID ${req.params.id} not found` });
    }
    res.json(user);
}

module.exports = {
    getAllUsers,
    deleteUser,
    getUser
}