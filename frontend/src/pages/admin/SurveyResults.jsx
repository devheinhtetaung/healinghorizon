import Card from '../../components/ui/Card';
import PieChart from '../../components/ui/charts/PieChart';
import { CHART_PALETTE } from '../../components/ui/charts/chartPalette';
import { HBarChart } from '../../components/ui/charts/Charts';

function questionTotal(q) {
  if (typeof q.count === 'number') return q.count;
  const opts = Array.isArray(q.options) ? q.options : [];
  if (opts.length > 0) {
    return opts.reduce((sum, o) => sum + (Number(o.count) || 0), 0);
  }
  return (Array.isArray(q.responses) ? q.responses : []).length;
}

function resolveType(q) {
  if (q.type === 'multiple_choice' || q.type === 'scale') return q.type;
  return 'text';
}

function percent(value, total) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function PieWithLegend({ options, total }) {
  const data = (options || []).map((o, i) => ({
    label: o.label,
    value: Number(o.count) || 0,
    color: CHART_PALETTE[i % CHART_PALETTE.length],
  }));

  return (
    <div className="ad-surveys-results__pie">
      <PieChart data={data} ariaLabel="Distribution of responses by option" />
      <ul className="ad-surveys-results__legend">
        {data.map((d) => (
          <li key={d.label} className="ad-surveys-results__legend-item">
            <span
              className="ad-surveys-results__legend-swatch"
              style={{ backgroundColor: d.color }}
              aria-hidden="true"
            />
            <span className="ad-surveys-results__legend-label">{d.label}</span>
            <span className="ad-surveys-results__legend-value">
              {percent(d.value, total)}% ({d.value})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuestionResultCard({ q }) {
  const total = questionTotal(q);
  const type = resolveType(q);

  return (
    <Card raised className="ad-surveys-results__card">
      <header className="ad-surveys-results__head">
        <h3 className="ad-surveys-results__question">{q.question}</h3>
        <span className="ad-surveys-results__count">
          {total} response{total === 1 ? '' : 's'}
        </span>
      </header>

      {type === 'multiple_choice' && <PieWithLegend options={q.options} total={total} />}

      {type === 'scale' && (
        <HBarChart
          data={(q.options || []).map((o) => ({ label: o.label, value: Number(o.count) || 0 }))}
          formatValue={(v) => v}
          ariaLabel={`Distribution of responses for ${q.question}`}
        />
      )}

      {type === 'text' && (
        <ul className="ad-surveys-results__text-list">
          {(q.responses || []).map((r, i) => (
            <li key={`${r.answer}-${i}`} className="ad-surveys-results__text-item">
              <span className="ad-surveys-results__text-answer">&ldquo;{r.answer}&rdquo;</span>
              <span className="ad-surveys-results__text-name">
                {r.patientName || 'Anonymous'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function SurveyResults({ responseCount = 0, questions = [] }) {
  const list = Array.isArray(questions) ? questions : [];
  const answered = list.filter((q) => questionTotal(q) > 0).length;
  const completionRate = list.length > 0 ? Math.round((answered / list.length) * 100) : 0;

  return (
    <div className="ad-surveys-results">
      <div className="ad-surveys-results__summary">
        <div className="ad-surveys-results__stat">
          <span className="ad-surveys-results__stat-value">{responseCount}</span>
          <span className="ad-surveys-results__stat-label">responses</span>
        </div>
        <div className="ad-surveys-results__stat">
          <span className="ad-surveys-results__stat-value">{completionRate}%</span>
          <span className="ad-surveys-results__stat-label">completion rate</span>
        </div>
      </div>

      <div className="ad-surveys-results__grid">
        {list.map((q) => (
          <QuestionResultCard key={q.questionId ?? q.question} q={q} />
        ))}
      </div>
    </div>
  );
}
