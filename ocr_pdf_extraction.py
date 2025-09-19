#!/usr/bin/env python3
"""
OCR-based PDF extraction for scanned math documents
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

# Try to import OCR libraries
try:
    import pytesseract
    from PIL import Image
    import io
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("Warning: OCR libraries not available. Install with: pip install pytesseract pillow")

class OCRMathProblemExtractor:
    def __init__(self):
        self.extracted_problems = []
        self.current_problem = {}

    def clean_text(self, text):
        """Clean OCR-extracted text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        # Fix common OCR errors in Chinese math text
        text = re.sub(r'[\u3000]+', ' ', text)  # Remove full-width spaces
        return text

    def is_math_problem(self, text):
        """Check if text looks like a math problem"""
        math_indicators = [
            r'\d+\s*[＋+\-×÷]\s*\d+',  # Basic operations
            r'解.*?题',  # Solve problem
            r'计算.*?式',  # Calculate expression
            r'求.*?值',  # Find value
            r'应用题',  # Word problem
            r'选择题',  # Multiple choice
            r'填空题',  # Fill in blank
            r'判断题',  # True/False
            r'[①②③④⑤⑥⑦⑧⑨⑩]',  # Problem numbers
            r'[1-9]\.\s*',  # Numbered problems
            r'千克|克|米|厘米|分钟|小时',  # Units
            r'苹果|书|学生|班级|学校',  # Common math problem subjects
        ]

        for pattern in math_indicators:
            if re.search(pattern, text):
                return True
        return False

    def extract_problem_structure(self, text):
        """Extract structured problem from OCR text"""
        problem = {
            "stem": "",
            "taxonomy": "数学应用题",
            "steps": [],
            "transitions": [
                "理解题目要求",
                "分析已知条件",
                "选择解题方法",
                "进行计算求解",
                "验证答案合理性"
            ],
            "scoring": {"total": 5, "steps": []},
            "answer": "",
            "analysis": "",
            "knowledgePoints": ["数学思维训练", "应用题解题"],
            "difficulty": "medium",
            "gradeLevel": "小学四年级"
        }

        # Extract problem stem
        # Remove answer/solution indicators
        stem = re.sub(r'答案[:：].*?$', '', text, flags=re.MULTILINE)
        stem = re.sub(r'答[:：].*?$', '', stem, flags=re.MULTILINE)
        stem = re.sub(r'解[:：].*?$', '', stem, flags=re.MULTILINE)
        stem = re.sub(r'解析[:：].*?$', '', stem, flags=re.MULTILINE)
        problem["stem"] = stem.strip()

        # Extract answer
        answer_match = re.search(r'答案[:：]\s*(.*?)(?:\n|$)', text)
        if answer_match:
            problem["answer"] = answer_match.group(1).strip()

        # Extract analysis
        analysis_match = re.search(r'解析[:：]\s*(.*?)(?:\n|$)', text)
        if analysis_match:
            problem["analysis"] = analysis_match.group(1).strip()

        # Determine difficulty
        stem_length = len(problem["stem"])
        if stem_length > 300:
            problem["difficulty"] = "hard"
        elif stem_length < 30:
            problem["difficulty"] = "easy"

        # Detect knowledge points
        if "加法" in problem["stem"] or "减法" in problem["stem"]:
            problem["knowledgePoints"].append("加减运算")
        if "乘法" in problem["stem"] or "除法" in problem["stem"]:
            problem["knowledgePoints"].append("乘除运算")
        if "面积" in problem["stem"] or "周长" in problem["stem"]:
            problem["knowledgePoints"].append("几何图形")
        if "时间" in problem["stem"] or "分钟" in problem["stem"]:
            problem["knowledgePoints"].append("时间问题")

        return problem

    def extract_text_with_ocr(self, pdf_path):
        """Extract text using OCR for scanned PDFs"""
        try:
            doc = fitz.open(pdf_path)
            text_content = ""

            for page_num in range(len(doc)):
                page = doc[page_num]

                # First try regular text extraction
                text = page.get_text()
                if len(text.strip()) > 50:  # If we have meaningful text
                    text_content += f"\n--- Page {page_num + 1} ---\n{text}"
                    continue

                # If no text, use OCR
                if OCR_AVAILABLE:
                    print(f"  Using OCR for page {page_num + 1}")
                    # Get page as image
                    pix = page.get_pixmap()
                    img_data = pix.tobytes("ppm")
                    img = Image.open(io.BytesIO(img_data))

                    # Use Tesseract OCR
                    ocr_text = pytesseract.image_to_string(img, lang='chi_sim+eng')
                    text_content += f"\n--- Page {page_num + 1} (OCR) ---\n{ocr_text}"

            doc.close()
            return text_content

        except Exception as e:
            print(f"Error in OCR extraction: {e}")
            return ""

    def process_text_content(self, text_content, source_file):
        """Process extracted text to find math problems"""
        problems = []

        # Clean the text
        cleaned_text = self.clean_text(text_content)

        # Split into pages
        pages = cleaned_text.split('--- Page')

        for i, page_content in enumerate(pages[1:], 1):
            page_text = page_content.strip()

            # Remove page number indicators
            page_text = re.sub(r'^\s*\d+\s*\(OCR\)\s*---', '', page_text, flags=re.MULTILINE)
            page_text = re.sub(r'^\s*\d+\s*---', '', page_text, flags=re.MULTILINE)

            # Look for problem patterns
            problem_patterns = [
                r'([①②③④⑤⑥⑦⑧⑨⑩])\s*(.*?)(?=[①②③④⑤⑥⑦⑧⑨⑩]|$)',
                r'([1-9]+[\.、])\s*(.*?)(?=[1-9]+[\.、]|$)',
                r'(第[一二三四五六七八九十\d]+题)\s*(.*?)(?=第[一二三四五六七八九十\d]+题|$)',
            ]

            found_problems = False
            for pattern in problem_patterns:
                matches = re.findall(pattern, page_text, re.DOTALL)
                for match in matches:
                    if len(match) >= 2:
                        problem_text = match[1].strip()
                        if len(problem_text) > 20 and self.is_math_problem(problem_text):
                            problem = self.extract_problem_structure(problem_text)
                            problem["source"] = f"{source_file} (Page {i})"
                            problem["id"] = f"{Path(source_file).stem}_page{i}_ocr{len(problems)+1}"
                            problem["extraction_method"] = "ocr_markdown_style"
                            problem["page_number"] = i

                            if problem["stem"]:
                                problems.append(problem)
                                found_problems = True

            # If no structured problems found, look for math content
            if not found_problems:
                # Split by sentences and look for math content
                sentences = re.split(r'[。！？]', page_text)
                for sentence in sentences:
                    sentence = sentence.strip()
                    if len(sentence) > 30 and self.is_math_problem(sentence):
                        problem = self.extract_problem_structure(sentence)
                        problem["source"] = f"{source_file} (Page {i})"
                        problem["id"] = f"{Path(source_file).stem}_page{i}_sentence{len(problems)+1}"
                        problem["extraction_method"] = "ocr_sentence"
                        problem["page_number"] = i

                        if problem["stem"]:
                            problems.append(problem)

        return problems

    def extract_from_pdf(self, pdf_path):
        """Extract math problems from PDF using OCR"""
        print(f"Processing PDF: {pdf_path}")

        if not OCR_AVAILABLE:
            print("OCR not available, skipping scanned PDFs")
            return []

        text_content = self.extract_text_with_ocr(pdf_path)
        if not text_content:
            print("No content extracted")
            return []

        print(f"Extracted {len(text_content)} characters of text")

        problems = self.process_text_content(text_content, pdf_path)
        print(f"Found {len(problems)} problems")
        return problems

def main():
    pdf_files = [
        "/Users/tywg001/Downloads/mathlearning/aoshu/一本数学思维训练四年级.pdf",
        "/Users/tywg001/Downloads/mathlearning/aoshu/学霸提优大试卷四年级上册数学人教版.pdf",
        "/Users/tywg001/Downloads/mathlearning/aoshu/第二十二届华罗庚金杯少年数学邀请赛 决赛试题参考答案 （小学中年级组）.pdf"
    ]

    extractor = OCRMathProblemExtractor()
    all_problems = []

    print(f"{'='*80}")
    print("OCR-BASED PDF EXTRACTION FOR MATH PROBLEMS")
    print(f"{'='*80}")

    for pdf_file in pdf_files:
        if os.path.exists(pdf_file):
            print(f"\nProcessing: {pdf_file}")
            problems = extractor.extract_from_pdf(pdf_file)
            all_problems.extend(problems)
            print(f"Extracted {len(problems)} problems from {Path(pdf_file).name}")
        else:
            print(f"File not found: {pdf_file}")

    # Save results
    output_file = "/Users/tywg001/Downloads/mathlearning/ocr_extracted_problems.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_problems, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*80}")
    print("FINAL SUMMARY")
    print(f"{'='*80}")
    print(f"Total problems extracted: {len(all_problems)}")
    print(f"Results saved to: {output_file}")

    # Show sample problems
    print(f"\n{'='*80}")
    print("SAMPLE EXTRACTED PROBLEMS")
    print(f"{'='*80}")
    for i, problem in enumerate(all_problems[:5], 1):
        print(f"\nProblem {i}:")
        print(f"  ID: {problem.get('id', 'N/A')}")
        print(f"  Source: {problem.get('source', 'N/A')}")
        print(f"  Method: {problem.get('extraction_method', 'N/A')}")
        print(f"  Difficulty: {problem.get('difficulty', 'N/A')}")
        print(f"  Knowledge Points: {problem.get('knowledgePoints', [])}")
        print(f"  Stem: {problem.get('stem', 'N/A')[:200]}...")
        if problem.get('answer'):
            print(f"  Answer: {problem['answer']}")
        if problem.get('analysis'):
            print(f"  Analysis: {problem['analysis']}")

    if len(all_problems) > 5:
        print(f"\n... and {len(all_problems) - 5} more problems")

if __name__ == "__main__":
    main()