"use client";

// import { useEffect, useState } from "react";

import { useParams } from "next/navigation";
import InteractiveAvatar from "@/components/InteractiveAvatar";
// import { AVATARS } from "@/app/lib/constants";

export default function LiveAvatarPage() {
  const params = useParams();
  const avatarId = params.avatar_id as string;

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