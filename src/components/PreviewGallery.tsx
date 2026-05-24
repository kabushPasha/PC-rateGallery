import React, { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { Project } from "../classes/Project";
import { getRarityColor, MediaPreview } from "./MediaPreview";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faFolderTree, faGrip, faShuffle, faStar } from '@fortawesome/free-solid-svg-icons';
import { Button, ButtonGroup } from "react-bootstrap";

export const PreviewGallery: React.FC = observer(() => {
  const project = Project.getInstance();
  const folder = project.selectedFolder;

  // State
  const [columns, setColumns] = useState<number>(3);
  const [itemsPerPage, setItemsPerPage] = useState<number>(6);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const [minRating, setMinRating] = useState<number>(0);
  const [maxRating, setMaxRating] = useState<number>(5);

  const [recursive, setRecursive] = useState<boolean>(false);

  useEffect(() => {
    if (!folder || !recursive) return;
    folder.readContentsRecursive();
  }, [folder, recursive]);


  // On folder changed - set first page
  useEffect(() => {
    if (!folder) return;
    const entry = project.database?.getFolderEntry(folder.path);
    const last_rating = entry?.lastRating ?? 0;
    const last_page = entry?.lastPageByRating[last_rating] ?? 1;
    setMinRating(last_rating);
    setCurrentPage(Math.max(last_page, 1));
  }, [folder]);

  useEffect(() => {
    if (!folder) return;
    const entry = project.database?.getFolderEntry(folder.path);
    const last_page = entry?.lastPageByRating[minRating] ?? 1;
    project.database?.setFolderRating(folder.path, minRating);
    setCurrentPage(Math.max(last_page, 1));
  }, [minRating]);


  // On page changed - store
  useEffect(() => {
    if (folder) project.database?.setFolderPage(folder?.path, minRating, currentPage)
  }, [currentPage])

  const [shuffle, setShuffle] = useState<boolean>(false);
  const [autorate, setAutorate] = useState<boolean>(false);
  /*
    const sourceFiles = useMemo(() => {
      if (!folder) return [];
      return recursive ? folder.files_recursive : folder.files;
    }, [recursive, folder])
  
  
    const filteredFiles = useMemo(() => {
      const files = sourceFiles.filter(
        (media) => media.rating >= minRating && media.rating <= maxRating
      );
  
      if (shuffle) {
        const shuffled = [...files];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      }
  
      return files.sort((a, b) => a.name.localeCompare(b.name));
    }, [minRating, maxRating, shuffle, sourceFiles]);
  */

  const sourceFiles = !folder ? [] : recursive ? folder.files_recursive : folder.files;
  const filteredFiles = sourceFiles.filter(
    (media) =>
      media.rating >= minRating &&
      media.rating <= maxRating
  );

  if (shuffle) {
    filteredFiles.sort(() => Math.random() - 0.5);
  } else {
    filteredFiles.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  const [showGridPicker, setShowGridPicker] = useState(false)
  const SIZE = 6;
  const [hovered, setHovered] = React.useState<any>(null);

  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const mediaToShow = filteredFiles.slice(startIndex, endIndex);

  // Ensure hooks are always called
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !folder) return;

    const handleWheel = (e: WheelEvent) => {
      console.log("wheel delta", e.deltaY);
      e.preventDefault();
      if (e.deltaY > 0) setCurrentPage((prev) => Math.min(prev + 1, totalPages));
      else if (e.deltaY < 0) setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    container.addEventListener("wheel", handleWheel);
    return () => container.removeEventListener("wheel", handleWheel);
  }, [folder,totalPages]);



  if (!folder) return <div>No folder selected.</div>;
  if (sourceFiles.length === 0) return <><div>No media found in this folder!!</div>
    <label>
      <input
        type="checkbox"
        checked={recursive}
        onChange={(e) => {
          setRecursive(e.target.checked);
          setCurrentPage(1);
        }}
      />
      Recursive
    </label>
  </>;




  // Pagination handlers
  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handleFirst = () => setCurrentPage(1);
  const handleLast = () => setCurrentPage(totalPages);




  return (
    <div ref={containerRef} style={{ padding: "1rem" }}>
      {/* Settings */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem", alignItems: "center" }}>

        <ButtonGroup className="me-2" aria-label="rating group">

          <Button
            variant={recursive ? "primary" : "outline-secondary"}
            onClick={() => {
              setRecursive((prev) => !prev);
              setCurrentPage(1);
            }}
            title="Recursive"
          >
            <FontAwesomeIcon icon={faFolderTree} />
          </Button>

          <Button
            variant={showGridPicker ? "primary" : "outline-secondary"}
            onClick={() => setShowGridPicker((prev) => !prev)}
            style={{ position: "relative" }}
          >
            <FontAwesomeIcon icon={faGrip} />

            {showGridPicker && (
              <div
                style={{
                  position: "absolute",
                  background: "black",
                  zIndex: 999,
                  padding: 4,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${SIZE}, 20px)`,
                    gap: 4,
                  }}
                >
                  {Array.from({ length: SIZE * SIZE }).map((_, i) => {
                    const x = i % SIZE;
                    const y = Math.floor(i / SIZE);

                    const isHovered =
                      hovered &&
                      x <= hovered.x &&
                      y <= hovered.y;

                    return (
                      <div
                        key={i}
                        onMouseEnter={() => setHovered({ x, y })}
                        onClick={() => {
                          console.log("clicked:", x + 1, y + 1)
                          setColumns(x + 1)
                          setItemsPerPage((x + 1) * (y + 1));
                          setCurrentPage(1);
                        }}
                        style={{
                          width: 20,
                          height: 20,
                          background: isHovered ? "#00aaff" : "#444",
                          borderRadius: 4,
                          cursor: "pointer",
                          transition: "0.1s",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </Button>


          {/**
        <label>
          Columns:{" "}
          <input
            type="number"
            min={1}
            max={6}
            value={columns}
            onChange={(e) => setColumns(Number(e.target.value))}
            style={{ width: "3rem" }}
          />
        </label>
        <label>
          Items per page:{" "}
          <input
            type="number"
            min={1}
            max={20}
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1); // reset page
            }}
            style={{ width: "3rem" }}
          />
        </label> 
         */}

          {/**
        <label>
          <input
            type="number"
            min={0}
            max={5}
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            style={{ width: "3rem" }}
          />
        </label>

        <label>
          <input
            type="number"
            min={0}
            max={5}
            value={maxRating}
            onChange={(e) => setMaxRating(Number(e.target.value))}
            style={{ width: "3rem" }}
          />
        </label>
         */}

          <Button
            variant={shuffle ? "warning" : "outline-secondary"}
            onClick={() => {
              setShuffle((prev) => !prev);
              setCurrentPage(1);
            }}
          >
            <FontAwesomeIcon icon={faShuffle} />
          </Button>

          <Button
            variant={autorate ? "warning" : "outline-secondary"}
            title="autorate"
            onClick={() => { setAutorate((prev) => !prev); }}
          >
            <FontAwesomeIcon icon={faEye} />
          </Button>

        </ButtonGroup>

        <ButtonGroup className="me-2" aria-label="rating group">
          {[0, 1, 2, 3, 4, 5].map((rating) => (
            <RatingButton
              key={rating}
              rating={rating}
              count={folder.ratingStats.ratings[rating - 1]}
              setMinRating={setMinRating}
              setMaxRating={setMaxRating}
              isActive={rating >= minRating && rating <= maxRating}
            />
          ))}
        </ButtonGroup>
      </div>

      {/* Gallery Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: "1rem",
        }}
      >
        {mediaToShow.map((media, _) => (
          <MediaPreview key={media.path} media={media} width="100%" autorate={autorate} />
        ))}
      </div>

      {/* Pagination Buttons */}
      {totalPages > 1 && (
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
          <button onClick={handleFirst} disabled={currentPage === 1}>
            First
          </button>
          <button onClick={handlePrev} disabled={currentPage === 1}>
            Prev
          </button>
          <span style={{ alignSelf: "center" }}>
            Page :
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = Number(e.target.value);
                if (!isNaN(page)) setCurrentPage(Math.min(Math.max(page, 1), totalPages));
              }}
              style={{ width: "3rem" }}
            />
            / {totalPages}
          </span>
          <button onClick={handleNext} disabled={currentPage === totalPages}>
            Next
          </button>
          <button onClick={handleLast} disabled={currentPage === totalPages}>
            Last
          </button>
        </div>
      )}
    </div>
  );
});





type RatingButtonProps = {
  rating: number;
  count: number;
  setMinRating: (v: number) => void;
  setMaxRating: (v: number) => void;
  isActive?: boolean;
};

export default function RatingButton({
  rating,
  count,
  setMinRating,
  setMaxRating,
  isActive,
}: RatingButtonProps) {

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      setMaxRating(rating);
      setMinRating(rating);
    } else {
      setMinRating(rating);
      setMaxRating(5);
    }
  };

  return (
    <Button
      onClick={handleClick}
      className="position-relative overflow-hidden"
      style={{
        backgroundColor: getRarityColor(rating),
        border: isActive ? "2px solid gold" : "2px solid transparent",
        transition: "all 120ms ease",
      }}
    >
      <FontAwesomeIcon
        icon={faStar}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          opacity: 0.2,
          fontSize: "1.35rem",
          zIndex: 0,
          pointerEvents: "none",

        }}
      />

      <span style={{ position: "relative", zIndex: 1 }}>
        {count}
      </span>
    </Button>
  );
}