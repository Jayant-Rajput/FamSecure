import express from "express";
import User from "../models/User.js";
import Group from "../models/Group.js";
import { nanoid } from "nanoid";

const router = express.Router();

function transformId(obj) {
  const plain = obj.toObject();
  plain.id = plain._id;
  delete plain._id;
  return plain;
}

router.post("/create", async (req, res) => {
  try {
    const { name, createdBy } = req.body;
    console.log(req.body);

    if (!name || !createdBy)
      return res.status(400).json({ message: "All fields are required." });

    const code = nanoid(6).toUpperCase();

    const group = new Group({
      name,
      createdBy,
      code,
      members: [createdBy],
    });

    await group.save();

    await User.findByIdAndUpdate(createdBy, { $push: { groups: group._id } });

    res.status(201).json(group);
  } catch (error) {
    console.log("Error in creating group ", error);
    res.status(400).json({ message: "Internal Server Error" });
  }
});

router.post("/join", async (req, res) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code)
      return res.status(400).json({ message: "All fields are required" });

    const group = await Group.findOne({ code });
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.members.includes(userId))
      return res
        .status(400)
        .json({ message: "User is already a member of the group" });

    group.members.push(userId);
    await group.save();

    await User.findByIdAndUpdate(userId, { $addToSet: { groups: group._id } });

    res
      .status(200)
      .json({ message: "Joined Group Successfully", groupId: group._id });
  } catch (error) {
    console.log("Error in joining group ", error);
    res.status(400).json({ message: "Internal Server Error" });
  }
});

router.post("/groups", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId)
      return res.status(400).json({ message: "User ID is required" });

    const user = await User.findById(userId).populate("groups");
    if (!user) return res.status(404).json({ message: "User not found" });

    const groups = user.groups.map(transformId);
    console.log(groups);

    res.status(200).json({ groups });
  } catch (error) {
    console.log("Error in getting groups ", error);
    res.status(400).json({ message: "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate(
      "members",
      "username _id lastLocation"
    );
    if (!group) return res.status(400).json({ message: "Group not found" });

    // Convert group to plain object
    const groupObj = group.toObject();

    // Replace _id with id in group
    groupObj.id = groupObj._id;
    delete groupObj._id;

    // Replace _id with id in each member
    groupObj.members = groupObj.members.map((member) => {
      const m = { ...member };
      m.id = m._id;
      delete m._id;
      return m;
    });

    res.status(200).json({ group : groupObj });
  } catch (error) {
    console.log("Error in fetching Group Details ", error);
    res.status(400).json({ message: "Internal Server Error" });
  }
});

export default router;
