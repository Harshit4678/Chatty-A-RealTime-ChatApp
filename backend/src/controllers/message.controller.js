import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    // Get all users except the logged-in user
    const users = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    // Get the logged-in user's unreadMessages array
    const me = await User.findById(loggedInUserId).select("unreadMessages");

    // Attach unread count for each user
    const usersWithUnread = users.map((user) => {
      const unreadEntry = me.unreadMessages.find(
        (entry) => entry.from.toString() === user._id.toString()
      );
      return {
        ...user.toObject(),
        unreadCount: unreadEntry ? unreadEntry.count : 0,
      };
    });

    res.status(200).json(usersWithUnread);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userTOChatId } = req.params;
    const myId = req.user._id;

    // Mark all messages from userTOChatId to me as seen
    await Message.updateMany(
      { senderId: userTOChatId, receiverId: myId, seen: false },
      { $set: { seen: true } }
    );

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userTOChatId },
        { senderId: userTOChatId, receiverId: myId },
      ],
    });

    // Reset unread count for this chat
    await User.updateOne(
      { _id: myId },
      { $pull: { unreadMessages: { from: userTOChatId } } }
    );

    // Emit to the sender that messages have been seen
    const senderSocketId = getReceiverSocketId(userTOChatId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", { seenBy: myId });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages controller : ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
      } catch (error) {
        console.error("Cloudinary upload error:", error.message);
        return res.status(500).json({ message: "Image upload failed" });
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    // --- Unread message logic ---
    const receiver = await User.findById(receiverId);
    if (receiver) {
      const unreadEntry = receiver.unreadMessages.find(
        (entry) => entry.from.toString() === senderId.toString()
      );
      if (unreadEntry) {
        unreadEntry.count += 1;
      } else {
        receiver.unreadMessages.push({ from: senderId, count: 1 });
      }
      await receiver.save();
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const result = await Message.deleteMany({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    });

    if (result.deletedCount === 0) {
      return res.status(200).json({ message: "No messages to delete." });
    }

    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error in deleteChat controller: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const clearChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    await Message.deleteMany({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });

    res.status(200).json({ message: "Chat history cleared successfully" });
  } catch (error) {
    console.error("Error in clearChatHistory controller: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
