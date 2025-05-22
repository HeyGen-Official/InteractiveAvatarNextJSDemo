import React from 'react';

import { useVoiceChat } from '../logic/useVoiceChat';
import { Button } from '../Button';
import { LoadingIcon, MicIcon, MicOffIcon } from '../Icons';
import { useConversationState } from '../logic/useConversationState';
import { Select } from '../Select';
import { useMount, useUnmount } from 'ahooks';

export const AudioInput: React.FC = () => {
  const {
    muteInputAudio,
    unmuteInputAudio,
    isMuted,
    isVoiceChatLoading,
    subscribeOnAudioDeviceChange,
    unsubscribeOnAudioDeviceChange,
    audioInputDevices,
    voiceChatDevice,
    setVoiceChatDevice,
  } = useVoiceChat();
  const { isUserTalking } = useConversationState();

  const handleMuteClick = () => {
    if (isMuted) {
      unmuteInputAudio();
    } else {
      muteInputAudio();
    }
  };

  useMount(() => {
    subscribeOnAudioDeviceChange();
  });

  useUnmount(() => {
    unsubscribeOnAudioDeviceChange();
  });

  return (
    <div className='flex flex-row items-center gap-4 min-w-[300px]'>
      <Button
        className={`!p-2 relative`}
        disabled={isVoiceChatLoading}
        onClick={handleMuteClick}
      >
        <div
          className={`absolute left-0 top-0 rounded-lg border-2 border-[#7559FF] w-full h-full ${isUserTalking ? 'animate-ping' : ''}`}
        />
        {isVoiceChatLoading ? (
          <LoadingIcon className='animate-spin' size={20} />
        ) : isMuted ? (
          <MicOffIcon size={20} />
        ) : (
          <MicIcon size={20} />
        )}
      </Button>
      <Select
        options={audioInputDevices}
        renderOption={(option) => option.label}
        onSelect={(option) => setVoiceChatDevice(option)}
        isSelected={(option) => voiceChatDevice?.deviceId === option.deviceId}
        value={voiceChatDevice?.label}
      />
    </div>
  );
};
