const { Router } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { usersModel } = require("./../../schema/user");

const loginRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API endpoints for user
 *
 * /login:
 *   post:
 *     summary: Login a user
 *     description: Authenticate a user with username and password, and generate a JWT token for authorization.
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
 *       200:
 *         description: User successfully logged in. Returns a JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authenticated user.
 *       400:
 *         description: Bad request. Missing username or password.
 *       401:
 *         description: Unauthorized. Invalid username or password.
 *       404:
 *         description: Not Found. User not found.
 *       500:
 *         description: Internal server error.
 */
loginRouter.post("/", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) return res.sendStatus(400);
  
  try {
    const user = await usersModel.findOne({ username });

    if (!user) return res.sendStatus(404);

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) return res.sendStatus(401);

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    return res.status(200).send({ token });
  } catch (e) {
    res.sendStatus(500);
  }
})

module.exports = loginRouter;

