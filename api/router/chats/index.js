const { Router } = require('express');
const { Chat } = require('./../../schema/chat');
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Chats
 *   description: API endpoints for managing chats
 *
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * /chats:
 *   post:
 *     summary: Create a new chat
 *     description: Creates a new chat with the specified participants. The user making the request must be included in the participants list.
 *     tags: [Chats]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       description: The details of the new chat.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of user IDs participating in the chat.
 *     responses:
 *       201:
 *         description: Successfully created the chat.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The ID of the newly created chat.
 *                 participants:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of user IDs participating in the chat.
 *       400:
 *         description: Bad Request. The user must be a participant in the chat.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating the user must be a participant.
 *       500:
 *         description: Internal server error. The server encountered an error while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message describing the issue encountered.
 */
router.post('/', async (req, res) => {
  const { participants } = req.body;

  if (!participants.includes(req.userId)) {
    return res.status(400).json({ message: "You must be a participant in the chat." });
  }

  try {
    const chat = new Chat({ participants });
    await chat.save();
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * tags:
 *   name: Chats
 *   description: API endpoints for managing chats
 *
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * /chats/{chatId}/messages:
 *   get:
 *     summary: Retrieve messages for a chat
 *     description: Retrieves messages for the specified chat. The user must be a participant in the chat to view messages.
 *     tags: [Chats]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         description: The ID of the chat to retrieve messages from.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved chat messages.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: The ID of the message.
 *                   sender:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: The ID of the user who sent the message.
 *                       username:
 *                         type: string
 *                         description: The username of the user who sent the message.
 *                     description: Details of the user who sent the message.
 *                   content:
 *                     type: string
 *                     description: The content of the message.
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     description: The time when the message was sent.
 *       403:
 *         description: Forbidden. The user is not a participant in the chat.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating the user is not authorized.
 *       404:
 *         description: Not Found. The specified chat does not exist.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating the chat was not found.
 *       500:
 *         description: Internal server error. The server encountered an error while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message describing the issue encountered.
 */
router.get('/:chatId/messages', async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId).populate({
      path: 'messages',
      populate: { path: 'sender' }
    });

    if (!chat || !chat.participants.includes(req.userId)) {
      return res.status(403).json({ message: "Not authorized." });
    }
    res.json(chat.messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
