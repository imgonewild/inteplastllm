# Public Documents System

This system enables users to access uploaded documents via public URLs, making documents viewable through direct links like `https://wpjk.inteplast.com/llm/document/wpjk.pdf`.

## Overview

When users upload documents to AnythingLLM, they can optionally be made available for public access through clean, friendly URLs. The system automatically copies files from the collector hotdir to a public directory and manages URL mappings.

## Configuration

Enable public document access by setting the following environment variable:

```bash
ENABLE_PUBLIC_DOCUMENTS=true
```

## How It Works

1. **Upload Process**: When a document is uploaded and `ENABLE_PUBLIC_DOCUMENTS=true`, the system:

   - Processes the document normally (text extraction, vectorization)
   - Copies the original file to `server/public/document/`
   - Generates a clean, URL-safe filename
   - Creates a mapping entry with metadata

2. **URL Access**: Documents become accessible at:

   ```
   https://your-domain.com/document/filename.pdf
   ```

3. **File Management**: The system maintains a mapping file (`server/storage/public-document-mappings.json`) that tracks:
   - Original filename
   - Public filename (URL-safe)
   - Upload timestamp
   - Access count
   - Source path

## API Endpoints

### List Public Documents

```http
GET /api/v1/public-documents
Authorization: Bearer YOUR_API_KEY
```

### Add Document to Public Access

```http
POST /api/v1/public-documents/add
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "filename": "original-file.pdf",
  "preferredName": "custom-name" // optional
}
```

### Remove Document from Public Access

```http
DELETE /api/v1/public-documents/{documentId}
Authorization: Bearer YOUR_API_KEY
```

## File Naming

The system automatically generates URL-safe filenames by:

- Converting to lowercase
- Replacing special characters with hyphens
- Removing consecutive hyphens
- Handling filename conflicts by appending numbers

Examples:

- `My Document (2024).pdf` → `my-document-2024.pdf`
- `Report_Final!.pdf` → `report-final.pdf`

## Security Features

- **Access Logging**: All document accesses are logged with timestamps and counts
- **MIME Type Detection**: Proper content types are set for different file formats
- **Frame Options**: Documents can be embedded in iframes for viewers
- **Cache Headers**: Optimized caching for better performance
- **File Validation**: Only files in the hotdir can be made public

## Storage Locations

- **Public Files**: `server/public/document/`
- **Mappings**: `server/storage/public-document-mappings.json`
- **Source Files**: `collector/hotdir/` (with `RETAIN_ORIGINAL_FILES=true`)

## Usage Examples

### Making a Document Public

After uploading `wpjk.pdf`, it automatically becomes available at:

```
https://wpjk.inteplast.com/llm/document/wpjk.pdf
```

### Custom Naming

You can specify a preferred public name during the process, so `QT25P0104R4 營德(無發票章).pdf` could become `wpjk-quote.pdf`.

### Integration with Document Viewer

Public documents work seamlessly with the existing document viewer system, providing both programmatic access and direct URL access.

## Best Practices

1. **Enable file retention** (`RETAIN_ORIGINAL_FILES=true`) to ensure source files remain available
2. **Use descriptive names** for better SEO and user experience
3. **Monitor access logs** to understand document usage patterns
4. **Regular cleanup** of unused public documents to save storage space

## Troubleshooting

### Document Not Accessible

- Verify `ENABLE_PUBLIC_DOCUMENTS=true` in environment
- Check that the file exists in `collector/hotdir/`
- Ensure the server has write permissions to `server/public/document/`

### File Not Found Errors

- Confirm the original file exists in the hotdir
- Verify the mapping entry exists in the JSON file
- Check server logs for copy/permission errors

### URL Issues

- Ensure your web server (nginx/apache) is configured to serve static files
- Verify the domain configuration matches your deployment
- Check that the `/document/` path is properly routed
