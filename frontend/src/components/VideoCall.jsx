import React, { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useVideoCallStore } from "../store/useVideoCallStore";
import VideoCallLayout from "./VideoCall/VideoCallLayout";
import VideoCallControls from "./VideoCall/VideoCallControls";

const VideoCall = ({ onEndCall, isCaller: initialIsCaller = false }) => {
  const { authUser, socket } = useAuthStore();
  const { selectedUser } = useChatStore();
  const { incomingCall } = useVideoCallStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);

  const [isCaller] = useState(initialIsCaller);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    const setupMedia = async () => {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = localStream;
        localVideoRef.current.srcObject = localStream;

        if (isCaller) {
          initiateCall();
        } else {
          setupReceiver();
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
        onEndCall();
      }
    };

    const initiateCall = () => {
      createPeerConnection();

      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStreamRef.current);
      });

      peerConnection.current
        .createOffer()
        .then((offer) => {
          peerConnection.current.setLocalDescription(offer);
          socket.emit("call-user", {
            offer,
            to: selectedUser._id,
            from: authUser._id,
          });
        })
        .catch((error) => console.error("Error creating offer:", error));
    };

    const setupReceiver = () => {
      createPeerConnection();

      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStreamRef.current);
      });

      if (incomingCall?.offer) {
        peerConnection.current
          .setRemoteDescription(new RTCSessionDescription(incomingCall.offer))
          .then(() => peerConnection.current.createAnswer())
          .then((answer) => {
            peerConnection.current.setLocalDescription(answer);
            socket.emit("accept-call", {
              to: incomingCall.from._id,
              answer,
            });
          })
          .catch((err) => console.error("Error handling incoming offer:", err));
      }
    };

    const createPeerConnection = () => {
      peerConnection.current = new RTCPeerConnection();

      peerConnection.current.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsConnecting(false);
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("send-ice-candidate", {
            candidate: event.candidate,
            to: selectedUser._id,
          });
        }
      };

      peerConnection.current.onconnectionstatechange = () => {
        if (peerConnection.current.connectionState === "failed") {
          console.error("Connection failed. Ending call.");
          endCall();
        }
      };

      socket.on("call-accepted", async ({ answer }) => {
        try {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          setIsConnecting(false);
        } catch (err) {
          console.error("Error setting remote description:", err);
        }
      });

      socket.on("receive-ice-candidate", ({ candidate }) => {
        if (peerConnection.current) {
          peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        }
      });
    };

    setupMedia();

    return () => {
      endCall();
    };
  }, [isCaller, socket, selectedUser, onEndCall, incomingCall, authUser._id]);

  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    onEndCall();
  };

  return (
    <>
      <VideoCallLayout
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        isConnecting={isConnecting}
        onEndCall={endCall}
      />
      <VideoCallControls
        localStream={localStreamRef.current}
        onEndCall={endCall}
      />
    </>
  );
};

export default VideoCall;
