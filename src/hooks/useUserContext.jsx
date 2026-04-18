/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { initEloScores, applyTrackSaveBoost } from '../models/elo.js';
import { DEFAULT_USER } from '../models/userContext.js';
import { storage } from '../services/storage.js';
import { initFirebase, initAuth, loadUserProfile } from '../services/firebase.js';

// ── State ──

const initialState = {
  ...DEFAULT_USER,
  eloScores: initEloScores(),
  isLoading: true,
  firebaseReady: false,
};

// ── Reducer ──

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

    case 'UPDATE_TRACK': {
      return {
        ...state,
        tracks: state.tracks.map((t) => t.id === action.payload.id ? { ...t, ...action.payload } : t),
      };
    }

    case 'FIREBASE_READY':
      return { ...state, firebaseReady: true, uid: action.payload };

    case 'SET_EXPLORATION_STYLE':
      return { ...state, explorationStyle: action.payload };

    case 'SET_LEARNING_PREF':
      return { ...state, learningPref: action.payload };

    default:
      return state;
  }
}

// ── Context ──

const UserContext = createContext(null);

export function UserContextProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Initialize: load from storage, then Firebase if available
  useEffect(() => {
    async function init() {
      // 1. Load local storage first (instant)
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

      // 2. Try Firebase (non-blocking)
      const fbReady = initFirebase();
      if (fbReady) {
        const user = await initAuth();
        if (user) {
          dispatch({ type: 'FIREBASE_READY', payload: user.uid });
          // Load cloud profile if available
          const cloud = await loadUserProfile(user.uid);
          if (cloud) {
            dispatch({ type: 'SET_PROFILE', payload: cloud });
          }
        }
      }
    }
    init();
  }, []);

  // Persist to localStorage whenever key state changes (debounced via useEffect deps)
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

  const actions = {
    setAgeGroup:       useCallback((ag) => dispatch({ type: 'SET_AGE_GROUP', payload: ag }), []),
    setPersonality:    useCallback((p)  => dispatch({ type: 'SET_PERSONALITY', payload: p }), []),
    setProfile:        useCallback((p)  => dispatch({ type: 'SET_PROFILE', payload: p }), []),
    completeOnboarding:useCallback((p)  => dispatch({ type: 'COMPLETE_ONBOARDING', payload: p }), []),
    updateElo:         useCallback((scores) => dispatch({ type: 'UPDATE_ELO', payload: scores }), []),
    setKnowledgeState: useCallback((nodeId, ks) => dispatch({ type: 'SET_KNOWLEDGE_STATE', payload: { nodeId, state: ks } }), []),
    addTrack:          useCallback((node) => dispatch({ type: 'ADD_TRACK', payload: node }), []),
    removeTrack:       useCallback((id)   => dispatch({ type: 'REMOVE_TRACK', payload: id }), []),
    updateTrack:       useCallback((node) => dispatch({ type: 'UPDATE_TRACK', payload: node }), []),
    setExplorationStyle: useCallback((s) => dispatch({ type: 'SET_EXPLORATION_STYLE', payload: s }), []),
    setLearningPref:   useCallback((p)  => dispatch({ type: 'SET_LEARNING_PREF', payload: p }), []),
    resetOnboarding:   useCallback(()   => dispatch({ type: 'RESET_ONBOARDING' }), []),
    recordExploration: useCallback((count) => dispatch({ type: 'RECORD_EXPLORATION', payload: count }), []),
  };

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
