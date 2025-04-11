import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore.js";
import { Image, X, Smile, Send } from "lucide-react"; // Import Smile icon
import EmojiPicker from "emoji-picker-react"; // Import emoji picker
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression"; // Import image compression library

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // State to toggle emoji picker
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null); // Ref for the emoji picker container
  const { sendMessage } = useChatStore();

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      // Compress the image
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1, // Compress to 1MB
        maxWidthOrHeight: 1024, // Resize to 1024px max
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Image compression failed:", error);
      toast.error("Failed to process image");
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      // Clear form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setText((prevText) => prevText + emojiObject.emoji); // Append selected emoji to the text
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 relative"
      >
        <div className="relative flex-1">
          {/* Text Input */}
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md pr-16" // Add padding to the right for buttons
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <button
            type="button"
            className={`absolute top-1/2 right-12 transform -translate-y-1/2 btn btn-circle btn-sm ${
              imagePreview ? "text-emerald-500" : "text-zinc-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={18} />
          </button>
        </div>

        {/* Emoji Picker Toggle Button */}
        <button
          type="button"
          className="absolute top-1/2 right-12 transform -translate-y-1/2 btn btn-circle btn-sm"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
        >
          <Smile size={20} />
        </button>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div
            className={`absolute z-50 ${
              window.innerWidth <= 640 // Check if the screen width is mobile size
                ? "bottom-0 left-0 w-full h-[40vh] overflow-y-scroll bg-white shadow-lg rounded-t-lg"
                : "bottom-14 right-1"
            }`}
            ref={emojiPickerRef}
          >
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
        <button
          type="submit"
          className="btn btn-sm btn-circle text-gray-800 dark:text-white"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={20} className="text-white hover:divide-zinc-900" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
