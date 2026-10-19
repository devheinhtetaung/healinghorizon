import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MessageSquareText,
  Calendar,
  Video,
  UserPlus,
  Users,
  TrendingUp,
  Star,
  ArrowRight,
  Sparkles,
  Brain,
  Smile,
  Activity,
  Moon,
  Target,
  Shield,
  Award,
  Mail,
  ChevronRight,
  Clock,
  Globe,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import Input from '../../components/ui/Input';
import Reveal from '../../components/ui/Reveal';
import { consultantService } from '../../services/consultantService';
import { forumService } from '../../services/forumService';
import './Home.css';

/* ──────────────────────────────────────────────
   Static content arrays
   ────────────────────────────────────────────── */

const HERO_STATS = [
  { value: '2,400+', label: 'People supported' },
  { value: '180+', label: 'Licensed consultants' },
  { value: '94%', label: 'Satisfaction rate' },
  { value: '24/7', label: 'AI support access' },
];

const TRUST_PARTNERS = [
  'Global Mind Health',
  'MindCare Network',
  'Wellness Network',
  'LifeCare Alliance',
  'TherapyPlus',
];

const STEPS = [
  { number: 1, icon: UserPlus, title: 'Create an Account', description: 'Sign up in under two minutes. Your privacy is our priority from day one.' },
  { number: 2, icon: Users, title: 'Match & Connect', description: 'Get matched with a consultant who fits your needs, schedule, and communication style.' },
  { number: 3, icon: Heart, title: 'Begin Healing', description: 'Start your sessions, track your progress, and take meaningful steps toward wellbeing.' },
];

const IMPACT_BARS = [
  { label: 'Member satisfaction', value: 94, valueLabel: '94%', barColor: 'var(--color-accent)' },
  { label: 'Consultant availability & reach', value: 87, valueLabel: '87%', barColor: 'var(--color-success)' },
  { label: 'Session attendance rate', value: 92, valueLabel: '92%', barColor: 'var(--color-primary)' },
  { label: 'AI chat accuracy & empathy score', value: 89, valueLabel: '89%', barColor: 'var(--color-warning)' },
];

const ASSESSMENTS = [
  { icon: Brain, title: 'Anxiety Check', description: 'Quick 2-minute screening to understand your anxiety levels.', to: '/register' },
  { icon: Smile, title: 'Mood Tracker', description: 'Log daily moods and spot patterns over time.', to: '/register' },
  { icon: Activity, title: 'Stress Test', description: 'Evaluate your current stress load and get tailored tips.', to: '/register' },
  { icon: Moon, title: 'Sleep Quality', description: 'Check how your sleep habits affect your mental health.', to: '/register' },
  { icon: Target, title: 'Focus Check', description: 'Measure concentration and get focus-building exercises.', to: '/register' },
  { icon: Heart, title: 'Burnout Risk', description: 'Identify early warning signs of personal and work burnout.', to: '/register' },
];

const SERVICES = [
  { icon: MessageSquareText, title: 'AI Chat Support', description: 'Compassionate AI-powered conversations — 24/7, confidential, and free.' },
  { icon: Calendar, title: 'Book Appointments', description: 'Schedule sessions with licensed consultants who understand your unique life journey.' },
  { icon: Video, title: 'Secure Video Sessions', description: 'Encrypted, private video calls — from the comfort of home or anywhere you choose.' },
  { icon: Users, title: 'Peer Community', description: 'Connect with a supportive community in a moderated, safe space.' },
  { icon: Shield, title: 'Crisis Resources', description: 'Immediate access to emergency contacts and crisis helplines.' },
  { icon: Award, title: 'Progress Tracking', description: 'Set goals, track milestones, and celebrate your growth.' },
];

const TESTIMONIALS = [
  { quote: 'Healing Horizon helped me through the hardest chapter of my life. My consultant understood exactly what I was going through.', name: 'Emily R.', role: 'Community Member', initials: 'ER' },
  { quote: 'The AI chat is a lifeline at 2 AM when I cannot sleep and need someone — or something — to talk to.', name: 'Marcus T.', role: 'Graphic Designer', initials: 'MT' },
  { quote: 'I was skeptical about online therapy, but the video sessions feel just as personal as in-person visits.', name: 'Aisha K.', role: 'Teacher', initials: 'AK' },
];

const DONATE_STATS = [
  { value: '2,400+', label: 'People supported this year' },
  { value: '180+', label: 'Licensed consultants' },
  { value: '94%', label: 'Of donations go directly to member care' },
];

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */

export default function HomePage() {
  const [consultants, setConsultants] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const cData = await consultantService.list().catch(() => []);
        setConsultants(Array.isArray(cData) ? cData.slice(0, 4) : []);
      } catch {
        /* fall back gracefully */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      {/* ============================================ */}
      {/* 1. HERO + GLASS STAT CARD                    */}
      {/* ============================================ */}
      <section id="hero" className="home-hero">
        <div className="home-hero__inner">
          <div className="home-hero__text">
            <Badge variant="accent" className="home-hero__badge">
              <Sparkles aria-hidden="true" /> Trusted by 180+ consultants
            </Badge>
            <h1 className="home-hero__headline">
              Your mental wellness journey starts here
            </h1>
            <p className="home-hero__subhead">
              Compassionate, accessible mental health support designed for
              everyone. Connect with licensed consultants, join a supportive
              community, and take the first step — all from one platform.
            </p>
            <div className="home-hero__actions">
              <Link to="/register">
                <Button variant="primary" size="lg" rightIcon={ArrowRight}>
                  Get Started Free
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="secondary-inverse" size="lg">
                  How It Works
                </Button>
              </Link>
            </div>
          </div>

          <div className="home-hero__stat-card" aria-label="Platform statistics">
            {HERO_STATS.map((s) => (
              <div key={s.label} className="home-hero__stat">
                <span className="home-hero__stat-value">{s.value}</span>
                <span className="home-hero__stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 2. TRUST BAR                                 */}
      {/* ============================================ */}
      <section className="home-trust" aria-label="Trusted by">
        <div className="home-trust__inner">
          <p className="home-trust__label">Trusted by leading healthcare & wellness networks</p>
          <div className="home-trust__logos">
            {TRUST_PARTNERS.map((name) => (
              <div key={name} className="home-trust__logo">
                <Shield aria-hidden="true" />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 3. HOW IT WORKS                              */}
      {/* ============================================ */}
      <section id="how-it-works" className="home-how">
        <Reveal className="home-how__inner">
          <div className="home-how__header">
            <Badge variant="accent">How It Works</Badge>
            <h2 className="home-how__heading">Three steps to better mental health</h2>
          </div>
          <div className="home-how__steps">
            {STEPS.map(({ number, icon: Icon, title, description }) => (
              <div key={number} className="home-how__step">
                <div className="home-how__step-badge">
                  <span className="home-how__step-number">{number}</span>
                  <Icon className="home-how__step-icon" aria-hidden="true" />
                </div>
                <div className="home-how__step-text">
                  <h3 className="home-how__step-title">{title}</h3>
                  <p className="home-how__step-desc">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ============================================ */}
      {/* 4. ABOUT + PROGRESS BARS                     */}
      {/* ============================================ */}
      <section id="about" className="home-about">
        <Reveal className="home-about__inner">
          <div className="home-about__header">
            <Badge variant="default">About Healing Horizon</Badge>
            <h2 className="home-about__heading">Real results for real lives</h2>
            <p className="home-about__subhead">
              We measure what matters — because every percentage point is a
              person whose life improved.
            </p>
          </div>
          <div className="home-about__bars">
            {IMPACT_BARS.map(({ label, value, valueLabel, barColor }) => (
              <div key={label} className="home-about__bar-item">
                <div className="home-about__bar-header">
                  <span className="home-about__bar-label">{label}</span>
                  <span className="home-about__bar-value">{valueLabel}</span>
                </div>
                <div
                  className="home-about__progress"
                  role="progressbar"
                  aria-valuenow={value}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${label}: ${valueLabel}`}
                >
                  <div
                    className="home-about__progress-fill"
                    style={{ width: `${value}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ============================================ */}
      {/* 5. SELF-ASSESSMENT CARDS                     */}
      {/* ============================================ */}
      <section id="assessments" className="home-assessments">
        <Reveal className="home-assessments__inner">
          <div className="home-assessments__header">
            <h2 className="home-assessments__heading">Explore your wellbeing</h2>
            <p className="home-assessments__subhead">
              Free, private self-assessments to help you understand where you
              stand — no sign-up required for most tools.
            </p>
          </div>
          <div className="home-assessments__grid">
            {ASSESSMENTS.map(({ icon: Icon, title, description, to }) => (
              <Card key={title} hover className="home-assessments__card">
                <div className="home-assessments__card-icon">
                  <Icon aria-hidden="true" />
                </div>
                <h4 className="home-assessments__card-title">{title}</h4>
                <p className="home-assessments__card-desc">{description}</p>
                <Link to={to} className="home-assessments__card-link">
                  Try it free <ChevronRight aria-hidden="true" />
                </Link>
              </Card>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ============================================ */}
      {/* 6. SERVICE GRID                              */}
      {/* ============================================ */}
      <section id="services" className="home-services">
        <Reveal className="home-services__inner">
          <div className="home-services__header">
            <Badge variant="accent">What We Offer</Badge>
            <h2 className="home-services__heading">Everything you need in one place</h2>
          </div>
          <div className="home-services__grid">
            {SERVICES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="home-services__item">
                <div className="home-services__item-icon">
                  <Icon aria-hidden="true" />
                </div>
                <h4 className="home-services__item-title">{title}</h4>
                <p className="home-services__item-desc">{description}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ============================================ */}
      {/* 7. FITNESS / WELLNESS CTA BANNER              */}
      {/* ============================================ */}
      <section className="home-banner">
        <div className="home-banner__inner">
          <Reveal className="home-banner__text">
            <h2 className="home-banner__heading">
              Mind and body — supported together
            </h2>
            <p className="home-banner__body">
              Mental wellness is connected to physical health. Access guided
              meditation, breathing exercises, and wellness routines alongside
              your therapy sessions.
            </p>
            <div className="home-banner__features">
              <span><Clock aria-hidden="true" /> Guided meditation</span>
              <span><Activity aria-hidden="true" /> Breathing exercises</span>
              <span><Globe aria-hidden="true" /> Wellness tracking</span>
            </div>
            <Link to="/register">
              <Button variant="primary" size="lg" rightIcon={ArrowRight}>
                Start Your Wellness Plan
              </Button>
            </Link>
          </Reveal>
          <div className="home-banner__visual" aria-hidden="true">
            <div className="home-banner__circle home-banner__circle--lg" />
            <div className="home-banner__circle home-banner__circle--md" />
            <div className="home-banner__circle home-banner__circle--sm" />
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 8. SPECIALISTS                               */}
      {/* ============================================ */}
      <section id="consultants" className="home-consultants">
        <Reveal className="home-consultants__inner">
          <div className="home-consultants__header">
            <h2 className="home-consultants__heading">Meet our expert consultants</h2>
            <p className="home-consultants__subhead">
              Licensed professionals who understand what you are going through
            </p>
          </div>
          {loading ? (
            <div className="home-consultants__loading">
              <Spinner size="lg" label="Loading consultants" />
            </div>
          ) : (
            <div className="home-consultants__grid">
              {consultants.length > 0 ? (
                consultants.map((c) => (
                  <Card key={c.consultantId} hover className="home-consultants__card">
                    <div className="home-consultants__card-top">
                      <Avatar name={c.name} size="lg" />
                      {c.rating && (
                        <Badge variant="success">
                          <Star aria-hidden="true" />
                          {Number(c.rating).toFixed(1)}
                        </Badge>
                      )}
                    </div>
                    <div className="home-consultants__card-body">
                      <h4 className="home-consultants__card-name">{c.name}</h4>
                      <p className="home-consultants__card-specialty">
                        {c.biography
                          ? c.biography.slice(0, 60) + '...'
                          : 'Licensed consultant'}
                      </p>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="home-consultants__empty">No consultants available at the moment.</p>
              )}
            </div>
          )}
          <div className="home-consultants__action">
            <Link to="/consultants">
              <Button variant="secondary" size="lg" rightIcon={ArrowRight}>
                Browse All Consultants
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ============================================ */}
      {/* 9. TESTIMONIALS + COMMUNITY                   */}
      {/* ============================================ */}
      <section id="testimonials" className="home-testimonials">
        <Reveal className="home-testimonials__inner">
          <div className="home-testimonials__header">
            <Badge variant="accent">Testimonials</Badge>
            <h2 className="home-testimonials__heading">
              A community that understands
            </h2>
            <p className="home-testimonials__subhead">
              Real stories from members who found support through Healing Horizon
            </p>
          </div>
          <div className="home-testimonials__grid">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="home-testimonials__card">
                <p className="home-testimonials__quote">&ldquo;{t.quote}&rdquo;</p>
                <div className="home-testimonials__author">
                  <Avatar name={t.name} size="sm" />
                  <div>
                    <span className="home-testimonials__name">{t.name}</span>
                    <span className="home-testimonials__role">{t.role}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="home-testimonials__action">
            <Link to="/register">
              <Button variant="primary" size="lg" rightIcon={ArrowRight}>
                Join the Community
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ============================================ */}
      {/* 10. DONATE                                    */}
      {/* ============================================ */}
      <section id="donate" className="home-donate">
        <Reveal className="home-donate__inner">
          <div className="home-donate__text">
            <Heart className="home-donate__heart-icon" aria-hidden="true" />
            <h2 className="home-donate__heading">Your support changes lives</h2>
            <p className="home-donate__body">
              Every contribution helps us provide free mental health resources,
              expand our consultant network, and ensure no one is turned away
              because of cost.
            </p>
          </div>
          <div className="home-donate__stats">
            {DONATE_STATS.map(({ value, label }) => (
              <div key={label} className="home-donate__stat">
                <span className="home-donate__stat-value">{value}</span>
                <span className="home-donate__stat-label">{label}</span>
              </div>
            ))}
          </div>
          <Link to="/donate">
            <Button variant="primary" size="lg" rightIcon={TrendingUp}>
              Support Our Mission
            </Button>
          </Link>
        </Reveal>
      </section>

      {/* ============================================ */}
      {/* 11. NEWSLETTER CTA                            */}
      {/* ============================================ */}
      <section id="newsletter" className="home-newsletter">
        <Reveal className="home-newsletter__inner">
          <Mail className="home-newsletter__icon" aria-hidden="true" />
          <h2 className="home-newsletter__heading">Stay informed, stay supported</h2>
          <p className="home-newsletter__subhead">
            Get weekly wellness tips, new feature announcements, and mental
            health resources delivered to your inbox.
          </p>
          <form
            className="home-newsletter__form"
            onSubmit={(e) => {
              e.preventDefault();
            }}
            noValidate
          >
            <Input
              type="email"
              placeholder="you@example.com"
              aria-label="Email address for newsletter"
              className="home-newsletter__input"
            />
            <Button type="submit" variant="primary" rightIcon={Mail}>
              Subscribe Free
            </Button>
          </form>
          <p className="home-newsletter__disclaimer">
            No spam, ever. Unsubscribe anytime.
          </p>
        </Reveal>
      </section>
    </>
  );
}
