import { ProblemSet } from '@/types/problem';

// 简单的测试数据，确保能正常加载
export const testProblemSet: ProblemSet = {
  $schema: "http://json-schema.org/draft-07/schema#",
  id: "test-001",
  version: "1.0.0",
  locale: "zh-CN",
  metadata: {
    gradeBand: "G3-G4",
    subject: "Math",
    tags: ["测试"],
    createdAt: "2025-01-18T10:00:00Z",
    author: "Math Learning System"
  },
  items: [
    {
      id: "test-item-001",
      stem: {
        text: "测试题目：1 + 1 = ?",
        variables: {}
      },
      taxonomy: {
        concepts: ["基础运算"],
        skills: ["加法"],
        difficulty: "E"
      },
      steps: [
        {
          id: "s1",
          type: "compute",
          prompt: "1 + 1 等于多少？",
          options: [
            {
              id: "s1o1",
              text: "2",
              correct: true,
              feedback: "正确！"
            },
            {
              id: "s1o2",
              text: "3",
              correct: false,
              feedback: "错误"
            }
          ]
        }
      ],
      transitions: [
        {
          fromStep: "s1",
          onCorrect: "",
          onWrong: "s1",
          maxRetries: 2
        }
      ],
      scoring: {
        total: 10,
        perStep: {
          s1: {
            score: 10,
            penaltyPerRetry: 1,
            minScore: 1
          }
        }
      },
      answer: {
        final: "2",
        unit: "",
        rationale: "基础加法运算"
      }
    }
  ]
};