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
  initialHighlights = [],
  sourceContext = null,
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

  // Apply initial highlights when component mounts
  useEffect(() => {
    if (initialHighlights && initialHighlights.length > 0) {
      setHighlights(initialHighlights);
    }
  }, [initialHighlights]);

  // Map document URLs based on document name/type
  const mapDocumentUrl = (documentId, title, source) => {
    // Determine the document filename
    let documentFilename = title || documentId;
    
    // Check if it's already a PDF file
    const isPdfFile = documentFilename && documentFilename.toLowerCase().endsWith('.pdf');
    
    // Check if it's a non-PDF file (has extension but not .pdf)
    const hasNonPdfExtension = documentFilename && /\.[a-zA-Z0-9]+$/.test(documentFilename) && !isPdfFile;
    
    // For non-PDF files, use local serving
    if (hasNonPdfExtension) {
      if (source) {
        return source;
      }
      return `/documents/${documentFilename}`;
    }
    
    // Ensure .pdf extension for PDF documents
    if (!isPdfFile) {
      documentFilename += '.pdf';
    }

    // For PDF documents, use production public documents URL
    console.log(`[Production PDF] Serving ${documentFilename} from production URL`);
    return `https://wpjk.inteplast.com/llm/public/documents/${encodeURIComponent(documentFilename)}`;
  };

  // Load document data
  useEffect(() => {
    const loadDocument = async () => {
      if (initialDocument) {
        setDocument(initialDocument);
        // Apply URL mapping for initial document
        const mappedUrl = mapDocumentUrl(
          initialDocument.id,
          initialDocument.title,
          initialDocument.source
        );
        if (initialDocument.type === "pdf") {
          setPdfFile(mappedUrl);
        }
        return;
      }

      // Check if this is a Unicode document that should be served directly from frontend
      const hasUnicode = /[^\u0000-\u007F]/.test(documentId);
      const isQT25P0104R5 = documentId.includes("QT25P0104R5");
      
      if (hasUnicode || isQT25P0104R5) {
        console.log(`[Frontend Direct] Serving document directly from frontend: ${documentId}`);
        
        // Create a document object for frontend-served documents
        const directDocument = {
          id: documentId,
          title: `${documentId}.pdf`,
          filename: `${documentId}.pdf`,
          type: "pdf",
          content: null, // No text content for direct PDF serving
          metadata: {
            servedFrom: "frontend"
          },
          source: null, // Will be handled by mapDocumentUrl
        };
        
        setDocument(directDocument);
        
        // Use frontend serving for the PDF
        const mappedUrl = mapDocumentUrl(
          directDocument.id,
          directDocument.title,
          directDocument.source
        );
        
        setPdfFile(mappedUrl);
        setIsLoading(false);
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
          // If server returns 404, try to handle Unicode documents by creating a fallback document
          if (response.status === 404 && /[^\u0000-\u007F]/.test(documentId)) {
            console.log(`[Unicode Fallback] Server 404 for Unicode document: ${documentId}`);
            
            // Create a fallback document object
            const fallbackDocument = {
              id: documentId,
              title: `${documentId}.pdf`,
              filename: `${documentId}.pdf`,
              type: "pdf",
              content: null, // No text content available
              metadata: {},
              source: null, // Will be handled by mapDocumentUrl
            };
            
            setDocument(fallbackDocument);
            
            // Use frontend serving for the PDF
            const mappedUrl = mapDocumentUrl(
              fallbackDocument.id,
              fallbackDocument.title,
              fallbackDocument.source
            );
            
            setPdfFile(mappedUrl);
            return; // Don't throw error, continue with frontend serving
          }
          
          throw new Error(`Failed to load document: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success) {
          setDocument(data.document);

          // Apply URL mapping and set PDF file
          const mappedUrl = mapDocumentUrl(
            data.document.id,
            data.document.title,
            data.document.source
          );

          if (data.document.type === "pdf") {
            setPdfFile(mappedUrl);
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

    // Sort highlights by length (longest first) to avoid partial matches
    const sortedHighlights = [...highlights].sort(
      (a, b) => (b.content?.length || 0) - (a.content?.length || 0)
    );

    sortedHighlights.forEach((highlight, index) => {
      if (!highlight.isSearch && highlight.content) {
        // Clean the content for better matching
        const cleanContent = highlight.content
          .replace(/\s+/g, " ") // Normalize whitespace
          .trim();

        if (cleanContent.length > 3) {
          // Only highlight meaningful text
          const regex = new RegExp(`(${escapeRegex(cleanContent)})`, "gi");
          const similarity = Math.round((highlight.similarity || 0) * 100);
          const highlightStyle = `
            background-color: ${highlight.color}; 
            padding: 1px 2px; 
            border-radius: 2px; 
            border: 1px solid ${highlight.color.replace("0.4", "0.8")};
            position: relative;
          `;

          highlightedContent = highlightedContent.replace(
            regex,
            `<mark style="${highlightStyle}" 
                   title="Referenced text - ${similarity}% relevance" 
                   data-highlight-id="${highlight.id}">$1</mark>`
          );
        }
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
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-gray-800 truncate max-w-xs">
                {document.title || document.filename}
              </h1>
              {document?.type && (
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded uppercase font-medium">
                  {document.type}
                </span>
              )}
            </div>
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

            {/* Highlights Info */}
            {highlights.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200">
                  <span className="font-medium">{highlights.length}</span>{" "}
                  highlight{highlights.length !== 1 ? "s" : ""} active
                </div>
                <button
                  onClick={clearHighlights}
                  className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 transition-colors"
                  title="Clear all highlights"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Source Context Info */}
            {sourceContext && (
              <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200">
                Referenced text highlighted
              </div>
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
            // Text Content Fallback (for non-PDF documents)
            <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg">
              {/* Document Type Header */}
              {document?.type && document.type !== "text" && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText size={20} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {document.type.toUpperCase()} Document - Displaying
                      converted text content
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    This document has been processed and converted to text for
                    searching and highlighting.
                  </p>
                </div>
              )}

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
