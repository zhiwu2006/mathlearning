# 数学题目 JSON 格式指南

## 完整结构

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "id": "problem-set-id",
  "version": "1.0.0",
  "locale": "zh-CN",
  "metadata": {
    "gradeBand": "G3-G6",
    "subject": "Math",
    "tags": ["四则运算", "应用题"],
    "createdAt": "2025-01-18T10:00:00Z",
    "author": "Math Learning System"
  },
  "items": [
    {
      "id": "question-001",
      "stem": {
        "text": "题目文本，支持变量 ${varName}",
        "variables": {
          "varName": {
            "type": "int",
            "range": {"min": 1, "max": 100},
            "constraints": ["varName > 0"]
          }
        }
      },
      "taxonomy": {
        "concepts": ["加法", "应用题"],
        "skills": ["条件提取", "关系建模"],
        "difficulty": "E|M|H"
      },
      "steps": [
        {
          "id": "step-1",
          "type": "extract|question|relation|plan|compute|check",
          "prompt": "步骤提示问题",
          "multipleSelect": true,
          "options": [
            {
              "id": "option-1",
              "text": "选项文本 ${varName}",
              "correct": true,
              "feedback": "反馈说明"
            }
          ],
          "hints": ["提示1", "提示2"],
          "validation": {
            "unit": "单位"
          }
        }
      ],
      "transitions": [
        {
          "fromStep": "step-1",
          "onCorrect": "step-2",
          "onWrong": "step-1",
          "maxRetries": 3
        }
      ],
      "scoring": {
        "total": 10,
        "perStep": {
          "step-1": {
            "score": 3,
            "penaltyPerRetry": 0.5,
            "minScore": 1
          }
        }
      },
      "answer": {
        "final": "${a} + ${b}",
        "unit": "个",
        "rationale": "解题思路说明"
      }
    }
  ]
}
```

## 详细说明

### 1. 基本信息字段

- **`id`**: 题目集合唯一标识符
- **`version`**: 版本号 (如 "1.0.0")
- **`locale`**: 语言代码 (如 "zh-CN")
- **`metadata`**: 元数据对象
  - **`gradeBand`**: 年级段 (如 "G3-G6")
  - **`subject`**: 学科 (如 "Math")
  - **`tags`**: 标签数组
  - **`createdAt`**: 创建时间 (ISO格式)
  - **`author`**: 作者

### 2. 题目结构

#### Stem (题干)
- **`text`**: 题目文本，支持变量插值 `${variableName}`
- **`variables`**: 变量定义
  - **`type`**: "int" | "float" | "choice"
  - **`range`**: 取值范围 {"min": 1, "max": 100}
  - **`constraints`**: 约束条件数组
  - **`choices`**: 选项数组 (type="choice"时)

#### Taxonomy (分类)
- **`concepts`**: 相关概念数组
- **`skills`**: 技能要求数组
- **`difficulty`**: 难度 "E"(简单) | "M"(中等) | "H"(困难)

### 3. 步骤类型

- **`extract`**: 提取条件
- **`question`**: 明确问题
- **`relation`**: 建立关系
- **`plan`**: 制定计划
- **`compute`**: 执行运算
- **`check`**: 检查校验

### 4. 步骤结构

```json
{
  "id": "step-id",
  "type": "步骤类型",
  "prompt": "问题文本",
  "multipleSelect": false,  // 是否多选
  "options": [
    {
      "id": "option-id",
      "text": "选项文本 ${varName}",
      "correct": true,
      "feedback": "反馈说明",
      "distractorType": "干扰类型"  // 可选
    }
  ],
  "hints": ["提示1", "提示2"],  // 可选
  "validation": {
    "unit": "单位"  // 可选，用于计算步骤
  }
}
```

### 5. 转换规则

```json
{
  "fromStep": "当前步骤ID",
  "onCorrect": "正确后下一步ID (空字符串表示结束)",
  "onWrong": "错误后下一步ID",
  "maxRetries": 3  // 最大重试次数
}
```

### 6. 评分规则

```json
{
  "total": 10,  // 总分
  "perStep": {
    "step-id": {
      "score": 5,  // 本步分值
      "penaltyPerRetry": 0.5,  // 每次重试扣分
      "minScore": 1  // 最低得分
    }
  }
}
```

## 变量系统

支持的变量类型：

### 整数变量
```json
{
  "a": {
    "type": "int",
    "range": {"min": 1, "max": 100},
    "constraints": ["a > 0", "a % 2 == 0"]
  }
}
```

### 浮点数变量
```json
{
  "b": {
    "type": "float",
    "range": {"min": 0.5, "max": 10.0}
  }
}
```

### 选择变量
```json
{
  "c": {
    "type": "choice",
    "choices": [2, 3, 5, 8]
  }
}
```

## 约束条件语法

- 基本比较: "a > 0", "b < 100"
- 模运算: "a % 2 == 0"
- 复合条件: "a > 10 && a < 50"
- 变量关系: "a + b < 100"

## 表达式语法

在 `text` 字段中可以使用：
- 变量引用: `${a}`, `${b}`
- 数学运算: `${a + b}`, `${a * b}`
- 复杂表达式: `${(a + b) / 2}`

## 完整示例

参见 `sample-question-format.json` 文件获取完整示例。