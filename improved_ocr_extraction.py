#!/usr/bin/env python3
"""
Improved OCR Math Problem Extractor
Better handling of Chinese math textbooks and workbooks
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

class ImprovedMathProblemExtractor:
    def __init__(self):
        self.extracted_problems = []
        self.temp_dir = tempfile.mkdtemp()

    def pdf_to_high_quality_images(self, pdf_path, start_page=0, max_pages=20):
        """Convert PDF pages to high quality images for better OCR"""
        images = []
        doc = fitz.open(pdf_path)

        # Process pages from start_page
        end_page = min(len(doc), start_page + max_pages)
        print(f"Processing pages {start_page+1} to {end_page} of {len(doc)} total pages")

        for page_num in range(start_page, end_page):
            page = doc[page_num]
            # Higher resolution for better OCR
            pix = page.get_pixmap(matrix=fitz.Matrix(3, 3))  # 3x zoom
            img_path = os.path.join(self.temp_dir, f"page_{page_num + 1}.png")
            pix.save(img_path)
            images.append((page_num + 1, img_path))

        doc.close()
        return images

    def ocr_with_multiple_configs(self, image_path):
        """Try multiple OCR configurations for best results"""
        best_text = ""
        best_score = 0

        configs = [
            # Config 1: Standard Chinese math text
            {
                'lang': 'chi_sim+eng',
                'psm': 6,  # Assume uniform text block
                'oem': 3   # Default LSTM OCR engine
            },
            # Config 2: Single column text
            {
                'lang': 'chi_sim+eng',
                'psm': 4,  # Single column text
                'oem': 3
            },
            # Config 3: Sparse text
            {
                'lang': 'chi_sim+eng',
                'psm': 11, # Sparse text
                'oem': 3
            }
        ]

        for config in configs:
            try:
                output_base = os.path.splitext(image_path)[0]
                txt_path = f"{output_base}_config{configs.index(config)}.txt"

                cmd = [
                    'tesseract',
                    image_path,
                    output_base,
                    '-l', config['lang'],
                    '--oem', str(config['oem']),
                    '--psm', str(config['psm'])
                ]

                result = subprocess.run(cmd, capture_output=True, text=True)

                if result.returncode == 0 and os.path.exists(txt_path):
                    with open(txt_path, 'r', encoding='utf-8') as f:
                        text = f.read()

                    # Score based on Chinese characters and math symbols
                    chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
                    math_symbols = len(re.findall(r'[+\-×÷=＜＞≤≥]', text))
                    score = chinese_chars + math_symbols * 5

                    if score > best_score:
                        best_score = score
                        best_text = text

                    # Clean up
                    os.remove(txt_path)

            except Exception as e:
                continue

        return best_text

    def clean_and_structure_ocr_text(self, text):
        """Clean OCR text and identify math problems"""
        # Remove OCR artifacts
        text = re.sub(r'[^\u4e00-\u9fff\w\s+\-×÷=＜＞≤≥\(\)\[\]{}.,，。、:：;；!！?？]', '', text)
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'(\d)\s*([+\-×÷=＜＞≤≥])\s*(\d)', r'\1\2\3', text)

        return text.strip()

    def is_math_problem_section(self, text):
        """Check if text section contains math problems"""
        # Indicators of math problem sections
        indicators = [
            r'练习',
            r'习题',
            r'测试',
            r'计算',
            r'解题',
            r'应用题',
            r'选择题',
            r'填空题',
            r'判断题',
            r'解答题',
            r'\d+\s*[\.、]',
            r'[①②③④⑤⑥⑦⑧⑨⑩]'
        ]

        for indicator in indicators:
            if re.search(indicator, text):
                return True
        return False

    def extract_structured_problems(self, text, page_num, source_file):
        """Extract structured math problems from text"""
        problems = []

        # Split by common problem separators
        problem_sections = re.split(r'(?:\d+[\.、]|[①②③④⑤⑥⑦⑧⑨⑩]|练习|习题|测试)\s*', text)

        for i, section in enumerate(problem_sections[1:], 1):  # Skip first empty section
            section = section.strip()

            if len(section) > 10:  # Minimum viable problem length
                # Try to extract different parts of the problem
                problem = self.create_problem_struct(section, page_num, i, source_file)

                if problem['stem'] and self.is_valid_math_problem(problem['stem']):
                    problems.append(problem)

        return problems

    def create_problem_struct(self, text, page_num, problem_num, source_file):
        """Create a structured problem object"""
        problem = {
            "id": f"{Path(source_file).stem}_{page_num}_{problem_num}",
            "source": f"{source_file} (Page {page_num})",
            "stem": text,
            "taxonomy": "math",
            "steps": [],
            "transitions": [],
            "scoring": {"total": 5, "steps": []},
            "answer": self.extract_answer(text),
            "analysis": self.extract_analysis(text),
            "knowledgePoints": self.extract_knowledge_points(text),
            "difficulty": self.estimate_difficulty(text),
            "type": self.classify_problem_type(text),
            "gradeLevel": "4"
        }

        return problem

    def extract_answer(self, text):
        """Extract answer from problem text"""
        # Look for answer patterns
        answer_patterns = [
            r'答案[:：]\s*([^。]+)',
            r'答[:：]\s*([^。]+)',
            r'解[:：]\s*([^。]+)',
            r'得\s*([^。]+)'
        ]

        for pattern in answer_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip()

        return ""

    def extract_analysis(self, text):
        """Extract analysis/solution from problem text"""
        # Look for analysis patterns
        analysis_patterns = [
            r'解析[:：]\s*([^。]+)',
            r'分析[:：]\s*([^。]+)',
            r'思路[:：]\s*([^。]+)',
            r'解法[:：]\s*([^。]+)'
        ]

        for pattern in analysis_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip()

        return ""

    def extract_knowledge_points(self, text):
        """Extract knowledge points from problem text"""
        knowledge_points = []

        # Comprehensive topic mapping for 4th grade math
        topic_keywords = {
            "加法": "加法运算",
            "减法": "减法运算",
            "乘法": "乘法运算",
            "除法": "除法运算",
            "四则": "四则混合运算",
            "分数": "分数",
            "小数": "小数",
            "面积": "面积计算",
            "周长": "周长计算",
            "体积": "体积计算",
            "时间": "时间计算",
            "应用题": "应用题",
            "几何": "几何图形",
            "图形": "几何图形",
            "平均数": "平均数",
            "统计": "统计图表",
            "概率": "概率初步",
            "角度": "角度计算",
            "三角形": "三角形",
            "四边形": "四边形",
            "圆形": "圆形",
            "长方形": "长方形",
            "正方形": "正方形",
            "平行四边形": "平行四边形",
            "梯形": "梯形",
            "多位数": "多位数",
            "估算": "估算",
            "验算": "验算",
            "单位": "单位换算",
            "路程": "路程问题",
            "速度": "速度问题",
            "效率": "效率问题",
            "植树": "植树问题",
            "鸡兔": "鸡兔同笼",
            "和差": "和差问题",
            "和倍": "和倍问题",
            "差倍": "差倍问题",
            "年龄": "年龄问题",
            "盈亏": "盈亏问题"
        }

        for keyword, point in topic_keywords.items():
            if keyword in text:
                knowledge_points.append(point)

        return list(set(knowledge_points)) if knowledge_points else ["基础运算"]

    def estimate_difficulty(self, text):
        """Estimate problem difficulty"""
        # More sophisticated difficulty estimation
        difficulty_score = 0

        # Length factor
        difficulty_score += min(len(text) // 50, 3)

        # Complexity factors
        if any(word in text for word in ["应用题", "解决", "实际"]):
            difficulty_score += 2

        if any(word in text for word in ["分数", "小数", "面积", "体积"]):
            difficulty_score += 1

        if any(word in text for word in ["综合", "分析", "多种方法"]):
            difficulty_score += 2

        if difficulty_score >= 5:
            return "hard"
        elif difficulty_score >= 3:
            return "medium"
        else:
            return "easy"

    def classify_problem_type(self, text):
        """Classify problem type"""
        type_keywords = {
            "word_problem": ["应用题", "解决", "实际", "问题"],
            "multiple_choice": ["选择", "选项", "A.", "B.", "C.", "D."],
            "true_false": ["判断", "对错", "正确", "错误"],
            "fill_in_blank": ["填空", "括号", "横线"],
            "calculation": ["计算", "求", "算式", "得数"],
            "geometry": ["几何", "图形", "面积", "周长", "体积"],
            "measurement": ["单位", "长度", "重量", "时间"],
            "data_analysis": ["统计", "图表", "平均数"]
        }

        for problem_type, keywords in type_keywords.items():
            if any(keyword in text for keyword in keywords):
                return problem_type

        return "calculation"

    def is_valid_math_problem(self, text):
        """Validate if text is a genuine math problem"""
        # Must contain either math operations or math-related terms
        has_math = (
            re.search(r'\d+[\s]*[+\-×÷=＜＞≤≥][\s]*\d+', text) or  # Basic operations
            re.search(r'[一二三四五六七八九十百千万亿]+', text) or    # Chinese numbers
            any(word in text for word in ["计算", "求", "解", "练习", "题", "应用", "几何", "面积", "周长"])
        )

        # Must have reasonable length
        reasonable_length = 10 <= len(text) <= 1000

        return has_math and reasonable_length

    def process_pdf(self, pdf_path, start_page=0, max_pages=20):
        """Process a PDF file with improved OCR"""
        print(f"\nProcessing PDF: {pdf_path}")

        if not os.path.exists(pdf_path):
            print(f"File not found: {pdf_path}")
            return []

        # Convert PDF to images
        images = self.pdf_to_high_quality_images(pdf_path, start_page, max_pages)
        all_problems = []

        for page_num, image_path in images:
            print(f"Processing page {page_num}...")

            # Perform OCR with multiple configurations
            text = self.ocr_with_multiple_configs(image_path)

            if text:
                # Clean and structure text
                clean_text = self.clean_and_structure_ocr_text(text)

                if self.is_math_problem_section(clean_text):
                    # Extract structured problems
                    problems = self.extract_structured_problems(clean_text, page_num, pdf_path)
                    all_problems.extend(problems)
                    print(f"Found {len(problems)} problems on page {page_num}")
                else:
                    print(f"Page {page_num}: No math problem sections detected")
            else:
                print(f"No text extracted from page {page_num}")

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

    extractor = ImprovedMathProblemExtractor()
    all_problems = []

    try:
        for pdf_file in pdf_files:
            # Try different page ranges to find content pages
            for start_page in [0, 10, 20, 30]:
                problems = extractor.process_pdf(pdf_file, start_page=start_page, max_pages=10)
                all_problems.extend(problems)

                if len(problems) > 0:
                    print(f"Found {len(problems)} problems starting from page {start_page+1}")
                    break  # Stop if we found problems in this range
                else:
                    print(f"No problems found starting from page {start_page+1}")

        # Remove duplicates based on similar stems
        unique_problems = []
        seen_stems = set()

        for problem in all_problems:
            stem_normalized = re.sub(r'\s+', ' ', problem['stem']).strip()[:50]
            if stem_normalized not in seen_stems and len(problem['stem']) > 20:
                unique_problems.append(problem)
                seen_stems.add(stem_normalized)

        # Save results
        output_file = "/Users/tywg001/Downloads/mathlearning/final_extracted_problems.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(unique_problems, f, ensure_ascii=False, indent=2)

        print(f"\n=== FINAL EXTRACTION RESULTS ===")
        print(f"Total unique problems extracted: {len(unique_problems)}")
        print(f"Results saved to: {output_file}")

        # Print detailed summary
        print(f"\n=== PROBLEM SUMMARY ===")
        by_type = {}
        by_difficulty = {}
        by_knowledge = {}

        for problem in unique_problems:
            # Count by type
            ptype = problem.get('type', 'unknown')
            by_type[ptype] = by_type.get(ptype, 0) + 1

            # Count by difficulty
            diff = problem.get('difficulty', 'unknown')
            by_difficulty[diff] = by_difficulty.get(diff, 0) + 1

            # Count by knowledge points
            for kp in problem.get('knowledgePoints', []):
                by_knowledge[kp] = by_knowledge.get(kp, 0) + 1

        print(f"\nBy Type: {by_type}")
        print(f"By Difficulty: {by_difficulty}")
        print(f"By Knowledge Points: {dict(list(by_knowledge.items())[:10])}")  # Top 10

        # Show sample problems
        print(f"\n=== SAMPLE PROBLEMS ===")
        for i, problem in enumerate(unique_problems[:3], 1):
            print(f"\nProblem {i}:")
            print(f"  ID: {problem.get('id', 'N/A')}")
            print(f"  Type: {problem.get('type', 'N/A')}")
            print(f"  Difficulty: {problem.get('difficulty', 'N/A')}")
            print(f"  Knowledge Points: {problem.get('knowledgePoints', [])}")
            print(f"  Stem: {problem.get('stem', 'N/A')[:300]}...")

    finally:
        extractor.cleanup()

if __name__ == "__main__":
    main()