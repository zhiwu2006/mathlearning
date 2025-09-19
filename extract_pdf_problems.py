#!/usr/bin/env python3
"""
PDF Math Problem Extractor
Extracts math problems from PDF files for math learning system
"""

import os
import sys
import json
import re
from pathlib import Path

# Try to import the PDF libraries
try:
    import fitz  # PyMuPDF
    import PyPDF2
except ImportError as e:
    print(f"Error importing PDF libraries: {e}")
    sys.exit(1)

class MathProblemExtractor:
    def __init__(self):
        self.extracted_problems = []
        self.current_problem = {}

    def clean_text(self, text):
        """Clean extracted text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        # Remove empty lines
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        return '\n'.join(lines)

    def is_math_problem(self, text):
        """Check if text looks like a math problem"""
        # Look for common math problem indicators
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
        ]

        for pattern in math_indicators:
            if re.search(pattern, text):
                return True
        return False

    def extract_problem_structure(self, text):
        """Extract structured problem from text"""
        # Initialize problem structure
        problem = {
            "stem": "",
            "taxonomy": "",
            "steps": [],
            "transitions": [],
            "scoring": {"total": 5, "steps": []},
            "answer": "",
            "analysis": "",
            "knowledgePoints": [],
            "difficulty": "medium"
        }

        # Split text into lines
        lines = text.split('\n')

        # Extract problem stem (first part)
        stem_lines = []
        for line in lines:
            if line.strip():
                # Stop at answer indicators
                if re.match(r'答案|答|解|解析', line):
                    break
                stem_lines.append(line)

        problem["stem"] = '\n'.join(stem_lines).strip()

        # Extract answer if present
        answer_match = re.search(r'答案[:：]\s*(.*?)(?:\n|$)', text)
        if answer_match:
            problem["answer"] = answer_match.group(1).strip()

        # Extract analysis if present
        analysis_match = re.search(r'解析[:：]\s*(.*?)(?:\n|$)', text)
        if analysis_match:
            problem["analysis"] = analysis_match.group(1).strip()

        # Determine difficulty based on content
        if len(problem["stem"]) > 200:
            problem["difficulty"] = "hard"
        elif len(problem["stem"]) < 50:
            problem["difficulty"] = "easy"

        return problem

    def extract_from_pdf(self, pdf_path):
        """Extract math problems from a PDF file"""
        print(f"Processing PDF: {pdf_path}")

        try:
            # Try PyMuPDF first (better for Chinese text)
            doc = fitz.open(pdf_path)
            text_content = ""

            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text()
                text_content += f"\n--- Page {page_num + 1} ---\n{text}"

            doc.close()

        except Exception as e:
            print(f"Error with PyMuPDF, trying PyPDF2: {e}")

            # Fallback to PyPDF2
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text_content = ""

                for page_num, page in enumerate(pdf_reader.pages):
                    text = page.extract_text()
                    text_content += f"\n--- Page {page_num + 1} ---\n{text}"

        # Process extracted text
        return self.process_text_content(text_content, pdf_path)

    def process_text_content(self, text_content, source_file):
        """Process extracted text to find math problems"""
        problems = []

        # Split by pages
        pages = text_content.split('--- Page')

        for i, page_content in enumerate(pages[1:], 1):  # Skip first empty split
            page_text = self.clean_text(page_content)

            # Split into potential problems
            # Look for problem number patterns
            problem_sections = re.split(r'(?:[①②③④⑤⑥⑦⑧⑨⑩]|[1-9]+[\.、])', page_text)

            for section in problem_sections:
                section = section.strip()
                if len(section) > 20 and self.is_math_problem(section):
                    problem = self.extract_problem_structure(section)
                    problem["source"] = f"{source_file} (Page {i})"
                    problem["id"] = f"{Path(source_file).stem}_{i}_{len(problems)+1}"

                    if problem["stem"]:  # Only add if we have a valid stem
                        problems.append(problem)

        return problems

def main():
    # Paths to the PDF files
    pdf_files = [
        "/Users/tywg001/Downloads/mathlearning/aoshu/一本数学思维训练四年级.pdf",
        "/Users/tywg001/Downloads/mathlearning/aoshu/学霸提优大试卷四年级上册数学人教版.pdf"
    ]

    extractor = MathProblemExtractor()
    all_problems = []

    for pdf_file in pdf_files:
        if os.path.exists(pdf_file):
            print(f"Processing: {pdf_file}")
            problems = extractor.extract_from_pdf(pdf_file)
            all_problems.extend(problems)
            print(f"Extracted {len(problems)} problems from {Path(pdf_file).name}")
        else:
            print(f"File not found: {pdf_file}")

    # Save results
    output_file = "/Users/tywg001/Downloads/mathlearning/extracted_problems.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_problems, f, ensure_ascii=False, indent=2)

    print(f"\nTotal problems extracted: {len(all_problems)}")
    print(f"Results saved to: {output_file}")

    # Print summary
    print("\n=== EXTRACTION SUMMARY ===")
    for i, problem in enumerate(all_problems[:10], 1):  # Show first 10
        print(f"\nProblem {i}:")
        print(f"  ID: {problem.get('id', 'N/A')}")
        print(f"  Source: {problem.get('source', 'N/A')}")
        print(f"  Difficulty: {problem.get('difficulty', 'N/A')}")
        print(f"  Stem: {problem.get('stem', 'N/A')[:100]}...")
        if problem.get('answer'):
            print(f"  Answer: {problem['answer']}")

    if len(all_problems) > 10:
        print(f"\n... and {len(all_problems) - 10} more problems")

if __name__ == "__main__":
    main()