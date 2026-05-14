from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import io
import json
import base64
import PyPDF2
from typing import List, Dict, Any
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/process-file")
async def process_file(file: UploadFile = File(...)):
    """
    Process uploaded files (Excel, CSV, PDF, Images) and convert to text format for the agent.
    Uses both content_type AND filename extension for robust detection.
    """
    try:
        contents = await file.read()
        fname = (file.filename or "").lower()
        ctype = (file.content_type or "").lower()

        logger.info(f"Processing file: {file.filename}, content_type={ctype}, size={len(contents)} bytes")

        # Detect by extension first (most reliable), then content_type
        if fname.endswith(('.xlsx', '.xls')) or ctype in [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]:
            result = await process_excel_file(contents, file.filename)

        elif fname.endswith('.csv') or ctype in ['text/csv', 'application/csv']:
            result = await process_csv_file(contents, file.filename)

        elif fname.endswith('.pdf') or ctype == 'application/pdf':
            result = await process_pdf_file(contents, file.filename)

        elif fname.endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp')) or ctype.startswith('image/'):
            result = await process_image_file(contents, file.filename, file.content_type or 'image/png')

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: '{file.content_type}' (filename: {file.filename}). "
                       f"Supported formats: Excel (.xlsx/.xls), CSV (.csv), PDF (.pdf), Images (.jpg/.png/.webp)."
            )

        return JSONResponse(content=result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

async def process_excel_file(contents: bytes, filename: str) -> Dict[str, Any]:
    """Process Excel file and convert to structured text"""
    try:
        # Read Excel file
        df = pd.read_excel(io.BytesIO(contents))
        
        # Convert to structured text
        text_content = convert_dataframe_to_text(df, filename)
        
        return {
            "success": True,
            "filename": filename,
            "content": text_content,
            "record_count": len(df),
            "columns": list(df.columns),
            "message": f"Excel file processed successfully. Found {len(df)} records."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading Excel file: {str(e)}")

async def process_csv_file(contents: bytes, filename: str) -> Dict[str, Any]:
    """Process CSV file and convert to structured text"""
    try:
        # Read CSV file
        df = pd.read_csv(io.BytesIO(contents))
        
        # Convert to structured text
        text_content = convert_dataframe_to_text(df, filename)
        
        return {
            "success": True,
            "filename": filename,
            "content": text_content,
            "record_count": len(df),
            "columns": list(df.columns),
            "message": f"CSV file processed successfully. Found {len(df)} records."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV file: {str(e)}")

def convert_dataframe_to_text(df: pd.DataFrame, filename: str) -> str:
    """Convert DataFrame to structured text format for the agent"""
    
    text_parts = []
    text_parts.append(f"FILE: {filename}")
    text_parts.append(f"TOTAL RECORDS: {len(df)}")
    text_parts.append(f"COLUMNS: {', '.join(df.columns)}")
    text_parts.append("")
    text_parts.append("DATA:")
    text_parts.append("=" * 50)
    
    # Add sample records (first 5)
    for i, (_, row) in enumerate(df.head().iterrows()):
        text_parts.append(f"Record {i + 1}:")
        for col in df.columns:
            text_parts.append(f"  {col}: {row[col]}")
        text_parts.append("")
    
    if len(df) > 5:
        text_parts.append(f"... and {len(df) - 5} more records")
    
    return "\n".join(text_parts)


async def process_pdf_file(contents: bytes, filename: str) -> Dict[str, Any]:
    """Process PDF file and convert text to structured text"""
    try:
        # Read PDF file
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
        text_parts = []
        text_parts.append(f"FILE: {filename}")
        text_parts.append(f"TOTAL PAGES: {len(pdf_reader.pages)}")
        text_parts.append("")
        text_parts.append("TEXT CONTENT:")
        text_parts.append("=" * 50)
        
        # Extract text from all pages
        full_text = ""
        for i, page in enumerate(pdf_reader.pages):
            page_text = page.extract_text()
            if page_text:
                full_text += page_text + "\n"
        
        text_parts.append(full_text)
        
        return {
            "success": True,
            "filename": filename,
            "content": "\n".join(text_parts),
            "record_count": len(pdf_reader.pages), # representing pages as records for consistency
            "message": f"PDF file processed successfully. Extracted text from {len(pdf_reader.pages)} pages."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF file: {str(e)}")


async def process_image_file(contents: bytes, filename: str, content_type: str = "image/png") -> Dict[str, Any]:
    """Process image file — encode to base64 for Gemini vision and provide metadata."""
    try:
        size_kb = round(len(contents) / 1024, 1)

        # Base64 encode the image for Gemini multimodal
        b64 = base64.b64encode(contents).decode('utf-8')
        mime = content_type or 'image/png'

        text_content = (
            f"FILE: {filename}\n"
            f"TYPE: Image ({mime})\n"
            f"SIZE: {size_kb} KB\n\n"
            f"[This is an uploaded image. The user wants you to analyze its contents. "
            f"The image has been provided to you as base64 data for visual analysis.]"
        )

        return {
            "success": True,
            "filename": filename,
            "content": text_content,
            "file_type": "image",
            "mime_type": mime,
            "image_base64": b64,
            "size_kb": size_kb,
            "message": f"Image file processed successfully ({size_kb} KB)."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing image file: {str(e)}")