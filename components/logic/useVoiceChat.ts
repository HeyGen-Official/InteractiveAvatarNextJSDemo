import { useCallback, useEffect } from 'react';
import { useAudioInputDevice } from './useAudioInputDevice';

import { useStreamingAvatarContext } from './context';

export const useVoiceChat = () => {
  const {
    avatarRef,
    isMuted,
    setIsMuted,
    isVoiceChatActive,
    setIsVoiceChatActive,
    isVoiceChatLoading,
    setIsVoiceChatLoading,
    audioInputDeviceId,
    audioInputDevices,
    audioInputDevice,
    setAudioInputDevice,
    subscribeOnAudioDeviceChange,
    unsubscribeOnAudioDeviceChange,
    initDevices,
  } = useStreamingAvatarContext();

  const startVoiceChat = useCallback(
    async (isInputAudioMuted?: boolean) => {
      if (!avatarRef.current) return;
      setIsVoiceChatLoading(true);
      const res = await initDevices();
      console.log('res', res);
      if (!res) {
        setIsVoiceChatLoading(false);
        return;
      }

      await avatarRef.current?.startVoiceChat({
        isInputAudioMuted,
        deviceId: { exact: res },
      });
      setIsVoiceChatLoading(false);
      setIsVoiceChatActive(true);
      setIsMuted(!!isInputAudioMuted);
    },
    [avatarRef, setIsMuted, setIsVoiceChatActive, setIsVoiceChatLoading]
  );

  const stopVoiceChat = useCallback(() => {
    if (!avatarRef.current) return;
    avatarRef.current?.closeVoiceChat();
    setIsVoiceChatActive(false);
    setIsMuted(true);
  }, [avatarRef, setIsMuted, setIsVoiceChatActive]);

  const muteInputAudio = useCallback(() => {
    if (!avatarRef.current) return;
    avatarRef.current?.muteInputAudio();
    setIsMuted(true);
  }, [avatarRef, setIsMuted]);

  const unmuteInputAudio = useCallback(() => {
    if (!avatarRef.current) return;
    avatarRef.current?.unmuteInputAudio();
    setIsMuted(false);
  }, [avatarRef, setIsMuted]);

  return {
    startVoiceChat,
    stopVoiceChat,
    muteInputAudio,
    unmuteInputAudio,
    isMuted,
    isVoiceChatActive,
    isVoiceChatLoading,
    setVoiceChatDevice: setAudioInputDevice,
    audioInputDevices,
    voiceChatDevice: audioInputDevice,
    subscribeOnAudioDeviceChange,
    unsubscribeOnAudioDeviceChange,
  };
};
