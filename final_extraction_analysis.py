#!/usr/bin/env python3
"""
Final analysis of PDF extraction methods and results
"""

import json
import os
from pathlib import Path

def load_json_file(file_path):
    """Load JSON file with error handling"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return []

def analyze_problems(problems, method_name):
    """Analyze a set of problems"""
    if not problems:
        return {
            "method": method_name,
            "count": 0,
            "avg_stem_length": 0,
            "with_answers": 0,
            "with_analysis": 0,
            "difficulty_dist": {},
            "taxonomy_dist": {},
            "knowledge_points": []
        }

    analysis = {
        "method": method_name,
        "count": len(problems),
        "avg_stem_length": sum(len(p.get("stem", "")) for p in problems) / len(problems),
        "with_answers": sum(1 for p in problems if p.get("answer")),
        "with_analysis": sum(1 for p in problems if p.get("analysis")),
        "difficulty_dist": {},
        "taxonomy_dist": {},
        "knowledge_points": set()
    }

    # Analyze difficulty distribution
    for p in problems:
        diff = p.get("difficulty", "unknown")
        analysis["difficulty_dist"][diff] = analysis["difficulty_dist"].get(diff, 0) + 1

    # Analyze taxonomy distribution
    for p in problems:
        tax = p.get("taxonomy", "unknown")
        analysis["taxonomy_dist"][tax] = analysis["taxonomy_dist"].get(tax, 0) + 1

    # Collect knowledge points
    for p in problems:
        kps = p.get("knowledgePoints", [])
        analysis["knowledge_points"].update(kps)

    analysis["knowledge_points"] = list(analysis["knowledge_points"])

    return analysis

def create_comprehensive_report():
    """Create comprehensive extraction report"""
    print("Creating comprehensive extraction analysis report...")

    # Load all extracted problem sets
    files_to_analyze = [
        ("Original OCR", "/Users/tywg001/Downloads/mathlearning/extracted_problems_ocr.json"),
        ("Enhanced OCR", "/Users/tywg001/Downloads/mathlearning/formatted_extracted_problems.json"),
        ("Existing Clean", "/Users/tywg001/Downloads/mathlearning/cleaned_math_problems.json"),
        ("Targeted OCR", "/Users/tywg001/Downloads/mathlearning/targeted_extracted_problems.json")
    ]

    analyses = {}
    for name, file_path in files_to_analyze:
        if os.path.exists(file_path):
            problems = load_json_file(file_path)
            analyses[name] = analyze_problems(problems, name)
            print(f"Loaded {len(problems)} problems from {name}")
        else:
            print(f"File not found: {file_path}")

    # Create comparison report
    report = {
        "extraction_summary": {
            "methods_tested": list(analyses.keys()),
            "total_methods": len(analyses),
            "pdf_files_processed": [
                "第二十二届华罗庚金杯少年数学邀请赛 决赛试题参考答案 （小学中年级组）.pdf",
                "一本数学思维训练四年级.pdf",
                "学霸提优大试卷四年级上册数学人教版.pdf"
            ],
            "extraction_methods_used": [
                "Standard PDF text extraction",
                "OCR with PyMuPDF and Tesseract",
                "Enhanced formatting and cleaning",
                "Comprehensive processing pipeline"
            ]
        },
        "method_comparisons": analyses,
        "quality_assessment": {},
        "recommendations": {}
    }

    # Quality assessment
    best_method = max(analyses.items(), key=lambda x: x[1]["count"] if x[1]["count"] > 0 else 0)
    report["quality_assessment"]["best_method"] = best_method[0]
    report["quality_assessment"]["best_method_stats"] = best_method[1]

    # Find method with best average stem length (indicating better extraction)
    best_content = max(analyses.items(), key=lambda x: x[1]["avg_stem_length"] if x[1]["count"] > 0 else 0)
    report["quality_assessment"]["best_content_quality"] = best_content[0]
    report["quality_assessment"]["best_content_stats"] = best_content[1]

    # Recommendations
    report["recommendations"] = {
        "for_scanned_pdfs": "Use OCR with PyMuPDF and Tesseract for Chinese math content",
        "for_text_pdfs": "Use standard text extraction with enhanced formatting",
        "best_approach": "Combined approach with automatic detection of PDF type",
        "quality_improvements": [
            "Enhanced OCR preprocessing for better Chinese character recognition",
            "Advanced formatting to match system structure",
            "Better knowledge point categorization",
            "Improved difficulty assessment based on content complexity"
        ],
        "future_improvements": [
            "Integration with markitdown MCP for markdown conversion",
            "Better OCR post-processing to fix common recognition errors",
            "Automated duplicate detection and merging",
            "Enhanced knowledge point extraction using NLP"
        ]
    }

    # Save report
    report_file = "/Users/tywg001/Downloads/mathlearning/final_extraction_report.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    # Create human-readable summary
    summary = create_human_readable_summary(analyses, report)
    summary_file = "/Users/tywg001/Downloads/mathlearning/EXTRACTION_SUMMARY.md"
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write(summary)

    return report, summary

def create_human_readable_summary(analyses, report):
    """Create human-readable summary"""
    summary = f"""# PDF Extraction Analysis Summary

## Overview
This report summarizes the analysis of different PDF extraction methods for math problems from elementary school math textbooks and workbooks.

## Files Processed
- **华罗庚金杯少年数学邀请赛**: Math competition answer key (text-based PDF)
- **一本数学思维训练四年级**: Math thinking training for 4th grade (scanned PDF)
- **学霸提优大试卷**: Excellence test papers for 4th grade (scanned PDF)

## Extraction Methods Compared

### 1. Original OCR
- **Method**: Basic OCR extraction
- **Problems**: {analyses.get('Original OCR', {}).get('count', 0)}
- **Avg Stem Length**: {analyses.get('Original OCR', {}).get('avg_stem_length', 0):.1f}
- **With Answers**: {analyses.get('Original OCR', {}).get('with_answers', 0)}
- **With Analysis**: {analyses.get('Original OCR', {}).get('with_analysis', 0)}

### 2. Enhanced OCR (This Method)
- **Method**: Enhanced OCR with PyMuPDF + Tesseract + formatting
- **Problems**: {analyses.get('Enhanced OCR', {}).get('count', 0)}
- **Avg Stem Length**: {analyses.get('Enhanced OCR', {}).get('avg_stem_length', 0):.1f}
- **With Answers**: {analyses.get('Enhanced OCR', {}).get('with_answers', 0)}
- **With Analysis**: {analyses.get('Enhanced OCR', {}).get('with_analysis', 0)}

### 3. Existing Clean Problems
- **Method**: Previously cleaned and formatted problems
- **Problems**: {analyses.get('Existing Clean', {}).get('count', 0)}
- **Avg Stem Length**: {analyses.get('Existing Clean', {}).get('avg_stem_length', 0):.1f}
- **With Answers**: {analyses.get('Existing Clean', {}).get('with_answers', 0)}
- **With Analysis**: {analyses.get('Existing Clean', {}).get('with_analysis', 0)}

## Quality Assessment

### Best Method for Content Quality
- **Method**: {report['quality_assessment']['best_content_quality']}
- **Average Stem Length**: {report['quality_assessment']['best_content_stats']['avg_stem_length']:.1f} characters

### Best Method for Volume
- **Method**: {report['quality_assessment']['best_method']}
- **Total Problems**: {report['quality_assessment']['best_method_stats']['count']}

## Key Findings

1. **PDF Type Matters**: Text-based PDFs (like answer keys) extract differently than scanned documents
2. **OCR Quality**: Scanned math documents require specialized OCR for Chinese mathematical content
3. **Format Consistency**: Enhanced formatting produces better structured problems for the learning system
4. **Content Diversity**: Different extraction methods capture different types of problems

## Recommendations

### For Scanned PDFs
- Use PyMuPDF with Tesseract OCR for Chinese mathematical content
- Apply post-processing to fix common OCR errors
- Limit processing to relevant pages to avoid cover/table of content pages

### For Text-based PDFs
- Use standard text extraction with enhanced formatting
- Apply knowledge point categorization based on content
- Implement difficulty assessment algorithms

### System Integration
- Combine multiple extraction methods for comprehensive coverage
- Implement duplicate detection and merging
- Create standardized format for all extracted problems

## Files Generated
- `formatted_extracted_problems.json` - Enhanced OCR problems with formatting
- `unique_formatted_problems.json` - Unique problems only
- `enhanced_extraction_summary.json` - Technical extraction summary
- `final_extraction_report.json` - Comprehensive analysis report
- `EXTRACTION_SUMMARY.md` - Human-readable summary

## Next Steps
1. Integrate with markitdown MCP for markdown conversion (when available)
2. Implement automated duplicate detection
3. Create unified problem database from all extraction methods
4. Develop continuous improvement pipeline for OCR quality

---

*Generated on: {os.popen('date').read().strip()}*
*Total analysis time: Comprehensive processing of 3 PDF files with multiple extraction methods*
"""
    return summary

def main():
    """Main function"""
    print(f"{'='*80}")
    print("FINAL PDF EXTRACTION ANALYSIS")
    print(f"{'='*80}")

    # Create comprehensive report
    report, summary = create_comprehensive_report()

    print(f"\n{'='*80}")
    print("ANALYSIS COMPLETE")
    print(f"{'='*80}")
    print(f"Report saved to: final_extraction_report.json")
    print(f"Summary saved to: EXTRACTION_SUMMARY.md")

    # Display key findings
    print(f"\nKey Findings:")
    print(f"- Methods tested: {len(report['method_comparisons'])}")
    print(f"- Best method for content: {report['quality_assessment']['best_content_quality']}")
    print(f"- Best method for volume: {report['quality_assessment']['best_method']}")

    # Display method comparison
    print(f"\nMethod Comparison:")
    for method, analysis in report['method_comparisons'].items():
        print(f"  {method}: {analysis['count']} problems, avg length {analysis['avg_stem_length']:.1f}")

    # Display unique knowledge points found
    all_knowledge_points = set()
    for analysis in report['method_comparisons'].values():
        all_knowledge_points.update(analysis.get('knowledge_points', []))

    print(f"\nUnique Knowledge Points Found: {len(all_knowledge_points)}")
    for kp in sorted(all_knowledge_points):
        print(f"  - {kp}")

if __name__ == "__main__":
    main()