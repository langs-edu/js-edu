import { useStore } from '@nanostores/preact';
import { getQuizStore } from '../../stores/quiz';

interface QuizQuestion {
  q: string;
  choices: string[];
  /** 正解の選択肢の添字（0始まり） */
  answer: number;
  explain: string;
}

interface Props {
  storageKey: string;
  questions: QuizQuestion[];
}

/**
 * レッスン末の理解確認クイズ。選ぶと正誤とexplainを表示する。
 * 回答はstorageKeyごとに `ennichi:quiz:{storageKey}` として保存され、再訪時に復元される。
 */
export default function Quiz({ storageKey, questions }: Props) {
  const store = getQuizStore(storageKey);
  const answers = useStore(store);

  const select = (qIndex: number, choiceIndex: number) => {
    store.set({ ...store.get(), [qIndex]: choiceIndex });
  };

  return (
    <div class="quiz">
      {questions.map((question, qIndex) => {
        const selected = answers[qIndex];
        const answered = selected !== undefined;
        return (
          <div class="quiz-question" key={qIndex}>
            <p class="quiz-q">
              <span class="quiz-q-no">問{qIndex + 1}</span>
              <span>{question.q}</span>
            </p>
            <div class="quiz-choices" role="group" aria-label={`問${qIndex + 1}の選択肢`}>
              {question.choices.map((choice, cIndex) => {
                const isSelected = selected === cIndex;
                const isCorrectChoice = cIndex === question.answer;
                let stateClass = '';
                if (answered && isCorrectChoice) stateClass = 'is-correct';
                else if (answered && isSelected) stateClass = 'is-wrong';
                return (
                  <button
                    key={cIndex}
                    type="button"
                    class={`quiz-choice ${stateClass}`}
                    aria-pressed={isSelected}
                    onClick={() => select(qIndex, cIndex)}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
            {answered && (
              <p class={`quiz-explain ${selected === question.answer ? 'is-correct' : 'is-wrong'}`}>
                {selected === question.answer ? '正解です。' : 'おしい。正解と見くらべてみましょう。'}{' '}
                {question.explain}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
