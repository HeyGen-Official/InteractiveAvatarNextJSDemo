import React, { useEffect, useState } from "react";

import { useVoiceChat } from "../logic/useVoiceChat";
import { Button } from "../Button";
import { LoadingIcon, MicIcon, MicOffIcon } from "../Icons";
import { useConversationState } from "../logic/useConversationState";

interface AudioInputProps {
  microphoneEnabled: boolean;
}

export const AudioInput: React.FC<AudioInputProps> = ({ microphoneEnabled }) => {
  const { muteInputAudio, unmuteInputAudio, isMuted, isVoiceChatLoading } =
    useVoiceChat();
  const { isUserTalking } = useConversationState();
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);

  // Initial mute state
  useEffect(() => {
    muteInputAudio();
    setIsPushToTalkActive(false);
  }, []);

  // Sync microphoneEnabled with isPushToTalkActive
  useEffect(() => {
    if (microphoneEnabled) {
      unmuteInputAudio();
      setIsPushToTalkActive(true);
    } else {
      muteInputAudio();
      setIsPushToTalkActive(false);
    }
  }, [microphoneEnabled, muteInputAudio, unmuteInputAudio]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift" && e.location === 1 && microphoneEnabled) { // Left shift key
        unmuteInputAudio();
        setIsPushToTalkActive(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift" && e.location === 1) { // Left shift key
        muteInputAudio();
        setIsPushToTalkActive(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [muteInputAudio, unmuteInputAudio, microphoneEnabled]);

  const handleMuteClick = () => {
    if (isMuted && microphoneEnabled) {
      unmuteInputAudio();
      setIsPushToTalkActive(true);
    } else {
      muteInputAudio();
      setIsPushToTalkActive(false);
    }
  };

  return (
    <div>
      <Button
        className={`!p-2 relative`}
        disabled={isVoiceChatLoading || !microphoneEnabled}
        onClick={handleMuteClick}
      >
        <div
          className={`absolute left-0 top-0 rounded-lg border-2 border-[#7559FF] w-full h-full ${isUserTalking ? "animate-ping" : ""}`}
        />
        {isVoiceChatLoading ? (
          <LoadingIcon className="animate-spin" size={20} />
        ) : !isPushToTalkActive ? (
          <MicOffIcon size={20} />
        ) : (
          <MicIcon size={20} />
        )}
      </Button>
    </div>
  );
};
