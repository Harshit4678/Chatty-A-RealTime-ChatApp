import { MoreVertical, Trash2, X, VideoIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import toast from "react-hot-toast";
import { useEffect, useRef, useState } from "react";
import VideoCallModal from "./VideoCallModal";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, clearChat, deleteChat } =
    useChatStore();
  const { onlineUsers, socket, authUser } = useAuthStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Video call states
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null); // { from, offer }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCaller, setIsCaller] = useState(false);
  const peerConnectionRef = useRef(null);

  // ICE servers for WebRTC
  const iceServers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  // Cleanup function
  const cleanupMedia = () => {
    setLocalStream((stream) => {
      stream?.getTracks().forEach((track) => track.stop());
      return null;
    });
    setRemoteStream(null);
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    setIsInCall(false);
    setIsCaller(false);
  };

  // Handle call offer
  useEffect(() => {
    if (!socket) return;

    // Receive call offer
    socket.on("call-offer", ({ from, offer }) => {
      if (from === selectedUser._id) {
        setIncomingCall({ from, offer });
        setIsCallOpen(true);
      }
    });

    // Receive call answer
    socket.on("call-answer", async ({ answer }) => {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(new window.RTCSessionDescription(answer));
        setIsInCall(true);
      }
    });

    // Receive ICE candidate
    socket.on("ice-candidate", async ({ candidate }) => {
      const pc = peerConnectionRef.current;
      if (pc && candidate) {
        await pc.addIceCandidate(new window.RTCIceCandidate(candidate));
      }
    });

    // Handle call end
    socket.on("call-ended", () => {
      toast("Call ended");
      setIsCallOpen(false);
      setIncomingCall(null);
      cleanupMedia();
    });

    // Handle call declined
    socket.on("call-declined", () => {
      toast("Call declined");
      setIsCallOpen(false);
      setIncomingCall(null);
      cleanupMedia();
    });

    return () => {
      socket.off("call-offer");
      socket.off("call-answer");
      socket.off("ice-candidate");
      socket.off("call-ended");
      socket.off("call-declined");
    };
    // eslint-disable-next-line
  }, [socket, selectedUser]);

  // Start a call
  const startCall = async () => {
    if (!selectedUser || !onlineUsers.includes(selectedUser._id)) {
      toast.error("User is not online");
      return;
    }
    setIsCallOpen(true);
    setIsCaller(true);
    setIsInCall(false);

    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    } catch {
      toast.error(
        "Could not access camera/microphone. Please check device and permissions."
      );
      setIsCallOpen(false);
      setIsCaller(false);
      return;
    }
    setLocalStream(stream);

    const pc = new window.RTCPeerConnection(iceServers);
    peerConnectionRef.current = pc;

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("call-offer", {
      to: selectedUser._id,
      from: authUser._id,
      offer,
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          to: selectedUser._id,
          candidate: event.candidate,
        });
      }
    };
  };

  // Accept incoming call
  const acceptCall = async () => {
    setIsInCall(true);
    setIsCaller(false);

    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    } catch {
      toast.error(
        "Could not access camera/microphone. Please check device and permissions."
      );
      setIsCallOpen(false);
      setIncomingCall(null);
      return;
    }
    setLocalStream(stream);

    const pc = new window.RTCPeerConnection(iceServers);
    peerConnectionRef.current = pc;

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    await pc.setRemoteDescription(
      new window.RTCSessionDescription(incomingCall.offer)
    );
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("call-answer", {
      to: incomingCall.from,
      answer,
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          to: incomingCall.from,
          candidate: event.candidate,
        });
      }
    };

    setIncomingCall(null);
  };

  // Decline incoming call
  const declineCall = () => {
    socket.emit("call-declined", { to: incomingCall.from });
    setIsCallOpen(false);
    setIncomingCall(null);
    cleanupMedia();
  };

  // End call
  const endCall = () => {
    if (isCaller) {
      socket.emit("call-ended", { to: selectedUser._id });
    } else if (incomingCall) {
      socket.emit("call-ended", { to: incomingCall.from });
    }
    setIsCallOpen(false);
    setIncomingCall(null);
    cleanupMedia();
  };

  // Delete chat
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

  // Clear chat history
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
    <div className="p-4 border-b border-gray-300 bg-transparent backdrop-blur-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="avatar">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
                className="object-cover"
              />
            </div>
          </div>
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

        <div className="flex items-center gap-2">
          {/* Video Call Button */}
          <button
            className="btn btn-sm btn-circle"
            title="Video Call"
            onClick={startCall}
            disabled={!onlineUsers.includes(selectedUser._id)}
          >
            <VideoIcon size={20} />
          </button>

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
      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={isCallOpen}
        incomingCall={incomingCall}
        onAccept={acceptCall}
        onDecline={declineCall}
        onEndCall={endCall}
        localStream={localStream}
        remoteStream={remoteStream}
        isInCall={isInCall}
        isCaller={isCaller}
      />
    </div>
  );
};

export default ChatHeader;
