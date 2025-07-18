import { GuessFeedback, LetterFeedback } from '../contexts/GameContext';

interface ShareData {
  guesses: GuessFeedback[];
  win: boolean;
  maxGuesses: number;
  gameNumber?: number;
}

// Mapear status para emojis
const getEmojiForStatus = (
  status: 'correct' | 'wrong-position' | 'incorrect'
): string => {
  switch (status) {
    case 'correct':
      return '🟩'; // Verde - letra correta na posição correta
    case 'wrong-position':
      return '🟨'; // Amarelo - letra existe mas posição errada
    case 'incorrect':
      return '⬜'; // Branco - letra não existe na palavra
    default:
      return '⬜';
  }
};

// Gerar texto de compartilhamento estilo Wordle
export const generateShareText = (data: ShareData): string => {
  const { guesses, win, maxGuesses, gameNumber } = data;

  // Cabeçalho
  const attempts = win ? guesses.length : 'X';
  const gameInfo = gameNumber ? `Verbo #${gameNumber}` : 'Verbo';
  const header = `${gameInfo} ${attempts}/${maxGuesses}`;

  // Converter tentativas para emojis
  const emojiLines = guesses.map(guess =>
    guess.letters
      .map((letter: LetterFeedback) => getEmojiForStatus(letter.status))
      .join('')
  );

  // Montar texto final
  const shareText = [
    header,
    '',
    ...emojiLines,
    '',
    'Jogue em: https://verbo.game', // Substitua pela URL real
  ].join('\n');

  return shareText;
};

// Função para copiar para clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Tentar usar a API moderna
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback para navegadores mais antigos
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    return successful;
  } catch (error) {
    console.error('Erro ao copiar para clipboard:', error);
    return false;
  }
};

// Função para compartilhar nativo (mobile)
export const shareNative = async (data: ShareData): Promise<boolean> => {
  if (!navigator.share) {
    return false;
  }

  try {
    const shareText = generateShareText(data);
    await navigator.share({
      title: 'Meu resultado no Verbo',
      text: shareText,
    });
    return true;
  } catch (error) {
    // Usuário cancelou ou erro
    return false;
  }
};
