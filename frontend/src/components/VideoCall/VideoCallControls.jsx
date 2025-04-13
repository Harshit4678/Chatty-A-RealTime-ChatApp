import React, { useState } from "react";

const VideoCallControls = ({ localStream, onEndCall }) => {
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted((prev) => !prev);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoMuted((prev) => !prev);
    }
  };

  return (
    <div className="video-call-controls flex justify-center gap-4 p-4 bg-gray-800">
      <button
        onClick={toggleAudio}
        className={`btn ${isAudioMuted ? "btn-error" : "btn-primary"}`}
      >
        {isAudioMuted ? "Unmute" : "Mute"}
      </button>
      <button
        onClick={toggleVideo}
        className={`btn ${isVideoMuted ? "btn-error" : "btn-primary"}`}
      >
        {isVideoMuted ? "Turn Video On" : "Turn Video Off"}
      </button>
      <button onClick={onEndCall} className="btn btn-error">
        End Call
      </button>
    </div>
  );
};

export default VideoCallControls;
