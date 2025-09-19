#!/usr/bin/env python3
"""
Comprehensive PDF processing combining text extraction and OCR
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
    print("OCR libraries available")
except ImportError:
    OCR_AVAILABLE = False
    print("OCR libraries not available")

class ComprehensiveMathProblemExtractor:
    def __init__(self):
        self.extracted_problems = []
        self.current_problem = {}

    def clean_text(self, text):
        """Clean extracted text"""
        text = re.sub(r'\s+', ' ', text).strip()
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

    def extract_problem_structure(self, text, source_info=""):
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
            "knowledgePoints": ["数学思维训练", "应用题解题"],
            "difficulty": "medium",
            "gradeLevel": "小学四年级",
            "source": source_info
        }

        # Extract problem stem
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

    def extract_from_text_pdf(self, pdf_path):
        """Extract from PDF with text content (like the math competition)"""
        print(f"Processing text-based PDF: {pdf_path}")
        problems = []

        try:
            doc = fitz.open(pdf_path)
            full_text = ""

            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text()
                full_text += text + "\n"

            doc.close()

            # Process the math competition answer key
            lines = full_text.split('\n')
            current_section = ""

            for line in lines:
                line = line.strip()
                if not line:
                    continue

                # Look for problem numbers and answers
                if re.match(r'^\d+\.\s*\d+', line):  # Problem number and answer
                    parts = line.split()
                    if len(parts) >= 2:
                        problem_num = parts[0]
                        answer = parts[1]

                        # Create a problem from the answer format
                        problem = {
                            "stem": f"第{problem_num}题",
                            "taxonomy": "数学竞赛题",
                            "steps": [],
                            "transitions": [
                                "理解题目要求",
                                "分析已知条件",
                                "选择解题方法",
                                "进行计算求解",
                                "验证答案合理性"
                            ],
                            "scoring": {"total": 10, "steps": []},
                            "answer": answer,
                            "analysis": f"竞赛题答案：{answer}",
                            "knowledgePoints": ["数学竞赛", "逻辑推理"],
                            "difficulty": "hard",
                            "gradeLevel": "小学中年级",
                            "source": f"{Path(pdf_path).name} (华罗庚金杯)",
                            "id": f"huajin_{problem_num}"
                        }
                        problems.append(problem)

            return problems

        except Exception as e:
            print(f"Error processing text PDF: {e}")
            return []

    def extract_from_scanned_pdf(self, pdf_path, max_pages=10):
        """Extract from scanned PDF using OCR"""
        print(f"Processing scanned PDF: {pdf_path} (first {max_pages} pages)")
        problems = []

        if not OCR_AVAILABLE:
            print("OCR not available")
            return []

        try:
            doc = fitz.open(pdf_path)
            print(f"Total pages: {len(doc)}, processing first {max_pages}")

            for page_num in range(min(max_pages, len(doc))):
                page = doc[page_num]

                # First try regular text extraction
                text = page.get_text()
                use_ocr = len(text.strip()) < 50

                if use_ocr:
                    print(f"  Using OCR for page {page_num + 1}")
                    try:
                        # Get page as image
                        pix = page.get_pixmap()
                        img_data = pix.tobytes("ppm")
                        img = Image.open(io.BytesIO(img_data))

                        # Use Tesseract OCR
                        text = pytesseract.image_to_string(img, lang='chi_sim+eng')
                    except Exception as e:
                        print(f"  OCR failed for page {page_num + 1}: {e}")
                        continue

                # Clean and process the text
                text = self.clean_text(text)

                # Look for problem patterns
                problem_patterns = [
                    r'([①②③④⑤⑥⑦⑧⑨⑩])\s*(.*?)(?=[①②③④⑤⑥⑦⑧⑨⑩]|$)',
                    r'([1-9]+[\.、])\s*(.*?)(?=[1-9]+[\.、]|$)',
                ]

                for pattern in problem_patterns:
                    matches = re.findall(pattern, text, re.DOTALL)
                    for match in matches:
                        if len(match) >= 2:
                            problem_text = match[1].strip()
                            if len(problem_text) > 20 and self.is_math_problem(problem_text):
                                problem = self.extract_problem_structure(
                                    problem_text,
                                    f"{Path(pdf_path).name} (Page {page_num + 1})"
                                )
                                problem["id"] = f"{Path(pdf_path).stem}_page{page_num + 1}_{len(problems)+1}"
                                problem["extraction_method"] = "ocr" if use_ocr else "text"

                                if problem["stem"]:
                                    problems.append(problem)

            doc.close()
            print(f"Found {len(problems)} problems in {max_pages} pages")
            return problems

        except Exception as e:
            print(f"Error processing scanned PDF: {e}")
            return []

    def compare_with_existing(self, new_problems, existing_file):
        """Compare with existing problems"""
        try:
            with open(existing_file, 'r', encoding='utf-8') as f:
                existing_problems = json.load(f)
        except:
            existing_problems = []

        comparison = {
            "existing_count": len(existing_problems),
            "new_count": len(new_problems),
            "unique_new": [],
            "improved_versions": [],
            "quality_metrics": {
                "avg_stem_length_existing": 0,
                "avg_stem_length_new": 0,
                "with_answers_existing": 0,
                "with_answers_new": 0,
                "with_analysis_existing": 0,
                "with_analysis_new": 0
            }
        }

        # Calculate metrics
        if existing_problems:
            comparison["quality_metrics"]["avg_stem_length_existing"] = sum(len(p.get("stem", "")) for p in existing_problems) / len(existing_problems)
            comparison["quality_metrics"]["with_answers_existing"] = sum(1 for p in existing_problems if p.get("answer"))
            comparison["quality_metrics"]["with_analysis_existing"] = sum(1 for p in existing_problems if p.get("analysis"))

        if new_problems:
            comparison["quality_metrics"]["avg_stem_length_new"] = sum(len(p.get("stem", "")) for p in new_problems) / len(new_problems)
            comparison["quality_metrics"]["with_answers_new"] = sum(1 for p in new_problems if p.get("answer"))
            comparison["quality_metrics"]["with_analysis_new"] = sum(1 for p in new_problems if p.get("analysis"))

        # Find unique problems
        for new_problem in new_problems:
            is_unique = True

            for existing_problem in existing_problems:
                # Simple similarity check
                if (len(new_problem["stem"]) > 10 and
                    any(keyword in new_problem["stem"] for keyword in ["计算", "应用", "数学", "解题"])):
                    # Check if it's an improved version
                    if (len(new_problem["stem"]) > len(existing_problem.get("stem", "")) * 1.2 and
                        new_problem.get("answer") and not existing_problem.get("answer")):
                        comparison["improved_versions"].append({
                            "new": new_problem,
                            "old_stem_length": len(existing_problem.get("stem", "")),
                            "new_stem_length": len(new_problem["stem"])
                        })
                        is_unique = False
                        break

            if is_unique:
                comparison["unique_new"].append(new_problem)

        return comparison

def main():
    # PDF files to process
    pdf_files = [
        {
            "path": "/Users/tywg001/Downloads/mathlearning/aoshu/第二十二届华罗庚金杯少年数学邀请赛 决赛试题参考答案 （小学中年级组）.pdf",
            "type": "text"
        },
        {
            "path": "/Users/tywg001/Downloads/mathlearning/aoshu/一本数学思维训练四年级.pdf",
            "type": "scanned"
        },
        {
            "path": "/Users/tywg001/Downloads/mathlearning/aoshu/学霸提优大试卷四年级上册数学人教版.pdf",
            "type": "scanned"
        }
    ]

    extractor = ComprehensiveMathProblemExtractor()
    all_problems = []

    print(f"{'='*80}")
    print("COMPREHENSIVE PDF PROCESSING")
    print(f"{'='*80}")

    for pdf_info in pdf_files:
        if os.path.exists(pdf_info["path"]):
            if pdf_info["type"] == "text":
                problems = extractor.extract_from_text_pdf(pdf_info["path"])
            else:
                problems = extractor.extract_from_scanned_pdf(pdf_info["path"], max_pages=10)

            all_problems.extend(problems)
            print(f"Extracted {len(problems)} problems from {Path(pdf_info['path']).name}")
        else:
            print(f"File not found: {pdf_info['path']}")

    # Save results
    output_file = "/Users/tywg001/Downloads/mathlearning/comprehensive_extracted_problems.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_problems, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*80}")
    print("FINAL SUMMARY")
    print(f"{'='*80}")
    print(f"Total problems extracted: {len(all_problems)}")
    print(f"Results saved to: {output_file}")

    # Compare with existing OCR results
    existing_file = "/Users/tywg001/Downloads/mathlearning/extracted_problems_ocr.json"
    comparison = extractor.compare_with_existing(all_problems, existing_file)

    print(f"\n{'='*80}")
    print("COMPARISON WITH EXISTING OCR RESULTS")
    print(f"{'='*80}")
    print(f"Existing problems: {comparison['existing_count']}")
    print(f"New problems: {comparison['new_count']}")
    print(f"Unique new problems: {len(comparison['unique_new'])}")
    print(f"Improved versions: {len(comparison['improved_versions'])}")

    metrics = comparison['quality_metrics']
    print(f"\nQuality Metrics:")
    print(f"  Avg stem length (existing): {metrics['avg_stem_length_existing']:.1f}")
    print(f"  Avg stem length (new): {metrics['avg_stem_length_new']:.1f}")
    print(f"  With answers (existing): {metrics['with_answers_existing']}")
    print(f"  With answers (new): {metrics['with_answers_new']}")
    print(f"  With analysis (existing): {metrics['with_analysis_existing']}")
    print(f"  With analysis (new): {metrics['with_analysis_new']}")

    # Save unique problems
    unique_file = "/Users/tywg001/Downloads/mathlearning/unique_comprehensive_problems.json"
    with open(unique_file, 'w', encoding='utf-8') as f:
        json.dump(comparison['unique_new'], f, ensure_ascii=False, indent=2)

    # Save comparison
    comparison_file = "/Users/tywg001/Downloads/mathlearning/comprehensive_comparison.json"
    with open(comparison_file, 'w', encoding='utf-8') as f:
        json.dump(comparison, f, ensure_ascii=False, indent=2)

    print(f"\nUnique problems saved to: {unique_file}")
    print(f"Comparison saved to: {comparison_file}")

    # Show sample problems
    print(f"\n{'='*80}")
    print("SAMPLE EXTRACTED PROBLEMS")
    print(f"{'='*80}")
    for i, problem in enumerate(all_problems[:5], 1):
        print(f"\nProblem {i}:")
        print(f"  ID: {problem.get('id', 'N/A')}")
        print(f"  Source: {problem.get('source', 'N/A')}")
        print(f"  Difficulty: {problem.get('difficulty', 'N/A')}")
        print(f"  Knowledge Points: {problem.get('knowledgePoints', [])}")
        print(f"  Stem: {problem.get('stem', 'N/A')[:150]}...")
        if problem.get('answer'):
            print(f"  Answer: {problem['answer']}")

    if len(all_problems) > 5:
        print(f"\n... and {len(all_problems) - 5} more problems")

if __name__ == "__main__":
    main()