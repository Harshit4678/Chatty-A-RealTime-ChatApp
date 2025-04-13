// filepath: frontend/src/components/VideoCallLayout.jsx
import React from "react";

const VideoCallLayout = ({
  localVideoRef,
  remoteVideoRef,
  isConnecting,
  onEndCall,
}) => {
  return (
    <div className="video-call-container relative w-full h-full bg-black rounded-lg overflow-hidden">
      {/* Full-screen video: other person's stream */}
      <video
        ref={remoteVideoRef}
        autoPlay
        className="full-video w-full h-full object-cover rounded-lg"
      />

      {/* Small box: own stream */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        className="small-video absolute bottom-4 left-4 w-32 h-32 md:w-40 md:h-40 object-cover rounded-2xl border-2 border-white shadow-lg"
      />

      {/* End call button */}
      <button
        onClick={onEndCall}
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

export default VideoCallLayout;
