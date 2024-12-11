"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import InteractiveAvatar from "@/components/InteractiveAvatar";
import { AVATARS } from "@/app/lib/constants";

export default function LiveAvatarPage() {
  const params = useParams();
  const avatarId = params.avatar_id as string;
  const [isValidAvatar, setIsValidAvatar] = useState(false);

  useEffect(() => {
    // Validate if the avatar exists in our list
    const isValid = AVATARS.some((avatar) => avatar.avatar_id === avatarId);
    setIsValidAvatar(isValid);
  }, [avatarId]);

  if (!isValidAvatar) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Avatar Not Found</h1>
          <p>The requested avatar does not exist or is not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="w-[900px] flex flex-col items-start justify-start gap-5 mx-auto pt-4 pb-20">
        <div className="w-full">
          <InteractiveAvatar initialAvatarId={avatarId} autoStartVoiceMode={true} />
        </div>
      </div>
    </div>
  );
} 