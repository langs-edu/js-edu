import { persistentAtom } from '@nanostores/persistent';
import type { WritableAtom } from 'nanostores';

/**
 * Quiz islandの回答状態。questionsの配列添字 → 選んだ選択肢の添字。
 * storageKeyごとに `ennichi:quiz:{storageKey}` として永続化する。
 */
export type QuizAnswers = Record<number, number>;

const cache = new Map<string, WritableAtom<QuizAnswers>>();

export function getQuizStore(storageKey: string): WritableAtom<QuizAnswers> {
  let store = cache.get(storageKey);
  if (!store) {
    store = persistentAtom<QuizAnswers>(
      `ennichi:quiz:${storageKey}`,
      {},
      {
        encode: JSON.stringify,
        decode: (raw) => {
          try {
            return JSON.parse(raw) as QuizAnswers;
          } catch {
            return {};
          }
        },
      },
    );
    cache.set(storageKey, store);
  }
  return store;
}
