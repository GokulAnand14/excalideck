import React from "react";
import { useDialog } from "../../context/DialogContext";

interface NewFileButtonProps {
  onCreateDrawing: (name: string, folder?: string) => void;
  rootPath?: string;
}

export const NewFileButton: React.FC<NewFileButtonProps> = ({ onCreateDrawing }) => {
  const { promptDialog } = useDialog();

  const handleClick = async () => {
    const name = await promptDialog({
      title: "Create New Drawing",
      placeholder: "Untitled",
      defaultValue: "Untitled",
      confirmText: "Create",
      icon: "✏️",
    });
    if (name) {
      onCreateDrawing(name);
    }
  };

  return (
    <button className="new-file-btn" onClick={handleClick} title="New Drawing">
      + New
    </button>
  );
};
