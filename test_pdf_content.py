#!/usr/bin/env python3
"""
Test PDF content extraction
"""

import fitz
import PyPDF2
import json

def test_pdf_content(pdf_path):
    print(f"\n=== Testing PDF: {pdf_path} ===")

    try:
        # Test PyMuPDF
        print("Testing PyMuPDF...")
        doc = fitz.open(pdf_path)
        print(f"PDF has {len(doc)} pages")

        # Get first page content
        first_page = doc[0]
        text = first_page.get_text()
        print(f"First page text length: {len(text)}")
        print("First 500 characters:")
        print(text[:500])
        print("---")

        # Check if it's scanned (no text)
        if len(text.strip()) < 100:
            print("WARNING: PDF appears to be scanned (minimal text extracted)")

        doc.close()

    except Exception as e:
        print(f"PyMuPDF error: {e}")

        # Test PyPDF2
        try:
            print("Testing PyPDF2...")
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                print(f"PDF has {len(pdf_reader.pages)} pages")

                first_page = pdf_reader.pages[0]
                text = first_page.extract_text()
                print(f"First page text length: {len(text)}")
                print("First 500 characters:")
                print(text[:500])

                if len(text.strip()) < 100:
                    print("WARNING: PDF appears to be scanned (minimal text extracted)")

        except Exception as e2:
            print(f"PyPDF2 error: {e2}")

def main():
    pdf_files = [
        "/Users/tywg001/Downloads/mathlearning/aoshu/一本数学思维训练四年级.pdf",
        "/Users/tywg001/Downloads/mathlearning/aoshu/学霸提优大试卷四年级上册数学人教版.pdf"
    ]

    for pdf_file in pdf_files:
        test_pdf_content(pdf_file)

if __name__ == "__main__":
    main()