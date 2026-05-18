import React, { useEffect, useState } from "react";
import { Media } from "../classes/Media";
import { observer } from "mobx-react-lite";

interface MediaPreviewProps {
  media: Media;
  width?: string | number;
  height?: string | number;
  maxRating?: number;
}

export const MediaPreview: React.FC<MediaPreviewProps> = observer(({
  media,
  width = "100%",
  height = "auto",
  maxRating = 5
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [type, setType] = useState<string>("");

  useEffect(() => {
    let objectUrl: string;

    const loadMedia = async () => {
      const file = await media.getFile();
      let mimeType = file.type;

      if (!mimeType) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        switch (ext) {
          case "mp4": mimeType = "video/mp4"; break;
          case "webm": mimeType = "video/webm"; break;
          case "ogg": mimeType = "video/ogg"; break;
          case "mkv": mimeType = "video/mkv"; break;
          case "jpg": case "jpeg": mimeType = "image/jpeg"; break;
          case "png": mimeType = "image/png"; break;
          case "gif": mimeType = "image/gif"; break;
          case "mp3": mimeType = "audio/mpeg"; break;
          case "wav": mimeType = "audio/wav"; break;
          default: mimeType = "application/octet-stream";
        }
      }

      objectUrl = URL.createObjectURL(file);
      setUrl(objectUrl);
      setType(mimeType);
    };

    loadMedia();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [media]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;

    if (clickX > rect.width / 2) {
      media.setRating(Math.min(media.rating + 1, maxRating));
    } else {
      media.setRating(Math.max(media.rating - 1, 0));
    }
  };

  const renderRatingDots = () => {
    const dots = [];
    for (let i = 0; i < maxRating; i++) {
      dots.push(
        <span
          key={i}
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: i < media.rating ? "limegreen" : "gray",
            marginLeft: 2
          }}
        />
      );
    }
    return (
      <div style={{ position: "absolute", top: 4, right: 4, display: "flex" }}>
        {dots}
      </div>
    );
  };

  if (!url) return <div>Loading preview...</div>;

  return (
    <div
      onClick={handleClick}
      style={{
        position: "relative",
        width,
        height,
        cursor: "pointer",
        borderRadius: 4,
        overflow: "hidden",
        backgroundColor: "#000",
        userSelect: "none",

        // add these
        border: `6px solid ${getRarityColor(media.rating)}`,
      }}
    >
      {type.startsWith("video/") ? (
        <video
          src={url}
          autoPlay
          muted
          loop
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : type.startsWith("image/") ? (
        <img
          src={url}
          alt={media.name}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : (
        <div style={{ color: "#fff", padding: 10 }}>
          Cannot preview this file type: {media.name}
        </div>
      )}
      {renderRatingDots()}
    </div>
  );
});


  // Add this helper above return()
  export const getRarityColor = (rating: number) => {
    switch (rating) {
      case 0:
        return "#343434";
      case 1:
        return "#927249";
      case 2:
        return "#7aa9bc";
      case 3:
        return "gold";
      case 4:
        return "#ff5100";
      default:
        return "transparent";
    }
  };