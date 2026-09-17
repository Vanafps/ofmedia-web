export interface CastMember {
  name: string;
  role: string;
  avatar?: string;
  isCreator?: boolean;
}

export interface Episode {
  id: string;
  number: number;
  title: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  storyboard?: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  titleLogo?: string;
  subtitle?: string;
  description: string;
  year: number;
  country: string;
  duration: string;
  ageRating: string;
  genres: string[];
  poster: string;
  backdrop: string;
  videoUrl: string;
  isSeries?: boolean;
  episodes?: Episode[];
  cast: CastMember[];
  directors: string[];
  releaseDate: string;
  production?: string;
  audioTrack?: string;
  audioTracks?: string[];
  subtitles?: string[];
  fullSynopsis?: string;
  stills?: string[];
  storyboard?: string;
  isOriginal?: boolean;
}

export const PROJECTS_DATA: Project[] = [
  {
    id: 'clip',
    slug: 'clip',
    title: 'Клип — Школа 2070',
    titleLogo: '/logos/clip_title_exact.png',
    subtitle: 'Главная премьера года • Видеоклип на гимн',
    description: 'Видеоклип на гимн Школы 2070. В нём задействованы любимые учителя, яркие локации и одноклассники.',
    year: 2026,
    country: 'Россия',
    duration: '4 мин',
    ageRating: '6+',
    genres: ['Музыкальное', 'Комедия', 'Клип'],
    poster: '/posters/poster_clip.png',
    backdrop: '/backdrops/clip_tilda_bg.png',
    videoUrl: 'https://raw.githubusercontent.com/Vanafps/ofmedia-media/main/clip/master.m3u8',
    storyboard: '/storyboards/clip.webp',
    isOriginal: true,
    isSeries: false,
    episodes: [
      {
        id: 'clip-ep1',
        number: 1,
        title: 'Клип — Школа 2070 (Официальное видео)',
        duration: '03:30',
        thumbnail: '/posters/poster_clip.png',
        videoUrl: 'https://raw.githubusercontent.com/Vanafps/ofmedia-media/main/clip/master.m3u8',
        storyboard: '/storyboards/clip.webp'
      }
    ],
    directors: ['Екатерина Морозова', 'Дарья Ш.'],
    releaseDate: '29 января 2026',
    audioTracks: ['Русский (Original Stereo)'],
    subtitles: ['Русские'],
    fullSynopsis: 'Масштабный видеоклип на гимн Школы 2070. Проект объединил учеников разных классов и педагогический состав в динамичном музыкальном путешествии по школьным коридорам, классам и актовому залу.',
    stills: ['/backdrops/clip_tilda_bg.png'],
    cast: [
      { name: 'Екатерина Морозова', role: 'Автор идеи, Актёр массовых сцен', avatar: '/actors/ekaterina_morozova_exact.jpg', isCreator: true },
      { name: 'Дарья Ш.', role: 'Креативный продюсер, Главный оператор, Актёр массовых сцен', avatar: '/actors/daria_shishkina_exact.jpg', isCreator: true },
      { name: 'Анфиса М.', role: 'Ассистент креативного продюсера, Оператор-постановщик, Актёр массовых сцен', avatar: '/actors/anfisa_m_exact.jpg', isCreator: true },
      { name: 'Иван Л.', role: 'Режиссёр монтажа', avatar: '/actors/ivan_lepo_exact.png', isCreator: true },
      { name: 'Мария Кольцова', role: 'Актёр массовых сцен', avatar: '/actors/maria_koltsova_exact.jpg' },
      { name: 'Ильмира Тимохина', role: 'Актёр массовых сцен', avatar: '/actors/ilmira_timokhina_exact.jpg' },
      { name: 'Ирина Макарова', role: 'Актёр массовых сцен', avatar: '/actors/irina_makarova_exact.jpg' },
      { name: 'Леонид Морозов', role: 'Актёр массовых сцен', avatar: '/actors/leonid_morozov_exact.jpg' },
      { name: 'Галина Слободянюк', role: 'Актёр массовых сцен', avatar: '/actors/galina_slobodyanyuk_exact.jpg' },
      { name: 'Марина Душенко', role: 'Актёр массовых сцен', avatar: '/actors/marina_dushenko_exact.jpg' },
      { name: 'Кирилл Зиновьев', role: 'Актёр массовых сцен', avatar: '/actors/kirill_zinoviev_exact.jpg' },
      { name: 'Дмитрий Зотов', role: 'Актёр массовых сцен', avatar: '/actors/dmitriy_zotov_exact.jpg' },
      { name: 'Всеволод Б.', role: 'Актёр массовых сцен', avatar: '/actors/vsevolod_b_exact.png' },
      { name: 'Давид М.', role: 'Актёр массовых сцен', avatar: '/actors/david_m_exact.png' },
      { name: 'Роман Л.', role: 'Актёр массовых сцен', avatar: '/actors/roman_l_exact.png' },
      { name: 'Илья А.', role: 'Актёр массовых сцен', avatar: '/actors/ilya_a_exact.png' },
    ]
  },
  {
    id: 'park',
    slug: 'park',
    title: 'Поездка в парк',
    titleLogo: '/logos/park_title_exact.png',
    subtitle: 'Комедийный влог-приключение',
    description: 'Весёлое и полное неожиданностей путешествие команды по городскому парку отдыха: аттракционы, юмор и атмосфера дружбы.',
    year: 2024,
    country: 'Россия',
    duration: '28 мин',
    ageRating: '12+',
    genres: ['Комедия', 'Приключения', 'Влог'],
    poster: '/posters/poster_park.png',
    backdrop: '/backdrops/park_tilda_bg.png',
    videoUrl: 'https://raw.githubusercontent.com/Vanafps/ofmedia-media/main/park/master.m3u8',
    storyboard: '/storyboards/park.webp',
    isOriginal: true,
    isSeries: false,
    episodes: [
      {
        id: 'park-ep1',
        number: 1,
        title: 'Поездка в парк — Полная версия',
        duration: '28:29',
        thumbnail: '/posters/poster_park.png',
        videoUrl: 'https://raw.githubusercontent.com/Vanafps/ofmedia-media/main/park/master.m3u8',
        storyboard: '/storyboards/park.webp'
      }
    ],
    directors: ['Екатерина М.', 'Иван Л.'],
    releaseDate: '15 июня 2024',
    audioTracks: ['Русский (Stereo)'],
    subtitles: ['Русские'],
    fullSynopsis: 'Влог-путешествие компании друзей в парк развлечений. Зрителей ждут испытания на аттракционах, искренние эмоции, забавные челленджи и тёплые дружеские моменты.',
    stills: ['/backdrops/park_tilda_bg.png'],
    cast: [
      { name: 'Иван Л.', role: 'Режиссёр монтажа, Главный оператор', avatar: '/actors/ivan_lepo_exact.png', isCreator: true },
      { name: 'Алексей М.', role: 'Оператор-постановщик', avatar: '/actors/aleksey_m_exact.png', isCreator: true },
      { name: 'Екатерина М.', role: 'event-продюсер', avatar: '/actors/ekaterina_morozova_exact.jpg', isCreator: true }
    ]
  },
  {
    id: 'nalim',
    slug: 'nalim',
    title: 'Налим — Постановка',
    titleLogo: '/logos/nalim_title_exact.png',
    subtitle: 'Школьная театральная экранизация классики А.П. Чехова',
    description: 'Экранизация классического юмористического рассказа А.П. Чехова «Налим» в оригинальной постановке команды OFMEDIA.',
    year: 2024,
    country: 'Россия',
    duration: '8 мин',
    ageRating: '6+',
    genres: ['Комедия', 'Постановка', 'Шоу'],
    poster: '/posters/poster_nalim.png',
    backdrop: '/backdrops/nalim_tilda_bg.png',
    videoUrl: 'https://raw.githubusercontent.com/Vanafps/ofmedia-media/main/nalim/master.m3u8',
    storyboard: '/storyboards/nalim.webp',
    isOriginal: true,
    isSeries: false,
    episodes: [
      {
        id: 'nalim-ep1',
        number: 1,
        title: 'Налим — Короткометражный фильм-спектакль',
        duration: '07:31',
        thumbnail: '/posters/poster_nalim.png',
        videoUrl: 'https://raw.githubusercontent.com/Vanafps/ofmedia-media/main/nalim/master.m3u8',
        storyboard: '/storyboards/nalim.webp'
      }
    ],
    directors: ['Екатерина Валерьевна', 'Иван Л.'],
    releaseDate: '10 октября 2024',
    audioTracks: ['Русский (Stereo)'],
    subtitles: ['Русские'],
    fullSynopsis: 'Живая экранизация знаменитого чеховского рассказа о попытках поймать упрямого налима под корягой. Юмор, колоритные персонажи и классический текст.',
    stills: ['/backdrops/nalim_tilda_bg.png'],
    cast: [
      { name: 'Всеволод Б.', role: 'Барин', avatar: '/actors/vsevolod_b_exact.png' },
      { name: 'Дарья Ш.', role: 'Рассказчик-1', avatar: '/actors/daria_shishkina_exact.jpg' },
      { name: 'Матвей С.', role: 'Актёр', avatar: '/actors/matvey_s_exact.png' },
      { name: 'Даниил А.', role: 'Актёр', avatar: '/actors/daniil_a_exact.png' },
      { name: 'Иван Л.', role: 'Рассказчик-2, Старик, Режиссёр монтажа', avatar: '/actors/ivan_lepo_exact.png', isCreator: true },
      { name: 'Екатерина Валерьевна', role: 'Автор идеи, Режиссёр, Оператор-постановщик', avatar: '/actors/ekaterina_morozova_exact.jpg', isCreator: true }
    ]
  },
  {
    id: 'ng',
    slug: 'ng',
    title: 'Новогодний корпоратив',
    titleLogo: '/logos/ng_title_exact.png',
    subtitle: 'Праздничный комедийный спецвыпуск',
    description: 'Яркое новогоднее праздничное шоу с Дедом Морозом, танцами, песнями, поздравлениями и уютной атмосферой праздника.',
    year: 2024,
    country: 'Россия',
    duration: '16 мин',
    ageRating: '6+',
    genres: ['Комедия', 'Шоу', 'Музыкальное'],
    poster: '/posters/poster_ng.png',
    backdrop: '/backdrops/ng_tilda_bg.png',
    videoUrl: 'https://raw.githubusercontent.com/Vanafps/ofmedia-media/main/ng/master.m3u8',
    storyboard: '/storyboards/ng.webp',
    isOriginal: true,
    isSeries: false,
    episodes: [
      {
        id: 'ng-ep1',
        number: 1,
        title: 'Новогодний корпоратив 2024–2025',
        duration: '15:36',
        thumbnail: '/posters/poster_ng.png',
        videoUrl: 'https://raw.githubusercontent.com/Vanafps/ofmedia-media/main/ng/master.m3u8',
        storyboard: '/storyboards/ng.webp'
      }
    ],
    directors: ['Екатерина Валерьевна', 'Иван Л.'],
    releaseDate: '28 декабря 2024',
    audioTracks: ['Русский (Stereo)'],
    subtitles: ['Русские'],
    fullSynopsis: 'Праздничный спецвыпуск студии OFMEDIA, посвящённый встрече Нового года. Комедийные миниатюры, поздравления, танцевальные номера и новогоднее настроение.',
    stills: ['/backdrops/ng_tilda_bg.png'],
    cast: [
      { name: 'Екатерина Валерьевна', role: 'Оператор-постановщик, Режиссёр', avatar: '/actors/ekaterina_morozova_exact.jpg', isCreator: true },
      { name: 'Иван Л.', role: 'Актёр массовых сцен, Режиссёр монтажа, Оператор-постановщик', avatar: '/actors/ivan_lepo_exact.png', isCreator: true },
      { name: 'Матвей С.', role: 'Дед Мороз', avatar: '/actors/matvey_s_exact.png' },
      { name: 'Дарья Ш.', role: 'Актёр массовых сцен', avatar: '/actors/daria_shishkina_exact.jpg' },
      { name: 'Дарья Х.', role: 'Актёр массовых сцен', avatar: '/actors/daria_kh_exact.png' },
      { name: 'Анастасия', role: 'Актёр массовых сцен', avatar: '/actors/anastasia_exact.png' },
      { name: 'Таира', role: 'Актёр массовых сцен', avatar: '/actors/taira_exact.png' },
      { name: 'Арифе', role: 'Актёр массовых сцен', avatar: '/actors/arife_exact.png' },
      { name: 'Матвей А.', role: 'Актёр массовых сцен', avatar: '/actors/matvey_a_exact.png' },
      { name: 'Сергей С.', role: 'Актёр массовых сцен', avatar: '/actors/sergey_s_exact.png' }
    ]
  },
  {
    id: 'vdnh',
    slug: 'vdnh',
    title: 'Поездка на ВДНХ',
    titleLogo: '/logos/vdnh_title_exact.png',
    subtitle: 'Экскурсионно-познавательный фильм-прогулка',
    description: 'Увлекательная поездка на главную выставку страны: павильоны, архитектура, космос и интересные открытия.',
    year: 2024,
    country: 'Россия',
    duration: '8 мин',
    ageRating: '6+',
    genres: ['Приключения', 'Шоу', 'Влог'],
    poster: '/posters/poster_vdnh.png',
    backdrop: '/backdrops/vdnh_tilda_bg.png',
    videoUrl: 'https://raw.githubusercontent.com/Vanafps/ofmedia-media/main/vdnh/master.m3u8',
    storyboard: '/storyboards/vdnh.webp',
    isOriginal: true,
    isSeries: false,
    episodes: [
      {
        id: 'vdnh-ep1',
        number: 1,
        title: 'Поездка на ВДНХ — Полный выпуск',
        duration: '08:01',
        thumbnail: '/posters/poster_vdnh.png',
        videoUrl: 'https://raw.githubusercontent.com/Vanafps/ofmedia-media/main/vdnh/master.m3u8',
        storyboard: '/storyboards/vdnh.webp'
      }
    ],
    directors: ['Екатерина Валерьевна', 'Иван Л.'],
    releaseDate: '20 сентября 2024',
    audioTracks: ['Русский (Stereo)'],
    subtitles: ['Русские'],
    fullSynopsis: 'Фильм-экскурсия по павильонам и знаковым локациям ВДНХ в Москве. Знакомство с историей, технологиями и масштабом крупнейшего выставочного комплекса.',
    stills: ['/backdrops/vdnh_tilda_bg.png'],
    cast: [
      { name: 'Екатерина Валерьевна', role: 'event-продюсер, Автор идеи', avatar: '/actors/ekaterina_morozova_exact.jpg', isCreator: true },
      { name: 'Иван Л.', role: 'Главный оператор, Режиссёр монтажа', avatar: '/actors/ivan_lepo_exact.png', isCreator: true },
      { name: 'Алексей М.', role: 'Оператор-постановщик', avatar: '/actors/aleksey_m_exact.png', isCreator: true }
    ]
  },
  {
    id: 'hor',
    slug: 'hor',
    title: 'Каждый класс — Хор',
    titleLogo: '/logos/hor_title_exact.png',
    subtitle: 'Музыкальный фестиваль-конкурс хорового пения',
    description: 'Масштабный школьный хоровой фестиваль: выступления классов, проникновенные голоса и торжественная атмосфера.',
    year: 2026,
    country: 'Россия',
    duration: '22 мин',
    ageRating: '6+',
    genres: ['Музыкальное', 'Шоу', 'Комедия'],
    poster: '/posters/poster_hor.png',
    backdrop: '/backdrops/hor_tilda_bg.jpg',
    videoUrl: 'https://raw.githubusercontent.com/Vanafps/ofmedia-media/main/hor/master.m3u8',
    storyboard: '/storyboards/hor.webp',
    isOriginal: true,
    isSeries: false,
    episodes: [
      {
        id: 'hor-ep1',
        number: 1,
        title: 'Каждый класс — Хор: Гала-концерт',
        duration: '21:43',
        thumbnail: '/posters/poster_hor.png',
        videoUrl: 'https://raw.githubusercontent.com/Vanafps/ofmedia-media/main/hor/master.m3u8',
        storyboard: '/storyboards/hor.webp'
      }
    ],
    directors: ['Иван Лепо', 'Михаил Заздравных', 'Екатерина Валерьевна'],
    releaseDate: '31 января 2026',
    audioTracks: ['Русский (Original Stereo)'],
    subtitles: ['Русские'],
    fullSynopsis: 'Большой музыкальный проект, запечатлевший творческие хоровые номера школьных коллективов. Песни о дружбе, родине и школе в живом многоголосном исполнении.',
    stills: ['/backdrops/hor_tilda_bg.jpg'],
    cast: [
      { name: 'Иван Лепо', role: 'Режиссёр монтажа, Оператор-постановщик, Актёр массовых сцен', avatar: '/actors/ivan_lepo_exact.png', isCreator: true },
      { name: 'Михаил Заздравных', role: 'Режиссёр монтажа, Оператор-постановщик, Актёр массовых сцен', avatar: '/actors/mikhail_zazdravnykh_exact.png', isCreator: true },
      { name: 'Екатерина Валерьевна', role: 'Оператор-постановщик', avatar: '/actors/ekaterina_morozova_exact.jpg', isCreator: true },
      { name: 'Всеволод Б.', role: 'Актёр массовых сцен', avatar: '/actors/vsevolod_b_exact.png' },
      { name: 'Дарья Ш.', role: 'Актёр массовых сцен', avatar: '/actors/daria_shishkina_exact.jpg' },
      { name: 'Даниил А.', role: 'Актёр массовых сцен', avatar: '/actors/daniil_a_exact.png' }
    ]
  }
];
