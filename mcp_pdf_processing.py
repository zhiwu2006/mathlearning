#!/usr/bin/env python3
"""
MCP Server PDF Processing Script
Uses markitdown and pdf-extraction MCP servers to process PDF files
"""

import os
import sys
import json
import re
import subprocess
import asyncio
from pathlib import Path
import tempfile

class MCPPDFProcessor:
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
            "knowledgePoints": ["数学思维训练"],
            "difficulty": "medium",
            "gradeLevel": "小学四年级"
        }

        # Split text into lines
        lines = text.split('\n')

        # Extract problem stem
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

    def try_markitdown_extraction(self, pdf_path):
        """Try to use markitdown MCP server"""
        try:
            # Create a temporary script to call markitdown
            script_content = f'''
import json
import subprocess
import sys

# Try to use markitdown through Claude MCP
result = subprocess.run([
    "claude",
    "--mcp",
    "markitdown",
    f"convert {pdf_path} markdown"
], capture_output=True, text=True, timeout=30)

print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("RETURN CODE:", result.returncode)

if result.returncode == 0:
    print("SUCCESS: markitdown extraction completed")
    print("CONTENT:", result.stdout)
else:
    print("FAILED: markitdown extraction failed")
'''

            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(script_content)
                temp_script = f.name

            # Run the script
            result = subprocess.run([sys.executable, temp_script],
                                   capture_output=True, text=True, timeout=60)

            os.unlink(temp_script)

            print(f"Markitdown attempt result:")
            print(f"Return code: {result.returncode}")
            print(f"Stdout: {result.stdout}")
            print(f"Stderr: {result.stderr}")

            if result.returncode == 0:
                return result.stdout

        except Exception as e:
            print(f"Markitdown extraction failed: {e}")

        return None

    def try_pdf_extraction_mcp(self, pdf_path):
        """Try to use pdf-extraction MCP server"""
        try:
            # Create a temporary script to call pdf-extraction
            script_content = f'''
import json
import subprocess
import sys

# Try to use pdf-extraction through Claude MCP
result = subprocess.run([
    "claude",
    "--mcp",
    "pdf-extraction",
    f"extract-pdf-contents --pdf_path {pdf_path}"
], capture_output=True, text=True, timeout=30)

print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("RETURN CODE:", result.returncode)

if result.returncode == 0:
    print("SUCCESS: pdf-extraction completed")
    print("CONTENT:", result.stdout)
else:
    print("FAILED: pdf-extraction failed")
'''

            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(script_content)
                temp_script = f.name

            # Run the script
            result = subprocess.run([sys.executable, temp_script],
                                   capture_output=True, text=True, timeout=60)

            os.unlink(temp_script)

            print(f"PDF extraction MCP attempt result:")
            print(f"Return code: {result.returncode}")
            print(f"Stdout: {result.stdout}")
            print(f"Stderr: {result.stderr}")

            if result.returncode == 0:
                return result.stdout

        except Exception as e:
            print(f"PDF extraction MCP failed: {e}")

        return None

    def fallback_pymupdf_extraction(self, pdf_path):
        """Fallback to PyMuPDF extraction"""
        try:
            import fitz
            doc = fitz.open(pdf_path)
            text_content = ""

            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text()
                text_content += f"\n--- Page {page_num + 1} ---\n{text}"

            doc.close()
            return text_content

        except Exception as e:
            print(f"PyMuPDF extraction failed: {e}")
            return None

    def process_pdf_file(self, pdf_path):
        """Process a single PDF file using available methods"""
        print(f"\n{'='*60}")
        print(f"Processing PDF: {pdf_path}")
        print(f"{'='*60}")

        if not os.path.exists(pdf_path):
            print(f"ERROR: File not found: {pdf_path}")
            return []

        extracted_content = None
        method_used = "none"

        # Try markitdown first
        print("\n1. Attempting markitdown MCP extraction...")
        extracted_content = self.try_markitdown_extraction(pdf_path)
        if extracted_content:
            method_used = "markitdown"
            print("✓ Markitdown extraction successful!")
        else:
            print("✗ Markitdown extraction failed")

        # Try pdf-extraction MCP
        if not extracted_content:
            print("\n2. Attempting pdf-extraction MCP extraction...")
            extracted_content = self.try_pdf_extraction_mcp(pdf_path)
            if extracted_content:
                method_used = "pdf-extraction-mcp"
                print("✓ PDF extraction MCP successful!")
            else:
                print("✗ PDF extraction MCP failed")

        # Fallback to PyMuPDF
        if not extracted_content:
            print("\n3. Attempting PyMuPDF fallback extraction...")
            extracted_content = self.fallback_pymupdf_extraction(pdf_path)
            if extracted_content:
                method_used = "pymupdf"
                print("✓ PyMuPDF fallback successful!")
            else:
                print("✗ PyMuPDF fallback failed")

        if not extracted_content:
            print(f"ERROR: All extraction methods failed for {pdf_path}")
            return []

        print(f"\nUsing extraction method: {method_used}")
        print(f"Extracted content length: {len(extracted_content)} characters")

        # Process the extracted content
        problems = self.process_text_content(extracted_content, pdf_path, method_used)
        print(f"Extracted {len(problems)} problems from {Path(pdf_path).name}")

        return problems

    def process_text_content(self, text_content, source_file, method):
        """Process extracted text to find math problems"""
        problems = []

        # Clean the text
        cleaned_text = self.clean_text(text_content)

        # Split into potential problems
        # Look for problem number patterns
        problem_sections = re.split(r'(?:[①②③④⑤⑥⑦⑧⑨⑩]|[1-9]+[\.、])', cleaned_text)

        for i, section in enumerate(problem_sections[1:], 1):  # Skip first empty split
            section = section.strip()
            if len(section) > 20 and self.is_math_problem(section):
                problem = self.extract_problem_structure(section)
                problem["source"] = f"{source_file} (Method: {method})"
                problem["id"] = f"{Path(source_file).stem}_{method}_{i}"
                problem["extraction_method"] = method

                if problem["stem"]:  # Only add if we have a valid stem
                    problems.append(problem)

        return problems

    def compare_extraction_quality(self, problems, old_problems_file):
        """Compare new extraction with old OCR results"""
        try:
            with open(old_problems_file, 'r', encoding='utf-8') as f:
                old_problems = json.load(f)
        except:
            old_problems = []

        print(f"\n{'='*60}")
        print("EXTRACTION QUALITY COMPARISON")
        print(f"{'='*60}")
        print(f"Old OCR problems: {len(old_problems)}")
        print(f"New MCP problems: {len(problems)}")

        # Compare content quality
        new_unique_problems = []
        improved_problems = []

        for new_problem in problems:
            is_unique = True
            is_improved = False

            # Check if this problem is unique or improved
            for old_problem in old_problems:
                # Simple similarity check (could be improved)
                if (len(new_problem["stem"]) > len(old_problem.get("stem", "")) * 1.5 and
                    any(keyword in new_problem["stem"] for keyword in ["计算", "应用", "数学"])):
                    is_improved = True
                    break

            if is_unique or is_improved:
                new_unique_problems.append(new_problem)

        print(f"Unique/improved problems: {len(new_unique_problems)}")
        return new_unique_problems

def main():
    # Paths to the PDF files
    pdf_files = [
        "/Users/tywg001/Downloads/mathlearning/aoshu/第二十二届华罗庚金杯少年数学邀请赛 决赛试题参考答案 （小学中年级组）.pdf",
        "/Users/tywg001/Downloads/mathlearning/aoshu/一本数学思维训练四年级.pdf",
        "/Users/tywg001/Downloads/mathlearning/aoshu/学霸提优大试卷四年级上册数学人教版.pdf"
    ]

    processor = MCPPDFProcessor()
    all_problems = []

    for pdf_file in pdf_files:
        problems = processor.process_pdf_file(pdf_file)
        all_problems.extend(problems)

    # Save results
    output_file = "/Users/tywg001/Downloads/mathlearning/mcp_extracted_problems.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_problems, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print("FINAL SUMMARY")
    print(f"{'='*60}")
    print(f"Total problems extracted: {len(all_problems)}")
    print(f"Results saved to: {output_file}")

    # Compare with old OCR results
    old_problems_file = "/Users/tywg001/Downloads/mathlearning/extracted_problems_ocr.json"
    unique_problems = processor.compare_extraction_quality(all_problems, old_problems_file)

    # Save unique problems
    unique_output_file = "/Users/tywg001/Downloads/mathlearning/unique_mcp_problems.json"
    with open(unique_output_file, 'w', encoding='utf-8') as f:
        json.dump(unique_problems, f, ensure_ascii=False, indent=2)

    print(f"Unique/improved problems saved to: {unique_output_file}")

    # Show sample problems
    print(f"\n{'='*60}")
    print("SAMPLE EXTRACTED PROBLEMS")
    print(f"{'='*60}")
    for i, problem in enumerate(all_problems[:5], 1):
        print(f"\nProblem {i}:")
        print(f"  ID: {problem.get('id', 'N/A')}")
        print(f"  Source: {problem.get('source', 'N/A')}")
        print(f"  Method: {problem.get('extraction_method', 'N/A')}")
        print(f"  Difficulty: {problem.get('difficulty', 'N/A')}")
        print(f"  Stem: {problem.get('stem', 'N/A')[:150]}...")
        if problem.get('answer'):
            print(f"  Answer: {problem['answer']}")

    if len(all_problems) > 5:
        print(f"\n... and {len(all_problems) - 5} more problems")

if __name__ == "__main__":
    main()