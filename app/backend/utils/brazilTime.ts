/**
 * Utilitários para trabalhar com o horário do Brasil (UTC-3)
 */

/**
 * Retorna a data/hora atual do Brasil (UTC-3)
 */
export function getBrazilNow(): Date {
  const now = new Date();
  return new Date(now.getTime() - (3 * 60 * 60 * 1000));
}

/**
 * Converte uma data UTC para o horário do Brasil (UTC-3)
 */
export function toBrazilTime(date: Date): Date {
  return new Date(date.getTime() - (3 * 60 * 60 * 1000));
}

/**
 * Retorna a data atual do Brasil no formato YYYY-MM-DD
 */
export function getBrazilDateString(): string {
  return getBrazilNow().toISOString().split('T')[0];
}

/**
 * Retorna a data/hora atual do Brasil no formato legível
 */
export function getBrazilDateTime(): string {
  return getBrazilNow().toISOString().replace('T', ' ').substring(0, 19) + ' (Brasil UTC-3)';
}

/**
 * Retorna ontem no horário do Brasil
 */
export function getBrazilYesterday(): Date {
  const today = getBrazilNow();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
}
