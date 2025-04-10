import { MoreVertical, Trash2, X, Video } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { useState } from "react";
import VideoCall from "./VideoCall";
import { useVideoCallStore } from "../store/useVideoCallStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, clearChat, deleteChat } =
    useChatStore();
  const { onlineUsers } = useAuthStore();
  const isVideoCallActive = useVideoCallStore(
    (state) => state.isVideoCallActive
  );
  const setIsVideoCallActive = useVideoCallStore(
    (state) => state.setVideoCallActive
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleDeleteChat = async () => {
    if (window.confirm("Are you sure you want to delete this chat?")) {
      try {
        await deleteChat(selectedUser._id);
        setSelectedUser(null);
        toast.success("Chat deleted successfully");
      } catch (error) {
        console.error("Error deleting chat:", error);
        toast.error("Failed to delete chat");
      }
    }
  };

  const handleClearChatHistory = async () => {
    try {
      await clearChat();
      setSelectedUser(null);
      toast.success("Chat history cleared successfully");
    } catch (error) {
      console.error("Error clearing chat history:", error);
      toast.error("Failed to clear chat history");
    }
  };

  const startVideoCall = () => {
    setIsVideoCallActive(true);
  };

  const endVideoCall = () => {
    setIsVideoCallActive(false);
  };

  return (
    <div className="p-4 border-b border-gray-300  bg-transparent backdrop-blur-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="avatar">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
                className="object-cover"
              />
            </div>
          </div>
          {/* User info */}
          <div>
            <h3 className="text-lg font-semibold">{selectedUser.fullName}</h3>
            <p
              className={`text-sm ${
                onlineUsers.includes(selectedUser._id)
                  ? "text-green-500"
                  : "text-gray-500"
              }`}
            >
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Video Call Button */}
          <button
            onClick={startVideoCall}
            className="btn btn-sm btn-primary flex items-center gap-2"
          >
            <Video size={18} />
            Video Call
          </button>

          {/* Dropdown button */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="btn btn-sm btn-circle"
            >
              <MoreVertical size={18} />
            </button>
            {isDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg z-50 border border-gray-300"
                onClick={() => setIsDropdownOpen(false)}
              >
                <ul className="py-2">
                  <li>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 w-full text-left text-base font-semibold text-gray-900"
                    >
                      <X size={20} />
                      Close Chat
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={handleDeleteChat}
                      className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 w-full text-left text-base font-semibold text-gray-900"
                    >
                      <Trash2 size={20} />
                      Delete Chat
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={handleClearChatHistory}
                      className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 w-full text-left text-base font-semibold text-gray-900"
                    >
                      <Trash2 size={20} />
                      Clear Chat History
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Call Component */}
      {isVideoCallActive && <VideoCall onEndCall={endVideoCall} />}
    </div>
  );
};

export default ChatHeader;
