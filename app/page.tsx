"use client";

import InteractiveAvatar from "@/components/InteractiveAvatar";
import InteractiveAvatarCode from "@/components/InteractiveAvatarCode";
import { Tab, Tabs } from "@nextui-org/react";

export default function App() {
  const tabs = [
    {
      id: "demo",
      label: "Demo",
      content: <InteractiveAvatar />,
    },
    {
      id: "code",
      label: "Code",
      content: <InteractiveAvatarCode />,
    },
  ];

  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="w-[900px] flex flex-col items-start justify-start gap-5 mx-auto pt-4 pb-20">
        <div className="w-full">
          <Tabs items={tabs}>
            {(items) => (
              <Tab key={items.id} title={items.label}>
                {items.content}
              </Tab>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
