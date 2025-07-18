import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from 'react';
import { api } from '../services/api';
import { statsService } from '../services/statsService';
import {
  historyService,
  WordHistoryEntry,
  getLocalDateString,
} from '../services/historyService';
import { getErrorFromStatus, validateWordInput } from '../utils/errorUtils';

export interface LetterFeedback {
  letter: string;
  status: 'correct' | 'wrong-position' | 'incorrect';
}

export interface GuessFeedback {
  letters: LetterFeedback[];
}

interface GameState {
  currentGuess: string;
  guesses: GuessFeedback[];
  gameOver: boolean;
  wordLength: number;
  maxGuesses: number;
  wordOfDay: string;
  verbId: string;
  loading: {
    game: boolean;
    submit: boolean;
    validate: boolean;
  };
  win: boolean;
  selectedPosition: number;
  showError: boolean;
  errorMessage: string;
  statsRecorded: boolean;
  hardMode: boolean;
}

type GameAction =
  | { type: 'SET_WORD'; payload: { word: string; verbId: string } }
  | { type: 'ADD_LETTER'; payload: string }
  | { type: 'REMOVE_LETTER' }
  | { type: 'SUBMIT_GUESS' }
  | { type: 'RESET_GAME' }
  | { type: 'SET_LOADING'; payload: { type: 'game' | 'submit' | 'validate'; value: boolean } }
  | { type: 'SET_WIN'; payload: boolean }
  | { type: 'SET_SELECTED_POSITION'; payload: number }
  | { type: 'SHOW_ERROR'; payload: string }
  | { type: 'HIDE_ERROR' }
  | { type: 'LOAD_SAVED_STATE'; payload: Partial<GameState> }
  | { type: 'MARK_STATS_RECORDED' }
  | { type: 'TOGGLE_HARD_MODE' }
  | { type: 'SET_HARD_MODE'; payload: boolean }
  | {
      type: 'INSERT_LETTER_AT_POSITION';
      payload: { letter: string; position: number };
    };

const initialState: GameState = {
  currentGuess: '',
  guesses: [],
  gameOver: false,
  wordLength: 5,
  maxGuesses: 6,
  wordOfDay: '',
  verbId: '',
  loading: {
    game: true,
    submit: false,
    validate: false,
  },
  win: false,
  selectedPosition: 0,
  showError: false,
  errorMessage: '',
  statsRecorded: false,
  hardMode: false,
};

// Funções auxiliares para localStorage
const getGameKey = (date: Date = new Date()) => {
  return `verbo-game-${date.toISOString().split('T')[0]}`;
};

const saveGameState = (state: GameState) => {
  try {
    const gameKey = getGameKey();
    const gameData = {
      currentGuess: state.currentGuess,
      guesses: state.guesses,
      gameOver: state.gameOver,
      wordOfDay: state.wordOfDay,
      wordLength: state.wordLength,
      win: state.win,
      selectedPosition: state.selectedPosition,
      statsRecorded: state.statsRecorded,
      hardMode: state.hardMode,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(gameKey, JSON.stringify(gameData));
  } catch (error) {
    console.error('Erro ao salvar estado do jogo:', error);
  }
};

const loadGameState = (): Partial<GameState> | null => {
  try {
    const gameKey = getGameKey();
    const savedData = localStorage.getItem(gameKey);
    if (savedData) {
      const gameData = JSON.parse(savedData);
      return {
        currentGuess: gameData.currentGuess || '',
        guesses: gameData.guesses || [],
        gameOver: gameData.gameOver || false,
        wordOfDay: gameData.wordOfDay || '',
        wordLength: gameData.wordLength || 5,
        win: gameData.win || false,
        selectedPosition: gameData.selectedPosition || 0,
        statsRecorded: gameData.statsRecorded || false,
        hardMode: gameData.hardMode || false,
      };
    }
  } catch (error) {
    console.error('Erro ao carregar estado do jogo:', error);
  }
  return null;
};

// Funções para gerenciar preferências do hard mode
const HARD_MODE_KEY = 'verbo_hard_mode';

const saveHardModePreference = (enabled: boolean) => {
  try {
    localStorage.setItem(HARD_MODE_KEY, JSON.stringify(enabled));
  } catch (error) {
    console.error('Erro ao salvar preferência de modo hard:', error);
  }
};

const loadHardModePreference = (): boolean => {
  try {
    const saved = localStorage.getItem(HARD_MODE_KEY);
    return saved ? JSON.parse(saved) : false;
  } catch (error) {
    console.error('Erro ao carregar preferência de modo hard:', error);
    return false;
  }
};

function getFeedback(guess: string, word: string): LetterFeedback[] {
  const feedback: LetterFeedback[] = [];
  const wordArr = word.split('');
  const guessArr = guess.split('');
  const used = Array(word.length).fill(false);

  // Primeira passada: corretos
  for (let i = 0; i < guessArr.length; i++) {
    if (guessArr[i] === wordArr[i]) {
      feedback.push({ letter: guessArr[i], status: 'correct' });
      used[i] = true;
    } else {
      feedback.push({ letter: guessArr[i], status: 'incorrect' });
    }
  }
  // Segunda passada: posição errada
  for (let i = 0; i < guessArr.length; i++) {
    if (feedback[i].status === 'correct') continue;
    const idx = wordArr.findIndex((l, j) => l === guessArr[i] && !used[j]);
    if (idx !== -1) {
      feedback[i].status = 'wrong-position';
      used[idx] = true;
    }
  }
  return feedback;
}

// Validação para modo hard
function validateHardModeGuess(
  currentGuess: string,
  previousGuesses: GuessFeedback[]
): { isValid: boolean; error: string } {
  if (previousGuesses.length === 0) {
    return { isValid: true, error: '' };
  }

  // Coletar letras que devem estar presentes (corretas + posição errada)
  const requiredLetters: { letter: string; position?: number }[] = [];
  const mustIncludeLetters: string[] = [];

  previousGuesses.forEach(guess => {
    guess.letters.forEach((letterFeedback, position) => {
      if (letterFeedback.status === 'correct') {
        requiredLetters.push({ letter: letterFeedback.letter, position });
      } else if (letterFeedback.status === 'wrong-position') {
        mustIncludeLetters.push(letterFeedback.letter);
      }
    });
  });

  // Verificar letras corretas nas posições certas
  for (const required of requiredLetters) {
    if (required.position !== undefined) {
      if (currentGuess[required.position] !== required.letter) {
        return {
          isValid: false,
          error: `A ${required.position + 1}ª letra deve ser "${required.letter.toUpperCase()}"`,
        };
      }
    }
  }

  // Verificar se letras amarelas estão incluídas
  for (const letter of mustIncludeLetters) {
    if (!currentGuess.includes(letter)) {
      return {
        isValid: false,
        error: `Deve incluir a letra "${letter.toUpperCase()}"`,
      };
    }
  }

  return { isValid: true, error: '' };
}

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_WORD':
      return {
        ...state,
        wordOfDay: action.payload.word,
        verbId: action.payload.verbId,
        wordLength: action.payload.word.length,
        loading: {
          game: false,
          submit: false,
          validate: false,
        },
        currentGuess: '',
        guesses: [],
        gameOver: false,
        win: false,
        statsRecorded: false,
      };
    case 'SET_LOADING':
      return { 
        ...state, 
        loading: {
          ...state.loading,
          [action.payload.type]: action.payload.value,
        }
      };
    case 'ADD_LETTER':
      if (state.currentGuess.length < state.wordLength && !state.gameOver) {
        return {
          ...state,
          currentGuess: state.currentGuess + action.payload.toLowerCase(),
        };
      }
      return state;
    case 'REMOVE_LETTER':
      if (state.currentGuess.length > 0) {
        // Garantir que a string tenha o tamanho correto preenchendo com espaços
        let newGuess = state.currentGuess;
        while (newGuess.length < state.wordLength) {
          newGuess += ' ';
        }

        const guessArray = newGuess.split('');

        // Se a posição selecionada tem uma letra, remove ela
        if (
          state.selectedPosition < guessArray.length &&
          guessArray[state.selectedPosition] !== ' '
        ) {
          guessArray[state.selectedPosition] = ' ';
          return {
            ...state,
            currentGuess: guessArray.join(''),
          };
        }

        // Se a posição selecionada está vazia, procura a letra anterior mais próxima
        let targetIndex = state.selectedPosition - 1;
        while (targetIndex >= 0 && guessArray[targetIndex] === ' ') {
          targetIndex--;
        }

        if (targetIndex >= 0) {
          guessArray[targetIndex] = ' ';
          return {
            ...state,
            currentGuess: guessArray.join(''),
            selectedPosition: targetIndex,
          };
        }
      }
      return state;
    case 'SUBMIT_GUESS':
      if (
        state.currentGuess.length === state.wordLength &&
        !state.gameOver &&
        !state.loading.validate  // Removido check do submit loading
      ) {
        // Remover espaços da palavra antes de submeter
        const cleanGuess = state.currentGuess.replace(/\s/g, '');

        if (cleanGuess.length === state.wordLength) {
          const feedback = getFeedback(cleanGuess, state.wordOfDay);
          const win =
            cleanGuess.toLowerCase() === state.wordOfDay.toLowerCase();
          const attempts = state.guesses.length + 1;
          const gameOver = win || attempts >= state.maxGuesses;

          return {
            ...state,
            guesses: [...state.guesses, { letters: feedback }],
            currentGuess: '',
            selectedPosition: 0,
            gameOver,
            win,
            loading: {
              ...state.loading,
              submit: false, // Reset loading após submissão
            },
          };
        }
      }
      return state;
    case 'RESET_GAME':
      // Limpar estado salvo quando resetar
      try {
        const gameKey = getGameKey();
        localStorage.removeItem(gameKey);
      } catch (error) {
        console.error('Erro ao limpar estado salvo:', error);
      }
      return {
        ...initialState,
        wordOfDay: state.wordOfDay,
        wordLength: state.wordOfDay.length,
        loading: {
          game: false,
          submit: false,
          validate: false,
        },
        statsRecorded: false,
      };
    case 'SET_WIN':
      return { ...state, win: action.payload };
    case 'SET_SELECTED_POSITION':
      return { ...state, selectedPosition: action.payload };
    case 'INSERT_LETTER_AT_POSITION':
      if (!state.gameOver && action.payload.position < state.wordLength) {
        // Garantir que a string tenha o tamanho correto preenchendo com espaços vazios
        let newGuess = state.currentGuess;
        while (newGuess.length < state.wordLength) {
          newGuess += ' ';
        }

        const guessArray = newGuess.split('');
        guessArray[action.payload.position] =
          action.payload.letter.toLowerCase();

        return {
          ...state,
          currentGuess: guessArray.join(''),
          selectedPosition: Math.min(
            action.payload.position + 1,
            state.wordLength - 1
          ),
        };
      }
      return state;
    case 'SHOW_ERROR':
      return {
        ...state,
        showError: true,
        errorMessage: action.payload,
      };
    case 'HIDE_ERROR':
      return {
        ...state,
        showError: false,
        errorMessage: '',
      };
    case 'LOAD_SAVED_STATE':
      return {
        ...state,
        ...action.payload,
        loading: {
          game: false,
          submit: false,
          validate: false,
        },
      };
    case 'MARK_STATS_RECORDED':
      return {
        ...state,
        statsRecorded: true,
      };
    case 'TOGGLE_HARD_MODE':
      const newHardMode = !state.hardMode;
      saveHardModePreference(newHardMode);
      return {
        ...state,
        hardMode: newHardMode,
      };
    case 'SET_HARD_MODE':
      saveHardModePreference(action.payload);
      return {
        ...state,
        hardMode: action.payload,
      };

    default:
      return state;
  }
};

interface GameContextType {
  gameState: GameState;
  submitGuess: () => void;
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  resetGame: () => void;
  setSelectedPosition: (position: number) => void;
  insertLetterAtPosition: (letter: string, position: number) => void;
  toggleHardMode: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [gameState, dispatch] = useReducer(gameReducer, initialState);

  // Salvar estado automaticamente quando houver mudanças importantes
  useEffect(() => {
    if (gameState.wordOfDay && !gameState.loading.game) {
      saveGameState(gameState);
    }
  }, [
    gameState.currentGuess,
    gameState.guesses,
    gameState.gameOver,
    gameState.win,
    gameState.statsRecorded,
    gameState.loading.game,
  ]);

  // Registrar estatísticas quando o jogo terminar
  useEffect(() => {
    const recordStats = async () => {
      if (
        gameState.gameOver &&
        gameState.wordOfDay &&
        !gameState.loading.game &&
        !gameState.statsRecorded
      ) {
        if (gameState.win) {
          // Registrar vitória com o número de tentativas
          const attempts = gameState.guesses.length;
          statsService.recordWin(attempts);
        } else {
          // Registrar derrota
          statsService.recordLoss();
        }

        // Salvar no histórico
        const today = getLocalDateString();
        const historyEntry: WordHistoryEntry = {
          date: today,
          word: gameState.wordOfDay,
          guesses: gameState.guesses,
          completed: true,
          won: gameState.win,
          attempts: gameState.win
            ? gameState.guesses.length
            : gameState.maxGuesses,
          timestamp: new Date().toISOString(),
        };
        historyService.addEntry(historyEntry);

        // Marcar como registrado para evitar duplicatas
        dispatch({ type: 'MARK_STATS_RECORDED' });
      }
    };

    recordStats();
  }, [
    gameState.gameOver,
    gameState.win,
    gameState.guesses.length,
    gameState.wordOfDay,
    gameState.loading.game,
    gameState.statsRecorded,
    gameState.maxGuesses,
    gameState.verbId,
  ]);

  useEffect(() => {
    const fetchWord = async () => {
      dispatch({ type: 'SET_LOADING', payload: { type: 'game', value: true } });

      // Carregar preferência do hard mode
      const hardModeEnabled = loadHardModePreference();
      dispatch({ type: 'SET_HARD_MODE', payload: hardModeEnabled });

      try {
        const data = await api.get('/api/verb/day');
        const wordOfDay = data?.word || 'comer';
        const verbId = data?.id || '';

        // Tentar carregar estado salvo para o dia de hoje
        const savedState = loadGameState();

        if (savedState && savedState.wordOfDay === wordOfDay) {
          // Se há estado salvo para a palavra de hoje, restaurar
          dispatch({ type: 'LOAD_SAVED_STATE', payload: savedState });
        } else {
          // Caso contrário, iniciar novo jogo
          dispatch({ type: 'SET_WORD', payload: { word: wordOfDay, verbId } });
        }
      } catch (error) {
        dispatch({ type: 'SET_WORD', payload: { word: 'comer', verbId: '' } });
      }
    };
    fetchWord();
  }, []);

  // Nova função para validar palavra antes de submeter
  const submitGuess = async () => {
    if (
      gameState.currentGuess.length !== gameState.wordLength ||
      gameState.gameOver ||
      gameState.loading.submit
    ) {
      return;
    }

    const cleanGuess = gameState.currentGuess.replace(/\s/g, '');

    // Validação básica da entrada
    const inputError = validateWordInput(cleanGuess);
    if (inputError) {
      dispatch({
        type: 'SHOW_ERROR',
        payload: inputError.message,
      });
      setTimeout(() => {
        dispatch({ type: 'HIDE_ERROR' });
      }, 3000);
      return;
    }

    // Verificar se a palavra já foi tentada
    const alreadyTried = gameState.guesses.some(guess => {
      const guessWord = guess.letters.map(l => l.letter).join('');
      return guessWord.toLowerCase() === cleanGuess.toLowerCase();
    });

    if (alreadyTried) {
      dispatch({
        type: 'SHOW_ERROR',
        payload: 'Você já tentou essa palavra!',
      });
      setTimeout(() => {
        dispatch({ type: 'HIDE_ERROR' });
      }, 3000);
      return;
    }

    // Validação do modo hard (se ativado)
    if (gameState.hardMode) {
      const hardModeValidation = validateHardModeGuess(
        cleanGuess,
        gameState.guesses
      );

      if (!hardModeValidation.isValid) {
        dispatch({
          type: 'SHOW_ERROR',
          payload: `Modo Hard: ${hardModeValidation.error}`,
        });
        setTimeout(() => {
          dispatch({ type: 'HIDE_ERROR' });
        }, 3000);
        return;
      }
    }

    // Validação no backend
    dispatch({ type: 'SET_LOADING', payload: { type: 'validate', value: true } });
    
    try {
      const data = await api.get(
        `/api/verb/validate?word=${cleanGuess}`
      );
      
      dispatch({ type: 'SET_LOADING', payload: { type: 'validate', value: false } });
      
      if (!data.valid) {
        dispatch({
          type: 'SHOW_ERROR',
          payload: data.message || 'Palavra inválida!',
        });
        setTimeout(() => {
          dispatch({ type: 'HIDE_ERROR' });
        }, 3000);
        return;
      }
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: { type: 'validate', value: false } });
      
      const appError = getErrorFromStatus(
        error?.response?.status || 500,
        error?.response?.data?.message || 'Erro ao validar palavra!'
      );
      
      dispatch({ type: 'SHOW_ERROR', payload: appError.message });
      setTimeout(() => {
        dispatch({ type: 'HIDE_ERROR' });
      }, 3000);
      return;
    }

    // Submeter a tentativa
    dispatch({ type: 'SUBMIT_GUESS' });
  };

  const addLetter = (letter: string) =>
    dispatch({ type: 'ADD_LETTER', payload: letter });
  const removeLetter = () => dispatch({ type: 'REMOVE_LETTER' });
  const resetGame = () => dispatch({ type: 'RESET_GAME' });
  const setSelectedPosition = (position: number) =>
    dispatch({ type: 'SET_SELECTED_POSITION', payload: position });
  const insertLetterAtPosition = (letter: string, position: number) =>
    dispatch({
      type: 'INSERT_LETTER_AT_POSITION',
      payload: { letter, position },
    });
  const toggleHardMode = () => dispatch({ type: 'TOGGLE_HARD_MODE' });

  const value = {
    gameState,
    submitGuess,
    addLetter,
    removeLetter,
    resetGame,
    setSelectedPosition,
    insertLetterAtPosition,
    toggleHardMode,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
