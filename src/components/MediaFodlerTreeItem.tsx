import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { MediaFolder } from "../classes/MediaFolder";
import { Project } from "../classes/Project";
import { ContextMenu } from "radix-ui";

import "../index.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquareCheck } from "@fortawesome/free-solid-svg-icons";

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
      <ContextMenu.Root>
        <ContextMenu.Trigger>
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
              {folder.loaded && ` (${folder.ratingSummary})`}
              {loading && " (loading...)"}
            </span>

            <FontAwesomeIcon icon={faSquareCheck} color={project.database?.getFolderEntry(folder.path).done ?? false ? "#09850d" : "#d7d7d782"}
              onClick={() => {
                 project.database?.setFolderDone(folder.path, !project.database.getFolderEntry(folder.path).done)                  
                 }} />

          </div>
        </ContextMenu.Trigger>

        <ContextMenu.Portal>
          <ContextMenu.Content className="ContextMenuContent" >
            <ContextMenu.Item className="ContextMenuItem" onClick={logFolder}>
              Log
            </ContextMenu.Item>

            <ContextMenu.Item className="ContextMenuItem" onClick={() => { project.database?.setFolderDone(folder.path, !project.database.getFolderEntry(folder.path).done) }}>
              Finished
            </ContextMenu.Item>

          </ContextMenu.Content>

        </ContextMenu.Portal>

      </ContextMenu.Root>

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
