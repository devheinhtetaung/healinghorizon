import { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  UserCheck,
  Clock,
  MessageSquareText,
  Heart,
  Activity,
  TrendingUp,
  CalendarCheck,
  ShieldAlert,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { LineChart, BarChart, HBarChart } from '../../components/ui/charts/Charts';
import useToast from '../../components/ui/useToast';
import { adminService } from '../../services/adminService';
import { formatUSD } from '../../utils/currency';
import './Admin.css';

const EMPTY_TREND = [{ label: '', value: 0 }];

export default function AdminDashboardPage() {
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    userGrowth: null,
    sessionVolume: null,
    ratings: null,
    donations: null,
    moderation: null,
  });

  useEffect(() => {
    let cancelled = false;

    const fetchDashboard = async () => {
      try {
        const [users, consultants, feedback, donationList, reports, userGrowth, sessionVolume, ratings, donations, moderation] =
          await Promise.all([
            adminService.getUsers(),
            adminService.getConsultants(),
            adminService.getFeedback(),
            adminService.getDonations(),
            adminService.getReports(),
            adminService.getUserGrowth(),
            adminService.getSessionVolume(),
            adminService.getConsultantRatings(),
            adminService.getDonationRevenue(),
            adminService.getModeration(),
          ]);

        if (cancelled) return;

        const pendingApprovals = consultants.filter((c) => !c.isVerified).length;

        setStats([
          { icon: UsersIcon, label: 'Total Patients', value: users.length },
          { icon: UserCheck, label: 'Total Consultants', value: consultants.length },
          { icon: Clock, label: 'Pending Approvals', value: pendingApprovals },
          { icon: MessageSquareText, label: 'Forum Posts', value: feedback.length },
          { icon: Heart, label: 'Total Donations', value: donationList.length },
        ]);

        setMetrics({
          userGrowth,
          sessionVolume,
          ratings,
          donations,
          moderation,
        });

        const feedbackItems = (feedback || []).map((f) => ({
          id: `feedback-${f.feedbackId}`,
          type: 'feedback',
          parts: [
            { value: f.patientName || 'Anonymous', strong: true },
            { value: ' left feedback for ' },
            { value: f.consultantName || 'a consultant', strong: true },
            { value: '.' },
          ],
          time: f.createdAt,
        }));

        const reportItems = (reports || []).map((r) => ({
          id: `report-${r.postReportId}`,
          type: 'report',
          parts: [
            { value: r.reporterName || 'Anonymous', strong: true },
            { value: ' reported a post: ' },
            { value: r.postTitle || 'Untitled post', strong: true },
            { value: '.' },
          ],
          time: r.createdAt,
        }));

        const recentActivity = [...feedbackItems, ...reportItems]
          .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
          .slice(0, 6)
          .map((item) => ({
            ...item,
            time: item.time ? new Date(item.time).toLocaleDateString() : 'Recently',
          }));

        setActivity(recentActivity);
      } catch (err) {
        if (!cancelled) {
          addToast({ type: 'error', title: 'Error', message: err.message });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDashboard();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="ad-dash">
        <Spinner />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="ad-dash">
        <p>Unable to load dashboard data.</p>
      </div>
    );
  }

  const userGrowthData = Array.isArray(metrics.userGrowth) && metrics.userGrowth.length
    ? metrics.userGrowth
    : EMPTY_TREND;
  const sessionVolumeData = Array.isArray(metrics.sessionVolume) && metrics.sessionVolume.length
    ? metrics.sessionVolume
    : EMPTY_TREND;
  const ratingsData = Array.isArray(metrics.ratings) && metrics.ratings.length
    ? metrics.ratings
    : EMPTY_TREND;
  const donationsData = Array.isArray(metrics.donations) && metrics.donations.length
    ? metrics.donations
    : EMPTY_TREND;
  const moderationData = Array.isArray(metrics.moderation) && metrics.moderation.length
    ? metrics.moderation
    : EMPTY_TREND;

  return (
    <div className="ad-dash">
      <h1 className="page-title">Dashboard</h1>
      {/* Headline stat cards (live counts) */}
      <div className="ad-dash__stats">
        {stats.map(({ icon: Icon, label, value }) => (
          <Card key={label} className="ad-dash__stat">
            <div className="ad-dash__stat-icon">
              <Icon aria-hidden="true" />
            </div>
            <div>
              <p className="ad-dash__stat-value">{value}</p>
              <p className="ad-dash__stat-label">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Group 1: Growth */}
      <section className="ad-metrics__group" aria-label="Platform growth metrics">
        <h2 className="ad-metrics__group-title">
          <TrendingUp aria-hidden="true" /> Platform Growth
        </h2>
        <div className="ad-metrics__grid ad-metrics__grid--wide-line">
          <Card className="ad-metric">
            <div className="ad-metric__head">
              <div>
                <h3 className="ad-metric__title">Registered Users</h3>
                <p className="ad-metric__subtitle">New accounts per day — last 90 days</p>
              </div>
            </div>
            <LineChart
              data={userGrowthData}
              ariaLabel="Registered users per day over the last 90 days"
            />
          </Card>

          <Card className="ad-metric">
            <div className="ad-metric__head">
              <div>
                <h3 className="ad-metric__title">Consultant Ratings</h3>
                <p className="ad-metric__subtitle">Distribution of patient feedback</p>
              </div>
            </div>
            <HBarChart
              data={ratingsData}
              ariaLabel="Consultant rating distribution from five stars to one star"
            />
          </Card>
        </div>
      </section>

      {/* Group 2: Engagement & Revenue */}
      <section className="ad-metrics__group" aria-label="Engagement and revenue metrics">
        <h2 className="ad-metrics__group-title">
          <CalendarCheck aria-hidden="true" /> Engagement & Revenue
        </h2>
        <div className="ad-metrics__grid ad-metrics__grid--split">
          <Card className="ad-metric">
            <div className="ad-metric__head">
              <div>
                <h3 className="ad-metric__title">Session Bookings</h3>
                <p className="ad-metric__subtitle">Appointments booked per week — last 90 days</p>
              </div>
            </div>
            <BarChart
              data={sessionVolumeData}
              color="var(--color-accent)"
              ariaLabel="Session bookings per week over the last 90 days"
            />
          </Card>

          <Card className="ad-metric">
            <div className="ad-metric__head">
              <div>
                <h3 className="ad-metric__title">Donation Revenue</h3>
                <p className="ad-metric__subtitle">Completed donations per week — last 90 days</p>
              </div>
            </div>
            <LineChart
              data={donationsData}
              color="var(--color-success)"
              formatValue={formatUSD}
              ariaLabel="Donation revenue per week over the last 90 days"
            />
          </Card>
        </div>
      </section>

      {/* Group 3: Moderation & live activity */}
      <section className="ad-metrics__group" aria-label="Moderation and recent activity">
        <h2 className="ad-metrics__group-title">
          <ShieldAlert aria-hidden="true" /> Moderation & Activity
        </h2>
        <div className="ad-metrics__grid ad-metrics__grid--activity">
          <Card className="ad-metric">
            <div className="ad-metric__head">
              <div>
                <h3 className="ad-metric__title">Moderation Queue</h3>
                <p className="ad-metric__subtitle">Flagged posts per day — last 30 days</p>
              </div>
            </div>
            <BarChart
              data={moderationData}
              color="var(--color-warning)"
              ariaLabel="Flagged posts per day over the last 30 days"
            />
          </Card>

          <Card raised className="ad-dash__activity-card">
            <div className="ad-dash__section-head">
              <h3 className="ad-dash__section-title">
                <Activity aria-hidden="true" />
                Recent Activity
              </h3>
            </div>
            {activity.length === 0 ? (
              <p className="ad-dash__feed-empty">No recent activity.</p>
            ) : (
              <div className="ad-dash__feed">
                {activity.map(({ id, type, parts, time }) => (
                  <div key={id} className="ad-dash__feed-item">
                    <div className={`ad-dash__feed-dot ad-dash__feed-dot--${type}`} aria-hidden="true" />
                    <div>
                      <p className="ad-dash__feed-text">
                        {parts.map((part, i) =>
                          part.strong ? <strong key={i}>{part.value}</strong> : part.value
                        )}
                      </p>
                      <span className="ad-dash__feed-time">{time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}
