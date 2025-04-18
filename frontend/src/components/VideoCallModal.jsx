import { useEffect, useRef } from "react";

const VideoCallModal = ({
  isOpen,
  //   onClose,
  localStream,
  remoteStream,
  onEndCall,
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
      <div className="bg-white rounded-lg p-4 flex flex-col items-center gap-4">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          className="w-48 h-36 bg-black rounded"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          className="w-64 h-48 bg-black rounded"
        />
        <button className="btn btn-error mt-2" onClick={onEndCall}>
          End Call
        </button>
        {!isCaller && <p>Incoming call...</p>}
      </div>
    </div>
  );
};

export default VideoCallModal;
