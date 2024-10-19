const { Router } = require('express');
const { Group } = require('./../../schema/group');
const { User } = require("./../../schema/user");
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: API endpoints for managing groups
 *
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * /groups:
 *   post:
 *     summary: Create a new group
 *     description: Creates a new group with the specified name and participants. Updates the participants' records to include the newly created group.
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       description: The details of the group to be created.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the group.
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: An array of user IDs who will be participants in the group.
 *             required:
 *               - name
 *               - participants
 *     responses:
 *       201:
 *         description: Successfully created the group and updated participants.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The ID of the newly created group.
 *                 name:
 *                   type: string
 *                   description: The name of the group.
 *                 participants:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: An array of user IDs who are participants in the group.
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: The time when the group was created.
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: The time when the group was last updated.
 *       400:
 *         description: Bad Request. The request is missing required fields or contains invalid data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating what was wrong with the request.
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
router.post('/',  async (req, res) => {
  const { name, participants } = req.body;

  try {
    const group = new Group({ name, participants });
    await group.save();
    
    await User.updateMany(
      { _id: { $in: participants } },
      { $push: { groups: group._id } }
    );
    
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: API endpoints for managing groups
 *
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * /groups/{groupId}/users:
 *   post:
 *     summary: Add a user to a group
 *     description: Adds a specified user to a group if the requester is a participant in the group. Updates both the group's and the user's records accordingly.
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           description: The ID of the group to which the user will be added.
 *     requestBody:
 *       description: The details of the user to be added to the group.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user to be added to the group.
 *             required:
 *               - userId
 *     responses:
 *       200:
 *         description: Successfully added the user to the group.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The ID of the group.
 *                 name:
 *                   type: string
 *                   description: The name of the group.
 *                 participants:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: An array of user IDs who are participants in the group.
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: The time when the group was created.
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: The time when the group was last updated.
 *       400:
 *         description: Bad Request. The user is already in the group or invalid request data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating the issue with the request.
 *       403:
 *         description: Forbidden. The user is not authorized to add users to the group.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating that the user is not authorized.
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
router.post('/:groupId/users', async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  try {
    const group = await Group.findById(groupId);
    
    if (!group || !group.participants.includes(req.userId)) {
      return res.status(403).json({ message: "Not authorized." });
    }

    if (!group.participants.includes(userId)) {
      group.participants.push(userId);
      await group.save();
      
      // Add group reference to user
      await User.findByIdAndUpdate(userId, {
        $push: { groups: group._id }
      });
      
      res.status(200).json(group);
    } else {
      res.status(400).json({ message: "User is already in the group." });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: API endpoints for managing groups
 *
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * /groups/{groupId}/users/{userId}:
 *   delete:
 *     summary: Remove a user from a group
 *     description: Removes a specified user from a group if the requester is a participant in the group. Updates both the group's and the user's records accordingly.
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           description: The ID of the group from which the user will be removed.
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           description: The ID of the user to be removed from the group.
 *     responses:
 *       200:
 *         description: Successfully removed the user from the group.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The ID of the group.
 *                 name:
 *                   type: string
 *                   description: The name of the group.
 *                 participants:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: An array of user IDs who are participants in the group.
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: The time when the group was created.
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: The time when the group was last updated.
 *       400:
 *         description: Bad Request. The user is not in the group or invalid request data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating the issue with the request.
 *       403:
 *         description: Forbidden. The user is not authorized to remove users from the group.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating that the user is not authorized.
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
router.delete('/:groupId/users/:userId', async (req, res) => {
  const { groupId, userId } = req.params;

  try {
    const group = await Group.findById(groupId);
    
    if (!group || !group.participants.includes(req.userId)) {
      return res.status(403).json({ message: "Not authorized." });
    }

    if (group.participants.includes(userId)) {
      group.participants.pull(userId);
      await group.save();
      
      // Remove group reference from user
      await User.findByIdAndUpdate(userId, {
        $pull: { groups: group._id }
      });
      
      res.status(200).json(group);
    } else {
      res.status(400).json({ message: "User is not in the group." });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
