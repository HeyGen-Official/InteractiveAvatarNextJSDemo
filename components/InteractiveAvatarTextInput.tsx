import { Input, Spinner, Tooltip } from "@nextui-org/react";
import { Airplane, ArrowRight, PaperPlaneRight } from "@phosphor-icons/react";
import clsx from "clsx";
import { useEffect, useRef } from "react";

interface ChatMessage {
  id: string; // Unique identifier for each message
  role: string;
  content: string;
  timestamp: string; // Timestamp for each message
}

interface StreamingAvatarTextInputProps {
  label: string;
  placeholder: string;
  input: string;
  onSubmit: () => void;
  setInput: (value: string) => void;
  endContent?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  chatMessages?: ChatMessage[];
}

export default function InteractiveAvatarTextInput({
  label,
  placeholder,
  input,
  onSubmit,
  setInput,
  endContent,
  disabled = false,
  loading = false,
  chatMessages = [],
}: StreamingAvatarTextInputProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  function handleSubmit() {
    if (input.trim() === "") {
      return;
    }
    onSubmit();
    setInput("");
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      // Scroll to the top (since messages are reversed)
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  
  return (
    <div className="flex flex-col gap-2">
      <div 
      ref={chatContainerRef}
      className="flex flex-col-reverse gap-2 max-h-60 overflow-y-auto">
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`p-2 rounded-lg ${
              message.role === "user" ? "bg-blue-200 self-end" : "bg-gray-200 self-start"
            }`}
          >
            <span className="text-xs text-gray-500">{message.timestamp} - </span>
            <span>{message.content}</span>
          </div>
        ))}
      </div>
      <Input
        endContent={
          <div className="flex flex-row items-center h-full">
            {endContent}
            <Tooltip content="Send message">
              {loading ? (
                <Spinner
                  className="text-indigo-300 hover:text-indigo-200"
                  size="sm"
                  color="default"
                />
              ) : (
                <button
                  type="submit"
                  className="focus:outline-none"
                  onClick={handleSubmit}
                >
                  <PaperPlaneRight
                    className={clsx(
                      "text-indigo-300 hover:text-indigo-200",
                      disabled && "opacity-50"
                    )}
                    size={24}
                  />
                </button>
              )}
            </Tooltip>
          </div>
        }
        label={label}
        placeholder={placeholder}
        size="sm"
        value={input}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSubmit();
          }
        }}
        onValueChange={setInput}
        isDisabled={disabled}
      />
    </div>
  );
}
