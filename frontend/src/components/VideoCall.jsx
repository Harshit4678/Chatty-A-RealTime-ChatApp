import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useChatStore } from "../store/useChatStore.js";

const VideoCall = ({ onEndCall, isCaller: initialIsCaller }) => {
  const { authUser, socket } = useAuthStore();
  const { selectedUser } = useChatStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);

  const [isCaller, setIsCaller] = useState(initialIsCaller);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    // When user is the caller
    const initCaller = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        peerConnection.current = new RTCPeerConnection();
        stream
          .getTracks()
          .forEach((track) => peerConnection.current.addTrack(track, stream));

        peerConnection.current.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setIsConnecting(false);
          }
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

        socket.emit("call-user", {
          offer,
          to: selectedUser._id,
          from: {
            _id: authUser._id,
            fullName: authUser.fullName,
            profilePic: authUser.profilePic,
          },
        });
      } catch (error) {
        console.error("Caller media error:", error);
        alert("Camera/mic access failed.");
        onEndCall();
      }
    };

    // When user is the receiver
    const handleIncomingCall = async ({ offer, from }) => {
      try {
        setIsCaller(false); // This user is the receiver

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        peerConnection.current = new RTCPeerConnection();
        stream
          .getTracks()
          .forEach((track) => peerConnection.current.addTrack(track, stream));

        peerConnection.current.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setIsConnecting(false);
          }
        };

        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", {
              candidate: event.candidate,
              to: from._id,
            });
          }
        };

        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        socket.emit("answer-call", { answer, to: from._id });
      } catch (error) {
        console.error("Receiver media error:", error);
        onEndCall();
      }
    };

    // Socket listeners
    socket.on("incoming-call", handleIncomingCall);

    socket.on("call-answered", async ({ answer }) => {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
      setIsConnecting(false);
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    });

    socket.on("call-ended", () => {
      endCall();
    });

    if (selectedUser && selectedUser._id !== authUser._id && isCaller) {
      initCaller();
    }

    // Cleanup when component unmounts
    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
      socket.off("call-ended");

      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };
  }, [socket, selectedUser, onEndCall, isCaller]);

  // Ends the call and cleans up
  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    socket.emit("call-ended", { to: selectedUser._id });
    onEndCall();
  };

  return (
    <div className="video-call-container relative w-full h-full bg-black rounded-lg overflow-hidden">
      {/* Full-screen video: other person's stream */}
      <video
        ref={(el) => {
          if (isCaller) remoteVideoRef.current = el;
          else localVideoRef.current = el;
        }}
        autoPlay
        className="full-video w-full h-full object-cover rounded-lg"
      />

      {/* Small box: own stream */}
      <video
        ref={(el) => {
          if (isCaller) localVideoRef.current = el;
          else remoteVideoRef.current = el;
        }}
        autoPlay
        muted
        className="small-video absolute bottom-4 left-4 w-32 h-32 md:w-40 md:h-40 object-cover rounded-2xl border-2 border-white shadow-lg"
      />

      {/* End call button */}
      <button
        onClick={endCall}
        className="btn btn-error absolute top-4 right-4 z-10"
      >
        End Call
      </button>

      {/* Connecting overlay */}
      {isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
          <div className="text-white text-lg">Connecting...</div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
