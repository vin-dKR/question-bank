
export const buildAnalyticsHTML = (data: TestAnalytics) => {
    const computeDerived = (data: TestAnalytics) => {
        const scores = data.studentAnalytics.map((s) => s.score).slice().sort((a, b) => a - b);
        const medianScore = scores.length === 0 ? 0 : scores.length % 2 === 1 ? scores[(scores.length - 1) / 2] : (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2;
        const passThreshold = 40; // percentage
        const passCount = data.studentAnalytics.filter((s) => s.percentage >= passThreshold).length;
        const passPercentage = data.studentAnalytics.length > 0 ? (passCount / data.studentAnalytics.length) * 100 : 0;
        const histogram = new Array(10).fill(0) as number[];
        for (const s of data.studentAnalytics) {
            let idx = Math.floor(s.percentage / 10);
            if (idx > 9) idx = 9;
            if (idx < 0) idx = 0;
            histogram[idx]++;
        }
        const difficultyLabel = data.averagePercentage >= 75 ? 'Easy' : data.averagePercentage >= 50 ? 'Moderate' : data.averagePercentage >= 30 ? 'Challenging' : 'Hard';
        return { medianScore, passPercentage, histogram, difficultyLabel };
    };

    const computeChapterAnalytics = (questionAnalytics: QuestionAnalytics[]) => {
        const chapterMap: Record<string, { correct: number; attempts: number; questions: number }> = {};
        questionAnalytics.forEach((q) => {
            const chapter = q.chapter || 'Unknown';
            if (!chapterMap[chapter]) {
                chapterMap[chapter] = { correct: 0, attempts: 0, questions: 0 };
            }
            chapterMap[chapter].correct += q.correctAnswers;
            chapterMap[chapter].attempts += q.totalAttempts;
            chapterMap[chapter].questions += 1;
        });
        return Object.entries(chapterMap).map(([chapter, data]) => ({
            chapter,
            totalQuestions: data.questions,
            totalCorrect: data.correct,
            totalAttempts: data.attempts,
            averageAccuracy: data.attempts > 0 ? (data.correct / data.attempts) * 100 : 0,
        }));
    };

    const computeTopicAnalytics = (questionAnalytics: QuestionAnalytics[]) => {
        const topicMap: Record<string, { correct: number; attempts: number; questions: number }> = {};
        questionAnalytics.forEach((q) => {
            const topic = q.topic || 'Unknown';
            if (!topicMap[topic]) {
                topicMap[topic] = { correct: 0, attempts: 0, questions: 0 };
            }
            topicMap[topic].correct += q.correctAnswers;
            topicMap[topic].attempts += q.totalAttempts;
            topicMap[topic].questions += 1;
        });
        return Object.entries(topicMap).map(([topic, data]) => ({
            topic,
            totalQuestions: data.questions,
            totalCorrect: data.correct,
            totalAttempts: data.attempts,
            averageAccuracy: data.attempts > 0 ? (data.correct / data.attempts) * 100 : 0,
        }));
    };

    const escapeHtml = (input: string) =>
        input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    const { medianScore, passPercentage, histogram, difficultyLabel } = computeDerived(data);
    const chapters = computeChapterAnalytics(data.questionAnalytics);
    const topics = computeTopicAnalytics(data.questionAnalytics);

    const style = `
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"; margin: 24px; }
      h1 { font-size: 24px; margin: 0 0 8px; }
      h2 { font-size: 18px; margin: 16px 0 8px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align: left; }
      .small { color: #6b7280; font-size: 12px; }
      .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
      .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
      .kv { font-size: 14px; }
      .kv b { font-size: 18px; }
      .hist { display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px; align-items: end; height: 120px; margin-top: 8px; }
      .bar { background: #6366f1; width: 100%; }
      .bar-label { text-align: center; font-size: 10px; margin-top: 4px; color: #6b7280; }
    </style>
  `;

    const histBars = histogram
        .map((count, idx) => {
            const height = Math.max(4, Math.round((count / Math.max(1, Math.max(...histogram))) * 100));
            return `<div><div class="bar" style="height:${height}px"></div><div class="bar-label">${idx * 10}-${idx * 10 + 9}</div></div>`;
        })
        .join('');

    const studentRows = data.studentAnalytics
        .map(
            (s) => `
        <tr>
          <td>${s.studentName}</td>
          <td>${s.rollNumber}</td>
          <td>${s.className}</td>
          <td>${s.score}/${s.totalQuestions}</td>
          <td>${s.percentage.toFixed(1)}%</td>
          <td>${s.correctAnswers}</td>
          <td>${s.timeTaken ?? '-'}</td>
        </tr>
        <tr>
        </tr>`
        )
        .join('');

    const questionRows = data.questionAnalytics
        .map(
            (q) => `<tr><td>Q${q.questionNumber}</td><td>${escapeHtml(q.questionText)}</td><td>${q.correctAnswers}/${q.totalAttempts}</td><td>${q.accuracy.toFixed(1)}%</td></tr>`
        )
        .join('');

    const chapterRows = chapters
        .map(
            (ch) => `<tr><td>${ch.chapter}</td><td>${ch.totalQuestions}</td><td>${ch.totalCorrect}/${ch.totalAttempts}</td><td>${ch.averageAccuracy.toFixed(1)}%</td></tr>`
        )
        .join('');

    const topicRows = topics
        .map(
            (t) => `<tr><td>${t.topic}</td><td>${t.totalQuestions}</td><td>${t.totalCorrect}/${t.totalAttempts}</td><td>${t.averageAccuracy.toFixed(1)}%</td></tr>`
        )
        .join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/>${style}</head><body>
    <h1>Test Analytics</h1>
    <div class="small">Test ID: ${data.testId}</div>
    <div class="grid" style="margin-top:12px;">
      <div class="card kv">Total Students<br/><b>${data.totalStudents}</b></div>
      <div class="card kv">Average Score<br/><b>${data.averageScore.toFixed(1)}</b> <span class="small">(${data.averagePercentage.toFixed(1)}%)</span></div>
      <div class="card kv">Highest / Lowest<br/><b>${data.highestScore}</b> / <b>${data.lowestScore}</b></div>
      <div class="card kv">Median Score<br/><b>${medianScore.toFixed(1)}</b></div>
    </div>
    <div class="grid" style="margin-top:12px;">
      <div class="card kv">Pass Percentage<br/><b>${passPercentage.toFixed(1)}%</b></div>
      <div class="card kv">Difficulty<br/><b>${difficultyLabel}</b></div>
      <div class="card kv">Attempted<br/><b>${data.studentAnalytics.length}</b></div>
      <div class="card kv">Questions<br/><b>${data.questionAnalytics.length}</b></div>
    </div>
    <h2>Score Distribution (percentage)</h2>
    <div class="hist">${histBars}</div>
    <h2>Chapter Performance</h2>
    <table>
      <thead><tr><th>Chapter</th><th>Total Questions</th><th>Correct/Attempts</th><th>Avg Accuracy</th></tr></thead>
      <tbody>${chapterRows}</tbody>
    </table>
    <h2>Topic Performance</h2>
    <table>
      <thead><tr><th>Topic</th><th>Total Questions</th><th>Correct/Attempts</th><th>Avg Accuracy</th></tr></thead>
      <tbody>${topicRows}</tbody>
    </table>
    <h2>Student Performance</h2>
    <table>
      <thead><tr><th>Name</th><th>Roll</th><th>Class</th><th>Score</th><th>%</th><th>Correct</th><th>Time</th></tr></thead>
      <tbody>${studentRows}</tbody>
    </table>
    <h2>Question Performance</h2>
    <table>
      <thead><tr><th>Question</th><th>Text</th><th>Correct/Attempts</th><th>Accuracy</th></tr></thead>
      <tbody>${questionRows}</tbody>
    </table>
  </body></html>`;
};
