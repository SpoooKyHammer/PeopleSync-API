const { Router } = require("express");

const { User } = require("./../../schema/user");

const friendsRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API endpoints for user
 *
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * /friends:
 *   get:
 *     summary: Get the list of friends and friend requests for the current user
 *     description: Retrieves the list of friends and friend requests for the current user. The user ID must be provided in the request's authentication token. Returns an object containing arrays of friend and friend request objects, each containing only the _id and username fields.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved the lists of friends and friend requests. Returns an object with arrays of friend and friend request objects, each with _id and username fields.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 friends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: The ID of the friend.
 *                       username:
 *                         type: string
 *                         description: The username of the friend.
 *                 friendRequests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: The ID of the user who sent the friend request.
 *                       username:
 *                         type: string
 *                         description: The username of the user who sent the friend request.
 *       404:
 *         description: Not Found. User not found.
 *       500:
 *         description: Internal server error.
 */
friendsRouter.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate("friends")
      .populate("friendRequests");

    if (!user) res.sendStatus(404);
    
    const payload = {
      friends: user.friends.map(f => ({ id: f._id, username: f.username })),
      friendRequests: user.friendRequests.map(f => ({ id: f._id, username: f.username }))
    }
    
    res.status(200).json(payload);
    
  } catch (e) {
    res.sendStatus(500);
  }
})


/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API endpoints for user
 *
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * /friends:
 *   post:
 *     summary: Add a friend to the user's friend list
 *     description: Adds a user specified by `username` to the current user's friend list. The user ID must be provided in the request's authentication token. If the user is already a friend, a conflict response is returned.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username of the user to be added as a friend.
 *             example:
 *               username: johndoe
 *     responses:
 *       200:
 *         description: Friend successfully added to the user's friend list. Returns the username of the added friend.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                   description: Username of the added friend.
 *                 id:
 *                   type: string
 *                   description: The ID of the user.
 *       400:
 *         description: Bad request. Missing username or other validation errors.
 *       404:
 *         description: Not Found. User or friend not found.
 *       409:
 *         description: Conflict. The user is already in the friend list.
 *       500:
 *         description: Internal server error.
 */
friendsRouter.post("/", async (req, res) => {
  const { username } = req.body;

  if (!username) return res.sendStatus(400);
  
  try {
    const user = await User.findById(req.userId);

    const friend = await User.findOne({ username });

    if (!friend) return res.sendStatus(404);
    
    const isAlreadyFriend = user.friends.includes(friend._id);

    if (isAlreadyFriend) return res.sendStatus(409);

    friend.friendRequests.push(user._id);
    await friend.save();
    await user.save();
    
    return res.status(200).json({ username: friend.username, id: friend._id });
  } catch (e) {
    res.sendStatus(500);
  }
})


/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API endpoints for user
 *
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * /friends/{username}:
 *   delete:
 *     summary: Remove a friend from the user's friend list
 *     description: Removes a user specified by `username` from the current user's friend list. The user ID must be provided in the request's authentication token. If the user is not found or not a friend, appropriate error responses are returned.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: The username of the user to be removed from the friend list.
 *     responses:
 *       200:
 *         description: Friend successfully removed from the user's friend list. Returns the username and ID of the removed friend.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                   description: Username of the removed friend.
 *                 id:
 *                   type: string
 *                   description: The ID of the user.
 *       400:
 *         description: Bad request. Missing username or other validation errors.
 *       404:
 *         description: Not Found. Friend not found.
 *       500:
 *         description: Internal server error.
 */
friendsRouter.delete("/:username", async (req, res) => {
  const username = req.params.username;

  if (!username) return res.sendStatus(400);
  
  try {
    const user = await User.findById(req.userId);

    const friend = await User.findOne({ username });

    if (!friend) return res.sendStatus(404);
    
    user.friends = user.friends.filter(id => !id.equals(friend._id));
    friend.friends = friend.friends.filter(id => !id.equals(user._id));
    await friend.save();
    await user.save();
    
    return res.status(200).json({ username: friend.username, id: friend._id });
  } catch (e) {
    res.sendStatus(500);
  }
})


/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API endpoints for user
 *
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * /friends/accept:
 *   put:
 *     summary: Accept a friend request
 *     description: Accepts a friend request from a user specified by `username`. The user ID must be provided in the request's authentication token. If the user is not found or there is no friend request from the user, appropriate error responses are returned.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username of the user whose friend request is being accepted.
 *             example:
 *               username: johndoe
 *     responses:
 *       200:
 *         description: Friend request successfully accepted and user added to the friend list. Returns the username and ID of the accepted friend.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                   description: Username of the accepted friend.
 *                 id:
 *                   type: string
 *                   description: The ID of the user.
 *       400:
 *         description: Bad request. Missing username or other validation errors.
 *       404:
 *         description: Not Found. Friend not found.
 *       500:
 *         description: Internal server error.
 */
friendsRouter.put("/accept", async (req, res) => {
  const { username } = req.body;

  if (!username) return res.sendStatus(400);

  try {
    const user = await User.findById(req.userId);

    const friend = await User.findOne({ username });

    if (!friend) return res.sendStatus(404);
    
    
    user.friendRequests = user.friendRequests.filter(id => !id.equals(friend._id));
    user.friends.push(friend._id);
    friend.friends.push(user._id);
    await friend.save();
    await user.save();
    
    return res.status(200).json({ username: friend.username, id: friend._id });
  } catch (e) {
    res.sendStatus(500);
  }
})


/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API endpoints for user
 *
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * /friends/reject:
 *   put:
 *     summary: Reject a friend request
 *     description: Rejects a friend request from a user specified by `username`. The user ID must be provided in the request's authentication token. If the user is not found or there is no pending friend request from the user, appropriate error responses are returned.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username of the user whose friend request is being rejected.
 *             example:
 *               username: johndoe
 *     responses:
 *       200:
 *         description: Friend request successfully rejected. Returns the username and ID of the user whose request was rejected.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                   description: Username of the user whose friend request was rejected.
 *                 id:
 *                   type: string
 *                   description: The ID of the user.
 *       400:
 *         description: Bad request. Missing username or other validation errors.
 *       404:
 *         description: Not Found. Friend request not found.
 *       500:
 *         description: Internal server error.
 */
friendsRouter.put("/reject", async (req, res) => {
  const { username } = req.body;

  if (!username) return res.sendStatus(400);

  try {
    const user = await User.findById(req.userId);

    const friend = await User.findOne({ username });

    if (!friend) return res.sendStatus(404); 
    
    user.friendRequests = user.friendRequests.filter(id => !id.equals(friend._id));
    await user.save();
    
    return res.status(200).json({ username: friend.username, id: friend._id });
  } catch (e) {
    res.sendStatus(500);
  }
})


module.exports = friendsRouter;

