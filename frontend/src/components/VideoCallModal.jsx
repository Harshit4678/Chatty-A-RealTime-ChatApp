import { useEffect, useRef } from "react";

const VideoCallModal = ({
  isOpen,
  incomingCall,
  onAccept,
  onDecline,
  onEndCall,
  localStream,
  remoteStream,
  isInCall,
  isCaller,
}) => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 flex flex-col items-center gap-4 relative w-[400px] h-[350px]">
        {isInCall ? (
          <div className="relative w-full h-full">
            <video
              ref={remoteVideoRef}
              autoPlay
              className="w-full h-full bg-black rounded"
            />
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className="absolute bottom-4 right-4 w-32 h-24 bg-black rounded border-2 border-white shadow-lg"
              style={{ zIndex: 10 }}
            />
            <button
              className="btn btn-error absolute top-2 right-2"
              onClick={onEndCall}
            >
              End Call
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <p className="text-lg font-semibold mb-4">
              {incomingCall ? "Incoming Video Call..." : "Calling..."}
            </p>
            {incomingCall && (
              <div className="flex gap-4">
                <button className="btn btn-success" onClick={onAccept}>
                  Accept
                </button>
                <button className="btn btn-error" onClick={onDecline}>
                  Decline
                </button>
              </div>
            )}
            {!incomingCall && (
              <button className="btn btn-error mt-4" onClick={onEndCall}>
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCallModal;
