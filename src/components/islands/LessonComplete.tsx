import { useStore } from '@nanostores/preact';
import { markDone, progress } from '../../stores/progress';

interface Props {
  lessonId: string;
  nextHref?: string;
  nextTitle?: string;
}

/** レッスン末尾の「読み終えた」ボタン。押すと、あなたのレッスンに提灯の灯がともる。 */
export default function LessonComplete({ lessonId, nextHref, nextTitle }: Props) {
  const data = useStore(progress);
  const done = data.lessons[lessonId]?.done ?? false;

  return (
    <div class={`lesson-complete ${done ? 'is-done' : ''}`}>
      {done ? (
        <>
          <p class="lesson-complete-msg">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8" />
              <path
                d="M8 12.5l2.5 2.5L16 9.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            このレッスンには、もう灯がともっています。
          </p>
          <div class="lesson-complete-actions">
            <button type="button" class="lesson-undone" onClick={() => markDone(lessonId, false)}>
              まだ途中にする
            </button>
            {nextHref && (
              <a class="btn btn-primary" href={nextHref}>
                つぎへ：{nextTitle ?? 'つぎのレッスン'}
              </a>
            )}
          </div>
        </>
      ) : (
        <button type="button" class="btn btn-primary" onClick={() => markDone(lessonId, true)}>
          このレッスンを読み終えた
        </button>
      )}
    </div>
  );
}
