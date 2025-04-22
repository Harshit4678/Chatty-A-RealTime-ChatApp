import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore.js";
import SidebarSkeleton from "./skeletons/SidebarSkeleton.jsx";
import { Users } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import { Tooltip } from "react-tooltip"; // Import react-tooltip

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUserLoading } =
    useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // Sort users: unread first, then by online status, then by name
  const sortedUsers = [...users].sort((a, b) => {
    if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
    if (onlineUsers.includes(b._id) !== onlineUsers.includes(a._id)) {
      return onlineUsers.includes(b._id) ? 1 : -1;
    }
    return a.fullName.localeCompare(b.fullName);
  });

  const filteredUsers = showOnlineOnly
    ? sortedUsers.filter((user) => onlineUsers.includes(user._id))
    : sortedUsers;

  if (isUserLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-1 border-base-300 flex flex-col transition-all duration-all">
      <div className="border-b border-base-300 w-full p-5 ">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        {/* Todo:Online filter toggle */}
        <div className="mt-3 flex items-center gap-2 z-50">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="hidden lg:block">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({onlineUsers.length - 1}){" "}
            <span className="hidden lg:block">online</span>
          </span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${
                selectedUser?._id === user._id
                  ? "bg-base-300 ring-1 ring-base-300"
                  : ""
              }
            `}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.name}
                className="size-12 object-cover rounded-full"
              />
              {onlineUsers.includes(user._id) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900"
                />
              )}
              {/* Unread badge with tooltip */}
              {user.unreadCount > 0 && (
                <>
                  <span
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] flex items-center justify-center shadow"
                    style={{ fontSize: "0.75rem" }}
                    data-tip={`${user.unreadCount} unread message${
                      user.unreadCount > 1 ? "s" : ""
                    }`}
                    data-for={`unread-tooltip-${user._id}`}
                  >
                    {user.unreadCount}
                  </span>
                  <Tooltip
                    id={`unread-tooltip-${user._id}`}
                    place="top"
                    effect="solid"
                  />
                </>
              )}
            </div>

            {/* User info - only visible on larger screens */}
            <div className="hidden lg:block text-left min-w-0">
              <div className="font-medium truncate flex items-center gap-2">
                {user.fullName}
                {user.unreadCount > 0 && (
                  <span className="ml-2 text-xs text-red-500 font-semibold animate-pulse">
                    New Message
                  </span>
                )}
              </div>
              <div className="text-sm text-zinc-400">
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </div>
            </div>
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
