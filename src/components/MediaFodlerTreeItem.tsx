import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { MediaFolder } from "../classes/MediaFolder";
import { Project } from "../classes/Project";

interface MediaFolderTreeItemProps {
  folder: MediaFolder | null;
}

export const MediaFolderTreeItem: React.FC<MediaFolderTreeItemProps> = observer(({ folder }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!folder) return null;

  const project = Project.getInstance();

  const toggleCollapse = async () => {
    if (collapsed && !folder.loaded) {
      setLoading(true);
      await folder.readContents();
      setLoading(false);
    }
    setCollapsed(!collapsed);

    project.setSelectedFolder(folder);
  };

  const logFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Folder clicked:", folder.name, folder);
  };

  let folderColor = folder.loaded ? "#fff" : "#ccc";
  if (project.selectedFolder === folder) folderColor = "limegreen";

  return (
    <li>
      {/* Folder row */}
      <div
        onClick={toggleCollapse}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span
          style={{
            flexGrow: 1,
            color: folderColor,
            whiteSpace: "nowrap",      // prevent text from wrapping
            overflow: "hidden",        // clip overflow
            textOverflow: "ellipsis",  // add "..." if too long
          }}
          title={`${folder.name}${folder.files.length > 0 ? ` (${folder.files.length})` : ""}`} // tooltip shows full name
        >
          {collapsed ? "▶ " : "▼ "}
          {folder.name}
          {folder.files.length > 0 && ` (${folder.files.length})`}
          {loading && " (loading...)"}
        </span>

        <button
          onClick={logFolder}
          style={{ fontSize: "0.8rem", padding: "0.1rem 0.3rem", cursor: "pointer" }}
        >
          Log
        </button>
      </div>

      {/* Nested subfolders */}
      {!collapsed && folder.folders.length > 0 && (
        <ul style={{ paddingLeft: "1rem", listStyleType: "none" }}>
          {folder.folders.map((childFolder, index) => (
            <MediaFolderTreeItem key={index} folder={childFolder} />
          ))}
        </ul>
      )}
    </li>
  );
});
