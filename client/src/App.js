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
      const res = await fetch('http://localhost:5001/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();
      console.log('분석 결과:', data);
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
      const res = await fetch('http://localhost:5001/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis }),
      });
      const data = await res.json();
      if (data.error) {
        console.error('인사이트 오류:', data);
        alert(`인사이트 실패: ${data.error}\n${data.rawContent || ''}`);
        setInsights(null);
      } else {
        setInsights(Array.isArray(data) ? data : null);
      }
    } catch (err) {
      console.error(err);
      alert('인사이트 생성 중 오류 발생');
      setInsights(null);
    }
    setLoading(false);
  };

  const renderSectionContent = (content) => {
    if (Array.isArray(content)) {
      if (content.length > 0 && typeof content[0] === 'object') {
        const keys = Object.keys(content[0]);
        return (
          <table style={{borderCollapse:'collapse', width:'100%', fontSize:15}}>
            <thead>
              <tr>
                {keys.map(k => (
                  <th key={k} style={{borderBottom:'1px solid #ccc', textAlign:'left', padding:'4px 6px', background:'#f2f2f2'}}>
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.map((item, i) => (
                <tr key={i}>
                  {keys.map(k => (
                    <td key={k} style={{padding:'4px 6px', borderBottom:'1px solid #eee'}}>
                      {String(item[k])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      }
      return (
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          {content.map((item, idx) =>
            <li key={idx}>{typeof item === 'object' ? JSON.stringify(item) : item}</li>
          )}
        </ul>
      );
    }
    if (content && typeof content === 'object') {
      return (
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          {Object.entries(content).map(([k, v]) =>
            <li key={k}><b>{k}:</b> {typeof v === 'object' ? JSON.stringify(v) : String(v)}</li>
          )}
        </ul>
      );
    }
    return <div style={{whiteSpace:'pre-wrap'}}>{content}</div>;
  };

  const renderAnalysis = (arr) => (
    <div style={{ marginTop: 16 }}>
      {Array.isArray(arr) && arr.length > 0
        ? arr.map((step, i) => (
          <div key={i} style={{ marginBottom: 18, background:'#f8f9fa', borderRadius:8, padding:16 }}>
            <b style={{fontSize:17, color:'#1668c2'}}>
              {step?.title ? step.title.replace(/^\d+\.\s?/, '') : `단계 ${i+1}`}
            </b>
            <div style={{marginTop:8, fontSize:15, color:'#222'}}>
              {renderSectionContent(step?.content)}
            </div>
          </div>
        ))
        : <div>분석 결과를 불러올 수 없습니다.</div>}
    </div>
  );

  const renderInsights = (arr) => (
    <div style={{ marginTop: 20 }}>
      <h4 style={{color:'#2e7d32'}}>💡 인사이트</h4>
      <ul style={{paddingLeft:20}}>
        {Array.isArray(arr) && arr.length > 0
          ? arr.map((item, idx) => (
            <li key={idx} style={{marginBottom:12, fontSize:16}}>
              <b>{item?.title || item?.idea || `인사이트 ${idx+1}`}</b>
              <div style={{marginTop:4, color:'#222'}}>{item?.content || item?.description}</div>
            </li>
          ))
          : <li>인사이트 결과가 없습니다.</li>}
      </ul>
    </div>
  );

  return (
    <div style={{
      maxWidth: 680, margin: '40px auto', padding: 28, borderRadius: 18,
      boxShadow: '0 4px 20px rgba(0,0,0,0.09)', background: '#fff',
      fontFamily: 'system-ui', minHeight: 480
    }}>
      <h2 style={{textAlign:'center', fontSize:28, marginBottom:16}}>📝 교육 발화 분석 웹서비스</h2>
      <textarea
        rows={8}
        style={{ width: '100%', fontSize: 17, borderRadius: 8, padding: 12, marginBottom: 14, border: '1px solid #bbb' }}
        placeholder="교사와 학생 발화 데이터를 여기에 입력하세요"
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <div style={{display: 'flex', gap: 10, marginBottom: 18}}>
        <button onClick={analyze} disabled={loading || !input}
          style={{flex:1, padding: 12, borderRadius: 8, background:'#1976d2', color:'#fff', border:0, fontWeight:'bold', fontSize:16, cursor:'pointer'}}>
          {loading ? '분석 중...' : '분석하기'}
        </button>
        <button onClick={getInsight} disabled={loading || !analysis}
          style={{flex:1, padding: 12, borderRadius: 8, background:'#2e7d32', color:'#fff', border:0, fontWeight:'bold', fontSize:16, cursor:'pointer'}}>
          {loading ? '처리 중...' : '인사이트 얻기'}
        </button>
      </div>
      {renderAnalysis(analysis)}
      {renderInsights(insights)}
    </div>
  );
}

export default App;
