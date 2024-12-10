import { Input, Spinner, Tooltip } from "@nextui-org/react";
import { Airplane, ArrowRight, PaperPlaneRight } from "@phosphor-icons/react";
import clsx from "clsx";

interface StreamingAvatarTextInputProps {
  label: string;
  placeholder: string;
  input: string;
  onSubmit: () => void;
  setInput: (value: string) => void;
  endContent?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  chatMessages?: { role: string; content: string }[];
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
  function handleSubmit() {
    if (input.trim() === "") {
      return;
    }
    onSubmit();
    setInput("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
        {chatMessages.map((message, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg ${
              message.role === "user" ? "bg-blue-200 self-end" : "bg-gray-200 self-start"
            }`}
          >
            {message.content}
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
