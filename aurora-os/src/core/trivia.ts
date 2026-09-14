export interface TriviaQuestion {
  category: string;
  type: 'multiple' | 'boolean';
  difficulty: string;
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
}

export async function fetchTrivia(amount = 10, difficulty = ''): Promise<TriviaQuestion[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const params: Record<string, string> = { amount: String(amount) };
    if (difficulty) params.difficulty = difficulty;
    const qs = new URLSearchParams(params);
    const res = await fetch(`https://opentdb.com/api.php?${qs}`, { signal: controller.signal });
    if (!res.ok) throw new Error('trivia failed');
    const data: { response_code?: number; results?: Array<Record<string, unknown>> } = await res.json();
    if (data?.response_code !== 0 || !Array.isArray(data.results)) throw new Error('trivia bad');
    return data.results.map(r => ({
      category: String(r.category ?? ''),
      type: r.type === 'boolean' ? ('boolean' as const) : ('multiple' as const),
      difficulty: String(r.difficulty ?? ''),
      question: String(r.question ?? ''),
      correctAnswer: String(r.correct_answer ?? ''),
      incorrectAnswers: Array.isArray(r.incorrect_answers) ? r.incorrect_answers.map(String) : [],
    }));
  } finally {
    clearTimeout(timer);
  }
}

export function decodeHtml(s: string): string {
  const txt = document.createElement('textarea');
  txt.innerHTML = s;
  return txt.value;
}