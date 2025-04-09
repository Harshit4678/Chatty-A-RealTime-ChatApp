import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const VideoCall = ({ onEndCall }) => {
  const { socket } = useAuthStore();
  const { selectedUser } = useChatStore();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
    const checkDevices = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log("Available devices:", devices); // Debugging: Log available devices

      const hasVideoInput = devices.some(
        (device) => device.kind === "videoinput"
      );
      const hasAudioInput = devices.some(
        (device) => device.kind === "audioinput"
      );

      if (!hasVideoInput && !hasAudioInput) {
        alert("No camera or microphone found on this device.");
        onEndCall();
        return false;
      }
      return true;
    };

    const startCall = async () => {
      if (!(await checkDevices())) return;

      try {
        // Dynamically adjust constraints based on available devices
        const constraints = {
          video: true,
          audio: true,
        };

        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoInput = devices.some(
          (device) => device.kind === "videoinput"
        );
        const hasAudioInput = devices.some(
          (device) => device.kind === "audioinput"
        );

        if (!hasVideoInput) constraints.video = false;
        if (!hasAudioInput) constraints.audio = false;

        // Request access to the user's camera and microphone
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localVideoRef.current.srcObject = stream;

        // Initialize the peer connection
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
        setIsCalling(true);
      } catch (error) {
        console.error("Error accessing media devices:", error);
        alert(
          "Unable to access your camera or microphone. Please check your device settings."
        );
        onEndCall(); // End the call if media devices are unavailable
      }
    };

    startCall();

    socket.on("incoming-call", async ({ offer, from }) => {
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
              to: from,
            });
          }
        };

        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        socket.emit("answer-call", { answer, to: from });
      } catch (error) {
        alert("Unable to handle incoming call.");
        onEndCall();
      }
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

  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    onEndCall();
  };

  return (
    <div className="video-call-container">
      <video ref={localVideoRef} autoPlay muted className="local-video" />
      <video ref={remoteVideoRef} autoPlay className="remote-video" />
      <button onClick={endCall} className="btn btn-error">
        End Call
      </button>
    </div>
  );
};

export default VideoCall;
