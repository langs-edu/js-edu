/** localStorageの薄いラッパ（プライベートモード等で失敗しても落とさない） */

const DRAFT_PREFIX = 'ennichi:runner:';

/** CodeRunner / HtmlRunner の編集内容を `ennichi:runner:{storageKey}` として保存・復元する */
export function loadDraft(key: string): string | null {
  try {
    return localStorage.getItem(DRAFT_PREFIX + key);
  } catch {
    return null;
  }
}

export function saveDraft(key: string, code: string | null): void {
  try {
    if (code === null) localStorage.removeItem(DRAFT_PREFIX + key);
    else localStorage.setItem(DRAFT_PREFIX + key, code);
  } catch {
    /* 保存できない環境では下書きなしで動く */
  }
}
