import { useCallback, useMemo, useState } from 'react';

export interface ExtendedMediaDeviceInfoInterface {
  deviceId: string;
  label: string;
  groupId: string;
  kind: MediaDeviceKind;
  isDefault: boolean;
}

const getDefaultAudioDevice = (
  devices: MediaDeviceInfo[]
): { device: MediaDeviceInfo; exact: boolean } | null => {
  const firstNonDefaultDevice =
    devices.find((d) => d.deviceId !== 'default' && d.kind === 'audioinput') || null;

  const defaultDevice = devices.find(
    (d) => d.deviceId === 'default' && d.kind === 'audioinput'
  );
  if (!defaultDevice)
    return firstNonDefaultDevice ? { device: firstNonDefaultDevice, exact: false } : null;

  const groupMatches = devices.filter(
    (d) =>
      d.kind === 'audioinput' &&
      d.deviceId !== 'default' &&
      d.groupId === defaultDevice.groupId
  );

  if (!groupMatches.length) {
    if (!defaultDevice)
      return firstNonDefaultDevice
        ? { device: firstNonDefaultDevice, exact: false }
        : null;
  }
  if (groupMatches.length === 1) {
    return { device: groupMatches[0], exact: true };
  }

  const labelMatches = groupMatches.filter(
    (d) => defaultDevice.label && defaultDevice.label?.includes(d.label)
  );

  if (!labelMatches.length) {
    return { device: groupMatches[0], exact: false };
  } else if (labelMatches.length === 1) {
    return { device: labelMatches[0], exact: true };
  } else {
    return { device: labelMatches[0], exact: false };
  }
};

const getAudioDevices = async (): Promise<{
  audioDevices: ExtendedMediaDeviceInfoInterface[];
  defaultAudioDevice: ExtendedMediaDeviceInfoInterface | null;
}> => {
  await navigator.mediaDevices.getUserMedia({
    audio: true,
  });

  const devices = await navigator.mediaDevices.enumerateDevices();
  const defaultDevice = getDefaultAudioDevice(devices);
  const audioDevices = devices
    .filter((device) => device.kind === 'audioinput')
    .map((device) => ({
      deviceId: device.deviceId,
      label: device.label,
      groupId: device.groupId,
      kind: device.kind,
      isDefault:
        device.deviceId === defaultDevice?.device.deviceId && defaultDevice?.exact,
    }))
    .sort((a, b) => (a.isDefault ? -1 : 1) - (b.isDefault ? -1 : 1));
  const defaultAudioDevice = defaultDevice
    ? {
        deviceId: defaultDevice.device.deviceId,
        label: defaultDevice.device.label,
        groupId: defaultDevice.device.groupId,
        kind: defaultDevice.device.kind,
        isDefault: defaultDevice.exact,
      }
    : null;
  return {
    audioDevices: audioDevices.filter((d) => d.deviceId !== 'default'),
    defaultAudioDevice,
  };
};

const maybeChangeAudioDevice = (
  prevDevice: ExtendedMediaDeviceInfoInterface | undefined,
  newDevice: ExtendedMediaDeviceInfoInterface | null,
  devices: ExtendedMediaDeviceInfoInterface[]
): ExtendedMediaDeviceInfoInterface | undefined => {
  if (
    !prevDevice ||
    prevDevice.isDefault ||
    !devices.some((device) => device.deviceId === prevDevice.deviceId)
  ) {
    return newDevice || undefined;
  }
  return prevDevice;
};

export const useAudioInputDevice = () => {
  const [audioInputDevice, setAudioInputDevice] = useState<
    ExtendedMediaDeviceInfoInterface | undefined
  >(undefined);
  const [audioInputDevices, setAudioInputDevices] = useState<
    ExtendedMediaDeviceInfoInterface[]
  >([]);

  const initDevices = useCallback(async (): Promise<string | null> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return null;
    }

    let defaultInputDevice: ExtendedMediaDeviceInfoInterface | undefined = undefined;
    const initInputDevices = async () => {
      try {
        const res = await getAudioDevices();
        if (!res.audioDevices.length || !res.defaultAudioDevice) {
          return;
        }
        setAudioInputDevices(res.audioDevices);
        const newDevice = maybeChangeAudioDevice(
          audioInputDevice,
          res.defaultAudioDevice,
          res.audioDevices
        );
        setAudioInputDevice(newDevice);
        if (newDevice) {
          defaultInputDevice = newDevice;
        }
      } catch (error) {
        console.error(error);
      }
    };

    await initInputDevices();

    return (
      (defaultInputDevice as ExtendedMediaDeviceInfoInterface | undefined)?.deviceId ||
      null
    );
  }, [audioInputDevice]);

  const onDeviceChange = useCallback(async () => {
    try {
      const inputRes = await getAudioDevices();
      setAudioInputDevices(inputRes.audioDevices);
      setAudioInputDevice((prevDevice) =>
        maybeChangeAudioDevice(
          prevDevice,
          inputRes.defaultAudioDevice,
          inputRes.audioDevices
        )
      );
    } catch (error) {
      console.error(error);
    }
  }, []);

  const subscribeOnAudioDeviceChange = useCallback(() => {
    navigator.mediaDevices.addEventListener('devicechange', onDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', onDeviceChange);
    };
  }, [onDeviceChange]);

  const unsubscribeOnAudioDeviceChange = useCallback(() => {
    navigator.mediaDevices.removeEventListener('devicechange', onDeviceChange);
  }, [onDeviceChange]);

  const audioInputDeviceId = useMemo(() => {
    return audioInputDevice?.deviceId;
  }, [audioInputDevice]);

  return {
    audioInputDevice,
    audioInputDeviceId,
    audioInputDevices,
    setAudioInputDevice,
    initDevices,
    subscribeOnAudioDeviceChange,
    unsubscribeOnAudioDeviceChange,
  };
};
