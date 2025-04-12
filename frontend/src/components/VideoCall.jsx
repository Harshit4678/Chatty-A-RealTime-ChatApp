import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useChatStore } from "../store/useChatStore.js";

const VideoCall = ({ onEndCall }) => {
  const { authUser, socket } = useAuthStore();
  const { selectedUser } = useChatStore();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStreamRef = useRef(null); // to store the media stream for cleanup

  useEffect(() => {
    const initCaller = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        localVideoRef.current.srcObject = stream;

        peerConnection.current = new RTCPeerConnection();
        stream
          .getTracks()
          .forEach((track) => peerConnection.current.addTrack(track, stream));

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

    const handleIncomingCall = async ({ offer, from }) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        localVideoRef.current.srcObject = stream;

        peerConnection.current = new RTCPeerConnection();
        stream
          .getTracks()
          .forEach((track) => peerConnection.current.addTrack(track, stream));

        peerConnection.current.ontrack = (event) => {
          remoteVideoRef.current.srcObject = event.streams[0];
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

    socket.on("incoming-call", handleIncomingCall);

    socket.on("call-answered", async ({ answer }) => {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socket.on("ice-candidate", ({ candidate }) => {
      peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on("call-ended", () => {
      endCall();
    });

    if (selectedUser && selectedUser._id !== authUser._id) {
      initCaller();
    }

    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
      socket.off("call-ended");

      if (peerConnection.current) peerConnection.current.close();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localVideoRef.current.srcObject = null;
        remoteVideoRef.current.srcObject = null;
      }
    };
  }, [socket, selectedUser, onEndCall]);

  const endCall = () => {
    if (peerConnection.current) peerConnection.current.close();

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
    <div className="video-call-container">
      <video ref={localVideoRef} autoPlay muted className="local-video" />
      <video ref={remoteVideoRef} autoPlay className="remote-video" />
      <button onClick={endCall} className="btn btn-error mt-4">
        End Call
      </button>
    </div>
  );
};

export default VideoCall;
