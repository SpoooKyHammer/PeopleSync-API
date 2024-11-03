const { Router } = require("express");

const { Message } = require("./../../schema/message");
const { Chat } = require("./../../schema/chat");
const { Group } = require("./../../schema/group");

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: API endpoints for managing messages
 *
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * /messages:
 *   post:
 *     summary: Create a new message
 *     description: Creates a new message and associates it with a chat or group. The message is created by the authenticated user. If the message is associated with a chat, it will be added to the chat's messages. If associated with a group, it will be added to the group's messages.
 *     tags: [Messages]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       description: The details of the message to be created.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The content of the message.
 *               chat:
 *                 type: string
 *                 description: The ID of the chat to which the message belongs. If not provided, the message will be associated with a group if the `group` field is provided.
 *               group:
 *                 type: string
 *                 description: The ID of the group to which the message belongs. If not provided, the message will be associated with a chat if the `chat` field is provided.
 *             required:
 *               - content
 *     responses:
 *       201:
 *         description: Successfully created the message.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The ID of the newly created message.
 *                 sender:
 *                   type: string
 *                   description: The ID of the user who sent the message.
 *                 content:
 *                   type: string
 *                   description: The content of the message.
 *                 chat:
 *                   type: string
 *                   description: The ID of the chat associated with the message, if applicable.
 *                 group:
 *                   type: string
 *                   description: The ID of the group associated with the message, if applicable.
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: The time when the message was sent.
 *       400:
 *         description: Bad Request. Either `chat` or `group` must be provided, but not both.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating a bad request.
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
  const { content, chat, group } = req.body;

  try {
    const message = new Message({
      sender: req.userId,
      content,
      chat,
      group
    });

    await message.save();

    if (chat) {
      await Chat.findByIdAndUpdate(chat, { $push: { messages: message._id } });
    } else if (group) {
      await Group.findByIdAndUpdate(group, { $push: { messages: message._id } });
    }

    const io = req.app.get("io");
    
    const messageWithSender = await message.populate("sender", "_id username");

    io.to(chat || group).emit("newMessage", messageWithSender);

    res.status(201).json(messageWithSender);
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: API endpoints for managing messages
 *
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * /messages/{messageId}:
 *   get:
 *     summary: Retrieve a specific message by ID
 *     description: Retrieves a specific message by its ID. The response includes details about the message and the user who sent it.
 *     tags: [Messages]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         description: The ID of the message to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved the message.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The ID of the message.
 *                 sender:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: The ID of the user who sent the message.
 *                     username:
 *                       type: string
 *                       description: The username of the user who sent the message.
 *                   description: Details of the user who sent the message.
 *                 content:
 *                   type: string
 *                   description: The content of the message.
 *                 chat:
 *                   type: string
 *                   description: The ID of the chat associated with the message, if applicable.
 *                 group:
 *                   type: string
 *                   description: The ID of the group associated with the message, if applicable.
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: The time when the message was sent.
 *       404:
 *         description: Not Found. The specified message does not exist.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating the message was not found.
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
router.get('/:messageId', async (req, res) => {
  const { messageId } = req.params;

  try {
    const message = await Message.findById(messageId).populate('sender');
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: API endpoints for managing messages
 *
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * /messages/{messageId}:
 *   put:
 *     summary: Update the read status of a specific message
 *     description: Updates the read status of a specific message by its ID. This endpoint allows marking a message as read or unread.
 *     tags: [Messages]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         description: The ID of the message to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       description: The details of the message to be updated.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isRead:
 *                 type: boolean
 *                 description: Indicates whether the message has been read (`true`) or not (`false`).
 *             required:
 *               - isRead
 *     responses:
 *       200:
 *         description: Successfully updated the message read status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The ID of the message.
 *                 sender:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: The ID of the user who sent the message.
 *                     username:
 *                       type: string
 *                       description: The username of the user who sent the message.
 *                   description: Details of the user who sent the message.
 *                 content:
 *                   type: string
 *                   description: The content of the message.
 *                 chat:
 *                   type: string
 *                   description: The ID of the chat associated with the message, if applicable.
 *                 group:
 *                   type: string
 *                   description: The ID of the group associated with the message, if applicable.
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: The time when the message was sent.
 *                 isRead:
 *                   type: boolean
 *                   description: Indicates whether the message has been read (`true`) or not (`false`).
 *       400:
 *         description: Bad Request. The `isRead` field is required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating that the `isRead` field was missing or invalid.
 *       404:
 *         description: Not Found. The specified message does not exist.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating that the message was not found.
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
router.put('/:messageId', async (req, res) => {
  const { messageId } = req.params;
  const { isRead } = req.body;

  try {
    const message = await Message.findByIdAndUpdate(messageId, { isRead }, { new: true });
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
