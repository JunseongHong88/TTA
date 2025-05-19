import React, { useState } from 'react';

function App() {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setInsights(null);
    try {
      const res = await fetch('https://tta-backend-3nj6.onrender.com/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });
      const json = await res.json();
      console.log('분석 결과:', json);
      const data = json.analysis || [];
      setAnalysis(Array.isArray(data) ? data : null);
    } catch (err) {
      console.error(err);
      alert('분석 중 오류 발생');
      setAnalysis(null);
    }
    setLoading(false);
  };

  const getInsight = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://tta-backend-3nj6.onrender.com/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis }),
      });
      const json = await res.json();
      if (json.error) {
        console.error('인사이트 오류:', json);
        alert(`인사이트 실패: ${json.error}\n${json.rawContent || ''}`);
        setInsights(null);
      } else {
        const data = json.insights || [];
        setInsights(Array.isArray(data) ? data : null);
      }
    } catch (err) {
      console.error(err);
      alert('인사이트 생성 중 오류 발생');
      setInsights(null);
    }
    setLoading(false);
  };

  // 이하 렌더링 로직(기존 그대로) …
  const renderSectionContent = (content) => {
    /* … unchanged … */
  };
  const renderAnalysis = (arr) => {
    /* … unchanged … */
  };
  const renderInsights = (arr) => {
    /* … unchanged … */
  };

  return (
    <div style={{ /* … your styles … */ }}>
      {/* … your JSX … */}
      <button onClick={analyze} disabled={loading || !input}>분석하기</button>
      <button onClick={getInsight} disabled={loading || !analysis}>인사이트 얻기</button>
      {renderAnalysis(analysis)}
      {renderInsights(insights)}
    </div>
  );
}

export default App;
