#!/usr/bin/env python3
"""
Enhanced PDF Extraction with Markitdown-style Processing
Simulates markitdown's markdown conversion approach for better math problem extraction
"""

import os
import sys
import json
import re
from pathlib import Path

try:
    import fitz  # PyMuPDF
    import PyPDF2
except ImportError as e:
    print(f"Error importing PDF libraries: {e}")
    sys.exit(1)

class EnhancedMathProblemExtractor:
    def __init__(self):
        self.extracted_problems = []
        self.current_problem = {}

    def clean_text(self, text):
        """Clean extracted text with markitdown-style processing"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        # Remove empty lines
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        return '\n'.join(lines)

    def convert_to_markdown_style(self, text):
        """Convert text to markdown-like format for better structure detection"""
        # Add markdown-style formatting
        markdown_text = text

        # Convert problem numbers to markdown headers
        markdown_text = re.sub(r'([①②③④⑤⑥⑦⑧⑨⑩]|[1-9]+[\.、])\s*(.*?)', r'## \1 \2', markdown_text)

        # Convert answer sections
        markdown_text = re.sub(r'答案[:：]\s*(.*?)', r'**答案**: \1', markdown_text)

        # Convert analysis sections
        markdown_text = re.sub(r'解析[:：]\s*(.*?)', r'**解析**: \1', markdown_text)

        # Convert solution sections
        markdown_text = re.sub(r'解[:：]\s*(.*?)', r'**解**: \1', markdown_text)

        return markdown_text

    def is_math_problem(self, text):
        """Check if text looks like a math problem with enhanced detection"""
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
        """Extract structured problem with enhanced format"""
        # Convert to markdown style first
        markdown_text = self.convert_to_markdown_style(text)

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

        # Extract problem stem (before answer/solution sections)
        stem_match = re.search(r'^(.*?)(?=答案|答|解|解析|$)', markdown_text, re.DOTALL)
        if stem_match:
            problem["stem"] = stem_match.group(1).strip()

        # Extract answer
        answer_match = re.search(r'\*\*答案\*\*[:：]?\s*(.*?)(?=\n|$)', markdown_text)
        if answer_match:
            problem["answer"] = answer_match.group(1).strip()

        # Extract analysis
        analysis_match = re.search(r'\*\*解析\*\*[:：]?\s*(.*?)(?=\n|$)', markdown_text)
        if analysis_match:
            problem["analysis"] = analysis_match.group(1).strip()

        # Enhanced difficulty detection
        stem_length = len(problem["stem"])
        if stem_length > 300:
            problem["difficulty"] = "hard"
        elif stem_length < 30:
            problem["difficulty"] = "easy"

        # Detect knowledge points based on content
        if "加法" in problem["stem"] or "减法" in problem["stem"]:
            problem["knowledgePoints"].append("加减运算")
        if "乘法" in problem["stem"] or "除法" in problem["stem"]:
            problem["knowledgePoints"].append("乘除运算")
        if "面积" in problem["stem"] or "周长" in problem["stem"]:
            problem["knowledgePoints"].append("几何图形")
        if "时间" in problem["stem"] or "分钟" in problem["stem"]:
            problem["knowledgePoints"].append("时间问题")

        return problem

    def extract_from_pdf(self, pdf_path):
        """Extract math problems from PDF with enhanced processing"""
        print(f"Processing PDF: {pdf_path}")

        try:
            # Use PyMuPDF for better Chinese text extraction
            doc = fitz.open(pdf_path)
            text_content = ""
            page_info = []

            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text()
                text_content += f"\n--- Page {page_num + 1} ---\n{text}"
                page_info.append({"page": page_num + 1, "text_length": len(text)})

            doc.close()

            # Process with enhanced extraction
            problems = self.process_enhanced_content(text_content, pdf_path, page_info)
            return problems

        except Exception as e:
            print(f"Error processing PDF: {e}")
            return []

    def process_enhanced_content(self, text_content, source_file, page_info):
        """Process content with enhanced extraction"""
        problems = []

        # Split by pages
        pages = text_content.split('--- Page')

        for i, page_content in enumerate(pages[1:], 1):  # Skip first empty split
            page_text = self.clean_text(page_content)

            # Enhanced problem detection using multiple patterns
            problem_patterns = [
                r'([①②③④⑤⑥⑦⑧⑨⑩])\s*(.*?)(?=[①②③④⑤⑥⑦⑧⑨⑩]|$)',
                r'([1-9]+[\.、])\s*(.*?)(?=[1-9]+[\.、]|$)',
                r'(第[一二三四五六七八九十\d]+题)\s*(.*?)(?=第[一二三四五六七八九十\d]+题|$)',
                r'(例题\d*)\s*(.*?)(?=例题|$)',
            ]

            for pattern in problem_patterns:
                matches = re.findall(pattern, page_text, re.DOTALL)
                for match in matches:
                    if len(match) >= 2:
                        problem_text = match[1].strip()
                        if len(problem_text) > 20 and self.is_math_problem(problem_text):
                            problem = self.extract_problem_structure(problem_text)
                            problem["source"] = f"{source_file} (Page {i})"
                            problem["id"] = f"{Path(source_file).stem}_page{i}_enhanced{len(problems)+1}"
                            problem["extraction_method"] = "enhanced_markdown_style"
                            problem["page_number"] = i

                            if problem["stem"]:
                                problems.append(problem)

            # If no structured problems found, look for math content blocks
            if not problems:
                math_blocks = re.split(r'[。！？]', page_text)
                for block in math_blocks:
                    block = block.strip()
                    if len(block) > 30 and self.is_math_problem(block):
                        problem = self.extract_problem_structure(block)
                        problem["source"] = f"{source_file} (Page {i})"
                        problem["id"] = f"{Path(source_file).stem}_page{i}_block{len(problems)+1}"
                        problem["extraction_method"] = "enhanced_math_block"
                        problem["page_number"] = i

                        if problem["stem"]:
                            problems.append(problem)

        return problems

    def compare_with_ocr(self, new_problems, old_problems_file):
        """Compare new extraction with old OCR results"""
        try:
            with open(old_problems_file, 'r', encoding='utf-8') as f:
                old_problems = json.load(f)
        except:
            old_problems = []

        comparison = {
            "old_count": len(old_problems),
            "new_count": len(new_problems),
            "improved_problems": [],
            "unique_problems": [],
            "quality_metrics": {
                "avg_stem_length_old": 0,
                "avg_stem_length_new": 0,
                "problems_with_answers_old": 0,
                "problems_with_answers_new": 0,
                "problems_with_analysis_old": 0,
                "problems_with_analysis_new": 0
            }
        }

        # Calculate quality metrics
        if old_problems:
            comparison["quality_metrics"]["avg_stem_length_old"] = sum(len(p.get("stem", "")) for p in old_problems) / len(old_problems)
            comparison["quality_metrics"]["problems_with_answers_old"] = sum(1 for p in old_problems if p.get("answer"))
            comparison["quality_metrics"]["problems_with_analysis_old"] = sum(1 for p in old_problems if p.get("analysis"))

        if new_problems:
            comparison["quality_metrics"]["avg_stem_length_new"] = sum(len(p.get("stem", "")) for p in new_problems) / len(new_problems)
            comparison["quality_metrics"]["problems_with_answers_new"] = sum(1 for p in new_problems if p.get("answer"))
            comparison["quality_metrics"]["problems_with_analysis_new"] = sum(1 for p in new_problems if p.get("analysis"))

        # Find improved and unique problems
        for new_problem in new_problems:
            is_unique = True
            is_improved = False

            for old_problem in old_problems:
                # Check for similarity (basic check)
                if (len(new_problem["stem"]) > len(old_problem.get("stem", "")) * 1.2 and
                    any(keyword in new_problem["stem"] for keyword in old_problem.get("stem", ""))):
                    is_improved = True
                    is_unique = False
                    comparison["improved_problems"].append({
                        "new_problem": new_problem,
                        "old_stem_length": len(old_problem.get("stem", "")),
                        "new_stem_length": len(new_problem["stem"])
                    })
                    break

            if is_unique:
                comparison["unique_problems"].append(new_problem)

        return comparison

def main():
    # Paths to the PDF files
    pdf_files = [
        "/Users/tywg001/Downloads/mathlearning/aoshu/第二十二届华罗庚金杯少年数学邀请赛 决赛试题参考答案 （小学中年级组）.pdf",
        "/Users/tywg001/Downloads/mathlearning/aoshu/一本数学思维训练四年级.pdf",
        "/Users/tywg001/Downloads/mathlearning/aoshu/学霸提优大试卷四年级上册数学人教版.pdf"
    ]

    extractor = EnhancedMathProblemExtractor()
    all_problems = []

    print(f"{'='*80}")
    print("ENHANCED PDF EXTRACTION WITH MARKDOWN-STYLE PROCESSING")
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
    output_file = "/Users/tywg001/Downloads/mathlearning/enhanced_extracted_problems.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_problems, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*80}")
    print("FINAL SUMMARY")
    print(f"{'='*80}")
    print(f"Total problems extracted: {len(all_problems)}")
    print(f"Results saved to: {output_file}")

    # Compare with old OCR results
    old_problems_file = "/Users/tywg001/Downloads/mathlearning/extracted_problems_ocr.json"
    comparison = extractor.compare_with_ocr(all_problems, old_problems_file)

    print(f"\n{'='*80}")
    print("QUALITY COMPARISON WITH OCR")
    print(f"{'='*80}")
    print(f"Old OCR problems: {comparison['old_count']}")
    print(f"New enhanced problems: {comparison['new_count']}")
    print(f"Improved problems: {len(comparison['improved_problems'])}")
    print(f"Unique problems: {len(comparison['unique_problems'])}")

    metrics = comparison['quality_metrics']
    print(f"\nQuality Metrics:")
    print(f"  Average stem length (OCR): {metrics['avg_stem_length_old']:.1f}")
    print(f"  Average stem length (Enhanced): {metrics['avg_stem_length_new']:.1f}")
    print(f"  Problems with answers (OCR): {metrics['problems_with_answers_old']}")
    print(f"  Problems with answers (Enhanced): {metrics['problems_with_answers_new']}")
    print(f"  Problems with analysis (OCR): {metrics['problems_with_analysis_old']}")
    print(f"  Problems with analysis (Enhanced): {metrics['problems_with_analysis_new']}")

    # Save unique problems
    unique_output_file = "/Users/tywg001/Downloads/mathlearning/unique_enhanced_problems.json"
    with open(unique_output_file, 'w', encoding='utf-8') as f:
        json.dump(comparison['unique_problems'], f, ensure_ascii=False, indent=2)

    # Save comparison report
    comparison_output_file = "/Users/tywg001/Downloads/mathlearning/extraction_comparison.json"
    with open(comparison_output_file, 'w', encoding='utf-8') as f:
        json.dump(comparison, f, ensure_ascii=False, indent=2)

    print(f"\nUnique problems saved to: {unique_output_file}")
    print(f"Comparison report saved to: {comparison_output_file}")

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