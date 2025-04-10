import { useState, useRef, useEffect } from "react";
import ChatContainer from "../components/ChatContainer.jsx";
import NoChatSelected from "../components/NoChatSelected.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { useChatStore } from "../store/useChatStore.js";
import Navbar from "../components/Navbar.jsx";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State to toggle sidebar
  const sidebarRef = useRef(null);

  // Close sidebar when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSidebarOpen]);

  return (
    <div className="h-screen bg-base-200">
      {/* Navbar */}
      <Navbar setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)] relative">
          <div className="flex h-full rounded-lg overflow-hidden relative">
            {/* Sidebar */}
            <div
              ref={sidebarRef}
              className={`absolute sm:relative bg-base-100 h-full transition-transform duration-300 sm:translate-x-0 ${
                isSidebarOpen ? "translate-x-0 z-50" : "-translate-x-full"
              }`}
              style={{
                maxWidth: "20rem", // Max width for larger devices
              }}
            >
              <Sidebar />
            </div>

            {/* Main Content */}
            <div
              className={`flex-1 overflow-y-auto transition-all duration-300 ${
                isSidebarOpen ? "sm:ml-0 z-40" : "w-full"
              }`}
            >
              {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
