// Groups.jsx — Collaborative learning groups
// Users co-author curriculum, share a group tree, build syllabi together.

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import Ember from '../components/ember/Ember.jsx';
import { useUserContext } from '../hooks/useUserContext.jsx';
import { DOMAIN_COLORS, DOMAIN_EMOJIS, DOMAIN_LABELS } from '../utils/constants.js';
import AIService from '../ai/ai.service.js';

// ── Storage helpers ──
const STORAGE_KEY = 'spark_groups';
function loadGroups() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveGroups(groups) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(groups)); } catch {}
}

// ── Seeded discovery groups for demo ──
const DISCOVERY_GROUPS = [
  {
    id: 'demo_topology',
    name: 'Shape of Space',
    description: 'Mapping the infinite — from Möbius strips to the geometry of the universe.',
    domain: 'math',
    startNode: 'Topology',
    isPublic: true,
    members: [
      { uid: 'u1', name: 'Alex', color: '#2B59C3', isLeader: true },
      { uid: 'u2', name: 'Sam', color: '#FF6B35', isLeader: false },
      { uid: 'u3', name: 'Jordan', color: '#2D936C', isLeader: false },
      { uid: 'u4', name: 'Riley', color: '#7B2D8B', isLeader: false },
    ],
    syllabus: [
      { id: 's1', label: 'Topology', path: ['Topology'], domain: 'math', approved: true, order: 0 },
      { id: 's2', label: 'Surfaces & Manifolds', path: ['Topology', 'Manifolds'], domain: 'math', approved: true, order: 1 },
      { id: 's3', label: 'Euler Characteristic', path: ['Topology', 'Manifolds', 'Euler Characteristic'], domain: 'math', approved: true, order: 2 },
      { id: 's4', label: 'Knot Theory', path: ['Topology', 'Knot Theory'], domain: 'math', approved: false, order: 3 },
    ],
    memberCount: 4,
    nodesExplored: 63,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    isDemo: true,
  },
  {
    id: 'demo_neuroscience',
    name: 'Inside the Brain',
    description: 'From neurons to consciousness — understanding how thought actually works.',
    domain: 'science',
    startNode: 'Neuroscience',
    isPublic: true,
    members: [
      { uid: 'u5', name: 'Morgan', color: '#2D936C', isLeader: true },
      { uid: 'u6', name: 'Casey', color: '#E07A5F', isLeader: false },
      { uid: 'u7', name: 'Drew', color: '#5B5EA6', isLeader: false },
    ],
    syllabus: [
      { id: 's5', label: 'Action Potentials', path: ['Neuroscience', 'Action Potentials'], domain: 'science', approved: true, order: 0 },
      { id: 's6', label: 'Synaptic Plasticity', path: ['Neuroscience', 'Synaptic Plasticity'], domain: 'science', approved: true, order: 1 },
      { id: 's7', label: 'Memory Formation', path: ['Neuroscience', 'Memory Formation'], domain: 'science', approved: false, order: 2 },
    ],
    memberCount: 3,
    nodesExplored: 38,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    isDemo: true,
  },
  {
    id: 'demo_music_theory',
    name: 'Why Music Moves Us',
    description: 'Chasing the physics and psychology behind chills, groove, and emotion in sound.',
    domain: 'music',
    startNode: 'Music Theory',
    isPublic: true,
    members: [
      { uid: 'u8', name: 'Quinn', color: '#7B2D8B', isLeader: true },
      { uid: 'u9', name: 'Avery', color: '#FF6B35', isLeader: false },
      { uid: 'u10', name: 'Blake', color: '#2B59C3', isLeader: false },
      { uid: 'u11', name: 'Parker', color: '#2D936C', isLeader: false },
      { uid: 'u12', name: 'Sage', color: '#E07A5F', isLeader: false },
    ],
    syllabus: [
      { id: 's8', label: 'Harmony & Tension', path: ['Music Theory', 'Harmony'], domain: 'music', approved: true, order: 0 },
      { id: 's9', label: 'Rhythm & Groove', path: ['Music Theory', 'Rhythm'], domain: 'music', approved: true, order: 1 },
      { id: 's10', label: 'Emotional Response', path: ['Music Theory', 'Music Psychology'], domain: 'music', approved: true, order: 2 },
      { id: 's11', label: 'Microtonality', path: ['Music Theory', 'Microtonality'], domain: 'music', approved: false, order: 3 },
    ],
    memberCount: 5,
    nodesExplored: 91,
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    isDemo: true,
  },
  {
    id: 'demo_ai_ethics',
    name: 'Minds & Machines',
    description: 'What does it mean for AI to think? And what should we do about it?',
    domain: 'cs',
    startNode: 'AI Ethics',
    isPublic: true,
    members: [
      { uid: 'u13', name: 'Rowan', color: '#5B5EA6', isLeader: true },
      { uid: 'u14', name: 'Finley', color: '#FF6B35', isLeader: false },
    ],
    syllabus: [
      { id: 's12', label: 'What is Intelligence?', path: ['AI Ethics', 'Philosophy of Mind'], domain: 'cs', approved: true, order: 0 },
      { id: 's13', label: 'Bias in Algorithms', path: ['AI Ethics', 'Algorithmic Bias'], domain: 'cs', approved: true, order: 1 },
      { id: 's14', label: 'Alignment Problem', path: ['AI Ethics', 'AI Alignment'], domain: 'cs', approved: false, order: 2 },
    ],
    memberCount: 2,
    nodesExplored: 24,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isDemo: true,
  },
];

// ── Member avatar ──
function MemberAvatar({ member, size = 32 }) {
  const initials = (member.name || '?').slice(0, 1).toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center font-body font-bold text-white text-[11px] flex-shrink-0 border-2 border-white"
      style={{ width: size, height: size, background: member.color || '#FF6B35', boxShadow: `0 0 0 1.5px ${member.color}40` }}
      title={member.name}
    >
      {initials}
    </div>
  );
}

// ── Mini tree visualization for group card ──
function GroupTreeMini({ syllabus, domain }) {
  const color = DOMAIN_COLORS[domain] || '#FF6B35';
  const approved = syllabus.filter((s) => s.approved).slice(0, 5);
  const pending = syllabus.filter((s) => !s.approved).slice(0, 2);

  return (
    <div className="flex flex-col gap-1 mt-2">
      {approved.map((node, i) => (
        <div key={node.id} className="flex items-center gap-2">
          <div
            className="flex-shrink-0 rounded-full"
            style={{ width: 8, height: 8, background: color, opacity: 0.85, marginLeft: i * 8 }}
          />
          <span className="text-[11px] font-body text-text-secondary truncate">{node.label}</span>
        </div>
      ))}
      {pending.map((node) => (
        <div key={node.id} className="flex items-center gap-2 opacity-50">
          <div
            className="flex-shrink-0 rounded-full border"
            style={{ width: 8, height: 8, borderColor: color, marginLeft: 8 }}
          />
          <span className="text-[11px] font-body text-text-muted truncate">{node.label}</span>
          <span className="text-[9px] font-mono uppercase text-text-muted">proposed</span>
        </div>
      ))}
    </div>
  );
}

// ── Group card ──
function GroupCard({ group, isMember = false, onOpen, onJoin }) {
  const color = DOMAIN_COLORS[group.domain] || '#FF6B35';
  const emoji = DOMAIN_EMOJIS[group.domain] || '✦';
  const daysSince = Math.floor((Date.now() - new Date(group.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: `0 20px 50px ${color}22` }}
      transition={{ duration: 0.25 }}
      className="rounded-[24px] border border-[rgba(255,255,255,0.78)] bg-[rgba(255,253,247,0.96)] shadow-[0_8px_28px_rgba(42,42,42,0.09)] overflow-hidden cursor-pointer"
      onClick={() => onOpen(group)}
      style={{ borderTop: `3px solid ${color}` }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{emoji}</span>
              <span className="text-[10px] font-mono uppercase tracking-[0.14em]" style={{ color }}>{DOMAIN_LABELS[group.domain] || group.domain}</span>
            </div>
            <h3 className="font-display font-semibold text-text-primary text-lg leading-tight">{group.name}</h3>
          </div>
          {isMember && (
            <span className="flex-shrink-0 text-[10px] font-mono uppercase tracking-[0.1em] px-2 py-1 rounded-full" style={{ background: `${color}18`, color }}>
              Joined
            </span>
          )}
        </div>

        <p className="font-body text-sm text-text-secondary leading-relaxed mb-3">{group.description}</p>

        <GroupTreeMini syllabus={group.syllabus} domain={group.domain} />

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-[rgba(42,42,42,0.06)] flex items-center justify-between">
          {/* Members */}
          <div className="flex items-center gap-1">
            <div className="flex -space-x-2">
              {group.members.slice(0, 4).map((m) => (
                <MemberAvatar key={m.uid} member={m} size={26} />
              ))}
            </div>
            <span className="ml-2 text-[11px] font-body text-text-muted">{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
            <span className="text-text-muted mx-1">·</span>
            <span className="text-[11px] font-body text-text-muted">{group.nodesExplored} nodes</span>
          </div>
          <span className="text-[10px] font-body text-text-muted">{daysSince}d ago</span>
        </div>
      </div>

      {!isMember && (
        <motion.button
          whileHover={{ opacity: 0.9 }}
          whileTap={{ scale: 0.97 }}
          onClick={(e) => { e.stopPropagation(); onJoin(group); }}
          className="w-full py-2.5 text-sm font-body font-semibold text-white transition-all"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}CC)` }}
          aria-label={`Join ${group.name}`}
        >
          Join group →
        </motion.button>
      )}
    </motion.div>
  );
}

// ── Syllabus node row ──
function SyllabusNode({ node, index, isLeader, onApprove, onVote, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`flex items-start gap-3 p-3 rounded-[16px] border transition-all ${
        node.approved
          ? 'bg-[rgba(255,255,255,0.7)] border-[rgba(42,42,42,0.06)]'
          : 'bg-[rgba(42,42,42,0.03)] border-dashed border-[rgba(42,42,42,0.1)]'
      }`}
    >
      {/* Order indicator */}
      <div
        className="flex-shrink-0 rounded-full flex items-center justify-center text-xs font-mono font-bold text-white mt-0.5"
        style={{ width: 24, height: 24, background: node.approved ? color : 'rgba(42,42,42,0.18)' }}
      >
        {node.approved ? index + 1 : '?'}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-body text-sm font-medium ${node.approved ? 'text-text-primary' : 'text-text-muted'}`}>
          {node.label}
        </p>
        {node.path?.length > 1 && (
          <p className="text-[11px] font-body text-text-muted truncate mt-0.5">{node.path.join(' → ')}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!node.approved && (
          <>
            <button
              onClick={() => onVote(node.id)}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-mono font-semibold transition-colors"
              style={{ background: `${color}14`, color }}
            >
              ↑ {node.votes || 0}
            </button>
            {isLeader && (
              <button
                onClick={() => onApprove(node.id)}
                className="px-2 py-1 rounded-full text-[11px] font-mono font-semibold text-white"
                style={{ background: color }}
              >
                Approve
              </button>
            )}
          </>
        )}
        {node.approved && (
          <span className="text-[11px] font-mono text-[#2D936C]">✓</span>
        )}
      </div>
    </motion.div>
  );
}

// ── Group detail view ──
function GroupDetail({ group: initialGroup, currentUser, onBack, onUpdate }) {
  const [group, setGroup] = useState(initialGroup);
  const [tab, setTab] = useState('syllabus');
  const [proposalText, setProposalText] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [justJoined, setJustJoined] = useState(false);

  const color = DOMAIN_COLORS[group.domain] || '#FF6B35';
  const emoji = DOMAIN_EMOJIS[group.domain] || '✦';
  const isMember = group.members.some((m) => m.uid === currentUser?.uid || m.uid === 'local');
  const isLeader = group.members.some((m) => (m.uid === currentUser?.uid || m.uid === 'local') && m.isLeader);
  const approvedNodes = group.syllabus.filter((s) => s.approved).sort((a, b) => a.order - b.order);
  const proposedNodes = group.syllabus.filter((s) => !s.approved);

  const submitProposal = () => {
    if (!proposalText.trim()) return;
    const newNode = {
      id: `node_${Date.now()}`,
      label: proposalText.trim(),
      path: [proposalText.trim()],
      domain: group.domain,
      approved: false,
      order: group.syllabus.length,
      votes: 1,
      proposedBy: currentUser?.name || 'You',
    };
    const updated = { ...group, syllabus: [...group.syllabus, newNode] };
    setGroup(updated);
    onUpdate(updated);
    setProposalText('');
  };

  const approveNode = (nodeId) => {
    const syllabus = group.syllabus.map((n) =>
      n.id === nodeId ? { ...n, approved: true } : n
    );
    const updated = { ...group, syllabus };
    setGroup(updated);
    onUpdate(updated);
  };

  const voteNode = (nodeId) => {
    const syllabus = group.syllabus.map((n) =>
      n.id === nodeId ? { ...n, votes: (n.votes || 0) + 1 } : n
    );
    const updated = { ...group, syllabus };
    setGroup(updated);
    onUpdate(updated);
  };

  const loadAiSuggestions = async () => {
    if (loadingSuggestions || aiSuggestions) return;
    setLoadingSuggestions(true);
    try {
      const explored = approvedNodes.map((n) => n.label).join(', ');
      const result = await AIService.call('nodeChildren', {
        node: group.startNode,
        path: approvedNodes.map((n) => n.label),
        ageGroup: currentUser?.ageGroup || 'college',
        userContext: { topInterests: [group.domain] },
      });
      const suggestions = Array.isArray(result) ? result.slice(0, 3) : [];
      setAiSuggestions(suggestions.map((s) => ({ label: s.label || s.text || s, domain: group.domain })));
    } catch {
      setAiSuggestions([
        { label: 'Deeper into ' + group.startNode, domain: group.domain },
        { label: 'Adjacent concepts', domain: group.domain },
      ]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (tab === 'syllabus' && approvedNodes.length >= 2) {
      loadAiSuggestions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="relative px-4 pt-6 pb-5"
        style={{ background: `linear-gradient(135deg, ${color}14 0%, ${color}07 60%, rgba(255,253,247,0.96) 100%)`, borderBottom: `1px solid ${color}18` }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-body text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          ← Back
        </button>

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span>{emoji}</span>
              <span className="text-[10px] font-mono uppercase tracking-[0.14em]" style={{ color }}>{DOMAIN_LABELS[group.domain] || group.domain}</span>
              {group.isPublic && (
                <span className="text-[10px] font-mono uppercase tracking-[0.1em] px-2 py-0.5 rounded-full" style={{ background: `${color}14`, color }}>Public</span>
              )}
            </div>
            <h1 className="font-display text-2xl font-semibold text-text-primary leading-tight">{group.name}</h1>
            <p className="font-body text-sm text-text-secondary mt-1 leading-relaxed">{group.description}</p>
          </div>
        </div>

        {/* Member strip */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            {group.members.slice(0, 6).map((m) => (
              <MemberAvatar key={m.uid} member={m} size={30} />
            ))}
            {group.members.length > 6 && (
              <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-[rgba(42,42,42,0.4)] border-2 border-white">
                +{group.members.length - 6}
              </div>
            )}
          </div>
          <span className="text-[11px] font-body text-text-muted">{group.memberCount} members · {group.nodesExplored} nodes explored</span>
        </div>

        {justJoined && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-[12px] px-3 py-2 text-sm font-body font-medium"
            style={{ background: `${color}18`, color }}
          >
            ✓ You joined this group! Explore together.
          </motion.div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-2 bg-bg-primary border-b border-[rgba(42,42,42,0.06)]">
        {[
          { id: 'syllabus', label: 'Syllabus' },
          { id: 'members', label: 'Members' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-1.5 rounded-full text-sm font-body font-medium transition-all ${
              tab === id ? 'text-white' : 'text-text-muted hover:text-text-primary'
            }`}
            style={tab === id ? { background: color } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 space-y-4">
        <AnimatePresence mode="wait">
          {tab === 'syllabus' && (
            <motion.div key="syllabus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Approved path */}
              {approvedNodes.length > 0 && (
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted mb-2">Approved path</p>
                  <div className="space-y-2">
                    {approvedNodes.map((node, i) => (
                      <SyllabusNode
                        key={node.id}
                        node={node}
                        index={i}
                        isLeader={isLeader}
                        onApprove={approveNode}
                        onVote={voteNode}
                        color={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Proposed nodes */}
              {proposedNodes.length > 0 && (
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted mb-2">Proposed — vote to approve</p>
                  <div className="space-y-2">
                    {proposedNodes.sort((a, b) => (b.votes || 0) - (a.votes || 0)).map((node, i) => (
                      <SyllabusNode
                        key={node.id}
                        node={node}
                        index={i}
                        isLeader={isLeader}
                        onApprove={approveNode}
                        onVote={voteNode}
                        color={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* AI suggestions */}
              {(loadingSuggestions || aiSuggestions?.length > 0) && (
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted mb-2">Spark suggests next</p>
                  {loadingSuggestions ? (
                    <div className="flex items-center gap-2 text-sm text-text-muted py-2 px-3 rounded-[14px] bg-[rgba(42,42,42,0.04)]">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: color, animation: 'pulse-ember 1s infinite' }} />
                      Generating suggestions...
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions.map((s) => (
                        <button
                          key={s.label}
                          onClick={() => setProposalText(s.label)}
                          className="px-3 py-1.5 rounded-full text-sm font-body transition-all hover:scale-105"
                          style={{ background: `${color}12`, color, border: `1px dashed ${color}40` }}
                        >
                          + {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Propose a node */}
              {isMember && (
                <div className="rounded-[20px] border border-[rgba(42,42,42,0.08)] bg-[rgba(255,255,255,0.7)] p-4">
                  <p className="text-sm font-body font-medium text-text-primary mb-2">Propose the next node</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={proposalText}
                      onChange={(e) => setProposalText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitProposal()}
                      placeholder="E.g. Homotopy Theory..."
                      className="flex-1 rounded-[14px] border border-[rgba(42,42,42,0.08)] bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-[rgba(255,107,53,0.4)]"
                    />
                    <button
                      onClick={submitProposal}
                      disabled={!proposalText.trim()}
                      className="px-4 py-2 rounded-[14px] text-sm font-body font-semibold text-white disabled:opacity-40 transition-opacity"
                      style={{ background: color }}
                    >
                      Propose
                    </button>
                  </div>
                </div>
              )}

              {!isMember && (
                <div className="text-center py-4 text-sm font-body text-text-muted">
                  Join this group to propose new nodes and vote on the syllabus.
                </div>
              )}
            </motion.div>
          )}

          {tab === 'members' && (
            <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {group.members.map((member) => (
                <div
                  key={member.uid}
                  className="flex items-center gap-3 p-3 rounded-[18px] bg-[rgba(255,255,255,0.7)] border border-[rgba(42,42,42,0.06)]"
                >
                  <MemberAvatar member={member} size={40} />
                  <div className="flex-1">
                    <p className="font-body text-sm font-semibold text-text-primary">{member.name}</p>
                    {member.isLeader && (
                      <p className="text-[11px] font-mono uppercase tracking-[0.1em]" style={{ color }}>Group leader</p>
                    )}
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: member.color }} />
                </div>
              ))}

              {isMember && (
                <div className="text-center pt-2">
                  <p className="text-xs font-body text-text-muted">Invite friends by sharing the group name.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Create group modal ──
function CreateGroupModal({ onClose, onCreate, currentUser }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('math');
  const [startNode, setStartNode] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  const DOMAINS_SHOWN = ['math', 'science', 'cs', 'art', 'music', 'history', 'philosophy', 'literature', 'engineering'];

  const handleCreate = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    const newGroup = {
      id: `group_${Date.now()}`,
      name: name.trim(),
      description: description.trim() || `Exploring ${name.trim()} together.`,
      domain,
      startNode: startNode.trim() || name.trim(),
      isPublic,
      members: [{ uid: currentUser?.uid || 'local', name: currentUser?.name || 'You', color: '#FF6B35', isLeader: true }],
      syllabus: [],
      memberCount: 1,
      nodesExplored: 0,
      createdAt: new Date().toISOString(),
      isDemo: false,
    };
    onCreate(newGroup);
    setCreating(false);
    onClose();
  };

  const color = DOMAIN_COLORS[domain] || '#FF6B35';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-3 pb-3"
      style={{ background: 'rgba(42,42,42,0.4)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="w-full max-w-lg rounded-[28px] bg-[rgba(255,253,247,0.98)] shadow-[0_32px_80px_rgba(42,42,42,0.22)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-text-primary">Start a group</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-[rgba(42,42,42,0.06)] flex items-center justify-center text-text-muted hover:bg-[rgba(42,42,42,0.1)] transition-colors text-sm">✕</button>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-[0.12em] text-text-muted mb-1.5">Group name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Shape of Space"
              className="w-full rounded-[16px] border border-[rgba(42,42,42,0.08)] bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-[rgba(255,107,53,0.4)]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-[0.12em] text-text-muted mb-1.5">What you'll explore (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One sentence about your group's mission..."
              className="w-full rounded-[16px] border border-[rgba(42,42,42,0.08)] bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-[rgba(255,107,53,0.4)]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-[0.12em] text-text-muted mb-1.5">Starting topic (optional)</label>
            <input
              type="text"
              value={startNode}
              onChange={(e) => setStartNode(e.target.value)}
              placeholder="e.g. Topology, Impressionism, Thermodynamics..."
              className="w-full rounded-[16px] border border-[rgba(42,42,42,0.08)] bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-[rgba(255,107,53,0.4)]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-[0.12em] text-text-muted mb-2">Domain</label>
            <div className="flex flex-wrap gap-1.5">
              {DOMAINS_SHOWN.map((d) => {
                const dc = DOMAIN_COLORS[d] || '#FF6B35';
                const isSelected = domain === d;
                return (
                  <button
                    key={d}
                    onClick={() => setDomain(d)}
                    className="px-3 py-1 rounded-full text-xs font-body font-medium transition-all"
                    style={isSelected
                      ? { background: dc, color: 'white', boxShadow: `0 4px 12px ${dc}40` }
                      : { background: `${dc}12`, color: dc }
                    }
                  >
                    {DOMAIN_EMOJIS[d]} {DOMAIN_LABELS[d] || d}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 px-4 rounded-[16px] bg-[rgba(42,42,42,0.04)]">
            <div>
              <p className="text-sm font-body font-medium text-text-primary">Public group</p>
              <p className="text-xs font-body text-text-muted">Anyone can discover and join</p>
            </div>
            <button
              onClick={() => setIsPublic((p) => !p)}
              className={`relative w-11 h-6 rounded-full transition-all ${isPublic ? 'bg-[#2D936C]' : 'bg-[rgba(42,42,42,0.15)]'}`}
            >
              <motion.div
                animate={{ x: isPublic ? 20 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
              />
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="w-full py-3.5 rounded-[18px] text-sm font-body font-semibold text-white disabled:opacity-40 transition-opacity"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}CC)` }}
          >
            {creating ? 'Creating...' : `Start "${name.trim() || 'group'}" →`}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Groups page ──
export default function Groups() {
  const user = useUserContext();
  const [tab, setTab] = useState('yours');
  const [myGroups, setMyGroups] = useState(() => loadGroups());
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const allMyGroupIds = useMemo(() => new Set(myGroups.map((g) => g.id)), [myGroups]);

  const handleJoin = useCallback((group) => {
    const joined = {
      ...group,
      members: [
        ...group.members,
        { uid: user.uid || 'local', name: user.name || 'You', color: '#FF6B35', isLeader: false },
      ],
      memberCount: group.memberCount + 1,
    };
    const updated = [...myGroups, joined];
    setMyGroups(updated);
    saveGroups(updated);
    setSelectedGroup(joined);
  }, [myGroups, user]);

  const handleCreate = useCallback((newGroup) => {
    const updated = [newGroup, ...myGroups];
    setMyGroups(updated);
    saveGroups(updated);
    setSelectedGroup(newGroup);
  }, [myGroups]);

  const handleUpdate = useCallback((updatedGroup) => {
    const updated = myGroups.map((g) => g.id === updatedGroup.id ? updatedGroup : g);
    setMyGroups(updated);
    saveGroups(updated);
  }, [myGroups]);

  const handleOpen = useCallback((group) => {
    setSelectedGroup(group);
  }, []);

  // Show group detail
  if (selectedGroup) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <GroupDetail
          group={selectedGroup}
          currentUser={user}
          onBack={() => setSelectedGroup(null)}
          onUpdate={handleUpdate}
        />
      </div>
    );
  }

  const discoverGroups = DISCOVERY_GROUPS.filter((g) => !allMyGroupIds.has(g.id));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Hero */}
      <div className="px-4 pt-6 pb-4" style={{ background: 'linear-gradient(135deg, rgba(91,94,166,0.1) 0%, rgba(255,107,53,0.06) 60%, rgba(255,253,247,0.96) 100%)', borderBottom: '1px solid rgba(91,94,166,0.12)' }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[rgba(91,94,166,0.7)]">Together</p>
            <h1 className="font-display text-2xl font-semibold text-text-primary mt-0.5">Groups</h1>
            <p className="font-body text-sm text-text-secondary mt-1">
              Co-author a curriculum. Build a shared tree. Learn together.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowCreate(true)}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-[18px] text-sm font-body font-semibold text-white shadow-[0_6px_20px_rgba(91,94,166,0.32)]"
            style={{ background: 'linear-gradient(135deg, #7B6CF6, #5B5EA6)' }}
          >
            <span className="text-base">+</span> New
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-2 border-b border-[rgba(42,42,42,0.06)]">
        {[
          { id: 'yours', label: `Yours${myGroups.length > 0 ? ` (${myGroups.length})` : ''}` },
          { id: 'discover', label: `Discover${discoverGroups.length > 0 ? ` (${discoverGroups.length})` : ''}` },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-1.5 rounded-full text-sm font-body font-medium transition-all ${
              tab === id ? 'bg-[#5B5EA6] text-white' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <AnimatePresence mode="wait">
          {tab === 'yours' && (
            <motion.div key="yours" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {myGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                  <Ember mood="curious" size="lg" glowIntensity={0.4} />
                  <div>
                    <p className="font-display text-lg font-semibold text-text-primary">No groups yet</p>
                    <p className="font-body text-sm text-text-secondary mt-1 max-w-xs">
                      Start a group with friends, or join a public one to explore a topic together.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreate(true)}
                      className="px-5 py-2.5 rounded-full text-sm font-body font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #7B6CF6, #5B5EA6)' }}
                    >
                      Start a group
                    </button>
                    <button
                      onClick={() => setTab('discover')}
                      className="px-5 py-2.5 rounded-full text-sm font-body font-semibold text-[#5B5EA6] bg-[rgba(91,94,166,0.1)]"
                    >
                      Browse groups
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {myGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      isMember
                      onOpen={handleOpen}
                      onJoin={handleJoin}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'discover' && (
            <motion.div key="discover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <p className="text-xs font-body text-text-muted mb-3">Public groups exploring interesting threads right now.</p>
              {discoverGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  isMember={allMyGroupIds.has(group.id)}
                  onOpen={handleOpen}
                  onJoin={handleJoin}
                />
              ))}
              {discoverGroups.length === 0 && (
                <p className="text-center py-8 font-body text-sm text-text-muted">
                  You've joined all the featured groups! Create your own.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateGroupModal
            onClose={() => setShowCreate(false)}
            onCreate={handleCreate}
            currentUser={user}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
