import React from "react";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useAuthStore } from "../store/useAuthStore";

const IncomingCallPopup = () => {
  const { incomingCall, setIncomingCall, setInCall } = useVideoCallStore();
  const { socket, authUser } = useAuthStore();

  // If there's no incoming call or the call is from the current user, don't show the popup
  if (!incomingCall || incomingCall.from._id === authUser._id) return null;

  const handleAccept = async () => {
    try {
      setInCall(true);
      socket.emit("accept-call", {
        to: incomingCall.from._id,
        answer: true,
      });
      setIncomingCall(null);
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  };

  const handleReject = () => {
    socket.emit("reject-call", { to: incomingCall.from._id });
    setIncomingCall(null);
  };

  return (
    <div className="incoming-call-popup fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="popup-content bg-white p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-lg font-semibold mb-4">
          Incoming Call from {incomingCall.from.name}
        </h2>
        <div className="flex justify-center gap-4">
          <button
            onClick={handleAccept}
            className="btn btn-success px-4 py-2 rounded-lg"
          >
            Accept
          </button>
          <button
            onClick={handleReject}
            className="btn btn-error px-4 py-2 rounded-lg"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallPopup;
