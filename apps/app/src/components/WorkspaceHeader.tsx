import React from "react";
import { Smartphone, RotateCcw } from "lucide-react";
import { UserProfile } from "../core/types";

interface WorkspaceHeaderProps {
  isSimulatorMode: boolean;
  setIsSimulatorMode: (val: boolean) => void;
  profile: UserProfile | null;
  handleLogoutReset: () => void;
}

export const WorkspaceHeader = ({
  isSimulatorMode,
  setIsSimulatorMode,
  profile,
  handleLogoutReset
}: WorkspaceHeaderProps) => {
  return null;
};
