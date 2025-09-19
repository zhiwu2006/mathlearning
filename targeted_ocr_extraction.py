#!/usr/bin/env python3
"""
Targeted OCR Math Problem Extraction
Focused approach for specific pages that likely contain math problems
"""

import os
import json
import re
import tempfile
import subprocess
from pathlib import Path
from PIL import Image
import fitz

class TargetedMathExtractor:
    def __init__(self):
        self.extracted_problems = []
        self.temp_dir = tempfile.mkdtemp()

    def convert_page_to_image(self, pdf_path, page_num):
        """Convert a single PDF page to image"""
        doc = fitz.open(pdf_path)
        if page_num >= len(doc):
            doc.close()
            return None

        page = doc[page_num]
        pix = page.get_pixmap(matrix=fitz.Matrix(2.5, 2.5))
        img_path = os.path.join(self.temp_dir, f"page_{page_num + 1}.png")
        pix.save(img_path)
        doc.close()
        return img_path

    def ocr_page(self, image_path):
        """OCR a single page image"""
        try:
            output_base = os.path.splitext(image_path)[0]
            txt_path = f"{output_base}.txt"

            cmd = [
                'tesseract',
                image_path,
                output_base,
                '-l', 'chi_sim+eng',
                '--oem', '3',
                '--psm', '6'
            ]

            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode == 0 and os.path.exists(txt_path):
                with open(txt_path, 'r', encoding='utf-8') as f:
                    text = f.read()
                os.remove(txt_path)
                return text

        except Exception as e:
            print(f"OCR error: {e}")

        return ""

    def extract_problems_from_text(self, text, page_num, source_file):
        """Extract math problems from OCR text"""
        problems = []

        # Clean text
        text = re.sub(r'[^\u4e00-\u9fff\w\s+\-×÷=＜＞≤≥\(\)\[\]{}.,，。、:：;；!！?？\d]', '', text)
        text = re.sub(r'\s+', ' ', text)

        # Look for problem patterns
        problem_patterns = [
            r'(\d+\.[^.\n]+(?:\n[^.\n]+){0,5})',  # Numbered problems
            r'([①②③④⑤⑥⑦⑧⑨⑩][^①②③④⑤⑥⑦⑧⑨⑩\n]+(?:\n[^①②③④⑤⑥⑦⑧⑨⑩\n]+){0,3})',  # Chinese numbered
            r'(计算[^。\n]+(?:\n[^。\n]+){0,2})',  # Calculation problems
            r'(应用题[^。\n]+(?:\n[^。\n]+){0,5})',  # Word problems
            r'(练习[^。\n]+(?:\n[^。\n]+){0,10})',  # Exercise sections
        ]

        for pattern in problem_patterns:
            matches = re.findall(pattern, text, re.MULTILINE)
            for match in matches:
                match = match.strip()
                if self.is_valid_problem(match):
                    problem = self.create_problem(match, page_num, len(problems) + 1, source_file)
                    problems.append(problem)

        return problems

    def is_valid_problem(self, text):
        """Check if text is a valid math problem"""
        if len(text) < 15 or len(text) > 500:
            return False

        # Must contain math-related content
        math_indicators = [
            r'\d+[\s]*[+\-×÷=＜＞≤≥][\s]*\d+',  # Math operations
            r'[计算应用题几何面积周长体积]',  # Math keywords
            r'[一二三四五六七八九十百千万]',  # Chinese numbers
        ]

        return any(re.search(pattern, text) for pattern in math_indicators)

    def create_problem(self, stem, page_num, problem_num, source_file):
        """Create a structured problem object"""
        return {
            "id": f"{Path(source_file).stem}_{page_num}_{problem_num}",
            "source": f"{source_file} (Page {page_num})",
            "stem": stem,
            "taxonomy": "math",
            "steps": [],
            "transitions": [],
            "scoring": {"total": 5, "steps": []},
            "answer": "",
            "analysis": "",
            "knowledgePoints": self.get_knowledge_points(stem),
            "difficulty": self.get_difficulty(stem),
            "type": self.get_type(stem),
            "gradeLevel": "4"
        }

    def get_knowledge_points(self, text):
        """Extract knowledge points"""
        keywords = {
            "加法": "加法运算", "减法": "减法运算", "乘法": "乘法运算", "除法": "除法运算",
            "分数": "分数", "小数": "小数", "面积": "面积计算", "周长": "周长计算",
            "应用题": "应用题", "几何": "几何图形", "平均数": "平均数", "统计": "统计图表"
        }

        points = []
        for keyword, point in keywords.items():
            if keyword in text:
                points.append(point)

        return points if points else ["基础运算"]

    def get_difficulty(self, text):
        """Estimate difficulty"""
        if len(text) > 150 or "应用题" in text or "综合" in text:
            return "hard"
        elif len(text) > 80:
            return "medium"
        else:
            return "easy"

    def get_type(self, text):
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

    def process_specific_pages(self, pdf_path, page_list):
        """Process specific pages from PDF"""
        problems = []

        for page_num in page_list:
            print(f"Processing page {page_num + 1}...")

            image_path = self.convert_page_to_image(pdf_path, page_num)
            if not image_path:
                continue

            text = self.ocr_page(image_path)
            if text:
                page_problems = self.extract_problems_from_text(text, page_num + 1, pdf_path)
                problems.extend(page_problems)
                print(f"Found {len(page_problems)} problems on page {page_num + 1}")
            else:
                print(f"No text extracted from page {page_num + 1}")

            if os.path.exists(image_path):
                os.remove(image_path)

        return problems

    def cleanup(self):
        """Clean up temporary files"""
        if os.path.exists(self.temp_dir):
            import shutil
            shutil.rmtree(self.temp_dir)

def main():
    # Target pages that are likely to contain math problems
    # Skip first few pages (covers, table of contents) and focus on content pages
    target_pages = [5, 6, 7, 10, 15, 20, 25, 30, 35, 40]

    pdf_files = [
        "/Users/tywg001/Downloads/mathlearning/aoshu/一本数学思维训练四年级.pdf",
        "/Users/tywg001/Downloads/mathlearning/aoshu/学霸提优大试卷四年级上册数学人教版.pdf"
    ]

    extractor = TargetedMathExtractor()
    all_problems = []

    try:
        for pdf_file in pdf_files:
            print(f"\nProcessing: {Path(pdf_file).name}")
            problems = extractor.process_specific_pages(pdf_file, target_pages)
            all_problems.extend(problems)
            print(f"Total from {Path(pdf_file).name}: {len(problems)}")

        # Remove duplicates
        unique_problems = []
        seen_stems = set()

        for problem in all_problems:
            # Simple deduplication based on first 100 chars of stem
            stem_key = problem['stem'][:100].strip()
            if stem_key not in seen_stems:
                unique_problems.append(problem)
                seen_stems.add(stem_key)

        # Save results
        output_file = "/Users/tywg001/Downloads/mathlearning/targeted_extracted_problems.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(unique_problems, f, ensure_ascii=False, indent=2)

        print(f"\n=== TARGETED EXTRACTION RESULTS ===")
        print(f"Total unique problems: {len(unique_problems)}")
        print(f"Results saved to: {output_file}")

        # Sample problems
        print(f"\n=== SAMPLE PROBLEMS ===")
        for i, problem in enumerate(unique_problems[:5], 1):
            print(f"\n{i}. {problem['id']}")
            print(f"   Type: {problem['type']}, Difficulty: {problem['difficulty']}")
            print(f"   Knowledge: {problem['knowledgePoints']}")
            print(f"   Stem: {problem['stem'][:150]}...")

        # Statistics
        type_counts = {}
        diff_counts = {}
        for problem in unique_problems:
            ptype = problem['type']
            diff = problem['difficulty']
            type_counts[ptype] = type_counts.get(ptype, 0) + 1
            diff_counts[diff] = diff_counts.get(diff, 0) + 1

        print(f"\n=== STATISTICS ===")
        print(f"By Type: {type_counts}")
        print(f"By Difficulty: {diff_counts}")

    finally:
        extractor.cleanup()

if __name__ == "__main__":
    main()