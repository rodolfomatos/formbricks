/**
 * Toggle button for selecting mobile/desktop preview mode in the preview panel.
 * Highlights the active tab with a rounded background.
 */
import { ReactNode } from "react";

interface TabOptionProps {
  active: boolean;
  icon: ReactNode;
  onClick: () => void;
}

export const TabOption = ({ active, icon, onClick }: TabOptionProps) => {
  return (
    <button
      type="button"
      className={`${active ? "rounded-full bg-slate-200" : ""} cursor-pointer`}
      onClick={onClick}>
      {icon}
    </button>
  );
};
