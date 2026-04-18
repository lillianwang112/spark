/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
import { initEloScores, applyTrackSaveBoost } from '../models/elo.js';
import { DEFAULT_USER } from '../models/userContext.js';
import { storage } from '../services/storage.js';
import {
  initFirebase,
  ensureGuestSession,
  subscribeToAuthChanges,
  loadUserProfile,
  loadTracks,
  replaceTracks,
  saveUserProfile,
  signInWithGoogle,
  signInWithEmail,
  createEmailAccount,
  signOutUser,
} from '../services/firebase.js';

const initialState = {
  ...DEFAULT_USER,
  eloScores: initEloScores(),
  isLoading: true,
  firebaseReady: false,
  authStatus: 'guest',
  authEmail: null,
};

function mergeTracks(localTracks = [], cloudTracks = []) {
  const merged = new Map();
  [...cloudTracks, ...localTracks].forEach((track) => {
    if (!track?.id) return;
    const existing = merged.get(track.id);
    if (!existing) {
      merged.set(track.id, track);
      return;
    }
    const existingTs = new Date(existing.lastTended || existing.savedAt || 0).getTime();
    const nextTs = new Date(track.lastTended || track.savedAt || 0).getTime();
    merged.set(track.id, nextTs >= existingTs ? { ...existing, ...track } : { ...track, ...existing });
  });
  return Array.from(merged.values());
}

function mergeCloudState(localState, cloudProfile, cloudTracks) {
  const mergedTracks = mergeTracks(localState.tracks, cloudTracks);
  return {
    ...localState,
    ...(cloudProfile || {}),
    eloScores: cloudProfile?.eloScores && Object.keys(cloudProfile.eloScores).length
      ? cloudProfile.eloScores
      : localState.eloScores,
    knowledgeStates: {
      ...(cloudProfile?.knowledgeStates || {}),
      ...(localState.knowledgeStates || {}),
    },
    stats: {
      ...(cloudProfile?.stats || {}),
      ...(localState.stats || {}),
    },
    tracks: mergedTracks,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'INIT_COMPLETE':
      return { ...state, isLoading: false, ...action.payload };
    case 'SET_AGE_GROUP':
      return { ...state, ageGroup: action.payload };
    case 'SET_PERSONALITY':
      return { ...state, personality: action.payload };
    case 'SET_PROFILE':
      return { ...state, ...action.payload };
    case 'COMPLETE_ONBOARDING':
      return { ...state, onboardingComplete: true, ...action.payload };
    case 'RESET_ONBOARDING':
      return { ...state, onboardingComplete: false };
    case 'RECORD_EXPLORATION':
      return {
        ...state,
        stats: {
          ...state.stats,
          nodesExplored: Math.max(state.stats?.nodesExplored || 0, action.payload),
        },
      };
    case 'UPDATE_ELO':
      return { ...state, eloScores: action.payload };
    case 'SET_KNOWLEDGE_STATE': {
      const { nodeId, state: kState } = action.payload;
      return {
        ...state,
        knowledgeStates: { ...state.knowledgeStates, [nodeId]: kState },
      };
    }
    case 'ADD_TRACK': {
      const exists = state.tracks.find((t) => t.id === action.payload.id);
      if (exists) return state;
      return {
        ...state,
        tracks: [...state.tracks, action.payload],
        stats: {
          ...state.stats,
          nodesExplored: (state.stats.nodesExplored || 0) + 1,
        },
        eloScores: applyTrackSaveBoost(action.payload.domain, state.eloScores),
      };
    }
    case 'REMOVE_TRACK':
      return { ...state, tracks: state.tracks.filter((t) => t.id !== action.payload) };
    case 'UPDATE_TRACK':
      return {
        ...state,
        tracks: state.tracks.map((t) => t.id === action.payload.id ? { ...t, ...action.payload } : t),
      };
    case 'SET_EXPLORATION_STYLE':
      return { ...state, explorationStyle: action.payload };
    case 'SET_LEARNING_PREF':
      return { ...state, learningPref: action.payload };
    case 'AUTH_STATE':
      return {
        ...state,
        firebaseReady: action.payload.firebaseReady,
        uid: action.payload.uid,
        authStatus: action.payload.authStatus,
        authEmail: action.payload.authEmail,
      };
    default:
      return state;
  }
}

const UserContext = createContext(null);

export function UserContextProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const latestStateRef = useRef(initialState);
  const syncTimerRef = useRef(null);

  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  useEffect(() => {
    const saved = storage.getUser();
    const savedElo = storage.getElo();
    const savedKnowledge = storage.getKnowledge();
    const savedTracks = storage.getTracks();

    const localState = {
      ...(saved || {}),
      eloScores: savedElo && Object.keys(savedElo).length ? savedElo : initEloScores(),
      knowledgeStates: savedKnowledge || {},
      tracks: savedTracks || [],
    };

    dispatch({ type: 'INIT_COMPLETE', payload: localState });

    if (!initFirebase()) return undefined;

    const unsubscribe = subscribeToAuthChanges(async (user) => {
      if (!user) {
        try {
          await ensureGuestSession();
        } catch {
          dispatch({ type: 'AUTH_STATE', payload: { firebaseReady: true, uid: null, authStatus: 'guest', authEmail: null } });
        }
        return;
      }

      const authStatus = user.isAnonymous ? 'guest' : 'signed_in';
      dispatch({
        type: 'AUTH_STATE',
        payload: {
          firebaseReady: true,
          uid: user.uid,
          authStatus,
          authEmail: user.email || null,
        },
      });

      try {
        const [cloudProfile, cloudTracks] = await Promise.all([
          loadUserProfile(user.uid),
          loadTracks(user.uid),
        ]);
        const merged = mergeCloudState(latestStateRef.current, cloudProfile, cloudTracks);
        dispatch({ type: 'SET_PROFILE', payload: merged });
      } catch {
        // keep local state if cloud load fails
      }
    });

    ensureGuestSession().catch(() => {});
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (state.isLoading) return;
    storage.saveUser({
      ...state,
      isLoading: undefined,
      firebaseReady: undefined,
    });
    storage.saveElo(state.eloScores);
    storage.saveKnowledge(state.knowledgeStates);
    storage.saveTracks(state.tracks);
  }, [state]);

  useEffect(() => {
    if (state.isLoading || !state.firebaseReady || !state.uid) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      const profile = {
        name: state.name || null,
        ageGroup: state.ageGroup,
        personality: state.personality,
        explorationStyle: state.explorationStyle,
        learningPref: state.learningPref,
        onboardingComplete: state.onboardingComplete,
        eloScores: state.eloScores,
        knowledgeStates: state.knowledgeStates,
        stats: state.stats,
        treeStage: state.treeStage,
      };
      saveUserProfile(state.uid, profile).catch(() => {});
      replaceTracks(state.uid, state.tracks || []).catch(() => {});
    }, 500);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [
    state.ageGroup,
    state.eloScores,
    state.explorationStyle,
    state.firebaseReady,
    state.isLoading,
    state.knowledgeStates,
    state.learningPref,
    state.name,
    state.onboardingComplete,
    state.personality,
    state.stats,
    state.tracks,
    state.treeStage,
    state.uid,
  ]);

  const authenticateGoogle = useCallback(async () => {
    const user = await signInWithGoogle();
    return user;
  }, []);

  const authenticateEmail = useCallback(async (email, password) => {
    const user = await signInWithEmail(email, password);
    return user;
  }, []);

  const createAccount = useCallback(async (email, password) => {
    const user = await createEmailAccount(email, password);
    return user;
  }, []);

  const continueAsGuest = useCallback(async () => {
    const user = await ensureGuestSession();
    return user;
  }, []);

  const logout = useCallback(async () => {
    await signOutUser();
    await ensureGuestSession().catch(() => {});
  }, []);

  const setAgeGroup = useCallback((ag) => dispatch({ type: 'SET_AGE_GROUP', payload: ag }), []);
  const setPersonality = useCallback((p) => dispatch({ type: 'SET_PERSONALITY', payload: p }), []);
  const setProfile = useCallback((p) => dispatch({ type: 'SET_PROFILE', payload: p }), []);
  const completeOnboarding = useCallback((p) => dispatch({ type: 'COMPLETE_ONBOARDING', payload: p }), []);
  const updateElo = useCallback((scores) => dispatch({ type: 'UPDATE_ELO', payload: scores }), []);
  const setKnowledgeState = useCallback((nodeId, ks) => dispatch({ type: 'SET_KNOWLEDGE_STATE', payload: { nodeId, state: ks } }), []);
  const addTrack = useCallback((node) => dispatch({ type: 'ADD_TRACK', payload: node }), []);
  const removeTrack = useCallback((id) => dispatch({ type: 'REMOVE_TRACK', payload: id }), []);
  const updateTrack = useCallback((node) => dispatch({ type: 'UPDATE_TRACK', payload: node }), []);
  const setExplorationStyle = useCallback((s) => dispatch({ type: 'SET_EXPLORATION_STYLE', payload: s }), []);
  const setLearningPref = useCallback((p) => dispatch({ type: 'SET_LEARNING_PREF', payload: p }), []);
  const resetOnboarding = useCallback(() => dispatch({ type: 'RESET_ONBOARDING' }), []);
  const recordExploration = useCallback((count) => dispatch({ type: 'RECORD_EXPLORATION', payload: count }), []);

  const actions = useMemo(() => ({
    setAgeGroup,
    setPersonality,
    setProfile,
    completeOnboarding,
    updateElo,
    setKnowledgeState,
    addTrack,
    removeTrack,
    updateTrack,
    setExplorationStyle,
    setLearningPref,
    resetOnboarding,
    recordExploration,
    authenticateGoogle,
    authenticateEmail,
    createAccount,
    continueAsGuest,
    logout,
  }), [
    addTrack,
    authenticateEmail,
    authenticateGoogle,
    completeOnboarding,
    continueAsGuest,
    createAccount,
    logout,
    recordExploration,
    removeTrack,
    resetOnboarding,
    setAgeGroup,
    setExplorationStyle,
    setKnowledgeState,
    setLearningPref,
    setPersonality,
    setProfile,
    updateElo,
    updateTrack,
  ]);

  return (
    <UserContext.Provider value={{ ...state, ...actions }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUserContext must be used within UserContextProvider');
  return ctx;
}
