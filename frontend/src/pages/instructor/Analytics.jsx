import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import { BarChart3, TrendingUp, Award, CheckCircle2 } from 'lucide-react';

export const InstructorAnalytics = () => {
  return (
    <div>
      <PageHeader
        title="Assessment Analytics & Cohort Performance"
        subtitle="Statistical distribution of candidate scores across technical, coding, and behavioral rounds."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard
          title="Avg Technical Score"
          value="—"
          subtitle="Theoretical CS concepts"
          icon={TrendingUp}
          color="indigo"
        />
        <StatCard
          title="Avg Coding Score"
          value="—"
          subtitle="Monaco automated execution"
          icon={Award}
          color="cyan"
        />
        <StatCard
          title="Avg Behavioral Score"
          value="—"
          subtitle="STAR communication"
          icon={CheckCircle2}
          color="purple"
        />
      </div>

      <Card title="Cohort Score Distribution" subtitle="Aggregate performance trends">
        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <BarChart3 size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
          <div>Cohort analytics will populate after candidates complete interviews in Phase 6.</div>
        </div>
      </Card>
    </div>
  );
};

export default InstructorAnalytics;
