#!/usr/bin/env python3
"""
Clean and format extracted OCR problems for the math learning system
"""

import json
import re
from pathlib import Path

class ProblemCleaner:
    def __init__(self):
        self.cleaning_stats = {
            'total_problems': 0,
            'valid_problems': 0,
            'cleaned_problems': 0,
            'rejected_problems': 0
        }

    def clean_ocr_text(self, text):
        """Clean OCR artifacts from text"""
        if not text:
            return ""

        # Remove common OCR artifacts
        text = re.sub(r'[^\u4e00-\u9fff\w\s+\-×÷=＜＞≤≥\(\)\[\]{}.,，。、:：;；!！?？\d]', '', text)

        # Fix common OCR errors
        text = re.sub(r'pp\s+', '', text)  # Remove page markers
        text = re.sub(r'www\b', '', text)  # Remove www
        text = re.sub(r'关注微信[^。]+', '', text)  # Remove WeChat ads
        text = re.sub(r'[FSFJBARROB+ecee]+', '', text)  # Remove garbled text
        text = re.sub(r'[0-9]{3,}\s*', '', text)  # Remove random 3+ digit numbers that might be page numbers

        # Fix spacing around math symbols
        text = re.sub(r'(\d)\s*([+\-×÷=＜＞≤≥])\s*(\d)', r'\1 \2 \3', text)
        text = re.sub(r'\s+', ' ', text).strip()

        return text

    def extract_actual_problem(self, text):
        """Extract the actual math problem from OCR text"""
        if not text:
            return ""

        # Look for specific math problem patterns
        problem_patterns = [
            # Numbered problems
            r'(?:\d+\.|[①②③④⑤⑥⑦⑧⑨⑩])\s*([^。\n]+)',
            # Calculation problems
            r'(?:计算|求|解)\s*([^\n]+)',
            # Word problems
            r'(?:应用题|解决问题)\s*([^\n]+(?:\n[^\n]+){0,3})',
            # Simple math expressions
            r'(\d+\s*[+\-×÷]\s*\d+(?:\s*[+\-×÷]\s*\d+)*)',
        ]

        for pattern in problem_patterns:
            match = re.search(pattern, text)
            if match:
                problem = match.group(1).strip()
                if len(problem) >= 10:  # Minimum length
                    return problem

        # If no specific pattern found, return the first reasonable portion
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if len(line) >= 10 and any(char in line for char in '0123456789+-×÷='):
                return line

        return text[:200]  # Return first 200 chars as fallback

    def is_valid_math_problem(self, text):
        """Validate if cleaned text is a proper math problem"""
        if len(text) < 10 or len(text) > 800:
            return False

        # Must contain math-related content
        must_contain = [
            r'\d+[\s]*[+\-×÷=＜＞≤≥][\s]*\d+',  # Math operations
            r'[计算求解应用题几何面积周长体积]',  # Math keywords
        ]

        return any(re.search(pattern, text) for pattern in must_contain)

    def enhance_problem_structure(self, problem):
        """Enhance problem with better structure"""
        stem = self.clean_ocr_text(problem['stem'])
        actual_stem = self.extract_actual_problem(stem)

        if not self.is_valid_math_problem(actual_stem):
            return None

        # Create cleaned problem
        cleaned_problem = {
            "id": problem['id'],
            "source": problem['source'],
            "stem": actual_stem,
            "taxonomy": "math",
            "steps": self.generate_steps(actual_stem),
            "transitions": self.generate_transitions(),
            "scoring": self.generate_scoring(),
            "answer": self.extract_answer(actual_stem),
            "analysis": self.generate_analysis(actual_stem),
            "knowledgePoints": problem.get('knowledgePoints', ['基础运算']),
            "difficulty": self.assess_difficulty(actual_stem),
            "type": problem.get('type', 'calculation'),
            "gradeLevel": "4"
        }

        return cleaned_problem

    def generate_steps(self, stem):
        """Generate solution steps based on problem type"""
        if "计算" in stem or any(op in stem for op in ['+', '-', '×', '÷']):
            return [
                "理解题目要求",
                "确定运算顺序",
                "进行计算",
                "检查结果"
            ]
        elif "应用题" in stem or "解决" in stem:
            return [
                "理解题意",
                "找出已知条件和问题",
                "选择解题方法",
                "列式计算",
                "检验答案"
            ]
        else:
            return [
                "分析题目",
                "确定解题思路",
                "进行解答",
                "验证结果"
            ]

    def generate_transitions(self):
        """Generate transitions between steps"""
        return [
            "首先，我们需要仔细阅读题目，理解题目的要求。",
            "接下来，根据题目特点选择合适的解题方法。",
            "然后，按照步骤进行计算或推理。",
            "最后，检查答案是否合理和正确。"
        ]

    def generate_scoring(self):
        """Generate scoring structure"""
        return {
            "total": 5,
            "steps": [1, 1, 2, 1]  # Points for each step
        }

    def extract_answer(self, stem):
        """Extract or generate answer"""
        # Look for explicit answers
        answer_match = re.search(r'答案[:：]\s*([^。]+)', stem)
        if answer_match:
            return answer_match.group(1).strip()

        # For simple calculations, we could compute the answer
        # For now, return placeholder
        return "需要根据具体计算得出"

    def generate_analysis(self, stem):
        """Generate problem analysis"""
        analysis_templates = [
            "本题考查了基本的数学运算能力，需要仔细理解题目要求。",
            "解题关键在于理解题意，选择正确的计算方法。",
            "这类题目有助于培养学生的逻辑思维和计算能力。",
            "通过练习此类题目，可以提高学生解决实际问题的能力。"
        ]

        # Choose analysis based on problem type
        if "计算" in stem:
            return analysis_templates[0]
        elif "应用题" in stem:
            return analysis_templates[1]
        else:
            return analysis_templates[2]

    def assess_difficulty(self, stem):
        """Re-assess difficulty based on cleaned content"""
        length = len(stem)
        complexity = 0

        # Length factor
        if length > 100:
            complexity += 2
        elif length > 50:
            complexity += 1

        # Content complexity
        if any(word in stem for word in ["应用题", "综合", "解决"]):
            complexity += 2
        elif any(word in stem for word in ["分数", "小数", "面积"]):
            complexity += 1

        if complexity >= 3:
            return "hard"
        elif complexity >= 1:
            return "medium"
        else:
            return "easy"

    def clean_and_validate_problems(self, input_file, output_file):
        """Main cleaning and validation process"""
        # Load extracted problems
        with open(input_file, 'r', encoding='utf-8') as f:
            problems = json.load(f)

        self.cleaning_stats['total_problems'] = len(problems)

        cleaned_problems = []

        for problem in problems:
            enhanced = self.enhance_problem_structure(problem)
            if enhanced:
                cleaned_problems.append(enhanced)
                self.cleaning_stats['cleaned_problems'] += 1
            else:
                self.cleaning_stats['rejected_problems'] += 1

        self.cleaning_stats['valid_problems'] = len(cleaned_problems)

        # Save cleaned problems
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(cleaned_problems, f, ensure_ascii=False, indent=2)

        return cleaned_problems

    def generate_summary_report(self):
        """Generate cleaning summary report"""
        report = f"""
=== PDF EXTRACTION AND CLEANING SUMMARY ===

Original Extraction:
- Total problems extracted: {self.cleaning_stats['total_problems']}

Cleaning Results:
- Valid problems after cleaning: {self.cleaning_stats['valid_problems']}
- Problems rejected: {self.cleaning_stats['rejected_problems']}
- Success rate: {self.cleaning_stats['valid_problems']/self.cleaning_stats['total_problems']*100:.1f}%

Source Files Processed:
1. 一本数学思维训练四年级.pdf
2. 学霸提优大试卷四年级上册数学人教版.pdf

Processing Details:
- Used OCR (Tesseract) with Chinese language support
- Targeted pages most likely to contain math problems
- Applied multiple cleaning and validation steps
- Enhanced problem structure for learning system compatibility

Output:
- Cleaned problems saved in JSON format
- Each problem includes: stem, steps, transitions, scoring, analysis
- Problems categorized by type, difficulty, and knowledge points
"""
        return report

def main():
    cleaner = ProblemCleaner()

    input_file = "/Users/tywg001/Downloads/mathlearning/targeted_extracted_problems.json"
    output_file = "/Users/tywg001/Downloads/mathlearning/cleaned_math_problems.json"

    print("Cleaning and formatting extracted math problems...")
    cleaned_problems = cleaner.clean_and_validate_problems(input_file, output_file)

    # Generate summary
    summary = cleaner.generate_summary_report()
    print(summary)

    # Save summary
    summary_file = "/Users/tywg001/Downloads/mathlearning/extraction_summary.txt"
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write(summary)

    print(f"\nCleaned problems saved to: {output_file}")
    print(f"Summary report saved to: {summary_file}")

    # Show sample cleaned problems
    print(f"\n=== SAMPLE CLEANED PROBLEMS ===")
    for i, problem in enumerate(cleaned_problems[:3], 1):
        print(f"\n{i}. {problem['id']}")
        print(f"   Type: {problem['type']}, Difficulty: {problem['difficulty']}")
        print(f"   Knowledge Points: {problem['knowledgePoints']}")
        print(f"   Stem: {problem['stem']}")
        print(f"   Steps: {problem['steps'][:2]}...")  # First 2 steps

    # Statistics
    type_counts = {}
    diff_counts = {}
    for problem in cleaned_problems:
        ptype = problem['type']
        diff = problem['difficulty']
        type_counts[ptype] = type_counts.get(ptype, 0) + 1
        diff_counts[diff] = diff_counts.get(diff, 0) + 1

    print(f"\n=== FINAL STATISTICS ===")
    print(f"By Type: {type_counts}")
    print(f"By Difficulty: {diff_counts}")

if __name__ == "__main__":
    main()