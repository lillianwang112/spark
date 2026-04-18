import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import Ember from '../ember/Ember.jsx';
import MathText from '../common/MathText.jsx';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuickQuiz({ quiz, color, onComplete }) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [emberMood, setEmberMood] = useState('attentive');

  const handleSelect = (idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const correct = idx === quiz.correct;
    setEmberMood(correct ? 'celebrating' : 'encouraging');
    if (correct) {
      setTimeout(() => onComplete?.(), 2400);
    }
  };

  const getOptionState = (idx) => {
    if (!answered) return 'idle';
    if (idx === quiz.correct) return 'correct';
    if (idx === selected) return 'wrong';
    return 'dim';
  };

  const isCorrect = answered && selected === quiz.correct;

  return (
    <div className="space-y-3">
      <MathText text={quiz.question} className="font-body text-sm font-semibold text-text-primary leading-relaxed" as="p" />

      <div className="space-y-2">
        {quiz.options.map((option, idx) => {
          const state = getOptionState(idx);
          return (
            <motion.button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: state === 'dim' ? 0.38 : 1,
                x: 0,
                scale: state === 'correct' ? [1, 1.02, 1] : 1,
              }}
              transition={{ delay: idx * 0.07, duration: 0.28 }}
              whileHover={!answered ? { x: 5 } : {}}
              whileTap={!answered ? { scale: 0.98 } : {}}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-left text-sm font-body font-medium transition-all duration-200"
              style={{
                background:
                  state === 'correct' ? 'rgba(45,147,108,0.1)' :
                  state === 'wrong' ? 'rgba(230,57,70,0.08)' :
                  `${color}08`,
                border: `1.5px solid ${
                  state === 'correct' ? 'rgba(45,147,108,0.4)' :
                  state === 'wrong' ? 'rgba(230,57,70,0.35)' :
                  `${color}20`
                }`,
                boxShadow: state === 'correct' ? '0 4px 16px rgba(45,147,108,0.14)' : 'none',
                cursor: answered ? 'default' : 'pointer',
              }}
            >
              <motion.span
                animate={state === 'correct' ? { scale: [0.8, 1.3, 1] } : state === 'wrong' ? { scale: [1, 0.8, 1] } : {}}
                transition={{ duration: 0.4 }}
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold transition-all duration-200"
                style={{
                  background:
                    state === 'correct' ? '#2D936C' :
                    state === 'wrong' ? '#E63946' :
                    `${color}18`,
                  color:
                    state === 'correct' || state === 'wrong' ? 'white' : color,
                }}
              >
                {state === 'correct' ? '✓' : state === 'wrong' ? '✗' : LETTERS[idx]}
              </motion.span>
              <MathText text={option} className="flex-1 leading-snug" />
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, type: 'spring', stiffness: 320, damping: 24 }}
            className="flex items-start gap-3 px-4 py-3.5 rounded-[18px]"
            style={{
              background: isCorrect ? 'rgba(45,147,108,0.07)' : 'rgba(255,166,43,0.07)',
              border: `1px solid ${isCorrect ? 'rgba(45,147,108,0.22)' : 'rgba(255,166,43,0.22)'}`,
            }}
          >
            <div className="flex-shrink-0">
              <Ember mood={emberMood} size="xs" glowIntensity={0.7} />
            </div>
            <div className="min-w-0">
              <p
                className="text-sm font-body font-semibold"
                style={{ color: isCorrect ? '#2D936C' : '#8B6914' }}
              >
                {isCorrect ? 'Exactly right.' : `Close — the answer is ${LETTERS[quiz.correct]}.`}
              </p>
              {quiz.explanation && (
                <MathText text={quiz.explanation} className="text-xs font-body text-text-secondary mt-1 leading-relaxed block" as="p" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
