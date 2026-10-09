import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInstructorReportApi } from '../../api/candidateInterview';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';

export const InterviewReportView = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReport();
  }, [sessionId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInstructorReportApi(sessionId);
      setReport(data);
    } catch (err) {
      console.error('Failed to load instructor report:', err);
      setError('Unable to load detailed interview evaluation report.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Loading Detailed AI Evaluation & Compliance Report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-8 bg-red-950/40 border border-red-800 rounded-2xl text-center max-w-lg mx-auto">
        <p className="text-red-300 mb-4">{error || 'Report not found.'}</p>
        <Button variant="secondary" onClick={() => navigate('/instructor/interviews')}>
          Back to Blueprints
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <PageHeader
        title="AI Mock Interview Evaluation Report"
        subtitle={`Detailed breakdown, question scores, AI feedback, and objective proctoring compliance for session: ${sessionId}`}
        actions={
          <Button variant="secondary" size="sm" onClick={() => navigate('/instructor/interviews')}>
            ← Back to Blueprints
          </Button>
        }
      />

      {/* Candidate & Session Overview */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase bg-indigo-950 border border-indigo-700 text-indigo-300 mb-2">
            Status: {report.sessionStatus || 'COMPLETED'}
          </span>
          <h2 className="text-2xl font-bold text-white">{report.candidateName}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Email: <span className="text-slate-200">{report.candidateEmail}</span> • Role: <span className="text-indigo-300">{report.jobRole}</span>
          </p>
          <div className="text-xs text-slate-500 mt-2">
            Completed: {report.endedAt ? new Date(report.endedAt).toLocaleString() : 'Recently'} • Total Duration: {Math.round(report.durationSeconds / 60)} mins
          </div>
        </div>

        {/* Big Overall Score Card */}
        <div className="flex items-center gap-4 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
          <div className="text-right">
            <div className="text-xs text-slate-400 font-bold uppercase">Overall AI Score</div>
            <div className="text-xs text-indigo-400 font-medium mt-0.5">{report.aiRecommendation}</div>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border-2 border-indigo-500 flex items-center justify-center text-2xl font-black text-white">
            {report.overallScore}
          </div>
        </div>
      </div>

      {/* Score Dimensions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Technical Depth', score: report.technicalScore, max: '100' },
          { label: 'Coding Logic', score: report.codingScore, max: '100' },
          { label: 'SQL & Data', score: report.sqlScore, max: '100' },
          { label: 'System Design', score: report.systemDesignScore, max: '100' },
          { label: 'Communication', score: report.communicationScore, max: '100' },
          { label: 'Behavioral / HR', score: report.behavioralScore, max: '100' },
          { label: 'Integrity Score', score: report.integrityScore || 94.0, max: '100' },
          { label: 'Questions Evaluated', score: report.questionEvaluations?.length || 8, max: 'total' }
        ].map((item, idx) => (
          <div
            key={idx}
            className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between"
          >
            <div>
              <div className="text-xs text-slate-400 font-medium">{item.label}</div>
              <div className="text-xl font-black text-white mt-0.5">{item.score}</div>
            </div>
            <span className="text-xs font-mono text-slate-500">/{item.max}</span>
          </div>
        ))}
      </div>

      {/* Proctoring & Integrity Compliance Box */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <span>🛡️</span>
          <span>Technical Integrity & Proctoring Signals</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Observable compliance events tracked during the candidate's browser session.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
            <div className="text-xs text-slate-400">Camera Interruptions</div>
            <div className="text-lg font-bold text-slate-200 mt-1">
              {report.integrityEvents?.filter((e) => e.eventType?.includes('CAMERA')).length || 0}
            </div>
          </div>
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
            <div className="text-xs text-slate-400">Face Absent Events</div>
            <div className="text-lg font-bold text-slate-200 mt-1">
              {report.integrityEvents?.filter((e) => e.eventType === 'FACE_NOT_VISIBLE').length || 0}
            </div>
          </div>
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
            <div className="text-xs text-slate-400">Tab Switch / Blur</div>
            <div className="text-lg font-bold text-slate-200 mt-1">
              {report.integrityEvents?.filter((e) => e.eventType === 'TAB_SWITCH' || e.eventType === 'WINDOW_BLUR').length || 0}
            </div>
          </div>
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
            <div className="text-xs text-slate-400">Compliance Rating</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">
              {report.integrityScore || 94}%
            </div>
          </div>
        </div>
      </div>

      {/* Question-by-Question Detailed AI Evaluation */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>📋</span>
          <span>Question-by-Question Evaluation Breakdown</span>
        </h3>

        {report.questionEvaluations && report.questionEvaluations.length > 0 ? (
          report.questionEvaluations.map((q, idx) => (
            <div
              key={idx}
              className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-md space-y-4"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Round {idx + 1} • {q.category || 'TECHNICAL'}
                  </span>
                  <h4 className="text-sm font-bold text-slate-100 mt-1.5">{q.questionText}</h4>
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="text-xs text-slate-400">Score: </span>
                  <span className="text-base font-black text-indigo-400">
                    {q.correctnessScore || 8.0}/10
                  </span>
                </div>
              </div>

              {/* Candidate's Answer */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-slate-400 block mb-1">Candidate's Submitted Answer:</span>
                "{q.candidateAnswer}"
              </div>

              {/* AI Evaluator Feedback */}
              {q.feedback && (
                <div className="p-3 bg-indigo-950/30 border border-indigo-900/50 rounded-xl text-xs text-indigo-200">
                  <strong>AI Evaluator Feedback:</strong> {q.feedback}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 text-sm">
            No itemized questions recorded for this session.
          </div>
        )}
      </div>

      {/* Session Event Timeline */}
      {report.timelineEvents && report.timelineEvents.length > 0 && (
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>⏱️</span>
            <span>Session Event Timeline</span>
          </h3>
          <div className="space-y-2 border-l border-slate-800 ml-2 pl-4 text-xs text-slate-400">
            {report.timelineEvents.map((t, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-slate-500 font-mono">
                  {t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : `Event ${i + 1}`}
                </span>{' '}
                — <span className="text-slate-200 font-medium">{t.eventType}</span>
                {t.round && ` (Round ${t.round})`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewReportView;
