import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle2, XCircle, Sparkles, ChevronRight, Trophy, Leaf, Volume2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuizQuestion {
  id: string;
  question: string;
  volet: string;
  type_question: string;
  options: Array<{ label: string; image_url?: string; is_correct: boolean }>;
  explication: string | null;
  image_url: string | null;
  sound_url: string | null;
  frequences_bonus: number;
}

interface QuizInteractifProps {
  niveau: string;
  userId: string;
  onComplete?: (score: number, total: number, frequences: number) => void;
}

const voletIcons: Record<string, React.ReactNode> = {
  biodiversite: <Leaf className="w-4 h-4" />,
  bioacoustique: <Volume2 className="w-4 h-4" />,
  geopoetique: <Brain className="w-4 h-4" />,
};

const voletColors: Record<string, string> = {
  biodiversite: 'text-emerald-300 bg-emerald-500/20',
  bioacoustique: 'text-cyan-300 bg-cyan-500/20',
  geopoetique: 'text-amber-300 bg-amber-500/20',
};

const QuizInteractif: React.FC<QuizInteractifProps> = ({ niveau, userId, onComplete }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [totalFrequences, setTotalFrequences] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionKey] = useState(() => crypto.randomUUID());
  const [alreadyAnswered, setAlreadyAnswered] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadQuestions();
    loadPreviousAnswers();
  }, [niveau, userId]);

  const loadPreviousAnswers = async () => {
    const { data } = await supabase
      .from('quiz_responses')
      .select('quiz_question_id')
      .eq('user_id', userId);
    if (data) {
      setAlreadyAnswered(new Set(data.map(r => r.quiz_question_id)));
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('niveau', niveau)
      .eq('is_active', true)
      .order('ordre', { ascending: true });

    if (error) {
      console.error('Error loading quiz:', error);
      setLoading(false);
      return;
    }

    const parsed = (data || []).map(q => ({
      ...q,
      options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string),
    })) as QuizQuestion[];

    setQuestions(parsed);
    setLoading(false);
  };

  const unansweredQuestions = questions.filter(q => !alreadyAnswered.has(q.id));
  const currentQuestion = unansweredQuestions[currentIndex];

  const handleAnswer = async (optionIndex: number) => {
    if (showResult || !currentQuestion) return;
    setSelectedAnswer(optionIndex);
    setShowResult(true);

    const isCorrect = currentQuestion.options[optionIndex]?.is_correct || false;
    const frequencesEarned = isCorrect ? currentQuestion.frequences_bonus : 0;

    if (isCorrect) {
      setScore(prev => prev + 1);
      setTotalFrequences(prev => prev + frequencesEarned);
    }

    // Save response
    await supabase.from('quiz_responses').insert({
      user_id: userId,
      quiz_question_id: currentQuestion.id,
      answer: { selected: optionIndex, label: currentQuestion.options[optionIndex]?.label },
      is_correct: isCorrect,
      frequences_earned: frequencesEarned,
      session_key: sessionKey,
    });

    // Log frequences if correct
    if (isCorrect && frequencesEarned > 0) {
      await supabase.from('frequences_log').insert({
        user_id: userId,
        action: 'quiz_reponse',
        frequences: frequencesEarned,
        multiplicateur: 1.0,
        reference_id: currentQuestion.id,
        reference_type: 'quiz_question',
      });
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= unansweredQuestions.length) {
      setQuizFinished(true);
      onComplete?.(score, unansweredQuestions.length, totalFrequences);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
        <div className="text-emerald-200/60 animate-pulse flex items-center justify-center gap-2">
          <Brain className="w-5 h-5" />
          Chargement du quiz…
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return null; // No quiz questions available
  }

  if (unansweredQuestions.length === 0) {
    return (
      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-400/20 p-6 text-center space-y-3">
        <Trophy className="w-8 h-8 text-amber-400 mx-auto" />
        <p className="text-white font-medium">Quiz complété ! 🎉</p>
        <p className="text-emerald-200/60 text-sm">
          Vous avez répondu à toutes les questions de ce niveau. De nouvelles questions arrivent bientôt !
        </p>
      </div>
    );
  }

  // Start screen
  if (!quizStarted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 rounded-xl border border-emerald-400/20 p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 flex items-center justify-center">
            <Brain className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Quiz Éveil Sensoriel</h3>
            <p className="text-emerald-200/60 text-sm">
              {unansweredQuestions.length} question{unansweredQuestions.length > 1 ? 's' : ''} • Biodiversité, Bioacoustique, Géopoétique
            </p>
          </div>
        </div>

        <p className="text-emerald-200/70 text-sm leading-relaxed">
          Testez vos connaissances sur les trois piliers des Marches du Vivant. Chaque bonne réponse vous rapporte des <span className="text-emerald-300 font-medium">Fréquences</span> bonus !
        </p>

        <div className="flex items-center gap-2 text-xs text-emerald-300/60">
          <Sparkles className="w-4 h-4" />
          <span>Jusqu'à {unansweredQuestions.reduce((acc, q) => acc + q.frequences_bonus, 0)} Fréquences à gagner</span>
        </div>

        <Button
          onClick={() => setQuizStarted(true)}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-12 text-sm font-medium"
        >
          Commencer le quiz
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    );
  }

  // Finished screen
  if (quizFinished) {
    const percentage = Math.round((score / unansweredQuestions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-emerald-500/15 to-amber-500/10 rounded-xl border border-emerald-400/30 p-6 text-center space-y-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
        >
          <Trophy className={`w-12 h-12 mx-auto ${percentage >= 60 ? 'text-amber-400' : 'text-emerald-400'}`} />
        </motion.div>

        <div>
          <h3 className="text-xl font-bold text-white">
            {percentage >= 80 ? 'Exceptionnel ! 🌟' : percentage >= 60 ? 'Bravo ! 🌿' : 'Bien joué ! 🌱'}
          </h3>
          <p className="text-emerald-200/70 text-sm mt-1">
            {score}/{unansweredQuestions.length} bonnes réponses ({percentage}%)
          </p>
        </div>

        {totalFrequences > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 rounded-full px-4 py-2 text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            +{totalFrequences} Fréquences gagnées
          </motion.div>
        )}

        <Button
          onClick={() => {
            setQuizStarted(false);
            setQuizFinished(false);
            setCurrentIndex(0);
            setScore(0);
            setTotalFrequences(0);
            setSelectedAnswer(null);
            setShowResult(false);
            loadPreviousAnswers();
          }}
          variant="outline"
          className="border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/10 rounded-xl"
        >
          Fermer
        </Button>
      </motion.div>
    );
  }

  // Question screen
  return (
    <motion.div
      key={currentQuestion.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
    >
      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / unansweredQuestions.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 ${voletColors[currentQuestion.volet] || 'text-white bg-white/10'}`}>
            {voletIcons[currentQuestion.volet]}
            {currentQuestion.volet === 'biodiversite' ? 'Biodiversité' :
             currentQuestion.volet === 'bioacoustique' ? 'Bioacoustique' : 'Géopoétique'}
          </span>
          <span className="text-emerald-200/40 text-xs">
            {currentIndex + 1}/{unansweredQuestions.length}
          </span>
        </div>

        {/* Image */}
        {currentQuestion.image_url && (
          <div className="rounded-lg overflow-hidden max-h-40">
            <img src={currentQuestion.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Question */}
        <p className="text-white font-medium leading-relaxed">{currentQuestion.question}</p>

        {/* Options */}
        <div className="space-y-2">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrectOption = option.is_correct;

            let optionStyle = 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white';
            if (showResult) {
              if (isCorrectOption) {
                optionStyle = 'bg-emerald-500/20 border-emerald-400/50 text-emerald-100';
              } else if (isSelected && !isCorrectOption) {
                optionStyle = 'bg-red-500/20 border-red-400/50 text-red-200';
              } else {
                optionStyle = 'bg-white/3 border-white/5 text-white/40';
              }
            }

            return (
              <motion.button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={showResult}
                whileTap={!showResult ? { scale: 0.98 } : undefined}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 flex items-center gap-3 ${optionStyle}`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  showResult && isCorrectOption ? 'bg-emerald-500 text-white' :
                  showResult && isSelected && !isCorrectOption ? 'bg-red-500 text-white' :
                  'bg-white/10 text-white/60'
                }`}>
                  {showResult && isCorrectOption ? <CheckCircle2 className="w-4 h-4" /> :
                   showResult && isSelected && !isCorrectOption ? <XCircle className="w-4 h-4" /> :
                   String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm">{option.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {currentQuestion.explication && (
                <div className="bg-white/5 rounded-lg p-3 text-emerald-200/70 text-sm leading-relaxed border border-white/5">
                  💡 {currentQuestion.explication}
                </div>
              )}

              {selectedAnswer !== null && currentQuestion.options[selectedAnswer]?.is_correct && (
                <div className="flex items-center gap-2 text-emerald-300 text-xs">
                  <Sparkles className="w-4 h-4" />
                  +{currentQuestion.frequences_bonus} Fréquence{currentQuestion.frequences_bonus > 1 ? 's' : ''}
                </div>
              )}

              <Button
                onClick={handleNext}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-10 text-sm"
              >
                {currentIndex + 1 >= unansweredQuestions.length ? 'Voir mes résultats' : 'Question suivante'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default QuizInteractif;
