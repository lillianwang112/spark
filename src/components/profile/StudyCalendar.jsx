import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import { DOMAIN_COLORS } from '../../utils/domainColors.js';

// ── Persistence ──────────────────────────────────────────────────────────────
const SESSIONS_KEY = 'spark_study_sessions';

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

// ── Tiny uid helper ───────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Date helpers ─────────────────────────────────────────────────────────────
function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayStr() {
  return toDateStr(new Date());
}

function buildRecentDays(count = 84) {
  const days = [];
  for (let i = count - 1; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    days.push(day);
  }
  return days;
}

function buildMonthGrid(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getWeekDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Monday-based week
  const dayOfWeek = today.getDay(); // 0=Sun
  const monday = new Date(today);
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(today.getDate() + offsetToMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// ── Type config ──────────────────────────────────────────────────────────────
const SESSION_TYPES = [
  { value: 'explore',    label: 'Explore',   emoji: '🔍' },
  { value: 'review',     label: 'Review',    emoji: '🔄' },
  { value: 'deep_dive',  label: 'Deep dive', emoji: '🕳️' },
  { value: 'practice',   label: 'Practice',  emoji: '💪' },
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

function typeEmoji(type) {
  return SESSION_TYPES.find((t) => t.value === type)?.emoji || '📖';
}

function domainColor(domain) {
  return DOMAIN_COLORS[domain] || '#FF6B35';
}

// ── Heatmap intensity ────────────────────────────────────────────────────────
function heatmapColor(count) {
  if (count >= 4) return '#2D936C';
  if (count >= 2) return '#79C99E';
  if (count >= 1) return '#CBEBD9';
  return 'rgba(42,42,42,0.08)';
}

// ── Stats row ────────────────────────────────────────────────────────────────
function StatsRow({ sessions }) {
  const weekDays = getWeekDays();
  const weekKeys = new Set(weekDays.map(toDateStr));
  const monthKey = toDateStr(new Date()).slice(0, 7);

  const thisWeekCount = sessions.filter((s) => weekKeys.has(s.date)).length;
  const thisMonthMinutes = sessions
    .filter((s) => s.date.startsWith(monthKey))
    .reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.completed).length;
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  const stats = [
    { label: 'Sessions this week', value: thisWeekCount, suffix: '' },
    { label: 'Hours this month', value: Math.round(thisMonthMinutes / 60 * 10) / 10, suffix: 'h' },
    { label: 'Completion rate', value: completionRate, suffix: '%' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-[18px] bg-[rgba(255,107,53,0.06)] border border-[rgba(255,107,53,0.12)] p-3 text-center"
        >
          <p className="font-display text-2xl font-semibold text-text-primary leading-none">
            {stat.value}
            <span className="text-sm text-spark-ember">{stat.suffix}</span>
          </p>
          <p className="font-body text-[11px] text-text-muted mt-1 leading-tight">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Heatmap strip ─────────────────────────────────────────────────────────────
function HeatmapStrip({ sessionsMap, dailyActivity }) {
  const days = useMemo(() => buildRecentDays(84), []);
  const [hoveredKey, setHoveredKey] = useState(null);

  // Merge session counts with dailyActivity
  function getCombinedCount(dateKey) {
    const sessions = (sessionsMap[dateKey] || []).length;
    const activity = dailyActivity[dateKey] || 0;
    return Math.max(sessions, activity);
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Last 12 weeks</p>
        {hoveredKey && (
          <motion.span
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-mono text-[11px] text-text-muted"
          >
            {hoveredKey} — {getCombinedCount(hoveredKey)} session{getCombinedCount(hoveredKey) !== 1 ? 's' : ''}
          </motion.span>
        )}
      </div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}
      >
        {days.map((day) => {
          const key = toDateStr(day);
          const count = getCombinedCount(key);
          return (
            <div
              key={key}
              className="h-3.5 rounded-[4px] cursor-default transition-transform hover:scale-110"
              style={{ backgroundColor: heatmapColor(count) }}
              title={`${key}: ${count} session${count !== 1 ? 's' : ''}`}
              onMouseEnter={() => setHoveredKey(key)}
              onMouseLeave={() => setHoveredKey(null)}
            />
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[10px] font-body text-text-muted">
        <span className="inline-flex items-center gap-1">
          <i className="inline-block h-2.5 w-2.5 rounded" style={{ background: 'rgba(42,42,42,0.08)' }} />
          0
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="inline-block h-2.5 w-2.5 rounded bg-[#CBEBD9]" />
          1
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="inline-block h-2.5 w-2.5 rounded bg-[#79C99E]" />
          2–3
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="inline-block h-2.5 w-2.5 rounded bg-[#2D936C]" />
          4+
        </span>
      </div>
    </div>
  );
}

// ── Schedule panel (shown inline below a row in the grid) ────────────────────
function SchedulePanel({ date, sessionsForDay, userTracks, onAdd, onDelete, onToggleComplete, onClose }) {
  const [topic, setTopic] = useState('');
  const [domain, setDomain] = useState('general');
  const [duration, setDuration] = useState(30);
  const [type, setType] = useState('explore');
  const [note, setNote] = useState('');

  const trackPills = (userTracks || []).slice(0, 6);

  function pickTrack(track) {
    setTopic(track.label || '');
    setDomain(track.domain || 'general');
  }

  function handleAdd() {
    if (!topic.trim()) return;
    onAdd({
      id: uid(),
      date,
      topicLabel: topic.trim(),
      topicDomain: domain,
      duration,
      type,
      note: note.trim(),
      completed: false,
      completedAt: null,
    });
    setTopic('');
    setNote('');
  }

  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
      animate={{ opacity: 1, y: 0, scaleY: 1 }}
      exit={{ opacity: 0, y: -6, scaleY: 0.96 }}
      transition={{ duration: 0.22, ease: [0.34, 1.1, 0.64, 1] }}
      style={{ transformOrigin: 'top center' }}
      className="col-span-7 bg-[rgba(255,253,247,0.98)] rounded-[18px] border border-[rgba(255,107,53,0.18)] shadow-[0_12px_32px_rgba(42,42,42,0.13)] p-4 mt-1 mb-2"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-text-primary text-base">{displayDate}</h3>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-[rgba(42,42,42,0.07)] text-text-muted hover:bg-[rgba(42,42,42,0.13)] transition-colors text-sm"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Existing sessions */}
      {sessionsForDay.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {sessionsForDay.map((s) => {
            const color = domainColor(s.topicDomain);
            return (
              <div
                key={s.id}
                className="flex items-center gap-2 rounded-[12px] px-3 py-2 border"
                style={{
                  borderColor: `${color}30`,
                  background: s.completed ? 'rgba(42,42,42,0.04)' : `${color}0D`,
                }}
              >
                <button
                  onClick={() => onToggleComplete(s.id)}
                  className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                  style={{
                    borderColor: s.completed ? '#2D936C' : `${color}70`,
                    background: s.completed ? '#2D936C' : 'transparent',
                  }}
                  aria-label={s.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {s.completed && <span className="text-white text-[10px] leading-none">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <span
                    className="font-body text-sm text-text-primary truncate block"
                    style={{ textDecoration: s.completed ? 'line-through' : 'none', opacity: s.completed ? 0.55 : 1 }}
                  >
                    {typeEmoji(s.type)} {s.topicLabel}
                  </span>
                  <span className="font-mono text-[10px] text-text-muted">{s.duration} min</span>
                </div>
                <button
                  onClick={() => onDelete(s.id)}
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-text-muted hover:bg-[rgba(200,50,50,0.1)] hover:text-red-400 transition-colors text-xs"
                  aria-label="Delete session"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add form */}
      <div className="space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Add session</p>

        {/* Topic input */}
        <div>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="What will you study?"
            className="w-full rounded-[14px] border border-[rgba(42,42,42,0.1)] bg-white px-3 py-2 text-sm font-body text-text-primary outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[rgba(255,107,53,0.2)] transition-colors"
          />
          {/* Quick-add from userTracks */}
          {trackPills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {trackPills.map((track) => {
                const color = domainColor(track.domain);
                return (
                  <button
                    key={track.id || track.label}
                    onClick={() => pickTrack(track)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-body border transition-colors hover:opacity-80"
                    style={{
                      borderColor: `${color}40`,
                      background: `${color}12`,
                      color: color,
                    }}
                  >
                    {track.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Duration picker */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-1.5">Duration</p>
          <div className="flex flex-wrap gap-1.5">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className="px-3 py-1 rounded-full text-xs font-mono border transition-colors"
                style={{
                  background: duration === d ? '#FF6B35' : 'transparent',
                  borderColor: duration === d ? '#FF6B35' : 'rgba(42,42,42,0.15)',
                  color: duration === d ? '#fff' : 'rgba(42,42,42,0.65)',
                }}
              >
                {d < 60 ? `${d}m` : `${d / 60}h`}
              </button>
            ))}
          </div>
        </div>

        {/* Type picker */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-1.5">Type</p>
          <div className="flex flex-wrap gap-1.5">
            {SESSION_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className="px-3 py-1 rounded-full text-xs font-body border transition-colors"
                style={{
                  background: type === t.value ? 'rgba(255,107,53,0.1)' : 'transparent',
                  borderColor: type === t.value ? '#FF6B35' : 'rgba(42,42,42,0.15)',
                  color: type === t.value ? '#FF6B35' : 'rgba(42,42,42,0.65)',
                  fontWeight: type === t.value ? 600 : 400,
                }}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Note field */}
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Optional note..."
          className="w-full rounded-[14px] border border-[rgba(42,42,42,0.08)] bg-[rgba(42,42,42,0.02)] px-3 py-2 text-sm font-body text-text-primary outline-none focus:border-[rgba(255,107,53,0.4)] transition-colors"
        />

        {/* Submit */}
        <button
          onClick={handleAdd}
          disabled={!topic.trim()}
          className="w-full py-2.5 rounded-full bg-[#FF6B35] text-white text-sm font-body font-semibold hover:bg-[#e85d28] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(255,107,53,0.3)]"
        >
          Schedule it
        </button>
      </div>
    </motion.div>
  );
}

// ── This-week session list ────────────────────────────────────────────────────
function WeekView({ weekDays, sessionsMap, onToggleComplete, onDelete }) {
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = todayStr();

  const hasAnySessions = weekDays.some((d) => (sessionsMap[toDateStr(d)] || []).length > 0);

  if (!hasAnySessions) {
    return (
      <div className="text-center py-6">
        <p className="font-body text-text-muted text-sm">No sessions scheduled this week.</p>
        <p className="font-body text-text-muted text-xs mt-1">Click any day above to add one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {weekDays.map((day, i) => {
        const key = toDateStr(day);
        const sessions = sessionsMap[key] || [];
        const isToday = key === today;

        if (sessions.length === 0) return null;

        return (
          <div key={key}>
            <p
              className="font-mono text-[11px] uppercase tracking-wider mb-1.5"
              style={{ color: isToday ? '#FF6B35' : 'rgba(42,42,42,0.45)' }}
            >
              {DAY_LABELS[i]} {day.getDate()}
              {isToday && <span className="ml-1.5 text-[10px] normal-case tracking-normal">today</span>}
            </p>
            <div className="space-y-1.5">
              {sessions.map((s) => {
                const color = domainColor(s.topicDomain);
                return (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="flex items-center gap-2.5 rounded-[14px] overflow-hidden border"
                    style={{
                      borderColor: `${color}25`,
                      background: s.completed ? 'rgba(42,42,42,0.03)' : `${color}0A`,
                    }}
                  >
                    {/* Colored left bar */}
                    <div
                      className="w-1 self-stretch flex-shrink-0"
                      style={{ background: s.completed ? 'rgba(42,42,42,0.15)' : color }}
                    />
                    <div className="flex-1 min-w-0 py-2.5 pr-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-base leading-none flex-shrink-0">{typeEmoji(s.type)}</span>
                        <span
                          className="font-body text-sm text-text-primary truncate"
                          style={{
                            textDecoration: s.completed ? 'line-through' : 'none',
                            opacity: s.completed ? 0.5 : 1,
                          }}
                        >
                          {s.topicLabel}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-text-muted mt-0.5">
                        {s.duration < 60 ? `${s.duration}m` : `${s.duration / 60}h`} · {s.type.replace('_', ' ')}
                        {s.note && ` · ${s.note}`}
                      </p>
                    </div>
                    {/* Complete checkbox */}
                    <button
                      onClick={() => onToggleComplete(s.id)}
                      className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors mr-1"
                      style={{
                        borderColor: s.completed ? '#2D936C' : `${color}60`,
                        background: s.completed ? '#2D936C' : 'transparent',
                      }}
                      aria-label={s.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {s.completed && <span className="text-white text-[10px] leading-none">✓</span>}
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => onDelete(s.id)}
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-[rgba(200,50,50,0.07)] rounded-full transition-colors mr-1 text-sm"
                      aria-label="Delete session"
                    >
                      ×
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function StudyCalendar({ dailyActivity = {}, userTracks = [] }) {
  // State
  const [sessions, setSessions] = useState(() => loadSessions());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewDate, setViewDate] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  // Persist on change
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  // Derived
  const sessionsMap = useMemo(() => {
    const map = {};
    for (const s of sessions) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [sessions]);

  const weekDays = useMemo(() => getWeekDays(), []);

  // Session operations
  function addSession(session) {
    setSessions((prev) => [...prev, session]);
  }

  function deleteSession(id) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  function toggleComplete(id) {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              completed: !s.completed,
              completedAt: !s.completed ? new Date().toISOString() : null,
            }
          : s
      )
    );
  }

  function handleSelectDay(dateStr) {
    setSelectedDate((prev) => (prev === dateStr || dateStr === null ? null : dateStr));
  }

  const panelSessions = selectedDate ? (sessionsMap[selectedDate] || []) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.07 }}
      className="bg-bg-secondary rounded-card shadow-card p-5"
    >
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-semibold text-text-primary">Study Calendar</h2>
          <p className="font-body text-xs text-text-muted mt-0.5">Plan and track your learning sessions.</p>
        </div>
      </div>

      {/* Stats row */}
      <StatsRow sessions={sessions} />

      {/* Heatmap strip */}
      <HeatmapStrip sessionsMap={sessionsMap} dailyActivity={dailyActivity} />

      {/* Divider */}
      <div className="border-t border-[rgba(42,42,42,0.06)] mb-5" />

      {/* Monthly calendar */}
      <MonthCalendarWithPanel
        viewDate={viewDate}
        setViewDate={setViewDate}
        sessionsMap={sessionsMap}
        selectedDate={selectedDate}
        onSelectDay={handleSelectDay}
        panelSessions={panelSessions}
        userTracks={userTracks}
        onAdd={addSession}
        onDelete={deleteSession}
        onToggleComplete={toggleComplete}
      />

      {/* Divider */}
      <div className="border-t border-[rgba(42,42,42,0.06)] mb-5" />

      {/* This week */}
      <div>
        <p className="font-display font-semibold text-text-primary mb-3">This week</p>
        <WeekView
          weekDays={weekDays}
          sessionsMap={sessionsMap}
          onToggleComplete={toggleComplete}
          onDelete={deleteSession}
        />
      </div>
    </motion.div>
  );
}

// ── MonthCalendarWithPanel — unified grid + panel ────────────────────────────
// Keeps the panel fully wired (needs access to add/delete/toggle).
function MonthCalendarWithPanel({
  viewDate,
  setViewDate,
  sessionsMap,
  selectedDate,
  onSelectDay,
  panelSessions,
  userTracks,
  onAdd,
  onDelete,
  onToggleComplete,
}) {
  const cells = useMemo(() => buildMonthGrid(viewDate), [viewDate]);
  const today = todayStr();
  const monthLabel = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const rows = useMemo(() => {
    const r = [];
    for (let i = 0; i < cells.length; i += 7) r.push(cells.slice(i, i + 7));
    return r;
  }, [cells]);

  function rowContainsSelected(row) {
    if (!selectedDate) return false;
    return row.some((cell) => cell && toDateStr(cell) === selectedDate);
  }

  return (
    <div className="mb-5">
      {/* Nav */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-text-primary">{monthLabel}</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            className="w-8 h-8 rounded-full bg-[rgba(42,42,42,0.07)] text-text-primary hover:bg-[rgba(42,42,42,0.13)] transition-colors flex items-center justify-center text-base"
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            onClick={() => {
              const n = new Date();
              setViewDate(new Date(n.getFullYear(), n.getMonth(), 1));
            }}
            className="px-3 h-8 rounded-full bg-[rgba(42,42,42,0.07)] text-text-secondary text-xs font-body hover:bg-[rgba(42,42,42,0.13)] transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            className="w-8 h-8 rounded-full bg-[rgba(42,42,42,0.07)] text-text-primary hover:bg-[rgba(42,42,42,0.13)] transition-colors flex items-center justify-center text-base"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center font-mono text-[10px] uppercase tracking-wider text-text-muted py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {rows.map((row, rowIdx) => {
          const panelOpen = rowContainsSelected(row);

          return (
            <div key={rowIdx}>
              <div className="grid grid-cols-7 gap-1">
                {row.map((cell, cellIdx) => {
                  if (!cell) {
                    return <div key={`empty-${rowIdx}-${cellIdx}`} className="h-[72px]" />;
                  }
                  const key = toDateStr(cell);
                  const isToday = key === today;
                  const isSelected = key === selectedDate;
                  const daySessions = sessionsMap[key] || [];
                  const shown = daySessions.slice(0, 2);
                  const extra = daySessions.length - 2;

                  return (
                    <button
                      key={key}
                      onClick={() => onSelectDay(key)}
                      className="h-[72px] rounded-[12px] border text-left p-1.5 flex flex-col transition-all hover:shadow-[0_4px_14px_rgba(42,42,42,0.10)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
                      style={{
                        borderColor: isSelected
                          ? '#FF6B35'
                          : isToday
                          ? 'rgba(255,107,53,0.35)'
                          : 'rgba(42,42,42,0.07)',
                        background: isSelected
                          ? 'rgba(255,107,53,0.07)'
                          : isToday
                          ? 'rgba(255,107,53,0.03)'
                          : 'rgba(255,255,255,0.65)',
                      }}
                      aria-label={`${key}${daySessions.length ? `, ${daySessions.length} sessions` : ''}`}
                      aria-pressed={isSelected}
                    >
                      <div className="flex items-start justify-between">
                        <span
                          className="font-body text-xs leading-none"
                          style={{
                            fontWeight: isToday ? 700 : 400,
                            color: isToday || isSelected ? '#FF6B35' : 'rgba(42,42,42,0.65)',
                          }}
                        >
                          {cell.getDate()}
                        </span>
                        {daySessions.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5 bg-[#2D936C]" />
                        )}
                      </div>
                      <div className="mt-1 flex flex-col gap-0.5 flex-1 overflow-hidden">
                        {shown.map((s) => {
                          const color = domainColor(s.topicDomain);
                          return (
                            <span
                              key={s.id}
                              className="block truncate rounded-[5px] px-1 py-0.5 text-[9px] font-body leading-tight"
                              style={{ background: `${color}1E`, color }}
                            >
                              {s.topicLabel}
                            </span>
                          );
                        })}
                        {extra > 0 && (
                          <span className="font-mono text-[9px] text-text-muted pl-0.5">+{extra} more</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Inline schedule panel after this row */}
              <AnimatePresence>
                {panelOpen && selectedDate && (
                  <SchedulePanel
                    key={selectedDate}
                    date={selectedDate}
                    sessionsForDay={panelSessions}
                    userTracks={userTracks}
                    onAdd={onAdd}
                    onDelete={onDelete}
                    onToggleComplete={onToggleComplete}
                    onClose={() => onSelectDay(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
