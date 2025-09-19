#!/usr/bin/env python3
"""
Format and clean extracted problems to match system structure
"""

import json
import re
from pathlib import Path

def clean_problem_text(text):
    """Clean and format problem text"""
    # Remove common OCR artifacts
    text = re.sub(r'[\u3000\u200b\u200c\u200d\u2060]', ' ', text)  # Remove various spaces
    text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
    text = re.sub(r'[FfBe]', '', text)  # Remove common OCR artifacts
    text = re.sub(r'[，,]{2,}', '，', text)  # Remove repeated commas
    text = re.sub(r'[。.]{2,}', '。', text)  # Remove repeated periods

    # Fix common Chinese math OCR errors
    text = re.sub(r'(\d+)\s*[xX]\s*(\d+)', r'\1 × \2', text)  # Fix multiplication
    text = re.sub(r'(\d+)\s*[/÷]\s*(\d+)', r'\1 ÷ \2', text)  # Fix division
    text = re.sub(r'克赤', '千克', text)  # Fix weight unit
    text = re.sub(r'Be', '克', text)  # Fix gram unit
    text = re.sub(r'F', '', text)  # Remove stray characters

    # Fix parentheses
    text = re.sub(r'\(\s*\)', '( )', text)
    text = re.sub(r'(\(\s*[^)]*\s*\))', lambda m: m.group(1).strip(), text)

    return text.strip()

def format_problem_structure(problem):
    """Format problem to match system structure"""
    # Clean the stem
    stem = clean_problem_text(problem.get('stem', ''))

    # Determine problem type based on content
    taxonomy = "数学应用题"
    if any(keyword in stem for keyword in ["计算", "算式", "×", "÷"]):
        taxonomy = "计算题"
    elif any(keyword in stem for keyword in ["选择", "判断"]):
        taxonomy = "选择题"
    elif any(keyword in stem for keyword in ["应用", "实际", "生活"]):
        taxonomy = "应用题"
    elif "填空" in stem:
        taxonomy = "填空题"

    # Enhanced knowledge points
    knowledge_points = ["数学思维训练"]
    if any(keyword in stem for keyword in ["加法", "减法", "加", "减"]):
        knowledge_points.append("加减运算")
    if any(keyword in stem for keyword in ["乘法", "除法", "×", "÷"]):
        knowledge_points.append("乘除运算")
    if any(keyword in stem for keyword in ["面积", "周长", "图形", "几何"]):
        knowledge_points.append("几何图形")
    if any(keyword in stem for keyword in ["时间", "分钟", "小时", "秒"]):
        knowledge_points.append("时间问题")
    if any(keyword in stem for keyword in ["千克", "克", "米", "厘米", "长度", "重量"]):
        knowledge_points.append("计量单位")
    if any(keyword in stem for keyword in ["计算器", "计算"]):
        knowledge_points.append("计算工具使用")
    if any(keyword in stem for keyword in ["规律", "模式", "序列"]):
        knowledge_points.append("规律探索")

    # Determine difficulty based on content complexity
    difficulty = "medium"
    stem_length = len(stem)
    if stem_length > 200 or any(keyword in stem for keyword in ["亿", "万", "规律", "模式"]):
        difficulty = "hard"
    elif stem_length < 50 or all(keyword not in stem for keyword in ["应用", "计算", "选择"]):
        difficulty = "easy"

    # Create steps based on problem type
    steps = []
    if "计算" in stem:
        steps = ["理解计算要求", "确定计算方法", "进行计算", "检查计算结果"]
    elif "应用" in stem or "实际" in stem:
        steps = ["理解应用场景", "分析已知条件", "建立数学模型", "进行计算求解", "验证答案合理性"]
    else:
        steps = ["理解题目要求", "分析已知条件", "选择解题方法", "进行计算求解", "验证答案合理性"]

    # Create scoring
    scoring = {"total": 5, "steps": []}
    if difficulty == "hard":
        scoring["total"] = 8
    elif difficulty == "easy":
        scoring["total"] = 3

    # Add step scores
    step_score = scoring["total"] // len(steps)
    for i, step in enumerate(steps):
        scoring["steps"].append({
            "step": step,
            "score": step_score if i < len(steps) - 1 else step_score + (scoring["total"] - step_score * len(steps))
        })

    return {
        "stem": stem,
        "taxonomy": taxonomy,
        "steps": steps,
        "transitions": [
            "理解题目要求",
            "分析已知条件",
            "选择解题方法",
            "进行计算求解",
            "验证答案合理性"
        ],
        "scoring": scoring,
        "answer": problem.get("answer", ""),
        "analysis": problem.get("analysis", ""),
        "knowledgePoints": list(set(knowledge_points)),
        "difficulty": difficulty,
        "gradeLevel": "小学四年级",
        "source": problem.get("source", ""),
        "id": problem.get("id", ""),
        "extraction_method": problem.get("extraction_method", "ocr_formatted")
    }

def main():
    # Load the extracted problems
    input_file = "/Users/tywg001/Downloads/mathlearning/comprehensive_extracted_problems.json"
    with open(input_file, 'r', encoding='utf-8') as f:
        problems = json.load(f)

    print(f"Loaded {len(problems)} problems for formatting")

    # Format each problem
    formatted_problems = []
    for i, problem in enumerate(problems):
        try:
            formatted = format_problem_structure(problem)
            formatted_problems.append(formatted)
        except Exception as e:
            print(f"Error formatting problem {i}: {e}")

    print(f"Formatted {len(formatted_problems)} problems")

    # Save formatted problems
    output_file = "/Users/tywg001/Downloads/mathlearning/formatted_extracted_problems.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(formatted_problems, f, ensure_ascii=False, indent=2)

    # Load existing problems for comparison
    try:
        with open("/Users/tywg001/Downloads/mathlearning/cleaned_math_problems.json", 'r', encoding='utf-8') as f:
            existing_problems = json.load(f)
    except:
        existing_problems = []

    print(f"Existing problems: {len(existing_problems)}")
    print(f"New formatted problems: {len(formatted_problems)}")

    # Find unique problems
    unique_problems = []
    for new_problem in formatted_problems:
        is_unique = True
        new_stem = new_problem.get("stem", "")

        # Check against existing problems
        for existing_problem in existing_problems:
            existing_stem = existing_problem.get("stem", "")
            # Simple similarity check
            if (len(new_stem) > 20 and len(existing_stem) > 20 and
                any(keyword in new_stem for keyword in existing_stem.split()[:5])):
                is_unique = False
                break

        if is_unique and len(new_stem) > 20:  # Only add meaningful problems
            unique_problems.append(new_problem)

    print(f"Found {len(unique_problems)} unique problems")

    # Save unique problems
    unique_file = "/Users/tywg001/Downloads/mathlearning/unique_formatted_problems.json"
    with open(unique_file, 'w', encoding='utf-8') as f:
        json.dump(unique_problems, f, ensure_ascii=False, indent=2)

    # Create comprehensive comparison
    comparison = {
        "extraction_method": "comprehensive_ocr_enhanced",
        "total_extracted": len(formatted_problems),
        "unique_problems": len(unique_problems),
        "quality_metrics": {
            "avg_stem_length": sum(len(p.get("stem", "")) for p in formatted_problems) / len(formatted_problems),
            "problems_with_answers": sum(1 for p in formatted_problems if p.get("answer")),
            "problems_with_analysis": sum(1 for p in formatted_problems if p.get("analysis")),
            "difficulty_distribution": {
                "easy": sum(1 for p in formatted_problems if p.get("difficulty") == "easy"),
                "medium": sum(1 for p in formatted_problems if p.get("difficulty") == "medium"),
                "hard": sum(1 for p in formatted_problems if p.get("difficulty") == "hard")
            },
            "taxonomy_distribution": {}
        },
        "extraction_quality": "enhanced_ocr_with_formatting"
    }

    # Calculate taxonomy distribution
    for problem in formatted_problems:
        taxonomy = problem.get("taxonomy", "未知")
        if taxonomy not in comparison["quality_metrics"]["taxonomy_distribution"]:
            comparison["quality_metrics"]["taxonomy_distribution"][taxonomy] = 0
        comparison["quality_metrics"]["taxonomy_distribution"][taxonomy] += 1

    # Save comparison
    comparison_file = "/Users/tywg001/Downloads/mathlearning/enhanced_extraction_summary.json"
    with open(comparison_file, 'w', encoding='utf-8') as f:
        json.dump(comparison, f, ensure_ascii=False, indent=2)

    # Display summary
    print(f"\n{'='*80}")
    print("EXTRACTION SUMMARY")
    print(f"{'='*80}")
    print(f"Total formatted problems: {len(formatted_problems)}")
    print(f"Unique problems: {len(unique_problems)}")
    print(f"Average stem length: {comparison['quality_metrics']['avg_stem_length']:.1f}")
    print(f"Problems with answers: {comparison['quality_metrics']['problems_with_answers']}")
    print(f"Problems with analysis: {comparison['quality_metrics']['problems_with_analysis']}")

    print(f"\nDifficulty distribution:")
    for diff, count in comparison["quality_metrics"]["difficulty_distribution"].items():
        print(f"  {diff}: {count}")

    print(f"\nTaxonomy distribution:")
    for tax, count in comparison["quality_metrics"]["taxonomy_distribution"].items():
        print(f"  {tax}: {count}")

    print(f"\nFiles created:")
    print(f"  {output_file} - All formatted problems")
    print(f"  {unique_file} - Unique problems only")
    print(f"  {comparison_file} - Extraction summary")

    # Show sample problems
    print(f"\n{'='*80}")
    print("SAMPLE FORMATTED PROBLEMS")
    print(f"{'='*80}")
    for i, problem in enumerate(formatted_problems[:3], 1):
        print(f"\nProblem {i}:")
        print(f"  ID: {problem.get('id', 'N/A')}")
        print(f"  Taxonomy: {problem.get('taxonomy', 'N/A')}")
        print(f"  Difficulty: {problem.get('difficulty', 'N/A')}")
        print(f"  Knowledge Points: {problem.get('knowledgePoints', [])}")
        print(f"  Steps: {problem.get('steps', [])}")
        print(f"  Stem: {problem.get('stem', 'N/A')[:150]}...")

if __name__ == "__main__":
    main()