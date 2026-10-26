/* Тексты прототипа. Тон: по имени, без «ты», без оценочных восклицаний. */
(function () {
  var goals = [
    {
      id: "greet",
      short: "Приветствие",
      criterion: "Приветствие",
      source: "Лёгкий старт",
      title: "Начать разговор с приветствия",
      detail: "До того, как перейти к делу.",
      why: "На первый день берём короткое: приветствие видно с первой фразы."
    },
    {
      id: "habits",
      short: "Привычки",
      criterion: "Потребность",
      source: "По вчерашним разговорам",
      title: "Спросить, как гость пользуется очками сейчас",
      detail: "До показа оправы.",
      why: "Вчера вопрос был в 4 из 9 разговоров, и каждый раз после того, как оправа уже на столе."
    },
    {
      id: "purpose",
      short: "Для чего",
      criterion: "Потребность",
      source: "По вчерашним разговорам",
      title: "Уточнить, для чего нужны очки",
      detail: "Читать, за рулём или за компьютером.",
      why: "Вчера это прозвучало в двух разговорах из девяти."
    },
    {
      id: "frame",
      short: "Лёгкая оправа",
      criterion: "Объяснение",
      source: "Закрепить своё",
      title: "Повторить фразу про лёгкую оправу",
      detail: "«Эта оправа легче, к вечеру вы её не почувствуете».",
      why: "Вчера гость остался с оправой. Так вышло 4 раза за смену."
    },
    {
      id: "reason",
      short: "Одна причина",
      criterion: "Объяснение",
      source: "По вчерашним разговорам",
      title: "Назвать одну причину, почему оправа подходит",
      detail: "Одна причина, не список.",
      why: "Вчера в трёх разговорах прозвучал длинный список, и гость откладывал выбор."
    },
    {
      id: "colleague",
      short: "Две линзы",
      criterion: "Объяснение",
      source: "Фраза коллеги",
      title: "Дать сравнить две линзы до цены",
      detail: "Фраза Светланы: «Посмотрите на экран через эту линзу и через обычную».",
      why: "Светлана разрешила показывать эту фразу. У неё гости соглашаются чаще, около 54%. Вопрос «подешевле или получше» даёт около 11%."
    },
    {
      id: "price",
      short: "Что в цене",
      criterion: "Возражение",
      source: "По вчерашним разговорам",
      title: "На «дорого» один раз сказать, что входит в цену",
      detail: "Без повторного предложения.",
      why: "Вчера про цену зашла речь дважды, второй раз гость перебил."
    },
    {
      id: "missing",
      short: "Замена",
      criterion: "Возражение",
      source: "По вчерашним разговорам",
      title: "Если оправы нет, предложить одну близкую",
      detail: "Сказать, чем она похожа.",
      why: "Вчера нужной оправы не было один раз, замены не прозвучало."
    },
    {
      id: "bye",
      short: "Прощание",
      criterion: "Завершение",
      source: "Лёгкий старт",
      title: "Спросить, остались ли вопросы, и попрощаться",
      detail: "В конце разговора.",
      why: "Короткое завершение. Его хорошо видно в записи."
    }
  ];

  var criteria = ["Приветствие", "Потребность", "Объяснение", "Возражение", "Завершение"];

  var loads = [
    { n: 3, name: "Спокойно", hint: "3 разговора" },
    { n: 5, name: "Обычно", hint: "5 разговоров" },
    { n: 8, name: "Плотнее", hint: "8 разговоров" }
  ];

  var rules = [
    { key: "tone", name: "Тон", text: "Спокойный разговор: приветствие, обращение, без спешки. Кольцо идёт к вашей планке и не падает." },
    { key: "offer", name: "Предложение", text: "Одна ясная причина, почему оправа или линза подходит. Не список и не цена первой фразой." },
    { key: "objection", name: "Возражения", text: "На «дорого» и «подумаю» один спокойный ответ. Повторное давление кольцо не растит." }
  ];

  var menuExtra = [
    "В центре вчерашняя цель. Галочка, если она закрылась. Это не оценка человека.",
    "Планка — ваш устойчивый результат. Она растёт и не снижается. Кольцо показывает путь к ней.",
    "Кольца не сравниваются с коллегами и ничего не отнимают.",
    "Оценку фразы можно оспорить. Пока спор не разобран, она не влияет на кольца.",
    "Если бейдж был выключен, кольцо серое: нет данных, не оценка. Пауза на бейдже не считается пропуском."
  ];

  var phrases = [
    {
      id: "light",
      kind: "good",
      tag: "Предложение",
      quote: "Эта оправа легче, к вечеру вы её не почувствуете",
      after: "Гость остался с этой оправой. Так вышло 4 раза за смену.",
      actions: ["save", "share", "dispute"],
      by: "Ирина, салон на Ленина"
    },
    {
      id: "lenses",
      kind: "good",
      tag: "Предложение",
      quote: "Посмотрите на экран через эту линзу и через обычную",
      after: "Гость сравнил и остался с этой линзой. Светлана разрешила показывать фразу.",
      actions: ["save", "share", "dispute"],
      by: "Светлана, салон на Ленина"
    },
    {
      id: "cheap",
      kind: "weak",
      tag: "Возражения",
      quote: "Вам подешевле или получше?",
      after: "Гость ушёл подумать. Вопрос прозвучал в двух разговорах.",
      goalId: "price",
      actions: ["goal", "dispute"],
      by: "Ирина, салон на Ленина"
    },
    {
      id: "dear",
      kind: "weak",
      tag: "Возражения",
      who: "Гость, 16:40",
      quote: "Дорого. Я лучше подумаю",
      after: "В ответ прозвучало «Ну, качество же». Что входит в цену, не прозвучало. Гость ушёл без оправы. Так было два раза за смену.",
      goalId: "price",
      actions: ["goal", "dispute"],
      by: "Ирина, салон на Ленина"
    },
    {
      id: "rush",
      kind: "weak",
      tag: "Тон",
      quote: "Садитесь, сейчас подберём",
      after: "Разговор сразу перешёл к оправе. Вопрос о привычках не прозвучал.",
      goalId: "habits",
      actions: ["goal", "dispute"],
      by: "Ирина, салон на Ленина"
    },
    {
      id: "light-part",
      kind: "good",
      tag: "Предложение",
      meta: "Из того, что записалось",
      quote: "Эта оправа легче, к вечеру вы её не почувствуете",
      after: "Гость остался с этой оправой.",
      actions: ["save", "dispute"],
      by: "Ирина, салон на Ленина"
    },
    {
      id: "greet-ok",
      kind: "good",
      tag: "Тон",
      who: "11:05",
      quote: "Добрый день, меня зовут Ирина. Чем могу помочь",
      after: "Гость ответил сразу. Так начались 7 разговоров из 9.",
      actions: ["save", "share", "dispute"],
      goalId: "greet",
      by: "Ирина, салон на Ленина"
    },
    {
      id: "pause",
      kind: "good",
      tag: "Тон",
      who: "14:20",
      quote: "Не торопитесь, примерьте ещё одну",
      after: "Гость примерил вторую оправу и выбрал. Спешки в разговоре не было.",
      actions: ["save", "share", "dispute"],
      by: "Ирина, салон на Ленина"
    },
    {
      id: "list",
      kind: "weak",
      tag: "Предложение",
      who: "15:10",
      quote: "Тут и форма хорошая, и цвет, и лёгкая, и по акции",
      after: "Гость отложил выбор. Длинный список прозвучал в трёх разговорах.",
      goalId: "reason",
      actions: ["goal", "dispute"],
      by: "Ирина, салон на Ленина"
    },
    {
      id: "missing-line",
      kind: "weak",
      tag: "Возражения",
      who: "Гость, 12:30",
      quote: "Этой оправы нет в моём размере",
      after: "Близкой замены не прозвучало. Гость ушёл смотреть в другой салон.",
      goalId: "missing",
      actions: ["goal", "dispute"],
      by: "Ирина, салон на Ленина"
    }
  ];

  var ringOf = {
    light: "offer", lenses: "offer", cheap: "objection", dear: "objection",
    rush: "tone", "light-part": "offer", "greet-ok": "tone", pause: "tone",
    list: "offer", "missing-line": "objection"
  };
  phrases.forEach(function (p) { p.ring = p.ring || ringOf[p.id]; });

  var shiftPhrases = ["greet-ok", "pause", "light", "lenses", "list", "dear", "rush"];

  /* Чужие слабые фразы сюда не попадают. Имени и точки нет: салон на 3-4 человека угадал бы автора. */
  var networkPhrases = [
    {
      id: "net-far",
      kind: "network",
      ring: "offer",
      tag: "Предложение",
      quote: "Посмотрите вдаль в этих и в своих",
      after: "Гость сравнил и остался с новыми.",
      agree: "Согласились около 44%",
      salons: "За вчера так сказали в 6 салонах",
      goalId: "colleague"
    },
    {
      id: "net-price",
      kind: "network",
      ring: "objection",
      tag: "Возражения",
      quote: "В цену входят линзы, которые не мутнеют к вечеру",
      after: "Гость перестал говорить «дорого» и остался с оправой.",
      agree: "Согласились около 42%",
      salons: "За вчера так сказали в 6 салонах",
      goalId: "price"
    },
    {
      id: "net-tone",
      kind: "network",
      ring: "tone",
      tag: "Тон",
      quote: "Я подберу, а вы скажете, если будет жать",
      after: "Гость ответил спокойно и примерил вторую оправу.",
      agree: "Разговор начался без спешки",
      salons: "За вчера так сказали в 8 салонах",
      goalId: "habits"
    }
  ];

  var phrase = phrases[0];

  /* Октябрь 2026: 1-е число — четверг. Воскресенье выходной. 26-е — сегодня, итога ещё нет. */
  var off = { 4: 1, 11: 1, 18: 1, 25: 1 };
  var special = {
    8: { tone: 0.7, offer: 1, objection: 0.5, goal: "partial", thanks: 1 },
    17: { tone: 1, offer: 1, objection: 1, goal: "done", thanks: 2, phrase: phrase.quote, grew: true },
    20: { tone: 1, offer: 1, objection: 0.66, goal: "partial", thanks: 1 },
    22: { tone: 0.6, offer: null, objection: null, goal: null, thanks: 1 },
    24: { tone: 0.8, offer: 1, objection: 0.67, goal: "done", thanks: 3, phrase: phrase.quote }
  };
  var month = [];
  for (var d = 1; d <= 26; d++) {
    if (d === 26) {
      month.push({ day: 26, today: true });
      continue;
    }
    if (off[d]) {
      month.push({ day: d, off: true });
      continue;
    }
    var row = { day: d, tone: 1, offer: 1, objection: 1, goal: "done", thanks: d % 3 === 0 ? 2 : 1 };
    var over = special[d];
    if (over) {
      for (var k in over) row[k] = over[k];
    }
    month.push(row);
  }

  var dayPhrases = {
    24: shiftPhrases,
    22: ["light-part"],
    20: ["rush", "dear", "list"],
    17: ["light", "lenses", "greet-ok", "pause"],
    8: ["rush", "missing-line"]
  };
  month.forEach(function (row) {
    if (row.off || row.today) return;
    row.phraseIds = dayPhrases[row.day] || (row.day % 2 ? ["light", "greet-ok"] : ["pause", "lenses"]);
    if (row.goal === "done") row.goalId = "frame";
    else if (row.goal === "partial") row.goalId = "habits";
  });

  var workDays = month.filter(function (row) { return !row.off && !row.today; });
  var lastSeven = workDays.slice(-7);
  var ringHistory = { tone: [], offer: [], objection: [] };
  lastSeven.forEach(function (row) {
    ["tone", "offer", "objection"].forEach(function (key) {
      ringHistory[key].push({ day: row.day, value: row[key] });
    });
  });

  var bars = {
    tone: { fact: "8 из 10", bar: "10 спокойных разговоров", note: "Планка — 10. Вчера так вышло в 8 разговорах. Планка не снижается." },
    offer: { fact: "закрыто", bar: "5 ясных предложений", note: "Планка — 5. Вчера она закрыта." },
    objection: { fact: "4 из 6", bar: "6 спокойных ответов", note: "Планка — 6. Вчера так вышло в 4 разговорах. Догонять не нужно." }
  };
  var ringGoals = { tone: "habits", offer: "frame", objection: "price" };

  var tally = { closed: 0, thanks: 0, shifts: 0, phrases: 6, record: 12 };
  month.forEach(function (row) {
    if (row.off || row.today) return;
    tally.shifts += 1;
    tally.thanks += row.thanks || 0;
    ["tone", "offer", "objection"].forEach(function (key) {
      if (row[key] >= 0.999) tally.closed += 1;
    });
  });

  function pack(values, from) {
    return { values: values, from: from || null };
  }

  var ringsRegular = pack(
    { tone: 0.8, offer: 1, objection: 0.67 },
    { tone: 0.12, offer: 0.35, objection: 0.12 }
  );
  var legendRegular = [
    { key: "tone", name: "Тон", text: "8 из 10" },
    { key: "offer", name: "Предложение", text: "закрыто" },
    { key: "objection", name: "Возражения", text: "4 из 6" }
  ];
  var ringsFull = pack(
    { tone: 1, offer: 1, objection: 1 },
    { tone: 0.2, offer: 0.3, objection: 0.15 }
  );
  var legendFull = [
    { key: "tone", name: "Тон", text: "закрыто" },
    { key: "offer", name: "Предложение", text: "планка выросла" },
    { key: "objection", name: "Возражения", text: "закрыто" }
  ];
  var ringsMiss = pack(
    { tone: 1, offer: 1, objection: 0.66 },
    { tone: 0.2, offer: 0.4, objection: 0.1 }
  );
  var legendMiss = [
    { key: "tone", name: "Тон", text: "закрыто" },
    { key: "offer", name: "Предложение", text: "закрыто" },
    { key: "objection", name: "Возражения", text: "4 из 6" }
  ];
  var ringsBadge = pack(
    { tone: 0.6, offer: null, objection: null },
    { tone: 0.1, offer: null, objection: null }
  );
  var legendBadge = [
    { key: "tone", name: "Тон", text: "к планке" },
    { key: "offer", name: "Предложение", text: "нет данных", tone: "muted" },
    { key: "objection", name: "Возражения", text: "нет данных", tone: "muted" }
  ];
  var ringsFresh = pack({ tone: null, offer: null, objection: null });
  var legendFresh = [
    { key: "tone", name: "Тон", text: "нет данных", tone: "muted" },
    { key: "offer", name: "Предложение", text: "нет данных", tone: "muted" },
    { key: "objection", name: "Возражения", text: "нет данных", tone: "muted" }
  ];

  function home(extra) {
    var base = { screen: "home", chrome: "mini", thanks: 0 };
    for (var key in extra) base[key] = extra[key];
    return base;
  }

  var tomorrowAlt = "День без цели. Это не пропуск. Завтра утром всё равно будет разбор смены.";
  var storyRegular = [
    { kind: "hello", kicker: "Смена разобрана", title: "Доброе утро, Ирина", text: "Суббота, 24 октября. Записано 8 часов 10 минут." },
    { kind: "rings" },
    { kind: "bar", count: 8, caption: "из 10 по тону", text: "Планка — 10 спокойных разговоров. Она не снижается." },
    { kind: "phrase", phraseId: "light" },
    { kind: "thanks", count: 3 },
    { kind: "find", phraseId: "net-price" },
    { kind: "goal" },
    { kind: "tomorrow", title: "Завтра утром", text: "Цель на сегодня взята. Завтра утром увидите, как она прозвучала в разговорах. По возражениям вчера 4 из 6: до планки два спокойных ответа. Если день сложится иначе, ничего не снимается.", alt: tomorrowAlt }
  ];
  var storyFull = [
    { kind: "hello", kicker: "Три кольца закрыты", title: "Доброе утро, Ирина", text: "Смена 17 октября. Все три кольца замкнуты." },
    { kind: "rings" },
    { kind: "bar", count: 6, caption: "новая планка", text: "По предложению было 5, стало 6. Планка выросла, и дальше считается от неё." },
    { kind: "phrase", phraseId: "lenses" },
    { kind: "thanks", count: 2 },
    { kind: "find", phraseId: "net-far" },
    { kind: "goal" },
    { kind: "tomorrow", title: "Завтра утром", text: "Планка по предложению уже выросла. Новая отсчитывается от неё. Завтра утром будет разбор сегодняшней смены.", alt: "День без цели. Планка на месте. Завтра утром будет разбор смены." }
  ];
  var storyMiss = [
    { kind: "hello", kicker: "Разбор готов", title: "Доброе утро, Ирина", text: "Смена 20 октября. Записано 8 часов 10 минут." },
    { kind: "rings" },
    { kind: "honest", title: "3 из 5", text: "Цель закрылась на 3 из 5. Ничего не снимается и догонять не нужно." },
    { kind: "phrase", phraseId: "rush" },
    { kind: "thanks", count: 1 },
    { kind: "find", phraseId: "net-tone" },
    { kind: "goal" },
    { kind: "tomorrow", title: "Завтра утром", text: "Вчерашние три не переносятся. Завтра утром увидите сегодняшний разбор. Догонять не нужно.", alt: "День без цели. Вчерашние три не переносятся. Завтра утром будет разбор." }
  ];
  var storyBadge = [
    { kind: "hello", kicker: "Разбор готов", title: "Доброе утро, Ирина", text: "Смена 22 октября. Записано 6 часов 20 минут." },
    { kind: "rings", note: "Часть смены без записи. Это не оценка." },
    { kind: "find", phraseId: "net-far" },
    { kind: "goal" },
    { kind: "tomorrow", title: "Завтра утром", text: "Сегодняшние кольца появятся завтра по записи. Если бейдж будет на паузе, это снова не оценка.", alt: "День без цели. Завтра утром разбор появится по той записи, что будет." }
  ];
  var storyReturn = [
    { kind: "hello", kicker: "Снова в смене", title: "Доброе утро, Ирина", text: "Четыре рабочих дня без смены. Серия на паузе." },
    { kind: "bar", count: 12, caption: "рекорд подряд", text: "Рекорд остаётся. Перерыв серию не обнуляет." },
    { kind: "rings" },
    { kind: "find", phraseId: "net-tone" },
    { kind: "goal" },
    { kind: "tomorrow", title: "Завтра утром", text: "Цель на сегодня взята. Завтра утром будет разбор этой смены. Серия продолжится со следующей рабочей.", alt: tomorrowAlt }
  ];
  var storyFirst = [
    { kind: "hello", kicker: "Пример", title: "Доброе утро, Ирина", text: "Так выглядит утро после смены. Кольца ниже — пример, не ваша запись." },
    { kind: "rings", note: "Пример, не ваша смена." },
    { kind: "find", phraseId: "net-far" },
    { kind: "goal" },
    { kind: "tomorrow", title: "Завтра утром", text: "Завтра утром будет разбор вашей смены, не пример. Кольца появятся по записи.", alt: "День без цели. Завтра утром всё равно будет разбор вашей смены." }
  ];
  var storyPick = [
    { kind: "hello", kicker: "Цель на сегодня", title: "Доброе утро, Ирина", text: "Три короткие цели. Можно выбрать одну или пройти день без цели." },
    { kind: "goal" },
    { kind: "tomorrow", title: "Завтра утром", text: "Завтра утром увидите, как цель прозвучала. Если разговоров будет меньше, считаем те, что были.", alt: tomorrowAlt }
  ];

  var scenarios = [
    {
      id: "first",
      title: "Первое утро",
          shows: "Сообщение бота, потом короткая сторис на примере и открытие коллеги из сети.",
      checks: "Понятно ли, что это, и не страшно ли начинать.",
      steps: [
        {
          id: "chat",
          title: "Сообщение бота",
          hint: "Один раз утром. Дальше всё внутри экрана, сайдбар для этого не нужен.",
          screen: "chat",
          chrome: "chat",
          chat: "Ирина, доброе утро. За первую смену записано 9 разговоров. Разбор готов: одна фраза, которую стоит оставить.",
          button: "Открыть разбор"
        },
        {
          id: "explain",
          title: "Кольца и фраза",
          hint: "После сообщения — короткая сторис. Кольца в ней пример. «Пропустить» открывает экран.",
          story: storyFirst,
          screen: "explain",
          rings: pack(
            { tone: 0.85, offer: 1, objection: 0.7 },
            { tone: 0.1, offer: 0.25, objection: 0.1 }
          ),
          legend: [
            { key: "tone", name: "Тон", text: "к планке" },
            { key: "offer", name: "Предложение", text: "закрыто" },
            { key: "objection", name: "Возражения", text: "к планке" }
          ],
          center: { kind: "pick" },
          phraseIds: ["light"],
          goalIds: ["greet", "frame", "bye"],
          intro: "На первый день три короткие цели. Можно открыть все или пройти день без цели."
        }
      ]
    },
    {
      id: "regular",
      title: "Обычное утро",
      shows: "Сторис про вчера, открытие коллеги из сети, затем главный экран.",
      checks: "Хочется ли досмотреть утро и находится ли путь без сайдбара.",
      steps: [
        home({
          id: "rings",
          title: "Сегодня",
          hint: "Сначала сторис. «Пропустить» или конец кадров открывает главный экран. Дальше кольцо, «Весь октябрь», «Все фразы смены».",
          story: storyRegular,
          coverage: "Смена 24 октября, записано 8 ч 10 мин",
          rings: ringsRegular,
          legend: legendRegular,
          center: { kind: "check", goalId: "frame", goto: "goals" },
          phraseIds: ["light", "dear"],
          thanks: 3,
          goalIds: ["habits", "frame", "colleague"]
        })
      ]
    },
    {
      id: "pick",
      title: "Выбор цели",
      shows: "Короткая сторис сразу ведёт к трём целям.",
      checks: "Хватает ли выбора и не давит ли он.",
      steps: [
        home({
          id: "entry",
          title: "Блок цели",
          hint: "Сторис из двух шагов: приветствие и три цели. Нагрузка открывается после выбора.",
          story: storyPick,
          coverage: "Смена 24 октября, записано 8 ч 10 мин",
          rings: ringsRegular,
          legend: legendRegular,
          center: { kind: "pick", goto: "goals" },
          thanks: 0,
          goalIds: ["habits", "frame", "colleague"]
        })
      ]
    },
    {
      id: "miss",
      title: "Цель не закрылась",
      shows: "В центре 3 из 5. В карточке цели можно оставить её или выбрать другую.",
      checks: "Нет ли чувства вины и желания бросить.",
      steps: [
        home({
          id: "result",
          title: "3 из 5",
          hint: "В сторис кадр «3 из 5»: ничего не снимается, догонять не нужно.",
          story: storyMiss,
          coverage: "Смена 20 октября, записано 8 ч 10 мин",
          rings: ringsMiss,
          legend: legendMiss,
          center: { kind: "partial", goalId: "habits", line: "3 из 5", goto: "goals" },
          banner: "Цель закрылась на 3 из 5. Ничего не снимается и догонять не нужно.",
          phraseIds: ["rush", "dear"],
          allPhraseIds: ["rush", "dear", "list"],
          thanks: 1,
          goalIds: ["habits", "frame", "colleague"],
          intro: "Можно взять другую. Вчерашняя от этого не становится ошибкой.",
          text: "Цель на сегодня та же: спросить, как гость пользуется очками сейчас. Вчерашние три не переносятся. Догонять не нужно.",
          actions: [
            { label: "Оставить эту цель", action: "open", screen: "confirm", mode: "keep" },
            { label: "Выбрать другую", action: "open", screen: "goals", view: "suggested", quiet: true }
          ]
        })
      ]
    },
    {
      id: "full",
      title: "Все кольца закрыты",
      shows: "Три кольца замкнуты, планка выросла. Фразу можно показать коллеге с карточки.",
      checks: "Хочется ли показать это коллеге.",
      steps: [
        home({
          id: "closed",
          title: "Три кольца",
          hint: "Сторис показывает, что планка выросла: было 5, стало 6.",
          story: storyFull,
          coverage: "Смена 17 октября, записано 8 ч 10 мин",
          rings: ringsFull,
          legend: legendFull,
          center: { kind: "check", goalId: "frame" },
          grew: "Планка по предложению выросла: было 5, стало 6.",
          achievement: "Все три кольца закрыты. Так вышло в третий раз за октябрь.",
          phraseIds: ["light", "lenses"],
          allPhraseIds: ["light", "lenses", "greet-ok", "pause"],
          thanks: 2,
          goalIds: ["habits", "frame", "colleague"]
        })
      ]
    },
    {
      id: "badge",
      title: "Бейдж был выключен",
      shows: "Серый центр, часть колец без данных, строка про неполную запись.",
      checks: "Не звучит ли как упрёк.",
      steps: [
        home({
          id: "gap",
          title: "Нет части записи",
          hint: "В сторис серые кольца и строка, что это не оценка. Открытие коллеги на месте.",
          story: storyBadge,
          coverage: "Смена 22 октября, записано 6 ч 20 мин, часть смены",
          rings: ringsBadge,
          legend: legendBadge,
          center: { kind: "nodata", goto: "goals" },
          banner: "Бейдж был выключен около двух часов. Кольца без записи серые: это не оценка. Цель по этой записи не разобрать.",
          extra: "Если нужен перерыв или личный разговор, на бейдже есть пауза. Пауза не считается пропуском.",
          phraseIds: ["light-part"],
          allPhraseIds: ["light-part"],
          thanks: 1,
          goalIds: ["habits", "frame", "colleague"],
          intro: "Вчерашнюю цель посчитать не из чего. На сегодня можно выбрать новую."
        })
      ]
    },
    {
      id: "return",
      title: "Возвращение после выходных",
      shows: "Серия на паузе, рекорд на месте, кольца последней смены на месте.",
      checks: "Нет ли тревоги после перерыва.",
      steps: [
        home({
          id: "back",
          title: "Серия на паузе",
          hint: "Сторис говорит: серия на паузе, рекорд 12 на месте.",
          story: storyReturn,
          coverage: "Последняя смена перед перерывом, записано 8 ч 10 мин",
          lead: "Четыре рабочих дня без смены. Серия на паузе. Рекорд, 12 подряд, остаётся.",
          rings: ringsFull,
          legend: [
            { key: "tone", name: "Тон", text: "закрыто" },
            { key: "offer", name: "Предложение", text: "закрыто" },
            { key: "objection", name: "Возражения", text: "закрыто" }
          ],
          center: { kind: "check", goalId: "frame", goto: "goals" },
          extra: "Считаются только рабочие смены. Перерыв серию ставит на паузу и не обнуляет.",
          thanks: 2,
          goalIds: ["habits", "frame", "colleague"],
          intro: "Перерыв ничего не должен. Можно выбрать цель как в обычное утро."
        })
      ]
    },
    {
      id: "deep",
      title: "Разбор смены вглубь",
      shows: "С главного экрана: кольцо, календарь, день и все фразы.",
      checks: "Можно ли пройти этот путь только кликами внутри телефона.",
      steps: [
        home({
          id: "today",
          title: "Точка входа",
          hint: "Кольцо «Возражения», назад. «Весь октябрь», день 22, назад. «Все фразы смены», «Мои фразы».",
          coverage: "Смена 24 октября, записано 8 ч 10 мин",
          rings: ringsRegular,
          legend: legendRegular,
          center: { kind: "check", goalId: "frame", goto: "goals" },
          phraseIds: ["light", "dear"],
          thanks: 3,
          goalIds: ["habits", "frame", "colleague"]
        })
      ]
    },
    {
      id: "phrases",
      title: "Фразы дня",
      shows: "Две карточки на главном экране и все фразы смены за ссылкой.",
      checks: "Понятны ли действия с фразой и нет ли обвинения.",
      steps: [
        home({
          id: "cards",
          title: "Фразы",
          hint: "Откройте «Все фразы смены». Сохранить, не согласиться и взять как цель работают на карточке.",
          coverage: "Смена 24 октября, записано 8 ч 10 мин",
          rings: ringsRegular,
          legend: legendRegular,
          center: { kind: "check", goalId: "frame" },
          phraseIds: ["light", "dear"],
          thanks: 3,
          goalIds: ["habits", "frame", "colleague"]
        })
      ]
    }
  ];

  window.PROTO = {
    person: { name: "Ирина", colleague: "Светлана", place: "салон на Ленина" },
    goals: goals,
    criteria: criteria,
    loads: loads,
    rules: rules,
    menuExtra: menuExtra,
    phrases: phrases,
    networkPhrases: networkPhrases,
    phrase: phrase,
    shiftPhrases: shiftPhrases,
    ringHistory: ringHistory,
    bars: bars,
    ringGoals: ringGoals,
    month: month,
    tally: tally,
    startWeekday: 3,
    scenarios: scenarios
  };
})();
