import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  VideoIcon,
  ArrowLeft,
  Camera,
  Mic as MicIcon,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  PhoneOff,
  ShieldCheck,
  RefreshCw,
  FileQuestion,
} from 'lucide-react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import Logo from '../../components/brand/Logo';
import useToast from '../../components/ui/useToast';
import useAuth from '../../hooks/useAuth';
import { appointmentService } from '../../services/appointmentService';
import { videoService } from '../../services/videoService';
import { describeWait, getAppointmentTimeStatus } from '../../utils/timeBuckets';
import './VideoSession.css';

export default function VideoSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user, role } = useAuth();

  // The same component serves both the patient and consultant portals (the
  // backend enforces per-appointment ownership for either role). All internal
  // navigation must therefore be role-appropriate.
  const isConsultant = role === 'consultant';
  const backPath = isConsultant ? '/consultant/dashboard' : '/patient/video-sessions';
  const backLabel = isConsultant ? 'Back to dashboard' : 'Back to sessions';
  const dashboardPath = isConsultant ? '/consultant/dashboard' : '/patient/dashboard';

  // A consultant sees the patient as the other party (and themselves as the
  // self-view); a patient sees it the other way around.
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [joined, setJoined] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [roomName, setRoomName] = useState(null);
  const [token, setToken] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);

  // A consultant sees the patient as the other party (and themselves as the
  // self-view); a patient sees it the other way around.
  const selfName = isConsultant
    ? (sessionInfo?.consultantName || 'Consultant')
    : (sessionInfo?.patientName || 'Patient');
  const otherName = isConsultant
    ? (sessionInfo?.patientName || 'Patient')
    : (sessionInfo?.consultantName || 'Consultant');
  const otherSubtitle = isConsultant
    ? 'Patient'
    : (sessionInfo?.specialty || 'Licensed Mental Health Specialist');

  // Jitsi display name must come from the logged-in account (auth context),
  // never re-entered by the user and never the technical room slug.
  const displayName = user?.name || selfName;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [camPerm, setCamPerm] = useState('checking');
  const [micPerm, setMicPerm] = useState('checking');
  const [permError, setPermError] = useState(null);

  const [now, setNow] = useState(() => Date.now());

  const previewVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  // Request camera and microphone permissions and start live preview
  const startPreviewStream = useCallback(async () => {
    try {
      setCamPerm('checking');
      setMicPerm('checking');
      setPermError(null);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;

      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
      }

      setCamPerm('granted');
      setMicPerm('granted');
    } catch (err) {
      const name = err?.name || '';
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setCamPerm('error');
        setMicPerm('error');
        setPermError('No camera or microphone device was found on this device.');
      } else if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
        setCamPerm('denied');
        setMicPerm('denied');
        setPermError('Camera and microphone access was denied. Allow access in your browser settings, then try again.');
      } else {
        setCamPerm('error');
        setMicPerm('error');
        setPermError('Your camera or microphone is unavailable or is in use by another application.');
      }
    }
  }, []);

  useEffect(() => {
    startPreviewStream();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [startPreviewStream]);

  // Handle local video toggle
  useEffect(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((t) => (t.enabled = cameraOn));
    }
  }, [cameraOn]);

  // Handle local audio toggle
  useEffect(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => (t.enabled = micOn));
    }
  }, [micOn]);

  // Fetch appointment session details
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const appt = await appointmentService.getById(id);
        if (!appt) throw new Error('Appointment details not found.');
        setSessionInfo(appt);
        setLoadError(null);
      } catch (err) {
        setLoadError(err.message || 'Failed to load session details');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleJoin = async () => {
    setConnecting(true);
    setJoinError(null);
    try {
      // Stop local preview stream before joining Jitsi call
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }

      const video = await appointmentService.createVideo(id);
      setRoomName(video.roomName);
      setToken(video.token || null);
      setJoined(true);
    } catch (err) {
      setJoinError(err.message || 'Failed to connect to video room.');
      addToast({ type: 'error', title: 'Connection error', message: err.message });
    } finally {
      setConnecting(false);
    }
  };

  // Signal this participant's leave to the backend exactly once per call.
  const leaveSignaledRef = useRef(false);
  const signalLeave = useCallback(() => {
    if (leaveSignaledRef.current) return;
    leaveSignaledRef.current = true;
    videoService.leave(id).catch(() => {});
  }, [id]);

  const handleLeaveConfirm = () => {
    setShowLeaveModal(false);
    signalLeave();
    navigate(backPath);
  };

  // Tab close / browser exit: best-effort leave signal via a keepalive fetch.
  useEffect(() => {
    const onPageHide = () => {
      if (!leaveSignaledRef.current) {
        videoService.leaveBeacon(id);
      }
    };
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [id]);

  const timeStatus = getAppointmentTimeStatus(sessionInfo, now);
  const wait = timeStatus.isEarly && timeStatus.apptTime
    ? describeWait(timeStatus.apptTime, now)
    : null;

  // Tick only while waiting: every second inside the final hour (live
  // countdown), every 30s beyond it (keeps day/bucket transitions fresh),
  // not at all once the lobby is open or the session has ended.
  const tickMs = !timeStatus.isEarly ? 0 : wait?.bucket === 'lobby' ? 1000 : 30000;

  useEffect(() => {
    if (!tickMs) return undefined;
    const t = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(t);
  }, [tickMs]);

  /* ─── State 1: Loading State ─── */
  if (loading) {
    return (
      <div className="vsession">
        <div className="vsession__connecting" aria-busy="true">
          <Spinner size="lg" label="Preparing your session lobby" />
          <p className="vsession__connecting-text">Loading session details...</p>
        </div>
      </div>
    );
  }

  /* ─── State 2: Load Error State ─── */
  if (loadError) {
    return (
      <div className="vsession">
        <button
          type="button"
          className="vsession__back"
          onClick={() => navigate(backPath)}
        >
          <ArrowLeft aria-hidden="true" /> {backLabel}
        </button>
        <div className="vsession__card-state">
          <AlertCircle className="vsession__state-icon vsession__state-icon--error" aria-hidden="true" />
          <h1 className="vsession__state-title">Couldn&rsquo;t Load Session</h1>
          <p className="vsession__state-text">{loadError}</p>
          <div className="vsession__state-actions">
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Retry Connection
            </Button>
            <Link to={backPath}>
              <Button variant="ghost">Return to Sessions</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ─── State 3: Session Expired State ─── */
  if (timeStatus.isExpired) {
    return (
      <div className="vsession">
        <button
          type="button"
          className="vsession__back"
          onClick={() => navigate(backPath)}
        >
          <ArrowLeft aria-hidden="true" /> {backLabel}
        </button>
        <div className="vsession__card-state">
          <Clock className="vsession__state-icon vsession__state-icon--warn" aria-hidden="true" />
          <h1 className="vsession__state-title">This Session Has Ended</h1>
          <p className="vsession__state-text">
            The appointment window for this consultation has closed. If you missed your session or need further guidance, you can book a follow-up appointment or contact support.
          </p>
          <div className="vsession__state-actions">
            {!isConsultant && (
              <Link to="/patient/appointments/book">
                <Button variant="primary">Book Follow-up Appointment</Button>
              </Link>
            )}
            <Link to={dashboardPath}>
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ─── State 4: Waiting For Start State (Too Early) ─── */
  if (timeStatus.isEarly && wait) {
    return (
      <div className="vsession">
        <button
          type="button"
          className="vsession__back"
          onClick={() => navigate(backPath)}
        >
          <ArrowLeft aria-hidden="true" /> {backLabel}
        </button>

        <div className="vsession__card-state">
          {wait.bucket === 'far' ? (
            <Calendar className="vsession__state-icon vsession__state-icon--info" aria-hidden="true" />
          ) : (
            <Clock className="vsession__state-icon vsession__state-icon--info" aria-hidden="true" />
          )}
          <h1 className="vsession__state-title">{wait.title}</h1>
          <p className="vsession__state-text">
            Your appointment with <strong>{otherName}</strong> has been confirmed.
          </p>

          {wait.live ? (
            <div className="vsession__countdown-box vsession__countdown-box--live" role="timer">
              <span className="vsession__countdown-dot" aria-hidden="true" />
              <span className="vsession__countdown-time">{wait.box}</span>
            </div>
          ) : (
            <div className="vsession__countdown-box">
              {wait.bucket === 'far' ? <Calendar aria-hidden="true" /> : <Clock aria-hidden="true" />}
              <span>{wait.box}</span>
            </div>
          )}

          <p className="vsession__state-subtext">{wait.subtext}</p>

          <div className="vsession__state-actions">
            <Button variant="secondary" onClick={() => window.location.reload()} leftIcon={RefreshCw}>
              Refresh Status
            </Button>
            <Link to={dashboardPath}>
              <Button variant="ghost">Return to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ─── State 7: Active Call View (Jitsi Embedded in App Chrome) ─── */
  if (joined && roomName) {
    return (
      <div className="vsession vsession--active-meeting">
        {/* App Chrome Top Header */}
        <header className="vsession__meeting-header">
          <div className="vsession__meeting-brand">
            <Logo variant="dark" size="sm" />
          </div>

          <div className="vsession__meeting-info">
            <Avatar name={otherName} size="sm" />
            <span className="vsession__meeting-consultant">
              Session with {otherName}
            </span>
            <Badge variant="success" className="vsession__meeting-badge">
              <span className="vsession__live-dot" aria-hidden="true" /> In Session
            </Badge>
          </div>

          <Button
            variant="destructive"
            size="sm"
            leftIcon={PhoneOff}
            onClick={() => setShowLeaveModal(true)}
          >
            Leave Call
          </Button>
        </header>

        {/* Embedded Jitsi Meeting Frame */}
        <div className="vsession__iframe-container">
          <JitsiMeeting
            domain="8x8.vc"
            roomName={roomName}
            jwt={token}
            userInfo={{ displayName, email: user?.email || '' }}
            configOverwrite={{
              startWithAudioMuted: !micOn,
              startWithVideoMuted: !cameraOn,
              disableDeepLinking: true,
              prejoinPageEnabled: false,
            }}
            interfaceConfigOverwrite={{
              TOOLBAR_BUTTONS: [
                'microphone',
                'camera',
                'desktop',
                'fullscreen',
                'fodeviceselection',
                'hangup',
                'tileview',
              ],
            }}
            onReadyToClose={() => {
              signalLeave();
              setShowLeaveModal(true);
            }}
            getIFrameRef={(ref) => {
              if (ref) {
                ref.style.height = '100%';
                ref.style.width = '100%';
              }
            }}
          />
        </div>

        {/* State 8: Leave Confirmation Modal */}
        <Modal
          isOpen={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          title="Leave Video Session"
        >
          <div className="vsession__leave-modal">
            <p className="vsession__leave-text">
              Are you sure you want to end your consultation call? You can return to your dashboard or book a follow-up session.
            </p>
            <div className="vsession__leave-actions">
              <Button variant="ghost" onClick={() => setShowLeaveModal(false)}>
                Stay in Call
              </Button>
              <Button variant="destructive" onClick={handleLeaveConfirm}>
                Leave Call
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  /* ─── State 5 & 6: Pre-Call Lobby & Permission-Blocked State ─── */
  const isBlocked = camPerm === 'denied' || micPerm === 'denied' || camPerm === 'error';

  return (
    <div className="vsession">
      <button
        type="button"
        className="vsession__back"
        onClick={() => navigate(backPath)}
      >
        <ArrowLeft aria-hidden="true" /> {backLabel}
      </button>

      {joinError && (
        <Card className="vsession__alert-card">
          <AlertCircle aria-hidden="true" />
          <span>{joinError}</span>
          <Button variant="secondary" size="sm" onClick={handleJoin}>
            Retry
          </Button>
        </Card>
      )}

      <div className="vsession__layout">
        {/* Left Column: Live Video Self-View & Overlaid Controls */}
        <Card className="vsession__preview-card">
          <div className={`vsession__preview${!cameraOn || isBlocked ? ' vsession__preview--off' : ''}`}>
            {/* Live Video Element */}
            <video
              ref={previewVideoRef}
              autoPlay
              playsInline
              muted
              className={`vsession__preview-video${!cameraOn || isBlocked ? ' vsession__preview-video--hidden' : ''}`}
            />

            {/* Camera Off State */}
            {!isBlocked && !cameraOn && (
              <div className="vsession__preview-off-state">
                <Avatar name={selfName} size="lg" />
                <p className="vsession__preview-off-text">Camera is turned off</p>
              </div>
            )}

            {/* State 5: Permission Blocked Overlay directly on Preview Panel */}
            {isBlocked && (
              <div className="vsession__permission-overlay">
                <VideoOff className="vsession__perm-icon" aria-hidden="true" />
                <h3 className="vsession__perm-title">
                  {camPerm === 'denied'
                    ? 'Camera or Microphone Access Blocked'
                    : 'Camera or Microphone Unavailable'}
                </h3>
                <p className="vsession__perm-desc">
                  {permError ||
                    'Healing Horizon needs camera and microphone access so your consultant can see and hear you during the session.'}
                </p>
                <Button variant="primary" size="sm" leftIcon={RefreshCw} onClick={startPreviewStream}>
                  Request Access Again
                </Button>
              </div>
            )}

            {/* Overlaid Mic & Camera Controls Bar */}
            <div className="vsession__overlay-controls">
              <button
                type="button"
                className={`vsession__control-btn${micOn ? '' : ' vsession__control-btn--off'}`}
                onClick={() => setMicOn((p) => !p)}
                aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
                aria-pressed={!micOn}
                disabled={isBlocked}
              >
                {micOn ? <Mic aria-hidden="true" /> : <MicOff aria-hidden="true" />}
              </button>

              <button
                type="button"
                className={`vsession__control-btn${cameraOn ? '' : ' vsession__control-btn--off'}`}
                onClick={() => setCameraOn((p) => !p)}
                aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
                aria-pressed={!cameraOn}
                disabled={isBlocked}
              >
                {cameraOn ? <Video aria-hidden="true" /> : <VideoOff aria-hidden="true" />}
              </button>

              <div className="vsession__overlay-status">
                <span className={`vsession__status-dot${isBlocked ? ' vsession__status-dot--err' : ' vsession__status-dot--ok'}`} aria-hidden="true" />
                <span>{isBlocked ? 'Access Blocked' : cameraOn ? 'Camera & Mic Ready' : 'Camera Off'}</span>
              </div>
            </div>
          </div>

          <div className="vsession__perms-summary">
            <div className="vsession__perm-row">
              <Camera aria-hidden="true" />
              <span>Camera: {camPerm === 'granted' ? 'Allowed' : camPerm === 'denied' ? 'Blocked' : camPerm === 'error' ? 'Unavailable' : 'Checking...'}</span>
            </div>
            <div className="vsession__perm-row">
              <MicIcon aria-hidden="true" />
              <span>Microphone: {micPerm === 'granted' ? 'Allowed' : micPerm === 'denied' ? 'Blocked' : micPerm === 'error' ? 'Unavailable' : 'Checking...'}</span>
            </div>
          </div>
        </Card>

        {/* Right Column: Appointment Details & Join Action */}
        <Card className="vsession__info-card">
          <div className="vsession__info-header">
            <Badge variant="accent">Ready to Join</Badge>
            <h2 className="vsession__info-title">Consultation Lobby</h2>
          </div>

          {sessionInfo && (
            <div className="vsession__consultant">
              <Avatar name={otherName} size="lg" />
              <div>
                <p className="vsession__consultant-name">{otherName}</p>
                <p className="vsession__consultant-specialty">{otherSubtitle}</p>
              </div>
            </div>
          )}

          <div className="vsession__meta">
            <div className="vsession__meta-row">
              <span className="vsession__meta-key">Date</span>
              <span className="vsession__meta-val">{sessionInfo?.appointmentDate || 'Today'}</span>
            </div>
            <div className="vsession__meta-row">
              <span className="vsession__meta-key">Time</span>
              <span className="vsession__meta-val">{sessionInfo?.appointmentTime || 'Scheduled Time'}</span>
            </div>
            <div className="vsession__meta-row">
              <span className="vsession__meta-key">Session ID</span>
              <span className="vsession__meta-val">#{id}</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            leftIcon={VideoIcon}
            loading={connecting}
            onClick={handleJoin}
            disabled={connecting || isBlocked}
            className="vsession__join-btn"
          >
            {connecting ? 'Connecting to Room...' : 'Join Session Now'}
          </Button>

          <div className="vsession__security-note">
            <ShieldCheck aria-hidden="true" />
            <span>Encrypted end-to-end for your privacy and confidentiality.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
