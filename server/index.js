const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildAnalysisPrompt(text) {
  return `
당신은 교육 데이터를 분석하는 전문가 GPT입니다.
아래 형식의 JSON 배열(최상위)에 각 단계별 결과를 "title", "content" 키로 넣어 반환하세요.
코드블록(\`\`\`)이나 마크다운, 주석, 불필요한 안내문은 절대 사용하지 마세요.

[
  { "title": "1. 전처리", "content": [ { "speaker": "...", "stage": "...", "text": "..." }, ... ] },
  { "title": "2. 유형 분류", "content": [ { "id": 1, "types": ["설명","질문"] }, ... ] },
  { "title": "3. 질문 분석", "content": [ { "form": "...", "focus": "...", "bloom": "..." }, ... ] },
  { "title": "4. 상호작용 분석", "content": { "teacherCount":0, "studentCount":0, "ratio":0.0, "averageSentenceLength":0, "vocabularyDiversityIndex":0.0, "sentimentRatio":{"positive":0,"negative":0} } }
]

분석 절차:
1. [전처리]  
2. [유형 분류]  
3. [질문 분석]  
4. [상호작용 분석]

사용자가 제공한 발화 데이터:
"""
${text}
"""
반드시 위 예시와 동일한 구조의 JSON 배열만 반환하세요.
`;
}

function buildInsightPrompt(analysis) {
  return `
당신은 교사에게 수업 개선 아이디어와 종합 피드백을 제공하는 전문가입니다.
반드시 아래 형식의 JSON 배열만 출력하세요.  
코드블록, 마크다운, 주석, 불필요한 안내문 절대 사용 금지. 한글만, 영어 금지.

[
  { "title": "5. 인사이트 도출", "content": "학습 개선 전략 및 실행 방안 요약" },
  { "title": "6. 최종 리포트",   "content": "종합 교사용 피드백" }
]

분석 결과:
${JSON.stringify(analysis, null, 2)}

반드시 위 예시와 동일한 구조로 JSON 배열만 반환하세요.
`;
}

function safeParseJSON(content) {
  try {
    const pure = content
      .replace(/```(json)?/gi, '')
      .replace(/```/g, '')
      .replace(/^[#]+/gm, '')
      .trim();
    return JSON.parse(pure);
  } catch (e) {
    console.error('JSON 파싱 오류:', e, '\nRaw content:', content);
    throw new Error('AI 응답 파싱 오류');
  }
}

app.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text 필드가 필요합니다.' });
    const prompt = buildAnalysisPrompt(text);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.3,
    });
    const content = completion.choices[0].message.content;
    const result = safeParseJSON(content);
    console.log('분석 result:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('analyze 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/insight', async (req, res) => {
  try {
    const analysis = req.body.analysis;
    console.log('insight API 요청 - 전달받은 analysis:', JSON.stringify(analysis, null, 2));
    if (!analysis) return res.status(400).json({ error: 'analysis 필드가 필요합니다.' });

    const prompt = buildInsightPrompt(analysis);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.4,
    });
    const content = completion.choices[0].message.content;
    console.log('OpenAI 인사이트 응답:', content);

    let result;
    try {
      result = safeParseJSON(content);
    } catch (e) {
      return res.status(500).json({ error: '파싱 오류', rawContent: content });
    }
    res.json(result);
  } catch (error) {
    console.error('insight 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
