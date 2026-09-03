/**
 * Calculates the exact age from a birth date string (YYYY-MM-DD)
 * taking into consideration the current date, month, and day.
 */
export function calculateExactAge(birthDateString: string): {
  age: number | null;
  isValidDate: boolean;
  isAdult: boolean;
  message: string;
} {
  if (!birthDateString) {
    return {
      age: null,
      isValidDate: false,
      isAdult: false,
      message: 'Por favor, informe a sua data de nascimento.',
    };
  }

  const parts = birthDateString.split('-');
  if (parts.length !== 3) {
    return {
      age: null,
      isValidDate: false,
      isAdult: false,
      message: 'Formato de data inválido.',
    };
  }

  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1; // 0-indexed
  const birthDay = parseInt(parts[2], 10);

  const birthDate = new Date(birthYear, birthMonth, birthDay);
  if (isNaN(birthDate.getTime())) {
    return {
      age: null,
      isValidDate: false,
      isAdult: false,
      message: 'Data de nascimento inválida.',
    };
  }

  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const monthDiff = today.getMonth() - birthMonth;

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
    age--;
  }

  if (age < 0 || age > 130) {
    return {
      age,
      isValidDate: false,
      isAdult: false,
      message: 'Por favor, insira uma data de nascimento válida.',
    };
  }

  const isAdult = age >= 18;

  if (!isAdult) {
    return {
      age,
      isValidDate: true,
      isAdult: false,
      message: `Esta pesquisa destina-se exclusivamente a maiores de 18 anos. Sua idade calculada é ${age} ${age === 1 ? 'ano' : 'anos'}, portanto o formulário está bloqueado.`,
    };
  }

  return {
    age,
    isValidDate: true,
    isAdult: true,
    message: `Idade confirmada: ${age} anos. Você está apto(a) a responder a pesquisa.`,
  };
}
