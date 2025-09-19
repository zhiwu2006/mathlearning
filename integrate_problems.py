#!/usr/bin/env python3
"""
Integrate extracted OCR problems into the existing math learning system
"""

import json
import os
from pathlib import Path

class ProblemIntegrator:
    def __init__(self):
        self.integration_stats = {
            'extracted_problems': 0,
            'existing_problems': 0,
            'final_total': 0,
            'quality_issues': 0
        }

    def load_existing_problems(self):
        """Load existing problems from the system"""
        existing_files = [
            "/Users/tywg001/Downloads/mathlearning/data/math_problems.json",
            "/Users/tywg001/Downloads/mathlearning/examples/math_problems.json"
        ]

        existing_problems = []
        for file_path in existing_files:
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        problems = json.load(f)
                        existing_problems.extend(problems)
                        print(f"Loaded {len(problems)} problems from {file_path}")
                except Exception as e:
                    print(f"Error loading {file_path}: {e}")

        return existing_problems

    def load_extracted_problems(self):
        """Load cleaned OCR problems"""
        extracted_file = "/Users/tywg001/Downloads/mathlearning/cleaned_math_problems.json"

        if not os.path.exists(extracted_file):
            print(f"Extracted problems file not found: {extracted_file}")
            return []

        try:
            with open(extracted_file, 'r', encoding='utf-8') as f:
                problems = json.load(f)
                print(f"Loaded {len(problems)} extracted problems")
                return problems
        except Exception as e:
            print(f"Error loading extracted problems: {e}")
            return []

    def quality_filter(self, problems):
        """Filter problems based on quality"""
        quality_problems = []

        for problem in problems:
            stem = problem.get('stem', '')
            stem_length = len(stem.strip())

            # Quality criteria
            if (stem_length >= 15 and stem_length <= 500 and
                any(char.isdigit() for char in stem) and
                not any(word in stem.lower() for word in ['微信', '关注', '资料', '获取'])):
                quality_problems.append(problem)
            else:
                self.integration_stats['quality_issues'] += 1

        return quality_problems

    def enhance_extracted_problems(self, problems):
        """Enhance extracted problems with better metadata"""
        enhanced = []

        for i, problem in enumerate(problems):
            # Generate better ID
            problem['id'] = f"ocr_extracted_{i+1:03d}"

            # Ensure required fields
            problem.setdefault('taxonomy', 'math')
            problem.setdefault('gradeLevel', '4')
            problem.setdefault('subject', 'mathematics')
            problem.setdefault('source', 'OCR extracted from math textbooks')
            problem.setdefault('version', '1.0')

            # Validate and fix steps
            if not problem.get('steps') or len(problem['steps']) == 0:
                problem['steps'] = [
                    "理解题目要求",
                    "确定解题方法",
                    "进行计算或推理",
                    "检查验证结果"
                ]

            # Validate scoring
            if not problem.get('scoring'):
                problem['scoring'] = {
                    "total": 5,
                    "steps": [1, 1, 2, 1]
                }

            # Add metadata
            problem['extraction_method'] = 'OCR'
            problem['confidence_score'] = self.calculate_confidence_score(problem)

            enhanced.append(problem)

        return enhanced

    def calculate_confidence_score(self, problem):
        """Calculate confidence score for OCR extracted problem"""
        score = 50  # Base score

        stem = problem.get('stem', '')

        # Add points for math content
        if any(op in stem for op in ['+', '-', '×', '÷', '=']):
            score += 20

        # Add points for Chinese content
        if any('\u4e00' <= char <= '\u9fff' for char in stem):
            score += 15

        # Add points for reasonable length
        if 20 <= len(stem) <= 300:
            score += 10

        # Deduct for potential OCR artifacts
        if any(word in stem for word in ['www', 'http', 'com']):
            score -= 30

        return min(max(score, 0), 100)

    def merge_problem_sets(self, existing_problems, extracted_problems):
        """Merge existing and extracted problems"""
        # Remove duplicates based on similar stems
        merged = existing_problems.copy()
        seen_stems = set()

        # Add existing problems to seen stems
        for problem in existing_problems:
            stem_key = self.normalize_stem(problem.get('stem', ''))
            seen_stems.add(stem_key)

        # Add unique extracted problems
        for problem in extracted_problems:
            stem_key = self.normalize_stem(problem.get('stem', ''))
            if stem_key not in seen_stems:
                merged.append(problem)
                seen_stems.add(stem_key)

        return merged

    def normalize_stem(self, stem):
        """Normalize problem stem for comparison"""
        # Remove extra spaces and normalize characters
        stem = ' '.join(stem.split())
        # Remove common prefixes/suffixes that might vary
        stem = stem.strip()
        return stem.lower()[:100]  # First 100 chars for comparison

    def save_final_problem_set(self, problems):
        """Save the final integrated problem set"""
        output_files = [
            "/Users/tywg001/Downloads/mathlearning/data/integrated_math_problems.json",
            "/Users/tywg001/Downloads/mathlearning/examples/integrated_math_problems.json"
        ]

        for output_file in output_files:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(output_file), exist_ok=True)

            try:
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(problems, f, ensure_ascii=False, indent=2)
                print(f"Saved {len(problems)} problems to {output_file}")
            except Exception as e:
                print(f"Error saving to {output_file}: {e}")

    def generate_integration_report(self):
        """Generate integration report"""
        report = f"""
=== MATH PROBLEM INTEGRATION REPORT ===

Integration Summary:
- Existing problems in system: {self.integration_stats['existing_problems']}
- Problems extracted from PDFs: {self.integration_stats['extracted_problems']}
- Quality issues filtered out: {self.integration_stats['quality_issues']}
- Final total problems: {self.integration_stats['final_total']}

Processing Details:
1. Loaded existing problems from system files
2. Applied quality filtering to OCR-extracted problems
3. Enhanced problem metadata and structure
4. Removed duplicates between existing and extracted sets
5. Generated final integrated problem database

Enhancement Features:
- Added confidence scores for OCR-extracted problems
- Standardized problem structure (steps, scoring, analysis)
- Improved categorization and metadata
- Quality filtering to ensure problem validity

Output Files:
- /data/integrated_math_problems.json (main database)
- /examples/integrated_math_problems.json (backup copy)

Success Rate: {((self.integration_stats['final_total'] - self.integration_stats['existing_problems']) / max(self.integration_stats['extracted_problems'], 1)) * 100:.1f}% of extracted problems were successfully integrated.
"""
        return report

    def run_integration(self):
        """Run the complete integration process"""
        print("Starting math problem integration...")

        # Load existing problems
        existing_problems = self.load_existing_problems()
        self.integration_stats['existing_problems'] = len(existing_problems)

        # Load extracted problems
        extracted_problems = self.load_extracted_problems()
        self.integration_stats['extracted_problems'] = len(extracted_problems)

        # Quality filtering
        quality_extracted = self.quality_filter(extracted_problems)

        # Enhance extracted problems
        enhanced_extracted = self.enhance_extracted_problems(quality_extracted)

        # Merge problem sets
        final_problems = self.merge_problem_sets(existing_problems, enhanced_extracted)
        self.integration_stats['final_total'] = len(final_problems)

        # Save final set
        self.save_final_problem_set(final_problems)

        # Generate report
        report = self.generate_integration_report()
        print(report)

        # Save report
        report_file = "/Users/tywg001/Downloads/mathlearning/integration_report.txt"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)

        print(f"Integration complete! Report saved to: {report_file}")

        return final_problems

def main():
    integrator = ProblemIntegrator()
    final_problems = integrator.run_integration()

    # Show sample of final problem set
    print(f"\n=== SAMPLE FINAL PROBLEMS ===")
    for i, problem in enumerate(final_problems[:5], 1):
        print(f"\n{i}. {problem.get('id', 'N/A')}")
        print(f"   Type: {problem.get('type', 'N/A')}")
        print(f"   Difficulty: {problem.get('difficulty', 'N/A')}")
        print(f"   Confidence: {problem.get('confidence_score', 'N/A')}%")
        print(f"   Stem: {problem.get('stem', 'N/A')[:100]}...")

    # Final statistics
    total = len(final_problems)
    ocr_count = sum(1 for p in final_problems if p.get('extraction_method') == 'OCR')
    print(f"\n=== FINAL STATISTICS ===")
    print(f"Total problems: {total}")
    print(f"OCR-extracted: {ocr_count}")
    print(f"Existing: {total - ocr_count}")
    print(f"Net increase: {ocr_count} problems added")

if __name__ == "__main__":
    main()