import { useVideoCallStore } from "../store/useVideoCallStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { useChatStore } from "../store/useChatStore.js";

const IncomingCallPopup = () => {
  const { incomingCall, setIncomingCall, setInCall } = useVideoCallStore();
  const { socket, authUser } = useAuthStore();
  const { setSelectedUser } = useChatStore();

  if (!incomingCall || incomingCall.from._id === authUser._id) return null;

  const handleAccept = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setSelectedUser({ ...incomingCall.from });
      setIncomingCall(null);
      setInCall(true);

      // Attach the stream to the local video element
      const localVideoRef = document.querySelector(".local-video");
      if (localVideoRef) {
        localVideoRef.srcObject = stream;
      }

      socket.emit("accept-call", { to: incomingCall.from._id });
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Failed to access camera/microphone.");
    }
  };

  const handleReject = () => {
    socket.emit("call-ended", { to: incomingCall.from._id });
    setIncomingCall(null);
  };

  return (
    <div className="fixed top-40 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-md text-center">
        <img
          src={incomingCall.from.profilePic || "/avatar.png"}
          alt="Caller"
          className="w-16 h-16 rounded-full mx-auto mb-4"
        />
        <h2 className="text-xl font-semibold">
          {incomingCall.from.fullName} is calling...
        </h2>
        <div className="mt-4 flex justify-center gap-4">
          <button className="btn btn-success" onClick={handleAccept}>
            Receive Call
          </button>
          <button className="btn btn-error" onClick={handleReject}>
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallPopup;
