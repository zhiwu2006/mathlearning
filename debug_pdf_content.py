#!/usr/bin/env python3
"""
Debug script to examine PDF content
"""

import os
import sys
import json
import re
from pathlib import Path

# Add the virtual environment path
sys.path.insert(0, './pdf_env/lib/python3.13/site-packages')

import fitz  # PyMuPDF
import PyPDF2

def debug_pdf_content(pdf_path):
    """Debug PDF content extraction"""
    print(f"Debugging PDF: {pdf_path}")

    try:
        # Method 1: PyMuPDF
        print("\n--- Method 1: PyMuPDF ---")
        doc = fitz.open(pdf_path)
        print(f"Total pages: {len(doc)}")

        for page_num in range(min(3, len(doc))):  # First 3 pages only
            page = doc[page_num]
            text = page.get_text()
            print(f"\n=== Page {page_num + 1} ===")
            print(f"Text length: {len(text)}")
            print(f"First 500 chars: {text[:500]}")
            print("---")

        doc.close()

    except Exception as e:
        print(f"PyMuPDF error: {e}")

    try:
        # Method 2: PyPDF2
        print("\n--- Method 2: PyPDF2 ---")
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            print(f"Total pages: {len(pdf_reader.pages)}")

            for page_num in range(min(3, len(pdf_reader.pages))):  # First 3 pages only
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                print(f"\n=== Page {page_num + 1} ===")
                print(f"Text length: {len(text)}")
                print(f"First 500 chars: {text[:500]}")
                print("---")

    except Exception as e:
        print(f"PyPDF2 error: {e}")

def main():
    # Test one PDF file first
    pdf_files = [
        "/Users/tywg001/Downloads/mathlearning/aoshu/一本数学思维训练四年级.pdf",
        "/Users/tywg001/Downloads/mathlearning/aoshu/学霸提优大试卷四年级上册数学人教版.pdf",
        "/Users/tywg001/Downloads/mathlearning/aoshu/第二十二届华罗庚金杯少年数学邀请赛 决赛试题参考答案 （小学中年级组）.pdf"
    ]

    for pdf_file in pdf_files:
        if os.path.exists(pdf_file):
            debug_pdf_content(pdf_file)
            print("\n" + "="*80 + "\n")
        else:
            print(f"File not found: {pdf_file}")

if __name__ == "__main__":
    main()