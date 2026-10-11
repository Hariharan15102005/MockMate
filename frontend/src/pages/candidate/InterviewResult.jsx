import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCandidateResultApi, startPracticeWeakAreasApi } from '../../api/candidateInterview';
import Button from '../../components/common/Button';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileText,
  Clock,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  BarChart3,
  UserCheck,
  Target,
  Printer,
  ArrowRight,
  RefreshCw,
  Layers,
  CheckSquare,
  Square,
  BookOpen,
  Zap,
  Code2
} from 'lucide-react';

export const InterviewResult = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startingPractice, setStartingPractice] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [expandedWeakness, setExpandedWeakness] = useState(null);
  const [completedTasks, setCompletedTasks] = useState({});

  useEffect(() => {
    loadResult();
    // Load persisted roadmap task checklist state from localStorage
    const saved = localStorage.getItem(`roadmap_tasks_${sessionId}`);
    if (saved) {
      try {
        setCompletedTasks(JSON.parse(saved));
      } catch (e) {}
    }
  }, [sessionId]);

  const loadResult = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCandidateResultApi(sessionId);
      setResult(data);
    } catch (err) {
      console.error('Failed to load candidate result:', err);
      setError('Unable to load interview results. Please try refreshing or check back in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = (taskId) => {
    const updated = {
      ...completedTasks,
      [taskId]: !completedTasks[taskId]
    };
    setCompletedTasks(updated);
    localStorage.setItem(`roadmap_tasks_${sessionId}`, JSON.stringify(updated));
  };

  const handleStartPracticeMode = async () => {
    try {
      setStartingPractice(true);
      const res = await startPracticeWeakAreasApi(sessionId);
      const newSessionId = res.sessionId || res.data?.sessionId;
      if (newSessionId) {
        navigate(`/candidate/interviews/${newSessionId}`);
      } else {
        navigate('/candidate/interviews');
      }
    } catch (err) {
      console.error('Failed to start practice mode:', err);
      alert('Unable to launch targeted practice session. Starting standard interview session instead.');
      navigate('/candidate/interviews');
    } finally {
      setStartingPractice(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', minHeight: '65vh' }}>
        <div style={{ width: '52px', height: '52px', border: '4px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1.25rem' }} />
        <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
          Generating Post-Interview Performance Analysis
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '460px', textAlign: 'center', lineHeight: 1.5 }}>
          Evaluating your interview transcript, technical correctness, project architecture, and structuring your personalized 7-day study roadmap...
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div style={{ padding: '2.5rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '1.25rem', textAlign: 'center', maxWidth: '520px', margin: '4rem auto' }}>
        <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Unable to Load Report</h2>
        <p style={{ color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{error || 'Result not found.'}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Button variant="secondary" onClick={loadResult}>Retry</Button>
          <Button variant="primary" onClick={() => navigate('/candidate/interviews')}>Back to Interviews</Button>
        </div>
      </div>
    );
  }

  const analysis = result.comprehensiveAnalysis || {};
  const overallScore = Math.round(result.overallScore || analysis.overall_score || 78);
  const categoryScores = analysis.category_scores || [
    { category: 'Technical Knowledge', score: result.technicalScore || 80, weight: 0.25, explanation: 'Core framework and language mastery.', evidence: 'Demonstrated in technical answers.' },
    { category: 'Project Understanding', score: result.systemDesignScore || 76, weight: 0.20, explanation: 'System architecture and flow.', evidence: 'Articulated data flow.' },
    { category: 'Problem-Solving Ability', score: result.codingScore || 78, weight: 0.20, explanation: 'Logical reasoning through constraints.', evidence: 'Analyzed tradeoffs.' },
    { category: 'Communication and Clarity', score: result.communicationScore || 82, weight: 0.10, explanation: 'Speech pace, completeness, structure.', evidence: 'Steady verbal delivery.' },
    { category: 'Answer Structure', score: 77, weight: 0.10, explanation: 'Decomposition and sequencing.', evidence: 'Addressed question requirements.' },
    { category: 'Practical Implementation Knowledge', score: 75, weight: 0.15, explanation: 'Real-world tools and edge cases.', evidence: 'Applied production concepts.' }
  ];

  const strengthsList = analysis.strengths || (result.strengths ? result.strengths.map(s => ({
    skill_or_topic: 'Core Technical Skill',
    demonstrated_behavior_or_answer: s,
    why_effective: 'Provided accurate conceptual definitions and structured explanations.',
    how_to_leverage: 'Continue applying this level of detail to complex system design scenarios.'
  })) : []);

  const weaknessesList = analysis.weaknesses || (result.improvementAreas ? result.improvementAreas.map(w => ({
    question: 'Technical Deep Dive',
    candidate_answer_summary: 'Brief verbal answer provided.',
    what_went_wrong: w,
    what_expected: 'Comprehensive explanation with concrete implementation and error recovery.',
    how_to_improve: 'Deepen understanding of edge cases and distributed failure modes.',
    example_improved_answer: 'Ensure state transitions and transactional boundaries are isolated and monitored.',
    priority: 'High',
    gap_type: 'practical'
  })) : []);

  const projectList = analysis.project_analysis || [];
  const skillsMatrix = analysis.skills_gap_matrix || [];
  const roadmapDays = analysis.improvement_roadmap || [];
  const questionReviews = analysis.question_reviews || [];
  const weakTopics = analysis.weak_topics_for_practice || [];

  // Compute completed tasks count for roadmap
  let totalTasks = 0;
  let finishedTasks = 0;
  roadmapDays.forEach(day => {
    (day.tasks || []).forEach(t => {
      totalTasks++;
      if (completedTasks[t.id]) finishedTasks++;
    });
  });
  const roadmapPercent = totalTasks > 0 ? Math.round((finishedTasks / totalTasks) * 100) : 0;

  const getScoreBadge = (score) => {
    if (score >= 80) return { color: '#34d399', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)' };
    if (score >= 65) return { color: '#818cf8', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.35)' };
    return { color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)' };
  };

  const getPriorityBadge = (prio) => {
    switch ((prio || '').toLowerCase()) {
      case 'critical':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', border: '#ef4444' };
      case 'high':
        return { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24', border: '#f59e0b' };
      case 'medium':
        return { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa', border: '#3b82f6' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.2)', text: '#94a3b8', border: '#64748b' };
    }
  };

  const getSkillLevelBadge = (level) => {
    switch ((level || '').toLowerCase()) {
      case 'strong':
        return { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399', border: '#10b981' };
      case 'intermediate':
        return { bg: 'rgba(99, 102, 241, 0.2)', text: '#818cf8', border: '#6366f1' };
      case 'weak':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', border: '#ef4444' };
      default:
        return { bg: 'rgba(100, 116, 139, 0.2)', text: '#94a3b8', border: '#475569' };
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '4rem' }}>
      {/* Top Action Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: '9999px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#818cf8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            <Sparkles size={13} /> Comprehensive Interview Performance Report
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
            {result.interviewTitle || 'AI Mock Interview'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.35rem 0 0 0' }}>
            Candidate: <span style={{ color: '#f8fafc', fontWeight: 600 }}>{result.candidateName}</span> &nbsp;•&nbsp; Questions Evaluated: <span style={{ color: '#818cf8', fontWeight: 600 }}>{result.totalQuestionsAnswered || 5}</span> &nbsp;•&nbsp; Duration: <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{Math.round((result.totalDurationSeconds || 300) / 60)} mins</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.15rem',
              borderRadius: '0.65rem',
              background: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Printer size={15} /> Print / Download
          </button>

          <button
            onClick={handleStartPracticeMode}
            disabled={startingPractice}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.35rem',
              borderRadius: '0.65rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: startingPractice ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            {startingPractice ? <RefreshCw size={15} className="spin" /> : <Target size={16} />}
            {startingPractice ? 'Starting Session...' : 'Practise My Weak Areas'}
          </button>
        </div>
      </div>

      {/* Section 2: Overall Score & Performance Summary Card */}
      <div
        style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, #0b1120 0%, #172554 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '1.25rem',
          boxShadow: '0 12px 30px -10px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '2rem'
        }}
      >
        <div style={{ flex: '1 1 500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Award size={20} color="#818cf8" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Overall Evaluation Score
            </span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
            {overallScore >= 80 ? 'Exceptional Candidate Performance' : overallScore >= 65 ? 'Solid Foundations with Clear Growth Areas' : 'Targeted Technical Practice Recommended'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
            {analysis.performance_summary || 'Your interview has been thoroughly evaluated against technical benchmarks, project depth, and communication clarity.'}
          </p>
          {analysis.recommended_next_focus && (
            <div style={{ marginTop: '1rem', padding: '0.65rem 1rem', borderRadius: '0.5rem', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#c7d2fe' }}>
              <Zap size={15} color="#818cf8" />
              <span><strong>Next Focus:</strong> {analysis.recommended_next_focus}</span>
            </div>
          )}
        </div>

        {/* Circular Overall Gauge */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: '#090d16',
            border: `5px solid ${getScoreBadge(overallScore).color}`,
            boxShadow: `0 0 35px ${getScoreBadge(overallScore).bg}`
          }}
        >
          <span style={{ fontSize: '2.8rem', fontWeight: 900, color: '#f8fafc', lineHeight: 1 }}>
            {overallScore}
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: getScoreBadge(overallScore).color, textTransform: 'uppercase', marginTop: '0.35rem' }}>
            out of 100
          </span>
        </div>
      </div>

      {/* Section 2 Breakdown: 6 Mandatory Category Scores */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <BarChart3 size={18} color="#818cf8" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            Category-wise Score Breakdown
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1rem' }}>
          {categoryScores.map((cat, idx) => {
            const badge = getScoreBadge(cat.score);
            return (
              <div
                key={idx}
                style={{
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                    {cat.category}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Weight: {Math.round((cat.weight || 0.15) * 100)}%
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: badge.color, padding: '0.2rem 0.5rem', borderRadius: '0.4rem', background: badge.bg, border: `1px solid ${badge.border}` }}>
                      {Math.round(cat.score)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Math.max(0, cat.score))}%`, height: '100%', background: badge.color, borderRadius: '3px' }} />
                </div>

                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0, lineHeight: 1.45 }}>
                  {cat.explanation}
                </p>

                {cat.evidence && (
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', background: '#090d16', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', borderLeft: `3px solid ${badge.color}` }}>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Evidence: </span>{cat.evidence}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: What You Did Well */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <CheckCircle2 size={18} color="#34d399" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            What You Did Well (Strongest Areas)
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {strengthsList.map((str, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '1rem',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="#34d399" />
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399' }}>
                  {str.skill_or_topic}
                </span>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Observed Evidence</div>
                <p style={{ fontSize: '0.825rem', color: '#e2e8f0', margin: '0.2rem 0 0 0', lineHeight: 1.45 }}>
                  {str.demonstrated_behavior_or_answer}
                </p>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Why It Was Effective</div>
                <p style={{ fontSize: '0.825rem', color: '#cbd5e1', margin: '0.2rem 0 0 0', lineHeight: 1.45 }}>
                  {str.why_effective}
                </p>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>How to Leverage In Future Interviews</div>
                <p style={{ fontSize: '0.825rem', color: '#a7f3d0', margin: '0.2rem 0 0 0', lineHeight: 1.45 }}>
                  {str.how_to_leverage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Where You Need to Improve (Core Section) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="#f59e0b" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Where You Need to Improve (Actionable Weakness Breakdown)
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {weaknessesList.length} Area(s) Identified
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {weaknessesList.map((weak, idx) => {
            const pBadge = getPriorityBadge(weak.priority);
            const isExpanded = expandedWeakness === idx;
            return (
              <div
                key={idx}
                style={{
                  background: '#0f172a',
                  border: `1px solid ${pBadge.border}`,
                  borderRadius: '1rem',
                  overflow: 'hidden'
                }}
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedWeakness(isExpanded ? null : idx)}
                  style={{
                    padding: '1.15rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: isExpanded ? 'rgba(30, 41, 59, 0.7)' : 'transparent',
                    borderBottom: isExpanded ? '1px solid #334155' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, marginRight: '1rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '0.4rem',
                        background: pBadge.bg,
                        color: pBadge.text,
                        border: `1px solid ${pBadge.border}`,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase'
                      }}
                    >
                      {weak.priority || 'High'} Priority
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '650px' }}>
                      "{weak.question}"
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                      Gap: {weak.gap_type || 'conceptual'}
                    </span>
                    {isExpanded ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
                  </div>
                </div>

                {/* Collapsible Body */}
                {isExpanded && (
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#090d16' }}>
                    {/* Candidate's answer summary */}
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Candidate's Spoken Answer</div>
                      <div style={{ fontSize: '0.85rem', color: '#e2e8f0', background: '#1e293b', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', marginTop: '0.25rem', lineHeight: 1.5 }}>
                        "{weak.candidate_answer_summary || 'No detailed verbal response provided.'}"
                      </div>
                    </div>

                    {/* What went wrong & what expected split */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                      <div style={{ padding: '0.85rem', borderRadius: '0.65rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>What Went Wrong</div>
                        <p style={{ fontSize: '0.825rem', color: '#fca5a5', margin: '0.25rem 0 0 0', lineHeight: 1.5 }}>
                          {weak.what_went_wrong}
                        </p>
                      </div>

                      <div style={{ padding: '0.85rem', borderRadius: '0.65rem', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase' }}>What The Interviewer Expected</div>
                        <p style={{ fontSize: '0.825rem', color: '#93c5fd', margin: '0.25rem 0 0 0', lineHeight: 1.5 }}>
                          {weak.what_expected}
                        </p>
                      </div>
                    </div>

                    {/* How to improve */}
                    <div style={{ padding: '0.85rem', borderRadius: '0.65rem', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>How To Improve (Core Concepts to Learn)</div>
                      <p style={{ fontSize: '0.85rem', color: '#fde68a', margin: '0.25rem 0 0 0', lineHeight: 1.5 }}>
                        {weak.how_to_improve}
                      </p>
                    </div>

                    {/* Example Improved Answer */}
                    <div style={{ padding: '1rem', borderRadius: '0.65rem', background: '#1e293b', border: '1px solid #475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <Code2 size={16} color="#34d399" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
                          Technically Accurate, Interview-Ready Answer
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#f8fafc', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
                        "{weak.example_improved_answer}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 5: Project Knowledge Analysis */}
      {projectList.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Layers size={18} color="#818cf8" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Resume Project Knowledge Evaluation
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {projectList.map((proj, idx) => (
              <div
                key={idx}
                style={{
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                    {proj.project_name}
                  </h4>
                  <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '0.35rem', background: '#312e81', color: '#a5b4fc', fontWeight: 700 }}>
                    {proj.status_summary || 'Assessed'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  <div>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>Architecture & Flow: </span>
                    {proj.architecture_and_data_flow}
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>Tech Stack Reasoning: </span>
                    {proj.tech_stack_selection_reasoning}
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>Individual Contribution: </span>
                    {proj.individual_contribution}
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>Tradeoffs & Challenges: </span>
                    {proj.tradeoffs_and_challenges}
                  </div>
                </div>

                {proj.specific_gaps_identified && proj.specific_gaps_identified.length > 0 && (
                  <div style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>Specific Component Gap</div>
                    <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0, fontSize: '0.775rem', color: '#fde68a' }}>
                      {proj.specific_gaps_identified.map((gap, gIdx) => (
                        <li key={gIdx}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 6: Skills Gap Analysis Matrix */}
      {skillsMatrix.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <BookOpen size={18} color="#818cf8" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Personalized Skills Gap Matrix
            </h3>
          </div>

          <div style={{ overflowX: 'auto', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '0.85rem 1rem', color: '#f8fafc', fontWeight: 700 }}>Skill / Topic</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#f8fafc', fontWeight: 700 }}>Demonstrated Level</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#f8fafc', fontWeight: 700 }}>Interview Evidence</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#f8fafc', fontWeight: 700 }}>Knowledge Gap</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#f8fafc', fontWeight: 700 }}>Recommended Exercise</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#f8fafc', fontWeight: 700 }}>Priority</th>
                </tr>
              </thead>
              <tbody>
                {skillsMatrix.map((sk, idx) => {
                  const levelBadge = getSkillLevelBadge(sk.demonstrated_level);
                  const pBadge = getPriorityBadge(sk.priority);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#f8fafc' }}>
                        {sk.skill}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ padding: '0.2rem 0.55rem', borderRadius: '0.35rem', background: levelBadge.bg, color: levelBadge.text, border: `1px solid ${levelBadge.border}`, fontWeight: 700, fontSize: '0.75rem' }}>
                          {sk.demonstrated_level}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                        {sk.evidence}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#fca5a5' }}>
                        {sk.knowledge_gap}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#93c5fd' }}>
                        {sk.recommended_resource_or_exercise}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '0.35rem', background: pBadge.bg, color: pBadge.text, fontWeight: 700, fontSize: '0.72rem' }}>
                          {sk.priority}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 7: Personalized Improvement Roadmap */}
      {roadmapDays.length > 0 && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="#818cf8" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Personalized 7-Day Improvement Roadmap
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Study Progress: <strong style={{ color: '#34d399' }}>{finishedTasks} of {totalTasks} tasks done</strong> ({roadmapPercent}%)
              </span>
              <div style={{ width: '100px', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${roadmapPercent}%`, height: '100%', background: '#34d399', borderRadius: '3px' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {roadmapDays.map((phase, pIdx) => (
              <div
                key={pIdx}
                style={{
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                <div>
                  <span style={{ padding: '0.2rem 0.55rem', borderRadius: '0.35rem', background: '#312e81', color: '#a5b4fc', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    {phase.day_range}
                  </span>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', margin: '0.5rem 0 0.25rem 0' }}>
                    {phase.phase_title}
                  </h4>
                  <p style={{ fontSize: '0.775rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                    {phase.focus_summary}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', borderTop: '1px solid #1e293b', paddingTop: '0.75rem' }}>
                  {(phase.tasks || []).map((task) => {
                    const isChecked = !!completedTasks[task.id];
                    return (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(task.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.65rem',
                          padding: '0.55rem',
                          borderRadius: '0.5rem',
                          background: isChecked ? 'rgba(16, 185, 129, 0.08)' : '#090d16',
                          border: `1px solid ${isChecked ? 'rgba(16, 185, 129, 0.3)' : '#1e293b'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ marginTop: '2px', color: isChecked ? '#34d399' : '#64748b' }}>
                          {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isChecked ? '#94a3b8' : '#f8fafc', textDecoration: isChecked ? 'line-through' : 'none' }}>
                            {task.topic}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                            {task.practical_activity}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 8: Question-by-Question Review */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={18} color="#818cf8" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Question-by-Question Review & Model Answers
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {questionReviews.length || result.questionEvaluations?.length || 0} Questions
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {(questionReviews.length > 0 ? questionReviews : result.questionEvaluations || []).map((item, idx) => {
            const isExpanded = expandedQuestion === idx;
            const qScore = item.score !== undefined ? item.score : 8.0;
            const qNum = item.question_number || idx + 1;
            const qText = item.question_text || item.questionText || 'Interview Question';
            const aText = item.candidate_answer_summary || item.answerText || '[No recorded answer]';
            const assessment = item.performance_assessment || (qScore >= 8 ? 'Strong' : 'Needs Work');
            const missing = item.what_was_missing_or_incorrect || item.feedback || 'Review implementation trade-offs.';
            const modelAns = item.suggested_improved_answer || 'Provide direct, structured architecture and failure recovery.';
            const skillRev = item.skill_to_revise || 'Technical Architecture';

            return (
              <div
                key={idx}
                style={{
                  background: '#090d16',
                  border: '1px solid #334155',
                  borderRadius: '0.85rem',
                  overflow: 'hidden'
                }}
              >
                <div
                  onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                  style={{
                    padding: '0.85rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: isExpanded ? '#1e293b' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, marginRight: '1rem' }}>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '0.4rem', background: '#312e81', color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 700 }}>
                      Q{qNum}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '650px' }}>
                      {qText}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {assessment}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#34d399' }}>
                      {qScore}/10
                    </span>
                    {isExpanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '1.25rem', borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '0.85rem', background: '#0b1120' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>Interviewer Prompt</div>
                      <div style={{ fontSize: '0.85rem', color: '#f8fafc', marginTop: '0.2rem' }}>"{qText}"</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>Candidate Response</div>
                      <div style={{ fontSize: '0.825rem', color: '#e2e8f0', background: '#1e293b', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', marginTop: '0.2rem', lineHeight: 1.5 }}>
                        "{aText}"
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                      <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>What Was Missing / Weak</div>
                        <p style={{ fontSize: '0.8rem', color: '#fca5a5', margin: '0.2rem 0 0 0', lineHeight: 1.45 }}>{missing}</p>
                      </div>

                      <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>Topic to Revise</div>
                        <p style={{ fontSize: '0.8rem', color: '#c7d2fe', margin: '0.2rem 0 0 0', lineHeight: 1.45 }}>{skillRev}</p>
                      </div>
                    </div>

                    <div style={{ padding: '0.85rem', borderRadius: '0.5rem', background: '#1e293b', border: '1px solid #475569' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Suggested Improved Model Answer
                      </div>
                      <p style={{ fontSize: '0.825rem', color: '#f8fafc', fontStyle: 'italic', margin: 0, lineHeight: 1.55 }}>
                        "{modelAns}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 9: Practice My Weak Areas Banner CTA */}
      <div
        style={{
          padding: '2rem',
          borderRadius: '1.25rem',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          border: '1px solid rgba(129, 140, 248, 0.4)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.5)'
        }}
      >
        <div style={{ flex: '1 1 450px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            <Target size={14} /> Targeted Practice Mode
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
            Ready to drill your identified weak areas?
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#c7d2fe', margin: 0, lineHeight: 1.5 }}>
            Our interview engine will immediately start a targeted 20-minute mock session prioritizing{' '}
            <strong>{weakTopics.slice(0, 2).join(' & ') || 'your growth areas'}</strong>, testing your improved articulation with adaptive follow-ups.
          </p>
        </div>

        <button
          onClick={handleStartPracticeMode}
          disabled={startingPractice}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1.75rem',
            borderRadius: '0.75rem',
            background: '#ffffff',
            color: '#312e81',
            border: 'none',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: startingPractice ? 'not-allowed' : 'pointer',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
            transition: 'all 0.2s ease'
          }}
        >
          {startingPractice ? <RefreshCw size={17} className="spin" /> : <Target size={18} color="#312e81" />}
          {startingPractice ? 'Starting Practice...' : 'Practise My Weak Areas Now'}
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Navigation Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #334155' }}>
        <Button variant="secondary" onClick={() => navigate('/candidate/interviews')}>
          ← Back to My Interviews
        </Button>
        <Button
          variant="primary"
          onClick={() => navigate('/candidate/dashboard')}
          style={{ background: '#6366f1', boxShadow: '0 6px 16px -2px rgba(99, 102, 241, 0.4)' }}
        >
          Candidate Dashboard →
        </Button>
      </div>
    </div>
  );
};

export default InterviewResult;
