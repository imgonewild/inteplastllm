import React, { useState, useEffect, useRef } from "react";

const SourceHighlighter = ({ highlights = [], pageNumber, scale = 1.0 }) => {
  const [hoveredHighlight, setHoveredHighlight] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Filter highlights for current page
  const pageHighlights = highlights.filter(
    (h) => h.pageNumber === pageNumber || (!h.pageNumber && pageNumber === 1)
  );

  const handleHighlightHover = (highlight, event) => {
    setHoveredHighlight(highlight);

    // Calculate tooltip position
    const rect = event.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      setTooltipPosition({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 10,
      });
    }
  };

  const handleHighlightLeave = () => {
    setHoveredHighlight(null);
  };

  const handleHighlightClick = (highlight) => {
    // Scroll to highlight or show more details
    console.log("Clicked highlight:", highlight);

    // Could trigger additional actions like:
    // - Show full context in a modal
    // - Scroll to related text
    // - Show similarity score details
  };

  const getHighlightStyle = (highlight) => {
    const baseStyle = {
      position: "absolute",
      borderRadius: "3px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      zIndex: 10,
      mixBlendMode: "multiply",
    };

    // Determine color based on similarity or type
    let backgroundColor, borderColor;

    if (highlight.isSearch) {
      backgroundColor = "rgba(0, 0, 255, 0.3)";
      borderColor = "rgba(0, 0, 255, 0.5)";
    } else {
      const similarity = highlight.similarity || 0;
      if (similarity > 0.9) {
        backgroundColor = "rgba(255, 0, 0, 0.3)";
        borderColor = "rgba(255, 0, 0, 0.5)";
      } else if (similarity > 0.8) {
        backgroundColor = "rgba(255, 165, 0, 0.3)";
        borderColor = "rgba(255, 165, 0, 0.5)";
      } else if (similarity > 0.7) {
        backgroundColor = "rgba(255, 255, 0, 0.3)";
        borderColor = "rgba(255, 255, 0, 0.5)";
      } else {
        backgroundColor = "rgba(0, 255, 0, 0.3)";
        borderColor = "rgba(0, 255, 0, 0.5)";
      }
    }

    return {
      ...baseStyle,
      backgroundColor: highlight.color || backgroundColor,
      border: `1px solid ${borderColor}`,
      // Apply scaling
      transform: `scale(${scale})`,
      transformOrigin: "top left",
    };
  };

  const estimateHighlightPosition = (highlight, index) => {
    // This is a simplified positioning algorithm
    // In a real implementation, you'd need more sophisticated text positioning
    // based on the actual PDF text layer coordinates

    const baseHeight = 600; // Approximate page height
    const baseWidth = 400; // Approximate page width

    // Use chunk index or estimated position
    const chunkIndex = highlight.chunkIndex || index;
    const chunksPerPage = 10; // Estimate

    // Calculate approximate position
    const row = Math.floor(chunkIndex / 2);
    const col = chunkIndex % 2;

    const top = row * 60 + Math.random() * 40; // Add some randomness
    const left = col * 200 + Math.random() * 100;
    const width = 150 + Math.random() * 100;
    const height = 20 + Math.random() * 20;

    return {
      top: `${Math.min(top, baseHeight - height)}px`,
      left: `${Math.min(left, baseWidth - width)}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  };

  const getHighlightTooltipContent = (highlight) => {
    if (highlight.isSearch) {
      return `Search result: "${highlight.content}"`;
    }

    const similarity = highlight.similarity || 0;
    const relevanceText =
      similarity > 0.9
        ? "High"
        : similarity > 0.8
          ? "Medium-High"
          : similarity > 0.7
            ? "Medium"
            : "Low";

    return `${relevanceText} relevance (${Math.round(similarity * 100)}%) - Click for details`;
  };

  if (pageHighlights.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
    >
      {pageHighlights.map((highlight, index) => {
        const position =
          highlight.startOffset && highlight.endOffset
            ? {
                // Use actual text positions if available
                top: `${highlight.top || 0}px`,
                left: `${highlight.left || 0}px`,
                width: `${highlight.width || 100}px`,
                height: `${highlight.height || 20}px`,
              }
            : estimateHighlightPosition(highlight, index);

        return (
          <div
            key={highlight.id}
            className="source-highlight pointer-events-auto"
            style={{
              ...getHighlightStyle(highlight),
              ...position,
            }}
            onMouseEnter={(e) => handleHighlightHover(highlight, e)}
            onMouseLeave={handleHighlightLeave}
            onClick={() => handleHighlightClick(highlight)}
            title={getHighlightTooltipContent(highlight)}
          />
        );
      })}

      {/* Tooltip */}
      {hoveredHighlight && (
        <div
          className="highlight-tooltip visible"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            position: "absolute",
            background: "rgba(0, 0, 0, 0.9)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "12px",
            whiteSpace: "nowrap",
            maxWidth: "250px",
            zIndex: 1000,
            pointerEvents: "none",
            transform: "translateX(-50%) translateY(-100%)",
          }}
        >
          <div className="font-medium mb-1">
            {hoveredHighlight.isSearch ? "Search Result" : "Source Reference"}
          </div>
          <div className="text-xs opacity-90">
            {hoveredHighlight.isSearch
              ? `"${hoveredHighlight.content}"`
              : `Relevance: ${Math.round((hoveredHighlight.similarity || 0) * 100)}%`}
          </div>
          {hoveredHighlight.metadata?.chunkIndex !== undefined && (
            <div className="text-xs opacity-75 mt-1">
              Chunk {hoveredHighlight.metadata.chunkIndex}
            </div>
          )}
        </div>
      )}

      {/* Highlight Legend */}
      {pageHighlights.length > 0 && (
        <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 text-xs pointer-events-auto shadow-lg">
          <div className="font-medium mb-2">
            Highlights ({pageHighlights.length})
          </div>
          <div className="space-y-1">
            {pageHighlights.some((h) => h.similarity > 0.9) && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded"></div>
                <span>High relevance</span>
              </div>
            )}
            {pageHighlights.some(
              (h) => h.similarity > 0.8 && h.similarity <= 0.9
            ) && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-400 rounded"></div>
                <span>Medium-high relevance</span>
              </div>
            )}
            {pageHighlights.some(
              (h) => h.similarity > 0.7 && h.similarity <= 0.8
            ) && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                <span>Medium relevance</span>
              </div>
            )}
            {pageHighlights.some((h) => h.similarity <= 0.7 && !h.isSearch) && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded"></div>
                <span>Lower relevance</span>
              </div>
            )}
            {pageHighlights.some((h) => h.isSearch) && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded"></div>
                <span>Search results</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SourceHighlighter;
