import React, { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  Plus,
  DownloadSimple,
  CaretLeft,
  CaretRight,
  X,
  ChatCircle,
  MagnifyingGlass,
  FileText,
} from "@phosphor-icons/react";
import DocumentQAOverlay from "./DocumentQAOverlay";
import SourceHighlighter from "./SourceHighlighter";
import PDFHighlighter from "./PDFHighlighter";
import "./DocumentViewer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const DocumentViewer = ({
  documentId,
  workspaceSlug,
  onClose,
  initialDocument = null,
}) => {
  const [document, setDocument] = useState(initialDocument);
  const [isLoading, setIsLoading] = useState(!initialDocument);
  const [error, setError] = useState(null);
  const [showQAOverlay, setShowQAOverlay] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // PDF-specific state
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [pdfFile, setPdfFile] = useState(null);

  const containerRef = useRef(null);
  const pdfPageRef = useRef(null);

  // Load document data
  useEffect(() => {
    const loadDocument = async () => {
      if (initialDocument) {
        setDocument(initialDocument);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          `/v1/workspace/${workspaceSlug}/document/${documentId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer " +
                (localStorage.getItem("anythingllm_authToken") || ""),
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to load document: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success) {
          setDocument(data.document);

          // If document has a source URL and is PDF, set it for PDF viewer
          if (data.document.source && data.document.type === "pdf") {
            setPdfFile(data.document.source);
          }
        } else {
          throw new Error(data.error || "Failed to load document");
        }
      } catch (err) {
        console.error("Document loading error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [documentId, workspaceSlug, initialDocument]);

  const handleDownload = () => {
    if (document?.source) {
      // Try to download the original document
      const link = document.createElement("a");
      link.href = document.source;
      link.download = document.filename || "document";
      link.click();
    }
  };

  const handleHighlightSources = useCallback((sources) => {
    // Convert source mapping to highlight data
    const newHighlights = sources.map((source) => ({
      id: source.chunkId,
      content: source.content,
      similarity: source.similarity,
      startOffset: source.metadata?.startOffset,
      endOffset: source.metadata?.endOffset,
      color: getHighlightColor(source.similarity),
    }));

    setHighlights((prev) => [...prev, ...newHighlights]);
  }, []);

  const getHighlightColor = (similarity) => {
    if (similarity > 0.9) return "rgba(255, 0, 0, 0.3)"; // Red for highest relevance
    if (similarity > 0.8) return "rgba(255, 165, 0, 0.3)"; // Orange
    if (similarity > 0.7) return "rgba(255, 255, 0, 0.3)"; // Yellow
    return "rgba(0, 255, 0, 0.3)"; // Green for lower relevance
  };

  const handleSearch = async (term) => {
    if (!term.trim()) {
      setHighlights([]);
      return;
    }

    setIsSearching(true);
    try {
      // Simple text search highlighting
      // In a full implementation, this would use more sophisticated search
      const searchHighlights = [
        {
          id: `search-${Date.now()}`,
          pageNumber: pageNumber,
          content: term,
          color: "rgba(0, 0, 255, 0.3)", // Blue for search
          isSearch: true,
        },
      ];

      setHighlights((prev) =>
        prev.filter((h) => !h.isSearch).concat(searchHighlights)
      );
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearHighlights = () => {
    setHighlights([]);
  };

  // PDF event handlers
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const onDocumentLoadError = (error) => {
    console.error("PDF load error:", error);
    setError("Failed to load PDF document");
  };

  const handlePrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
  };

  const handlePageInputChange = (e) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const renderHighlightedContent = (content) => {
    if (!content || highlights.length === 0) {
      return content;
    }

    let highlightedContent = content;
    highlights.forEach((highlight) => {
      if (!highlight.isSearch && highlight.content) {
        const regex = new RegExp(`(${escapeRegex(highlight.content)})`, "gi");
        highlightedContent = highlightedContent.replace(
          regex,
          `<mark style="background-color: ${highlight.color};" title="Relevance: ${Math.round((highlight.similarity || 0) * 100)}%">$1</mark>`
        );
      }
    });

    return highlightedContent;
  };

  const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Error Loading Document</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex">
      {/* Document Viewer Panel */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-300 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
              title="Close"
            >
              <X size={24} />
            </button>
            <h1 className="text-lg font-semibold text-gray-800 truncate max-w-xs">
              {document.title || document.filename}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search in document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && handleSearch(searchTerm)
                }
                className="pl-8 pr-4 py-1 border border-gray-300 rounded text-sm w-48"
              />
              <MagnifyingGlass
                size={16}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              {isSearching && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>

            {/* Page Navigation */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handlePrevPage}
                disabled={pageNumber <= 1}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                title="Previous page"
              >
                <CaretLeft size={20} />
              </button>
              <span className="text-sm text-gray-600">
                <input
                  type="number"
                  value={pageNumber}
                  onChange={handlePageInputChange}
                  className="w-12 text-center border border-gray-300 rounded px-1"
                  min="1"
                  max={numPages}
                />
                {numPages && ` / ${numPages}`}
              </span>
              <button
                onClick={handleNextPage}
                disabled={pageNumber >= numPages}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                title="Next page"
              >
                <CaretRight size={20} />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handleZoomOut}
                className="p-1 text-gray-500 hover:text-gray-700 flex items-center justify-center w-8 h-8"
                title="Zoom out"
              >
                <span className="text-lg font-bold leading-none">−</span>
              </button>
              <span className="text-sm text-gray-600 w-12 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 text-gray-500 hover:text-gray-700"
                title="Zoom in"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Toggle Q&A Overlay */}
            <button
              onClick={() => setShowQAOverlay(!showQAOverlay)}
              className={`p-2 rounded ${
                showQAOverlay
                  ? "bg-blue-500 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title="Ask questions about this document"
            >
              <ChatCircle size={20} />
            </button>

            {/* Clear Highlights */}
            {highlights.length > 0 && (
              <button
                onClick={clearHighlights}
                className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
                title="Clear highlights"
              >
                Clear highlights ({highlights.length})
              </button>
            )}
          </div>
        </div>

        {/* Document Content */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-gray-200 p-4 document-viewer-container"
        >
          {pdfFile && document?.type === "pdf" ? (
            // PDF Viewer
            <div className="flex justify-center">
              <div className="relative" ref={pdfPageRef}>
                <Document
                  file={pdfFile}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-3 text-gray-600">Loading PDF...</span>
                    </div>
                  }
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={false}
                    loading={
                      <div className="flex items-center justify-center p-8 bg-white">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
                    }
                    className="shadow-lg"
                  />
                </Document>

                {/* PDF-specific Highlights Overlay */}
                <PDFHighlighter
                  highlights={highlights.filter(
                    (h) => h.pageNumber === pageNumber || !h.pageNumber
                  )}
                  pageNumber={pageNumber}
                  scale={scale}
                  pdfPageRef={pdfPageRef}
                />
              </div>
            </div>
          ) : (
            // Text Content Fallback
            <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg">
              <div className="prose prose-lg max-w-none">
                {document?.content ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: renderHighlightedContent(document.content),
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No content available for this document.</p>
                    {document?.source && (
                      <p className="mt-2">
                        <a
                          href={document.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View original document
                        </a>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Document metadata for text view */}
              {document?.metadata && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">
                    Document Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {document.metadata.wordCount && (
                      <div>
                        <span className="font-medium">Word Count:</span>{" "}
                        {document.metadata.wordCount.toLocaleString()}
                      </div>
                    )}
                    {document.metadata.token_count_estimate && (
                      <div>
                        <span className="font-medium">Estimated Tokens:</span>{" "}
                        {document.metadata.token_count_estimate.toLocaleString()}
                      </div>
                    )}
                    {document.source && (
                      <div className="col-span-2">
                        <span className="font-medium">Source:</span>{" "}
                        {document.source}
                      </div>
                    )}
                    {document.chunks && (
                      <div>
                        <span className="font-medium">Chunks:</span>{" "}
                        {document.chunks.length}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Q&A Overlay Panel */}
      {showQAOverlay && (
        <DocumentQAOverlay
          document={document}
          workspaceSlug={workspaceSlug}
          onClose={() => setShowQAOverlay(false)}
          onHighlightSources={handleHighlightSources}
          currentPage={pageNumber}
        />
      )}
    </div>
  );
};

export default DocumentViewer;
