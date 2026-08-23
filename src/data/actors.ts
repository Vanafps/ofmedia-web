export interface ActorFilmographyItem {
  projectId: string;
  projectSlug?: string;
  projectTitle: string;
  role: string;
  year: number;
  poster: string;
  duration?: string;
  genres?: string[];
}

export interface Actor {
  id: string;
  slug: string;
  name: string;
  initials: string;
  mainRole: string;
  filmsCount: number;
  bio: string;
  photo?: string;
  filmography: ActorFilmographyItem[];
}

export const ACTORS_DATA: Actor[] = [
  {
    id: 'ivan-lepo',
    slug: 'ivan-lepo',
    name: 'Иван Лепо (Иван Л.)',
    initials: 'ИЛ',
    mainRole: 'Генеральный продюсер, режиссёр монтажа, оператор',
    filmsCount: 6,
    bio: 'Генеральный продюсер и ведущий режиссёр монтажа студии OFMEDIA. Отвечает за пост-продакшн, динамику кадров, цветокоррекцию и звук во всех ключевых релизах студии.',
    photo: '/actors/ivan_lepo_exact.png',
    filmography: [
      {
        projectId: 'clip',
        projectSlug: 'clip',
        projectTitle: 'Клип — Школа 2070',
        role: 'Режиссёр монтажа',
        year: 2026,
        poster: '/posters/poster_clip.png',
        duration: '3 мин',
        genres: ['Музыкальное', 'Комедия', 'Клип']
      },
      {
        projectId: 'hor',
        projectSlug: 'hor',
        projectTitle: 'Каждый класс — Хор',
        role: 'Режиссёр монтажа, Оператор, Актёр',
        year: 2026,
        poster: '/posters/poster_hor.png',
        duration: '22 мин',
        genres: ['Музыкальное', 'Шоу', 'Комедия']
      },
      {
        projectId: 'nalim',
        projectSlug: 'nalim',
        projectTitle: 'Налим — Постановка',
        role: 'Рассказчик-2, Старик, Режиссёр монтажа',
        year: 2024,
        poster: '/posters/poster_nalim.png',
        duration: '8 мин',
        genres: ['Комедия', 'Постановка', 'Шоу']
      },
      {
        projectId: 'park',
        projectSlug: 'park',
        projectTitle: 'Поездка в парк',
        role: 'Режиссёр монтажа, Главный оператор',
        year: 2024,
        poster: '/posters/poster_park.png',
        duration: '27 мин',
        genres: ['Комедия', 'Приключения', 'Влог']
      },
      {
        projectId: 'ng',
        projectSlug: 'ng',
        projectTitle: 'Новогодний корпоратив',
        role: 'Актёр массовых сцен, Режиссёр монтажа, Оператор-постановщик',
        year: 2024,
        poster: '/posters/poster_ng.png',
        duration: '16 мин',
        genres: ['Комедия', 'Шоу', 'Музыкальное']
      },
      {
        projectId: 'vdnh',
        projectSlug: 'vdnh',
        projectTitle: 'Поездка на ВДНХ',
        role: 'Главный оператор, Режиссёр монтажа',
        year: 2024,
        poster: '/posters/poster_vdnh.png',
        duration: '8 мин',
        genres: ['Приключения', 'Шоу', 'Влог']
      }
    ]
  },
  {
    id: 'ekaterina-morozova',
    slug: 'ekaterina-morozova',
    name: 'Екатерина Морозова (Екатерина Валерьевна)',
    initials: 'ЕМ',
    mainRole: 'Автор идеи, режиссёр, event-продюсер',
    filmsCount: 6,
    bio: 'Идейный вдохновитель, креативный руководитель и режиссёр проектов OFMEDIA. Создатель концепций большинства знаковых постановок и музыкальных клипов.',
    photo: '/actors/ekaterina_morozova_exact.jpg',
    filmography: [
      {
        projectId: 'clip',
        projectSlug: 'clip',
        projectTitle: 'Клип — Школа 2070',
        role: 'Автор идеи, Актёр массовых сцен',
        year: 2026,
        poster: '/posters/poster_clip.png',
        duration: '3 мин',
        genres: ['Музыкальное', 'Комедия', 'Клип']
      },
      {
        projectId: 'nalim',
        projectSlug: 'nalim',
        projectTitle: 'Налим — Постановка',
        role: 'Автор идеи, Режиссёр, Оператор-постановщик',
        year: 2024,
        poster: '/posters/poster_nalim.png',
        duration: '8 мин',
        genres: ['Комедия', 'Постановка', 'Шоу']
      },
      {
        projectId: 'park',
        projectSlug: 'park',
        projectTitle: 'Поездка в парк',
        role: 'event-продюсер',
        year: 2024,
        poster: '/posters/poster_park.png',
        duration: '27 мин',
        genres: ['Комедия', 'Приключения', 'Влог']
      },
      {
        projectId: 'ng',
        projectSlug: 'ng',
        projectTitle: 'Новогодний корпоратив',
        role: 'Оператор-постановщик, Режиссёр',
        year: 2024,
        poster: '/posters/poster_ng.png',
        duration: '16 мин',
        genres: ['Комедия', 'Шоу', 'Музыкальное']
      },
      {
        projectId: 'vdnh',
        projectSlug: 'vdnh',
        projectTitle: 'Поездка на ВДНХ',
        role: 'event-продюсер, Автор идеи',
        year: 2024,
        poster: '/posters/poster_vdnh.png',
        duration: '8 мин',
        genres: ['Приключения', 'Шоу', 'Влог']
      },
      {
        projectId: 'hor',
        projectSlug: 'hor',
        projectTitle: 'Каждый класс — Хор',
        role: 'Оператор-постановщик',
        year: 2026,
        poster: '/posters/poster_hor.png',
        duration: '22 мин',
        genres: ['Музыкальное', 'Шоу', 'Комедия']
      }
    ]
  },
  {
    id: 'daria-sh',
    slug: 'daria-sh',
    name: 'Дарья Ш.',
    initials: 'ДШ',
    mainRole: 'Креативный продюсер, главный оператор, актриса',
    filmsCount: 4,
    bio: 'Креативный продюсер и ведущий оператор студии OFMEDIA. Участвовала в создании визуального стиля проектов и исполняла яркие роли в постановках.',
    photo: '/actors/daria_shishkina_exact.jpg',
    filmography: [
      {
        projectId: 'clip',
        projectSlug: 'clip',
        projectTitle: 'Клип — Школа 2070',
        role: 'Креативный продюсер, Главный оператор, Актёр',
        year: 2026,
        poster: '/posters/poster_clip.png',
        duration: '3 мин',
        genres: ['Музыкальное', 'Комедия', 'Клип']
      },
      {
        projectId: 'nalim',
        projectSlug: 'nalim',
        projectTitle: 'Налим — Постановка',
        role: 'Рассказчик-1',
        year: 2024,
        poster: '/posters/poster_nalim.png',
        duration: '8 мин',
        genres: ['Комедия', 'Постановка', 'Шоу']
      },
      {
        projectId: 'ng',
        projectSlug: 'ng',
        projectTitle: 'Новогодний корпоратив',
        role: 'Актёр массовых сцен',
        year: 2024,
        poster: '/posters/poster_ng.png',
        duration: '16 мин',
        genres: ['Комедия', 'Шоу', 'Музыкальное']
      },
      {
        projectId: 'hor',
        projectSlug: 'hor',
        projectTitle: 'Каждый класс — Хор',
        role: 'Актёр массовых сцен',
        year: 2026,
        poster: '/posters/poster_hor.png',
        duration: '22 мин',
        genres: ['Музыкальное', 'Шоу', 'Комедия']
      }
    ]
  },
  {
    id: 'anfisa-m',
    slug: 'anfisa-m',
    name: 'Анфиса М.',
    initials: 'АМ',
    mainRole: 'Ассистент креативного продюсера, оператор-постановщик',
    filmsCount: 1,
    bio: 'Ассистент продюсера и оператор команды OFMEDIA.',
    photo: '/actors/anfisa_m_exact.jpg',
    filmography: [
      {
        projectId: 'clip',
        projectSlug: 'clip',
        projectTitle: 'Клип — Школа 2070',
        role: 'Ассистент креативного продюсера, Оператор-постановщик, Актёр',
        year: 2026,
        poster: '/posters/poster_clip.png',
        duration: '3 мин',
        genres: ['Музыкальное', 'Комедия', 'Клип']
      }
    ]
  },
  {
    id: 'vsevolod-b',
    slug: 'vsevolod-b',
    name: 'Всеволод Б.',
    initials: 'ВБ',
    mainRole: 'Актёр (Барин)',
    filmsCount: 3,
    bio: 'Харизматичный актёр, исполнитель роли Барина в постановке «Налим».',
    photo: '/actors/vsevolod_b_exact.png',
    filmography: [
      {
        projectId: 'nalim',
        projectSlug: 'nalim',
        projectTitle: 'Налим — Постановка',
        role: 'Барин',
        year: 2024,
        poster: '/posters/poster_nalim.png',
        duration: '8 мин',
        genres: ['Комедия', 'Постановка', 'Шоу']
      },
      {
        projectId: 'clip',
        projectSlug: 'clip',
        projectTitle: 'Клип — Школа 2070',
        role: 'Актёр массовых сцен',
        year: 2026,
        poster: '/posters/poster_clip.png',
        duration: '3 мин',
        genres: ['Музыкальное', 'Комедия', 'Клип']
      },
      {
        projectId: 'hor',
        projectSlug: 'hor',
        projectTitle: 'Каждый класс — Хор',
        role: 'Актёр массовых сцен',
        year: 2026,
        poster: '/posters/poster_hor.png',
        duration: '22 мин',
        genres: ['Музыкальное', 'Шоу', 'Комедия']
      }
    ]
  },
  {
    id: 'matvey-s',
    slug: 'matvey-s',
    name: 'Матвей С.',
    initials: 'МС',
    mainRole: 'Актёр (Дед Мороз)',
    filmsCount: 2,
    bio: 'Актёр проектов OFMEDIA, исполнивший роль Деда Мороза в «Новогоднем корпоративе» и роль в постановке «Налим».',
    photo: '/actors/matvey_s_exact.png',
    filmography: [
      {
        projectId: 'ng',
        projectSlug: 'ng',
        projectTitle: 'Новогодний корпоратив',
        role: 'Дед Мороз',
        year: 2024,
        poster: '/posters/poster_ng.png',
        duration: '16 мин',
        genres: ['Комедия', 'Шоу', 'Музыкальное']
      },
      {
        projectId: 'nalim',
        projectSlug: 'nalim',
        projectTitle: 'Налим — Постановка',
        role: 'Актёр',
        year: 2024,
        poster: '/posters/poster_nalim.png',
        duration: '8 мин',
        genres: ['Комедия', 'Постановка', 'Шоу']
      }
    ]
  },
  {
    id: 'mikhail-zazdravnykh',
    slug: 'mikhail-zazdravnykh',
    name: 'Михаил Заздравных',
    initials: 'МЗ',
    mainRole: 'Режиссёр монтажа, оператор-постановщик',
    filmsCount: 1,
    bio: 'Режиссёр монтажа и оператор-постановщик студии OFMEDIA.',
    photo: '/actors/mikhail_zazdravnykh_exact.png',
    filmography: [
      {
        projectId: 'hor',
        projectSlug: 'hor',
        projectTitle: 'Каждый класс — Хор',
        role: 'Режиссёр монтажа, Оператор-постановщик, Актёр',
        year: 2026,
        poster: '/posters/poster_hor.png',
        duration: '22 мин',
        genres: ['Музыкальное', 'Шоу', 'Комедия']
      }
    ]
  },
  {
    id: 'aleksey-m',
    slug: 'aleksey-m',
    name: 'Алексей М.',
    initials: 'АМ',
    mainRole: 'Оператор-постановщик',
    filmsCount: 2,
    bio: 'Оператор-постановщик выездных репортажей и экскурсий OFMEDIA.',
    photo: '/actors/aleksey_m_exact.png',
    filmography: [
      {
        projectId: 'park',
        projectSlug: 'park',
        projectTitle: 'Поездка в парк',
        role: 'Оператор-постановщик',
        year: 2024,
        poster: '/posters/poster_park.png',
        duration: '27 мин',
        genres: ['Комедия', 'Приключения', 'Влог']
      },
      {
        projectId: 'vdnh',
        projectSlug: 'vdnh',
        projectTitle: 'Поездка на ВДНХ',
        role: 'Оператор-постановщик',
        year: 2024,
        poster: '/posters/poster_vdnh.png',
        duration: '8 мин',
        genres: ['Приключения', 'Шоу', 'Влог']
      }
    ]
  }
];

export const getActorByName = (name: string): Actor | undefined => {
  const norm = name.trim().toLowerCase();
  return ACTORS_DATA.find((a) => a.name.toLowerCase().includes(norm) || norm.includes(a.name.toLowerCase()));
};
