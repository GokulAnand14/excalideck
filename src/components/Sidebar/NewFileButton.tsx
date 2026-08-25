import React from "react";

interface NewFileButtonProps {
  onCreateDrawing: (name: string, folder?: string) => void;
  rootPath: string;
}

export const NewFileButton: React.FC<NewFileButtonProps> = ({ onCreateDrawing, rootPath }) => {
  const handleClick = () => {
    const name = prompt("New drawing name:");
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
