import React, { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import VideoCallLayout from "./VideoCall/VideoCallLayout";
import VideoCallControls from "./VideoCall/VideoCallControls";

const VideoCall = ({ onEndCall, isCaller: initialIsCaller = false }) => {
  const { authUser, socket } = useAuthStore();
  const { selectedUser } = useChatStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);

  const [isCaller] = useState(initialIsCaller);
  const [isConnecting] = useState(true);

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
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
        onEndCall();
      }
    };

    const initiateCall = () => {
      // Initialize the peer connection
      peerConnection.current = new RTCPeerConnection();

      // Add local tracks to the peer connection
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStreamRef.current);
      });

      // Set up event listeners for the peer connection
      peerConnection.current.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
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

      // Create and send an offer
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

    setupMedia();

    return () => {
      endCall();
    };
  }, [isCaller, socket, selectedUser, onEndCall]);

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
