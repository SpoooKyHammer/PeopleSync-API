const { Router } = require("express");
const bcrypt = require("bcryptjs");

const { User } = require("./../../schema/user");

const registerRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API endpoints for user
 *
 * /register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with username, password, and email.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             example:
 *               username: johndoe
 *               password: password123
 *     responses:
 *       201:
 *         description: User successfully registered.
 *       400:
 *         description: Bad request. Missing username, password, or email.
 *       409:
 *         description: Conflict. Username already exists.
 *       500:
 *         description: Internal server error.
 */
registerRouter.post("/", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) return res.sendStatus(400);
  
  let hashedPassword;

  try { 
    hashedPassword = await bcrypt.hash(password, 10)
  } catch (error) {
    return res.sendStatus(500);
  }

  try {
    const user = new User({ username , passwordHash: hashedPassword});
    await user.save();
    res.sendStatus(201);
  } catch (e) {
    res.sendStatus(409)
  }
})

module.exports = registerRouter;
