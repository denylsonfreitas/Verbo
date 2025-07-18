import { useState, useEffect } from 'react';

const TUTORIAL_COMPLETED_KEY = 'verbo_tutorial_completed';
const FIRST_VISIT_KEY = 'verbo_first_visit';

interface TutorialState {
  showTutorial: boolean;
  isFirstVisit: boolean;
  hasCompletedTutorial: boolean;
}

export const useTutorial = () => {
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    showTutorial: false,
    isFirstVisit: true,
    hasCompletedTutorial: false,
  });

  // Função global para debug (adicionar ao window)
  if (typeof window !== 'undefined') {
    (window as any).debugTutorial = {
      reset: () => {
        localStorage.removeItem(TUTORIAL_COMPLETED_KEY);
        localStorage.removeItem(FIRST_VISIT_KEY);
        window.location.reload();
      },
      show: () => {
        setTutorialState(prev => ({ ...prev, showTutorial: true }));
      },
      status: () => {
        const firstVisit = localStorage.getItem(FIRST_VISIT_KEY);
        const tutorialCompleted = localStorage.getItem(TUTORIAL_COMPLETED_KEY);
      },
    };
  }

  useEffect(() => {
    // Verificar se é a primeira visita
    const firstVisit = localStorage.getItem(FIRST_VISIT_KEY);
    const tutorialCompleted = localStorage.getItem(TUTORIAL_COMPLETED_KEY);

    const isFirstVisit = !firstVisit;
    const hasCompletedTutorial = tutorialCompleted === 'true';

    // Se é primeira visita e não completou tutorial, mostrar
    const shouldShowTutorial = isFirstVisit && !hasCompletedTutorial;

    setTutorialState({
      showTutorial: shouldShowTutorial,
      isFirstVisit,
      hasCompletedTutorial,
    });

    // Marcar que já visitou (mas não que completou o tutorial ainda)
    if (isFirstVisit) {
      localStorage.setItem(FIRST_VISIT_KEY, 'true');
    }
  }, []);

  const completeTutorial = () => {
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
    setTutorialState(prev => ({
      ...prev,
      showTutorial: false,
      hasCompletedTutorial: true,
    }));
  };

  const showTutorialManually = () => {
    setTutorialState(prev => ({
      ...prev,
      showTutorial: true,
    }));
  };

  const hideTutorial = () => {
    setTutorialState(prev => ({
      ...prev,
      showTutorial: false,
    }));
  };

  const resetTutorial = () => {
    localStorage.removeItem(TUTORIAL_COMPLETED_KEY);
    localStorage.removeItem(FIRST_VISIT_KEY);
    setTutorialState({
      showTutorial: true,
      isFirstVisit: true,
      hasCompletedTutorial: false,
    });
  };

  return {
    ...tutorialState,
    completeTutorial,
    showTutorialManually,
    hideTutorial,
    resetTutorial,
  };
};
