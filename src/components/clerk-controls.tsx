"use client";

import { useEffect, useState } from "react";

type ClerkModule = {
  Show: React.ComponentType<any>;
  SignInButton: React.ComponentType<any>;
  SignUpButton: React.ComponentType<any>;
  UserButton: React.ComponentType<any>;
};

// Loads Clerk controls only when needed, so the app also runs without Clerk configured.
export function ClerkControls() {
  const [m, setM] = useState<ClerkModule | null>(null);

  useEffect(() => {
    let alive = true;
    import("@clerk/nextjs")
      .then((mod) => {
        if (alive) {
          setM({
            Show: mod.Show,
            SignInButton: mod.SignInButton,
            SignUpButton: mod.SignUpButton,
            UserButton: mod.UserButton,
          });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!m) return null;
  return (
    <div className="ml-1 flex items-center gap-1.5">
      <m.Show when="signed-out">
        <m.SignInButton mode="modal" />
        <m.SignUpButton mode="modal" />
      </m.Show>
      <m.Show when="signed-in">
        <m.UserButton />
      </m.Show>
    </div>
  );
}
