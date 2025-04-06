import { MoreVertical, Trash2, X } from "lucide-react";
import { useChatStore } from "../store/useChatstore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { useState } from "react";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, clearChat, deleteChat } =
    useChatStore();
  const { onlineUsers } = useAuthStore();
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

  return (
    <div className="p-2 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>
          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-small text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "offline"}
            </p>
          </div>
        </div>

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
                    className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 w-full text-left text-base font-semibold text-gray-900 antialiased"
                  >
                    <X size={20} />
                    Close Chat
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleDeleteChat}
                    className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 w-full text-left text-base font-semibold text-gray-900 antialiased"
                  >
                    <Trash2 size={20} />
                    Delete Chat
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleClearChatHistory}
                    className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 w-full text-left text-base font-semibold text-gray-900 antialiased"
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
  );
};

export default ChatHeader;
