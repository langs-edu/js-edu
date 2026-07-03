export type CourseKey = 'hajimete' | 'nagare' | 'matomeru' | 'sekkei' | 'dom' | 'koubou';

export interface CourseInfo {
  key: CourseKey;
  no: number;
  title: string;
  tagline: string;
  description: string;
  total: number;
  /** 前提コース（複数可）。ここに挙げたコースを学習済みである前提で書かれている */
  prerequisites?: CourseKey[];
  /** 前提ではないが、あわせて読むと理解が深まるコース */
  recommended?: CourseKey[];
}

export const COURSES: CourseInfo[] = [
  {
    key: 'hajimete',
    no: 1,
    title: 'はじめてのJavaScript',
    tagline: 'インストールなしで、今夜から遊べる',
    description:
      'JavaScriptはブラウザの言語。何もインストールせずに、このページの中で最初のコードを動かすところから始めます。',
    total: 8,
  },
  {
    key: 'nagare',
    no: 2,
    title: 'プログラムの流れ',
    tagline: '上から下へ、ときどき分かれて、くりかえす',
    description:
      'プログラムは上から順に読まれます。その流れを、if文で分岐させ、while・forでくりかえし、名前のついた手順（関数）にまとめます。',
    total: 7,
    prerequisites: ['hajimete'],
  },
  {
    key: 'matomeru',
    no: 3,
    title: 'データをまとめる',
    tagline: 'ひとつの名前で、たくさんの値を',
    description:
      '値をひとつずつ持つ暮らしから、配列やオブジェクトで集めて・並べて・対応づける暮らしへ。JSの心臓部であるオブジェクトに出会います。',
    total: 7,
    prerequisites: ['nagare'],
  },
  {
    key: 'sekkei',
    no: 4,
    title: '関数とオブジェクトのかたち',
    tagline: '関数が値である、ということ',
    description:
      'アロー関数・コールバック・map/filter/find・class・JSON・例外——JSらしさの核心を、このコースでまとめて正面から扱います。',
    total: 8,
    prerequisites: ['matomeru'],
  },
  {
    key: 'dom',
    no: 5,
    title: 'ブラウザとDOM',
    tagline: 'ページという舞台に、手を伸ばす',
    description:
      'document・querySelector・addEventListener——ブラウザの中でJavaScriptが実際に何をしているかに触れます。ここからはHtmlRunnerでHTML+JSを一緒に動かします。',
    total: 6,
    prerequisites: ['sekkei'],
  },
  {
    key: 'koubou',
    no: 6,
    title: '小さな道具をつくる',
    tagline: '縁日の思い出を、持って帰れるかたちに',
    description:
      '最後のコースは、ブラウザで動く読書メモWebアプリ「hondana」をゼロから作ります。設計し、localStorageに保存し、node:testで固め、道具として完成させます。',
    total: 6,
    prerequisites: ['sekkei', 'dom'],
  },
];

export function courseByKey(key: string): CourseInfo | undefined {
  return COURSES.find((c) => c.key === key);
}
