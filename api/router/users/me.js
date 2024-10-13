const { Router } = require("express");
const { User } = require("./../../schema/user");
const { Chat } = require("../../schema/chat");
const router = Router();

router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('friends').populate('friendRequests').populate('groups');
    const friendsWithChatIds = await Promise.all(user.friends.map(async (f) => {
      const chat = await Chat.findOne({
        participants: {
          $all: [user._id, f._id]
        },
        $expr: { $eq: [{ $size: "$participants" }, 2] }
      });
      
      return {
        id: f._id,
        username: f.username,
        chatId: chat?._id
      };
    }));

    const friendRequestsWithIdAndUsername = user.friendRequests.map(f => ({id: f._id, username: f.username }));

    const groups = user.groups.map(g => ({ id: g._id, username: g.name }));

    // Attach the updated friends array to the user object
    const userWithFriends = {
      ...user._doc,
      id: user._id,
      friends: friendsWithChatIds,
      friendRequests: friendRequestsWithIdAndUsername,
      groups
    };
    delete userWithFriends.passwordHash;
    res.json(userWithFriends);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
