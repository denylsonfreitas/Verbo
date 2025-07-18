import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

const TUTORIAL_COMPLETED_KEY = 'verbo_tutorial_completed';
const FIRST_VISIT_KEY = 'verbo_first_visit';

interface TutorialContextType {
  showTutorial: boolean;
  showTutorialManually: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
  hideTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(
  undefined
);

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const firstVisit = localStorage.getItem(FIRST_VISIT_KEY);
    const tutorialCompleted = localStorage.getItem(TUTORIAL_COMPLETED_KEY);

    const isFirstVisit = !firstVisit;
    const hasCompletedTutorial = tutorialCompleted === 'true';

    if (isFirstVisit && !hasCompletedTutorial) {
      setShowTutorial(true);
      localStorage.setItem(FIRST_VISIT_KEY, 'true');
    }
  }, []);

  const completeTutorial = () => {
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
    setShowTutorial(false);
  };

  const showTutorialManually = () => {
    setShowTutorial(true);
  };

  const resetTutorial = () => {
    localStorage.removeItem(TUTORIAL_COMPLETED_KEY);
    localStorage.removeItem(FIRST_VISIT_KEY);
    setShowTutorial(true);
  };

  const hideTutorial = () => setShowTutorial(false);

  return (
    <TutorialContext.Provider
      value={{
        showTutorial,
        showTutorialManually,
        completeTutorial,
        resetTutorial,
        hideTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = (): TutorialContextType => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
};
