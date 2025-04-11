import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useChatStore } from "../store/useChatStore.js";
import { PhoneIncoming, PhoneOff } from "lucide-react";

const VideoCall = ({ onEndCall }) => {
  const { socket } = useAuthStore();
  const { selectedUser } = useChatStore();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [callerInfo, setCallerInfo] = useState(null);

  useEffect(() => {
    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localVideoRef.current.srcObject = stream;

        peerConnection.current = new RTCPeerConnection();
        stream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, stream);
        });

        peerConnection.current.ontrack = (event) => {
          remoteVideoRef.current.srcObject = event.streams[0];
        };

        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", {
              candidate: event.candidate,
              to: selectedUser._id,
            });
          }
        };

        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);

        socket.emit("call-user", { offer, to: selectedUser._id });
      } catch (error) {
        console.error("Error accessing media devices:", error);
        alert(
          "Unable to access your camera or microphone. Please check your device settings."
        );
        onEndCall();
      }
    };

    socket.on("incoming-call", ({ offer, from, caller }) => {
      setIsIncomingCall(true);
      setCallerInfo({ offer, from, caller });
    });

    socket.on("call-answered", async ({ answer }) => {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socket.on("ice-candidate", ({ candidate }) => {
      peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, [socket, selectedUser, onEndCall]);

  const acceptCall = async () => {
    setIsIncomingCall(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideoRef.current.srcObject = stream;

      peerConnection.current = new RTCPeerConnection();
      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
      });

      peerConnection.current.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            candidate: event.candidate,
            to: callerInfo.from,
          });
        }
      };

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(callerInfo.offer)
      );
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("answer-call", { answer, to: callerInfo.from });
    } catch (error) {
      console.error("Error accepting call:", error);
      alert("Unable to accept the call.");
      onEndCall();
    }
  };

  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    onEndCall();
  };

  return (
    <div className="video-call-container relative">
      {isIncomingCall && callerInfo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="avatar mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto">
                <img
                  src={callerInfo.caller.profilePic || "/avatar.png"}
                  alt={callerInfo.caller.fullName}
                  className="object-cover"
                />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {callerInfo.caller.fullName}
            </h3>
            <p className="text-sm text-gray-500 mb-4">Incoming Video Call</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={acceptCall}
                className="btn btn-success flex items-center gap-2"
              >
                <PhoneIncoming size={18} />
                Accept
              </button>
              <button
                onClick={endCall}
                className="btn btn-error flex items-center gap-2"
              >
                <PhoneOff size={18} />
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center h-full">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          className="w-1/2 rounded-lg mb-4"
        />
        <video ref={remoteVideoRef} autoPlay className="w-1/2 rounded-lg" />
        <button
          onClick={endCall}
          className="btn btn-error mt-4 flex items-center gap-2"
        >
          <PhoneOff size={18} />
          End Call
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
