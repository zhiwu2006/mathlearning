#!/usr/bin/env python3
"""
PDF OCR Math Problem Extractor
Uses OCR to extract math problems from scanned PDF files
"""

import os
import sys
import json
import re
import tempfile
import subprocess
from pathlib import Path
from PIL import Image
import fitz  # PyMuPDF

class MathProblemOCRExtractor:
    def __init__(self):
        self.extracted_problems = []
        self.temp_dir = tempfile.mkdtemp()

    def pdf_to_images(self, pdf_path, max_pages=10):
        """Convert PDF pages to images for OCR"""
        images = []
        doc = fitz.open(pdf_path)

        # Limit to first max_pages for testing
        pages_to_process = min(len(doc), max_pages)
        print(f"Processing first {pages_to_process} pages of {len(doc)} total pages")

        for page_num in range(pages_to_process):
            page = doc[page_num]
            # Convert page to image
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better OCR
            img_path = os.path.join(self.temp_dir, f"page_{page_num + 1}.png")
            pix.save(img_path)
            images.append(img_path)

        doc.close()
        return images

    def ocr_image(self, image_path, lang='chi_sim+eng'):
        """Perform OCR on an image"""
        try:
            # Use Tesseract OCR
            output_base = os.path.splitext(image_path)[0]
            txt_path = f"{output_base}.txt"

            cmd = [
                'tesseract',
                image_path,
                output_base,
                '-l', lang,
                '--oem', '3',  # Use LSTM OCR engine
                '--psm', '6'   # Assume uniform text block
            ]

            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode == 0 and os.path.exists(txt_path):
                with open(txt_path, 'r', encoding='utf-8') as f:
                    text = f.read()
                # Clean up temp file
                os.remove(txt_path)
                return text
            else:
                print(f"OCR failed for {image_path}: {result.stderr}")
                return ""

        except Exception as e:
            print(f"OCR error for {image_path}: {e}")
            return ""

    def clean_ocr_text(self, text):
        """Clean OCR extracted text"""
        # Remove common OCR artifacts
        text = re.sub(r'\s+', ' ', text)  # Multiple spaces to single
        text = re.sub(r'[|\\_]', '', text)  # Remove stray characters
        text = re.sub(r'(\d)\s*([＋+\-×÷])\s*(\d)', r'\1\2\3', text)  # Fix math expressions
        return text.strip()

    def extract_math_problems(self, text, page_num, source_file):
        """Extract math problems from OCR text"""
        problems = []

        # Common math problem patterns
        problem_patterns = [
            # Numbered problems
            r'(\d+[\.、]\s*[^.\n]+(?:\n[^.\n]+)*?)',
            # Chinese numbered problems
            r'([①②③④⑤⑥⑦⑧⑨⑩]\s*[^①②③④⑤⑥⑦⑧⑨⑩\n]+(?:\n[^①②③④⑤⑥⑦⑧⑨⑩\n]+)*?)',
            # Problems with "题" or "计算"
            r'((?:题|计算|求|解)[^.\n]+(?:\n[^.\n]+)*?)',
        ]

        for pattern in problem_patterns:
            matches = re.findall(pattern, text, re.MULTILINE)
            for match in matches:
                match = match.strip()
                if len(match) > 15:  # Minimum length for a valid problem
                    problem = {
                        "id": f"{Path(source_file).stem}_{page_num}_{len(problems)+1}",
                        "source": f"{source_file} (Page {page_num})",
                        "stem": match,
                        "taxonomy": "math",
                        "steps": [],
                        "transitions": [],
                        "scoring": {"total": 5, "steps": []},
                        "answer": "",
                        "analysis": "",
                        "knowledgePoints": self.extract_knowledge_points(match),
                        "difficulty": self.estimate_difficulty(match),
                        "type": self.classify_problem_type(match)
                    }
                    problems.append(problem)

        return problems

    def extract_knowledge_points(self, text):
        """Extract knowledge points from problem text"""
        knowledge_points = []

        # Common 4th grade math topics
        topic_keywords = {
            "加法": "加法运算",
            "减法": "减法运算",
            "乘法": "乘法运算",
            "除法": "除法运算",
            "分数": "分数",
            "小数": "小数",
            "面积": "面积计算",
            "周长": "周长计算",
            "体积": "体积计算",
            "时间": "时间计算",
            "应用题": "应用题",
            "几何": "几何图形",
            "平均数": "平均数",
            "统计": "统计图表"
        }

        for keyword, point in topic_keywords.items():
            if keyword in text:
                knowledge_points.append(point)

        return knowledge_points if knowledge_points else ["基础运算"]

    def estimate_difficulty(self, text):
        """Estimate problem difficulty"""
        if len(text) > 200:
            return "hard"
        elif len(text) > 100:
            return "medium"
        else:
            return "easy"

    def classify_problem_type(self, text):
        """Classify problem type"""
        if "应用题" in text or "解决" in text:
            return "word_problem"
        elif "选择" in text:
            return "multiple_choice"
        elif "判断" in text:
            return "true_false"
        elif "填空" in text:
            return "fill_in_blank"
        else:
            return "calculation"

    def process_pdf(self, pdf_path, max_pages=10):
        """Process a PDF file with OCR"""
        print(f"Processing PDF: {pdf_path}")

        if not os.path.exists(pdf_path):
            print(f"File not found: {pdf_path}")
            return []

        # Convert PDF to images
        images = self.pdf_to_images(pdf_path, max_pages)
        all_problems = []

        for i, image_path in enumerate(images):
            print(f"OCR processing page {i+1}/{len(images)}...")

            # Perform OCR
            text = self.ocr_image(image_path)
            text = self.clean_ocr_text(text)

            if text:
                # Extract problems from OCR text
                problems = self.extract_math_problems(text, i+1, pdf_path)
                all_problems.extend(problems)
                print(f"Found {len(problems)} problems on page {i+1}")
            else:
                print(f"No text extracted from page {i+1}")

            # Clean up image file
            if os.path.exists(image_path):
                os.remove(image_path)

        return all_problems

    def cleanup(self):
        """Clean up temporary files"""
        if os.path.exists(self.temp_dir):
            import shutil
            shutil.rmtree(self.temp_dir)

def main():
    pdf_files = [
        "/Users/tywg001/Downloads/mathlearning/aoshu/一本数学思维训练四年级.pdf",
        "/Users/tywg001/Downloads/mathlearning/aoshu/学霸提优大试卷四年级上册数学人教版.pdf"
    ]

    extractor = MathProblemOCRExtractor()
    all_problems = []

    try:
        for pdf_file in pdf_files:
            problems = extractor.process_pdf(pdf_file, max_pages=5)  # Process first 5 pages for testing
            all_problems.extend(problems)
            print(f"Extracted {len(problems)} problems from {Path(pdf_file).name}")

        # Save results
        output_file = "/Users/tywg001/Downloads/mathlearning/extracted_problems_ocr.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_problems, f, ensure_ascii=False, indent=2)

        print(f"\nTotal problems extracted: {len(all_problems)}")
        print(f"Results saved to: {output_file}")

        # Print summary
        print("\n=== OCR EXTRACTION SUMMARY ===")
        for i, problem in enumerate(all_problems[:5], 1):  # Show first 5
            print(f"\nProblem {i}:")
            print(f"  ID: {problem.get('id', 'N/A')}")
            print(f"  Source: {problem.get('source', 'N/A')}")
            print(f"  Type: {problem.get('type', 'N/A')}")
            print(f"  Difficulty: {problem.get('difficulty', 'N/A')}")
            print(f"  Knowledge Points: {problem.get('knowledgePoints', [])}")
            print(f"  Stem: {problem.get('stem', 'N/A')[:200]}...")

        if len(all_problems) > 5:
            print(f"\n... and {len(all_problems) - 5} more problems")

    finally:
        extractor.cleanup()

if __name__ == "__main__":
    main()