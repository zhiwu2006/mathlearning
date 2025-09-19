#!/usr/bin/env python3
"""
Quick OCR test for PDFs - limited to first few pages
"""

import os
import sys
import json
import re
from pathlib import Path

# Add the virtual environment path
sys.path.insert(0, './pdf_env/lib/python3.13/site-packages')

import fitz  # PyMuPDF

# Try to import OCR libraries
try:
    import pytesseract
    from PIL import Image
    import io
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("Warning: OCR libraries not available")

def test_ocr_on_pdf(pdf_path, max_pages=3):
    """Test OCR on first few pages of PDF"""
    print(f"Testing OCR on: {pdf_path}")

    try:
        doc = fitz.open(pdf_path)
        print(f"Total pages: {len(doc)}")

        for page_num in range(min(max_pages, len(doc))):
            page = doc[page_num]

            # First try regular text extraction
            text = page.get_text()
            print(f"\n--- Page {page_num + 1} ---")
            print(f"Regular text length: {len(text)}")
            print(f"Regular text: {text[:200]}...")

            if len(text.strip()) < 50 and OCR_AVAILABLE:
                print("Using OCR...")
                # Get page as image
                pix = page.get_pixmap()
                img_data = pix.tobytes("ppm")
                img = Image.open(io.BytesIO(img_data))

                # Use Tesseract OCR
                ocr_text = pytesseract.image_to_string(img, lang='chi_sim+eng')
                print(f"OCR text length: {len(ocr_text)}")
                print(f"OCR text: {ocr_text[:300]}...")

        doc.close()

    except Exception as e:
        print(f"Error: {e}")

def main():
    pdf_files = [
        "/Users/tywg001/Downloads/mathlearning/aoshu/一本数学思维训练四年级.pdf",
        "/Users/tywg001/Downloads/mathlearning/aoshu/学霸提优大试卷四年级上册数学人教版.pdf"
    ]

    for pdf_file in pdf_files:
        if os.path.exists(pdf_file):
            test_ocr_on_pdf(pdf_file, max_pages=2)
            print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    main()