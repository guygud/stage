(function () {
  var PROTO = window.PROTO;
  if (!PROTO) {
    document.body.textContent = "Не загрузился data.js";
    return;
  }

  var WD = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"];
  var WD_SHORT = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
  var RING_KEYS = ["tone", "offer", "objection"];
  var RING_NAME = { tone: "Тон", offer: "Предложение", objection: "Возражения" };
  var RING_COLOR = { tone: "#1E7B4A", offer: "#2E8BFF", objection: "#C4842A" };
  var TRACK = "#E1E8F2";
  var NODATA = "#C5D0DE";
  var CHECK = '<svg class="check-svg" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 9.5 17 19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var phone = document.getElementById("phone");
  var sidebar = document.getElementById("sidebar");
  var state = {
    scenarioId: PROTO.scenarios[0].id,
    step: 0,
    goalId: null,
    intensity: 5,
    confirmMode: null,
    viewOverride: null,
    fromPhrase: false,
    sheet: null,
    shareKind: "phrase",
    sharePhraseId: null,
    shareSent: null,
    plainGoal: false,
    disputePhraseId: null,
    saved: {},
    disputed: {},
    day: null,
    nav: [],
    phraseFilter: "all",
    skipAnim: false,
    story: null,
    fromStory: false,
    fromNetwork: false,
    renderedKey: ""
  };
  var storyTimer = null;
  var STORY_MS = 4600;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function typo(s) {
    return String(s == null ? "" : s)
      .replace(/ — /g, "\u00a0— ")
      .replace(/(\d) (?=[а-яёa-z%])/gi, "$1\u00a0")
      .replace(/(^|[\s(«])([ВвКкСсОоУуИиАаЯя]) /g, function (_, a, b) {
        return a + b + "\u00a0";
      });
  }

  function tx(s) { return esc(typo(s)); }

  function plural(n, one, few, many) {
    var n10 = n % 10;
    var n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return one;
    if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
    return many;
  }

  function scenario() {
    return PROTO.scenarios.filter(function (s) { return s.id === state.scenarioId; })[0];
  }

  function step() { return scenario().steps[state.step]; }

  function goalById(id) {
    return PROTO.goals.filter(function (g) { return g.id === id; })[0];
  }

  function phraseById(id) {
    var own = PROTO.phrases.filter(function (p) { return p.id === id; })[0];
    if (own) return own;
    return (PROTO.networkPhrases || []).filter(function (p) { return p.id === id; })[0];
  }

  function isNetworkPhrase(p) {
    return !!(p && p.kind === "network");
  }

  function loadByN(n) {
    return PROTO.loads.filter(function (l) { return l.n === n; })[0] || PROTO.loads[1];
  }

  function weekday(day) { return (PROTO.startWeekday + day - 1) % 7; }

  function thanksLine(n) {
    if (!n) return "";
    if (n === 1) return "Гость сказал «спасибо» один раз.";
    return "Гости сказали «спасибо» " + n + " " + plural(n, "раз", "раза", "раз") + ".";
  }

  function describe(value) {
    if (value == null) return "нет данных";
    if (value >= 0.999) return "закрыто";
    return "к планке";
  }

  function goalDescribe(goal) {
    if (goal === "done") return "закрыта";
    if (goal === "partial") return "3 из 5, догонять не нужно";
    if (goal === "none") return "без цели, это не пропуск";
    return "нет данных";
  }

  function ringsSVG(spec) {
    var keys = RING_KEYS;
    var size = 236;
    var cx = size / 2;
    var radii = { tone: 100, offer: 84, objection: 68 };
    var stroke = 11;
    var parts = [];
    keys.forEach(function (key, i) {
      var r = radii[key];
      var c = +(2 * Math.PI * r).toFixed(2);
      var value = spec.values[key];
      var hasFrom = spec.from && spec.from[key] != null && value != null;
      var from = hasFrom ? spec.from[key] : value;
      var track = value == null ? NODATA : TRACK;
      parts.push('<circle cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" stroke="' + track + '" stroke-width="' + stroke + '"/>');
      if (value == null || value <= 0) return;
      var toOff = +(c * (1 - Math.min(1, value))).toFixed(2);
      var fromOff = +(c * (1 - Math.min(1, from))).toFixed(2);
      var cap = value >= 0.999 ? "butt" : "round";
      parts.push(
        '<circle class="arc" data-from="' + fromOff + '" data-to="' + toOff + '" cx="' + cx + '" cy="' + cx +
        '" r="' + r + '" fill="none" stroke="' + RING_COLOR[key] + '" stroke-width="' + stroke +
        '" stroke-linecap="' + cap + '" stroke-dasharray="' + c + '" stroke-dashoffset="' + fromOff +
        '" style="transition-delay:' + (i * 120) + 'ms" transform="rotate(-90 ' + cx + " " + cx + ')"/>'
      );
    });
    return '<svg class="rings" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '" aria-hidden="true">' + parts.join("") + "</svg>";
  }

  function miniRings(row) {
    var cx = 16;
    var radii = { tone: 12, offer: 8.5, objection: 5 };
    var parts = [];
    RING_KEYS.forEach(function (key) {
      var r = radii[key];
      var c = +(2 * Math.PI * r).toFixed(2);
      var value = row[key];
      var track = value == null ? NODATA : TRACK;
      parts.push('<circle cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" stroke="' + track + '" stroke-width="2.4"/>');
      if (value == null || value <= 0) return;
      var off = +(c * (1 - Math.min(1, value))).toFixed(2);
      parts.push(
        '<circle cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" stroke="' + RING_COLOR[key] + '"' +
        ' stroke-width="2.4" stroke-linecap="' + (value >= 0.999 ? "butt" : "round") +
        '" stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '" transform="rotate(-90 ' + cx + " " + cx + ')"/>'
      );
    });
    if (row.goal === "done" || row.goal === "partial") {
      var fill = row.goal === "done" ? RING_COLOR.tone : RING_COLOR.objection;
      parts.push('<circle cx="' + cx + '" cy="' + cx + '" r="2" fill="' + fill + '"/>');
    }
    return '<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">' + parts.join("") + "</svg>";
  }

  function centerHTML(c) {
    if (!c) return "";
    var g = c.goalId ? goalById(c.goalId) : null;
    var short = (g && g.short) || c.short || "";
    var clickable = !!c.goto || c.kind === "pick";
    var tag = clickable ? "button" : "div";
    var label = short;
    if (c.kind === "check") label = "Цель закрыта: " + short + (clickable ? ". Выбрать цель на сегодня" : "");
    if (c.kind === "partial") label = (c.line || "3 из 5") + ", " + short + (clickable ? ". Выбрать цель на сегодня" : "");
    if (c.kind === "nodata") label = "Нет данных по цели" + (clickable ? ". Выбрать цель на сегодня" : "");
    if (c.kind === "pick") label = "Цель на сегодня";
    if (c.kind === "taken") label = "Цель на сегодня: " + short;
    if (c.kind === "none") label = "Без цели сегодня";
    var attrs = ' class="ring-center ' + esc(c.kind) + '"';
    if (clickable) {
      attrs = ' type="button"' + attrs + ' data-action="open" data-screen="goals"';
    }
    attrs += ' aria-label="' + tx(label) + '"';
    var inner = "";
    var go = clickable && c.kind !== "pick" ? '<span class="go">на сегодня</span>' : "";
    if (c.kind === "check") inner = CHECK + '<span class="cl">' + tx(short) + "</span>" + go;
    else if (c.kind === "partial") inner = '<span class="score">' + tx(c.line || "3 из 5") + '</span><span class="cl">' + tx(short) + "</span>" + go;
    else if (c.kind === "nodata") inner = '<span class="cl">Нет данных</span>' + go;
    else if (c.kind === "pick") inner = '<span class="cl">Цель на сегодня</span>';
    else if (c.kind === "taken") {
      var load = loadByN(c.load || state.intensity);
      inner = '<span class="cl">' + tx(short) + '</span><span class="cs">' + tx(load.hint) + "</span>";
    } else if (c.kind === "none") inner = '<span class="cl">Без цели</span><span class="cs">не пропуск</span>';
    return "<" + tag + attrs + ">" + inner + "</" + tag + ">";
  }

  function stageHTML(rings, center, hits) {
    var hit = "";
    if (hits && rings) {
      hit = RING_KEYS.map(function (key) {
        return '<button type="button" class="ring-hit ' + key + '" data-action="open" data-screen="ring" data-ring="' +
          key + '" aria-label="' + tx(RING_NAME[key]) + '"></button>';
      }).join("");
    }
    return '<div class="rings-stage">' + ringsSVG(rings) + hit + centerHTML(center) + "</div>";
  }

  function navTop() {
    return state.nav.length ? state.nav[state.nav.length - 1] : null;
  }

  function animateRings(root) {
    var reduce = state.skipAnim || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.querySelectorAll(".arc").forEach(function (arc) {
      var to = arc.getAttribute("data-to");
      var from = arc.getAttribute("data-from");
      if (reduce) {
        arc.style.transition = "none";
        arc.style.strokeDashoffset = to;
        return;
      }
      arc.style.strokeDashoffset = from;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          arc.style.strokeDashoffset = to;
        });
      });
    });
  }

  function legendHTML(items, compact) {
    if (!items) return "";
    if (compact) {
      return '<div class="legend-row">' + items.map(function (it) {
        return '<button type="button" class="legend-btn" data-action="open" data-screen="ring" data-ring="' + it.key +
          '"><i class="dot ' + it.key + '"></i>' + tx(it.name + " · " + it.text) + "</button>";
      }).join("") + "</div>";
    }
    return '<ul class="legend">' + items.map(function (it) {
      return '<li><span class="name"><i class="dot ' + it.key + '"></i>' + tx(it.name) +
        '</span><span class="val ' + (it.tone || "") + '">' + tx(it.text) + "</span></li>";
    }).join("") + "</ul>";
  }

  function shareCardHTML(card) {
    var who = isNetworkPhrase(card) ? "Из сети, без имени и без точки" : (card.by || PROTO.phrase.by);
    return '<article class="share-card"><blockquote>' + tx("«" + card.quote + "»") + "</blockquote><p>" +
      tx(card.after || card.result) + '</p><p class="by">' + tx(who) + '</p><p class="brand">OnStagez</p></article>';
  }

  function monthCardHTML() {
    var t = PROTO.tally;
    return '<article class="share-card"><p class="by">' + tx("Ирина, октябрь") + '</p><ul class="stats">' +
      stat(t.closed + " " + plural(t.closed, "кольцо", "кольца", "колец"), "закрыто") +
      stat(String(t.thanks), "спасибо от гостей") +
      stat(String(t.phrases), plural(t.phrases, "фраза", "фразы", "фраз") + ", которые сработали") +
      "</ul><p class=\"brand\">OnStagez</p></article>";
  }

  function stat(value, label) {
    return "<li><span>" + tx(label) + "</span><b>" + tx(value) + "</b></li>";
  }

  function dock(actions, plain) {
    if (!actions || !actions.length) return "";
    return '<div class="' + (plain ? "card-actions" : "dock") + '">' + actions.map(function (a) {
      var cls = a.quiet ? "btn quiet" : "btn";
      var attrs = 'type="button" class="' + cls + '" data-action="' + esc(a.action) + '"';
      if (a.goto) attrs += ' data-goto="' + esc(a.goto) + '"';
      if (a.screen) attrs += ' data-screen="' + esc(a.screen) + '"';
      if (a.view) attrs += ' data-view="' + esc(a.view) + '"';
      if (a.mode) attrs += ' data-mode="' + esc(a.mode) + '"';
      if (a.goal) attrs += ' data-goal="' + esc(a.goal) + '"';
      if (a.share) attrs += ' data-kind="' + esc(a.share) + '"';
      return "<button " + attrs + ">" + tx(a.label) + "</button>";
    }).join("") + "</div>";
  }

  function goalButton(g) {
    return '<button type="button" class="goal" data-action="goal" data-goal="' + esc(g.id) + '"><span class="src">' +
      tx(g.source) + '</span><span class="gt">' + tx(g.title) + '</span><span class="gd">' + tx(g.detail) + "</span></button>";
  }

  function phraseCardHTML(p) {
    var bits = (p.actions || []).map(function (a) {
      if (a === "save") return '<span data-slot="save"></span>';
      if (a === "share") {
        return '<button type="button" class="chip" data-action="share" data-kind="phrase" data-phrase="' +
          esc(p.id) + '">' + tx("Показать коллеге") + "</button>";
      }
      if (a === "dispute") return '<span data-slot="dispute"></span>';
      if (a === "goal") {
        return '<button type="button" class="chip" data-action="goal-from-phrase" data-goal="' + esc(p.goalId) +
          '" data-phrase="' + esc(p.id) + '">' + tx("Взять как цель") + "</button>";
      }
      return "";
    }).join("");
    var meta = p.meta ? '<p class="tag">' + tx(p.meta) + "</p>" : "";
    var who = p.who ? '<p class="who">' + tx(p.who) + "</p>" : "";
    return '<article class="phrase-card ' + esc(p.kind) + '" data-id="' + esc(p.id) + '">' + meta +
      '<p class="tag">' + tx(p.tag) + "</p>" + who + "<blockquote>" + tx("«" + p.quote + "»") + "</blockquote><p class=\"after\">" +
      tx(p.after) + '</p><p class="review-note" hidden></p><div class="chips">' + bits + "</div></article>";
  }

  function networkCardHTML(p) {
    return '<article class="phrase-card network" data-id="' + esc(p.id) + '"><p class="tag">' + tx(p.tag) +
      '</p><p class="who">' + tx("Из сети, без имени") + "</p><blockquote>" + tx("«" + p.quote + "»") +
      '</blockquote><p class="after">' + tx(p.after) + '</p><p class="fine">' + tx(p.agree + ". " + p.salons + ".") +
      '</p><div class="chips"><span data-slot="save"></span><button type="button" class="chip" data-action="goal" data-origin="network" data-goal="' +
      esc(p.goalId) + '">' + tx("Взять целью") + "</button></div></article>";
  }

  function networkGroupHTML(list, title) {
    if (!list || !list.length) return "";
    return "<h2>" + tx(title) + "</h2>" + list.map(networkCardHTML).join("") +
      '<p class="fine">' + tx("Только то, что сработало в других салонах. Имени и точки нет.") + "</p>";
  }

  function phrasesHTML(ids) {
    if (!ids || !ids.length) return "";
    var cards = ids.map(phraseById).filter(Boolean);
    var good = cards.filter(function (c) { return c.kind === "good"; });
    var weak = cards.filter(function (c) { return c.kind === "weak"; });
    var html = "";
    if (good.length) html += "<h2>" + tx("Сработало") + "</h2>" + good.map(phraseCardHTML).join("");
    if (weak.length) html += "<h2>" + tx("Стоит поменять") + "</h2>" + weak.map(phraseCardHTML).join("");
    return html;
  }

  function syncPhraseChips() {
    phone.querySelectorAll(".phrase-card").forEach(function (card) {
      var id = card.getAttribute("data-id");
      var save = card.querySelector('[data-slot="save"]');
      if (save) {
        save.innerHTML = state.saved[id]
          ? '<span class="chip done">' + tx("Сохранено") + "</span>"
          : '<button type="button" class="chip" data-action="save" data-phrase="' + esc(id) + '">' + tx("Сохранить к себе") + "</button>";
      }
      var dispute = card.querySelector('[data-slot="dispute"]');
      if (dispute) {
        dispute.innerHTML = state.disputed[id]
          ? '<span class="chip done">' + tx("На проверке") + "</span>"
          : '<button type="button" class="chip" data-action="dispute" data-phrase="' + esc(id) + '">' + tx("Не согласиться") + "</button>";
      }
      var note = card.querySelector(".review-note");
      if (note) {
        note.hidden = !state.disputed[id];
        note.innerHTML = state.disputed[id] ? tx("Оценка на проверке и на кольца не влияет.") : "";
      }
    });
  }

  function viewChat(s) {
    return '<div class="chat-bg"><div class="bubble"><p>' + tx(s.chat) + '</p><span class="time">9:02</span>' +
      '<button type="button" class="btn" data-action="next">' + tx(s.button) + "</button></div></div>";
  }

  function viewExplain(s) {
    var rules = PROTO.rules.map(function (r) {
      return '<div class="rule"><i class="dot ' + r.key + '"></i><div><strong>' + tx(r.name) + "</strong><span>" +
        tx(r.text) + "</span></div></div>";
    }).join("");
    return '<div class="pad home"><h1 class="sr-only">' + tx("Кольца, пример") + "</h1>" +
      stageHTML(s.rings, s.center) + '<p class="example-label">' + tx("Пример, не ваша смена") + "</p>" +
      legendHTML(s.legend, true) + phrasesHTML(s.phraseIds) + rules +
      '<p class="note">' + tx("Планка — ваш устойчивый результат. Она растёт и не снижается.") + "</p>" +
      '<p class="demo">' + tx("Демо-данные") + "</p></div>" +
      dock([{ label: "Выбрать цель на сегодня", action: "open", screen: "goals" }]);
  }

  function workDays() {
    return PROTO.month.filter(function (row) { return !row.off && !row.today; });
  }

  function weekStrip() {
    var days = workDays().slice(-7);
    var minis = days.map(function (row) {
      return '<button type="button" class="week-day" data-action="open" data-screen="day" data-day="' + row.day +
        '" aria-label="' + tx(row.day + " октября") + '"><span>' + row.day + "</span>" + miniRings(row) + "</button>";
    }).join("");
    return '<div class="week"><div class="week-days">' + minis + '</div><button type="button" class="textlink" data-action="open" data-screen="calendar">' +
      tx("Весь октябрь") + "</button></div>";
  }

  function goalCard(s) {
    var c = s.center || { kind: "pick" };
    var g = c.goalId ? goalById(c.goalId) : null;
    var name = g ? g.title : (c.short || "");
    var body = "На сегодня цель ещё не выбрана.";
    if (c.kind === "check") body = "Вчера закрыта: " + name + ".";
    else if (c.kind === "partial") body = (c.line || "3 из 5") + ". " + name + ". Ничего не снимается, догонять не нужно.";
    else if (c.kind === "nodata") body = "По этой записи цель не разобрать. Это не оценка.";
    else if (c.kind === "taken") body = "На сегодня: " + name + ".";
    else if (c.kind === "none") body = "День без цели. Это не пропуск.";
    var primary = "";
    if (s.actions && s.actions.length) primary = dock(s.actions, true);
    else if (c.kind === "taken") {
      primary = '<button type="button" class="btn quiet" data-action="open" data-screen="goals">' + tx("Сменить") + "</button>";
    } else if (c.kind !== "none") {
      primary = '<button type="button" class="btn" data-action="open" data-screen="goals">' + tx("Выбрать цель") + "</button>";
    }
    return '<section class="goal-card"><h2>' + tx("Цель") + "</h2><p>" + tx(body) + "</p>" + primary +
      '<button type="button" class="textlink" data-action="open" data-screen="goals" data-view="all">' + tx("Все цели") + "</button>" +
      '<button type="button" class="textlink" data-action="menu">' + tx("Как считается") + "</button></section>";
  }

  function phraseLinks(s) {
    var ids = s.allPhraseIds || PROTO.shiftPhrases || [];
    var n = ids.length;
    return '<button type="button" class="textlink" data-action="open" data-screen="phrases">' +
      tx("Все фразы смены, " + n) + '</button><button type="button" class="textlink" data-action="open" data-screen="saved">' +
      tx("Мои фразы") + "</button>";
  }

  function viewHome(s) {
    var lead = s.lead ? '<p class="note">' + tx(s.lead) + "</p>" : "";
    var banner = s.banner ? '<p class="note">' + tx(s.banner) + "</p>" : "";
    var extra = s.extra ? '<p class="note">' + tx(s.extra) + "</p>" : "";
    var grew = s.grew ? '<p class="note">' + tx(s.grew) + "</p>" : "";
    var ach = s.achievement ? '<p class="achievement">' + tx(s.achievement) + "</p>" : "";
    var thanks = s.thanks ? '<p class="thanks">' + tx(thanksLine(s.thanks)) + "</p>" : "";
    var coverage = s.coverage ? '<p class="coverage">' + tx(s.coverage) + "</p>" : "";
    var net = null;
    (s.story || []).forEach(function (frame) {
      if (frame.kind === "find") net = phraseById(frame.phraseId);
    });
    if (!net) net = (PROTO.networkPhrases || [])[0];
    var netBlock = net ? '<section class="goal-card"><h2>' + tx("Сработало у коллег вчера") + "</h2>" +
      networkCardHTML(net) + '<button type="button" class="textlink" data-action="open" data-screen="phrases">' +
      tx("Фразы коллег из сети, " + PROTO.networkPhrases.length) + "</button></section>" : "";
    var replay = s.story ? '<button type="button" class="textlink" data-action="story-replay">' + tx("Утро ещё раз") + "</button>" : "";
    return '<div class="pad home"><h1 class="sr-only">' + tx("Кольца за смену") + "</h1>" +
      stageHTML(s.rings, s.center, true) + coverage + legendHTML(s.legend, true) + weekStrip() +
      grew + lead + banner + thanks + extra + goalCard(s) + phrasesHTML(s.phraseIds) + netBlock + phraseLinks(s) + replay + ach +
      '<p class="demo">' + tx("Демо-данные") + "</p></div>";
  }

  function goalsViewName(s) {
    var top = navTop();
    if (top && top.screen === "goals" && top.view) return top.view;
    return state.viewOverride || s.view || "suggested";
  }

  function viewSuggested(s) {
    var ids = s.goalIds || ["habits", "frame", "colleague"];
    var intro = s.intro || "Три варианта по вашим разговорам. Можно открыть все или пройти день без цели.";
    return '<div class="pad"><h1>' + tx("Цель на сегодня") + '</h1><p class="sub">' + tx(intro) + "</p>" +
      ids.map(function (id) { return goalButton(goalById(id)); }).join("") +
      '<button type="button" class="btn quiet" data-action="all">' + tx("Все цели") + "</button>" +
      '<button type="button" class="btn quiet" data-action="skip">' + tx("Без цели сегодня") + "</button>" +
      '<p class="demo">' + tx("Демо-данные") + "</p></div>";
  }

  function viewAll() {
    var html = PROTO.criteria.map(function (c) {
      var items = PROTO.goals.filter(function (g) { return g.criterion === c; });
      if (!items.length) return "";
      return "<h2>" + tx(c) + "</h2>" + items.map(goalButton).join("");
    }).join("");
    return '<div class="pad"><h1>' + tx("Все цели") + '</h1><p class="sub">' +
      tx("Любая проверяется по записи разговора. Нагрузку выберете на следующем шаге.") + "</p>" + html +
      '<button type="button" class="btn quiet" data-action="suggested">' + tx("Только три предложенные") + "</button>" +
      '<button type="button" class="btn quiet" data-action="skip">' + tx("Без цели сегодня") + "</button></div>";
  }

  function viewIntensity() {
    var g = goalById(state.goalId) || PROTO.goals[0];
    var loads = PROTO.loads.map(function (l) {
      var on = state.intensity === l.n ? "true" : "false";
      return '<button type="button" class="load" role="radio" aria-checked="' + on + '" data-action="load" data-load="' +
        l.n + '"><span>' + tx(l.name) + '</span><span class="lh">' + tx(l.hint) + "</span></button>";
    }).join("");
    var from = "";
    if (state.fromPhrase) from = '<p class="note">' + tx("Эта цель из фразы, которую стоит поменять.") + "</p>";
    else if (state.fromNetwork) from = '<p class="note">' + tx("Фраза из сети, без имени и без точки.") + "</p>";
    return '<div class="pad"><h1>' + tx("На сегодня") + '</h1><p class="src">' + tx(g.source) +
      '</p><p class="gt big">' + tx(g.title) + '</p><p class="note">' + tx(g.detail + " " + g.why) + "</p>" + from +
      '<div class="loads" role="radiogroup" aria-label="' + tx("Сколько разговоров") + '">' + loads + "</div>" +
      '<p class="fine">' + tx("Ориентир, не норма. Если разговоров за смену меньше, считаем те, что были.") +
      "</p></div>" + dock([
        { label: "Взять на сегодня", action: "confirm" },
        { label: "Другая цель", action: "suggested", quiet: true }
      ]);
  }

  function viewSkip() {
    return '<div class="pad home"><h1 class="sr-only">' + tx("Без цели сегодня") + "</h1>" +
      stageHTML(
        { values: { tone: null, offer: null, objection: null } },
        { kind: "none" }
      ) + '<p class="coverage">' + tx("Кольца появятся завтра по записи смены") + "</p>" +
      '<p class="note">' + tx("День без цели. В центре сегодня пусто, и это не пропуск. Кольца тона, предложения и возражений ведутся по записи, даже если цель не выбрана.") +
      "</p></div>" + dock([{ label: "Всё же выбрать цель", action: "suggested", quiet: true }].concat(
        state.fromStory ? [{ label: "Что будет завтра", action: "story-tomorrow" }] : []
      ));
  }

  function viewGoals(s) {
    var view = goalsViewName(s);
    if (view === "all") return viewAll();
    if (view === "intensity") return viewIntensity();
    if (view === "skip") return viewSkip();
    return viewSuggested(s);
  }

  function viewConfirm(s) {
    var g = goalById(state.goalId || s.goalId || s.preselect || (s.center && s.center.goalId)) || PROTO.goals[0];
    var load = loadByN(state.intensity);
    var topMode = navTop();
    var mode = (topMode && topMode.mode) || s.mode || state.confirmMode || "goal";
    var text = mode === "keep" ? s.text : "";
    if (!text) {
      text = "Цель: " + g.title + ". " + load.name + ", " + load.hint +
        ". Кольца этой смены появятся завтра утром, когда разбор будет готов.";
    }
    var center = { kind: "taken", goalId: g.id, load: load.n };
    var coverage = s.coverage ? '<p class="coverage">' + tx(s.coverage) + "</p>" : "";
    var frames = s.story || [];
    var ahead = state.fromStory && frames.some(function (f) { return f.kind === "tomorrow"; });
    var next = ahead ? dock([{ label: "Что будет завтра", action: "story-tomorrow" }]) : "";
    return '<div class="pad home"><h1 class="sr-only">' + tx("Цель на сегодня") + "</h1>" +
      stageHTML(s.rings, center) + coverage + legendHTML(s.legend, true) +
      '<p class="note">' + tx(text) + '</p><p class="demo">' + tx("Демо-данные") + "</p></div>" + next;
  }

  function viewCalendar() {
    var head = WD_SHORT.map(function (w) { return '<div class="wd">' + w + "</div>"; }).join("");
    var cells = [];
    for (var i = 0; i < PROTO.startWeekday; i++) cells.push("<div></div>");
    PROTO.month.forEach(function (row) {
      if (row.today) {
        cells.push('<div class="day-today"><span class="n">26</span></div>');
        return;
      }
      if (row.off) {
        cells.push('<div class="day-off"><span class="n">' + row.day + "</span></div>");
        return;
      }
      var label = row.day + " октября, тон " + describe(row.tone) +
        ", предложение " + describe(row.offer) + ", возражения " + describe(row.objection) +
        ", цель " + goalDescribe(row.goal);
      cells.push('<button type="button" class="day" data-action="open" data-screen="day" data-day="' + row.day + '" aria-label="' +
        tx(label) + '"><span class="n">' + row.day + "</span>" + miniRings(row) + "</button>");
    });
    var t = PROTO.tally;
    return '<div class="pad"><h1>' + tx("Октябрь") + '</h1><p class="sub">' +
      tx("Каждый день — три кольца. Точка в центре — цель. Выходные пустые, сегодня ещё без итога.") +
      '</p><div class="cal" id="grid">' + head + cells.join("") + "</div><p class=\"fine\">" +
      tx("26 октября ещё без итога: он приходит на следующее утро.") + '</p><h2 id="summary">' +
      tx("Что осталось с вами") + "</h2><ul class=\"stats\">" +
      stat(String(t.closed), "Закрытых колец") +
      stat(String(t.thanks), "Спасибо от гостей") +
      stat(String(t.phrases), "Фраз, которые сработали") +
      stat(t.record + " подряд", "Рекорд серии") +
      "</ul><p class=\"note\">" + tx("Это остаётся с вами. Ничего из этого не снимается. За " + t.shifts + " " +
        plural(t.shifts, "смену", "смены", "смен") + " октября.") + "</p>" +
      '<p class="fine">' + tx("Так карточка выглядит, если показать её коллеге.") + "</p>" +
      monthCardHTML() + '<p class="demo">' + tx("Демо-данные") + "</p></div>" +
      dock([{ label: "Показать итоги коллеге", action: "share", share: "month" }]);
  }

  function viewRing(key) {
    var rule = PROTO.rules.filter(function (r) { return r.key === key; })[0] || PROTO.rules[0];
    var info = (PROTO.bars && PROTO.bars[key]) || { fact: "", bar: "", note: "" };
    var hist = (PROTO.ringHistory && PROTO.ringHistory[key]) || [];
    var bars = hist.map(function (h) {
      var hgt = h.value == null ? 8 : Math.max(8, Math.round(Math.min(1, h.value) * 100));
      var color = h.value == null ? "#C5D0DE" : RING_COLOR[key];
      return '<div class="bar"><i style="height:' + hgt + "%;background:" + color + '"></i><span>' + h.day + "</span></div>";
    }).join("");
    var pool = step().allPhraseIds || PROTO.shiftPhrases || [];
    var related = pool.filter(function (id) {
      var phrase = phraseById(id);
      return phrase && phrase.ring === key;
    });
    var relatedHTML = related.length ? phrasesHTML(related) : '<p class="note">' + tx("За эту смену фраз по этому кольцу нет.") + "</p>";
    var goalId = PROTO.ringGoals ? PROTO.ringGoals[key] : "habits";
    var grew = key === "offer" && step().grew ? '<p class="note">' + tx(step().grew) + "</p>" : "";
    return '<div class="pad"><h1>' + tx(rule.name) + "</h1><p class=\"note\">" + tx(rule.text) + "</p><p class=\"sub\">" +
      tx(info.fact + ". Планка: " + info.bar) + "</p><p class=\"note\">" + tx(info.note) + "</p>" + grew +
      '<div class="bars" aria-hidden="true">' + bars + "</div><p class=\"fine\">" +
      tx("Семь последних смен. Серый столбик — нет данных.") + "</p>" + relatedHTML +
      networkGroupHTML((PROTO.networkPhrases || []).filter(function (p) { return p.ring === key; }), "У коллег по этому кольцу вчера сработало") +
      "</div>" + dock([{ label: "Взять цель по этой теме", action: "goal", goal: goalId }]);
  }

  function viewDay(day) {
    var row = PROTO.month.filter(function (d) { return d.day === day; })[0];
    if (!row) return '<div class="pad"><p class="note">' + tx("Этого дня нет в разборе.") + "</p></div>";
    var list = workDays();
    var idx = -1;
    list.forEach(function (item, i) { if (item.day === day) idx = i; });
    var prev = idx > 0 ? list[idx - 1] : null;
    var next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
    var navBtns = '<div class="day-nav">' +
      (prev ? '<button type="button" class="btn quiet" data-action="replace" data-day="' + prev.day + '">' + tx("Раньше") + "</button>" : "<span></span>") +
      (next ? '<button type="button" class="btn quiet" data-action="replace" data-day="' + next.day + '">' + tx("Позже") + "</button>" : "<span></span>") +
      "</div>";
    var goalName = row.goalId && goalById(row.goalId) ? goalById(row.goalId).short : "";
    var goalLine = '<p class="note">' + tx("Цель: " + goalDescribe(row.goal) + (goalName ? ", " + goalName : "")) + "</p>";
    var note = "";
    if (row.goal == null && (row.offer == null || row.objection == null)) {
      note = '<p class="note">' + tx("Бейдж в этот день был выключен часть смены. Это не оценка.") + "</p>";
    }
    var grew = row.grew ? '<p class="note">' + tx("Планка по предложению в этот день выросла.") + "</p>" : "";
    var thanks = row.thanks ? '<p class="thanks">' + tx(thanksLine(row.thanks)) + "</p>" : "";
    return '<div class="pad"><h1>' + tx(row.day + " октября, " + WD[weekday(row.day)]) + "</h1>" +
      stageHTML({ values: { tone: row.tone, offer: row.offer, objection: row.objection } }, null, true) +
      legendHTML([
        { key: "tone", name: "Тон", text: describe(row.tone), tone: row.tone == null ? "muted" : "" },
        { key: "offer", name: "Предложение", text: describe(row.offer), tone: row.offer == null ? "muted" : "" },
        { key: "objection", name: "Возражения", text: describe(row.objection), tone: row.objection == null ? "muted" : "" }
      ], true) + goalLine + note + grew + thanks + phrasesHTML(row.phraseIds) + navBtns +
      '<p class="demo">' + tx("Демо-данные") + "</p></div>";
  }

  function viewPhrases() {
    var s = step();
    var ids = s.allPhraseIds || PROTO.shiftPhrases || [];
    var filter = state.phraseFilter || "all";
    var chips = [{ id: "all", name: "Все" }].concat(RING_KEYS.map(function (key) {
      return { id: key, name: RING_NAME[key] };
    })).map(function (f) {
      var on = filter === f.id ? "true" : "false";
      return '<button type="button" class="filter" aria-pressed="' + on + '" data-action="filter" data-filter="' + f.id + '">' + tx(f.name) + "</button>";
    }).join("");
    var shown = ids.filter(function (id) {
      var p = phraseById(id);
      return p && (filter === "all" || p.ring === filter);
    });
    var empty = shown.length ? "" : '<p class="note">' + tx("В этом критерии фраз за смену нет.") + "</p>";
    var net = (PROTO.networkPhrases || []).filter(function (p) {
      return filter === "all" || p.ring === filter;
    });
    var netEmpty = net.length ? "" : '<p class="note">' + tx("В этом кольце фраз из сети нет.") + "</p>";
    return '<div class="pad"><h1>' + tx("Фразы смены") + '</h1><p class="sub">' +
      tx("Сработавшие можно сохранить и показать. То, что стоит поменять, можно взять целью или оспорить.") +
      '</p><div class="filters">' + chips + "</div>" + empty + phrasesHTML(shown) +
      netEmpty + networkGroupHTML(net, "Сработало у коллег вчера") +
      '<button type="button" class="textlink" data-action="open" data-screen="saved">' + tx("Мои фразы") + "</button>" +
      '<p class="demo">' + tx("Демо-данные") + "</p></div>";
  }

  function viewSaved() {
    return '<div class="pad"><h1>' + tx("Мои фразы") + "</h1>" + savedListHTML() +
      '<p class="fine">' + tx("Сохранённая фраза остаётся здесь. На кольца это не влияет.") + "</p></div>";
  }

  function storyFrames() {
    return (step().story || []);
  }

  function storyFrame() {
    var frames = storyFrames();
    if (!state.story || !frames.length) return null;
    return frames[state.story.index] || frames[0];
  }

  function storyHolds(frame) {
    return frame && (frame.kind === "find" || frame.kind === "goal" || frame.kind === "tomorrow");
  }

  function clearStoryTimer() {
    if (storyTimer) {
      clearTimeout(storyTimer);
      storyTimer = null;
    }
  }

  function motionReduced() {
    return state.skipAnim || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function armStoryTimer() {
    clearStoryTimer();
    if (!state.story || navTop() || state.sheet) return;
    if (motionReduced() || storyHolds(storyFrame())) return;
    storyTimer = setTimeout(function () {
      storyTimer = null;
      if (!state.story || navTop()) return;
      storyMove(1);
    }, STORY_MS);
  }

  function beginStory(index) {
    var frames = storyFrames();
    clearStoryTimer();
    if (!frames.length) {
      state.story = null;
      return;
    }
    var i = index == null ? 0 : index;
    if (i < 0) i = 0;
    if (i >= frames.length) i = frames.length - 1;
    state.story = { index: i };
    state.fromStory = false;
  }

  function endStory() {
    clearStoryTimer();
    state.story = null;
    state.fromStory = false;
    state.sheet = null;
    state.nav = [];
  }

  function storyMove(dir) {
    var frames = storyFrames();
    if (!state.story || !frames.length) return;
    var i = state.story.index + dir;
    if (i < 0) return;
    if (i >= frames.length) {
      endStory();
      render();
      return;
    }
    state.story.index = i;
    state.skipAnim = false;
    state.sheet = null;
    render();
  }

  function storySeek(kind) {
    var frames = storyFrames();
    var i = -1;
    frames.forEach(function (frame, idx) { if (frame.kind === kind) i = idx; });
    state.nav = [];
    state.sheet = null;
    if (i < 0) {
      endStory();
      render();
      return;
    }
    state.story = { index: i };
    state.skipAnim = false;
    render();
  }

  function viewStory() {
    var frames = storyFrames();
    var frame = storyFrame();
    if (!frame) return "";
    var bars = frames.map(function (_, i) {
      var cls = i < state.story.index ? "done" : (i === state.story.index ? "current" : "");
      return '<i class="' + cls + '"><b></b></i>';
    }).join("");
    return '<div class="story"><div class="story-top"><div class="story-bars" aria-hidden="true">' + bars +
      '</div><button type="button" class="story-skip" data-action="story-skip">' + tx("Пропустить") + "</button></div>" +
      '<div class="story-frame" data-kind="' + esc(frame.kind) + '">' + storyBody(frame) + "</div>" +
      '<button type="button" class="story-zone prev" data-action="story-prev" aria-label="' + tx("Предыдущий кадр") + '"></button>' +
      '<button type="button" class="story-zone next" data-action="story-next" aria-label="' + tx("Следующий кадр") + '"></button></div>';
  }

  function storyBody(frame) {
    var s = step();
    if (frame.kind === "hello" || frame.kind === "honest") {
      return '<p class="story-kicker">' + tx(frame.kicker || "Утро") + "</p><h1>" + tx(frame.title) +
        '</h1><p class="story-lead">' + tx(frame.text) + "</p>";
    }
    if (frame.kind === "rings") {
      var note = frame.note ? '<p class="story-lead">' + tx(frame.note) + "</p>" : "";
      return stageHTML(s.rings, s.center, false) + note +
        '<div class="story-legend">' + (s.legend || []).map(function (it) {
          return "<span><i class=\"dot " + it.key + "\"></i>" + tx(it.name + " · " + it.text) + "</span>";
        }).join("") + "</div>";
    }
    if (frame.kind === "bar") {
      return '<p class="story-kicker">' + tx("Что выросло") + '</p><p class="story-num" data-count="' + frame.count +
        '">0</p><p class="story-caption">' + tx(frame.caption) + '</p><p class="story-lead">' + tx(frame.text) + "</p>";
    }
    if (frame.kind === "phrase") {
      var phrase = phraseById(frame.phraseId) || PROTO.phrase;
      return '<p class="story-kicker">' + tx(phrase.tag) + "</p><blockquote>" + tx("«" + phrase.quote + "»") +
        '</blockquote><p class="story-lead">' + tx(phrase.after) + "</p>";
    }
    if (frame.kind === "thanks") {
      return '<p class="story-kicker">' + tx("От гостей") + '</p><p class="story-num" data-count="' + frame.count +
        '">0</p><p class="story-lead">' + tx(thanksLine(frame.count)) + "</p>";
    }
    if (frame.kind === "find") {
      var found = phraseById(frame.phraseId);
      if (!found) return "";
      return '<p class="story-kicker">' + tx("Открытие коллеги") + "</p><blockquote>" + tx("«" + found.quote + "»") +
        '</blockquote><p class="story-lead">' + tx(found.after) + "</p><p class=\"story-caption\">" +
        tx(found.agree + ". " + found.salons + ".") + "</p>" +
        '<button type="button" class="btn story-btn" data-action="goal" data-origin="network" data-goal="' +
        esc(found.goalId) + '">' + tx("Взять целью на сегодня") + "</button>";
    }
    if (frame.kind === "goal") {
      var ids = s.goalIds || ["habits", "frame", "colleague"];
      return '<p class="story-kicker">' + tx("На сегодня") + "</p><h1>" + tx("Три цели") + "</h1>" +
        ids.map(function (id) { return goalButton(goalById(id)); }).join("") +
        '<button type="button" class="btn quiet story-btn" data-action="story-all">' + tx("Все цели") + "</button>" +
        '<button type="button" class="btn quiet story-btn" data-action="story-next">' + tx("Без цели сегодня") + "</button>";
    }
    if (frame.kind === "tomorrow") {
      var line = state.goalId ? frame.text : (frame.alt || frame.text);
      return '<p class="story-kicker">' + tx("Повод вернуться") + "</p><h1>" + tx(frame.title) +
        '</h1><p class="story-lead">' + tx(line) + "</p>" +
        '<button type="button" class="btn story-btn" data-action="story-skip">' + tx("К смене") + "</button>";
    }
    return "";
  }

  function animateCount(root) {
    root.querySelectorAll("[data-count]").forEach(function (el) {
      var to = +el.getAttribute("data-count") || 0;
      if (motionReduced()) {
        el.textContent = String(to);
        return;
      }
      var t0 = performance.now();
      function tick(now) {
        var p = Math.min(1, (now - t0) / 700);
        el.textContent = String(Math.round(to * p));
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = String(to);
      }
      requestAnimationFrame(tick);
    });
  }

  function screenHTML(s) {
    var top = navTop();
    if (top) {
      if (top.screen === "calendar") return viewCalendar();
      if (top.screen === "ring") return viewRing(top.ring || "tone");
      if (top.screen === "day") return viewDay(top.day);
      if (top.screen === "phrases") return viewPhrases();
      if (top.screen === "saved") return viewSaved();
      if (top.screen === "goals") return viewGoals(s);
      if (top.screen === "confirm") return viewConfirm(s);
      if (top.screen === "skip") return viewSkip();
    }
    if (state.story && storyFrames().length) return viewStory();
    if (s.screen === "chat") return viewChat(s);
    if (s.screen === "explain") return viewExplain(s);
    if (s.screen === "home") return viewHome(s);
    if (s.screen === "goals") return viewGoals(s);
    if (s.screen === "skip") return viewSkip();
    if (s.screen === "confirm") return viewConfirm(s);
    if (s.screen === "calendar") return viewCalendar();
    return "";
  }

  function header(s) {
    if (state.story && storyFrames().length && !state.nav.length) return "";
    if ((s.chrome || "mini") === "chat") {
      return '<div class="tg-head"><div class="avatar" aria-hidden="true">O</div><div><div class="who">OnStagez</div><div class="sub">бот</div></div></div>';
    }
    var back = state.nav.length
      ? '<button type="button" class="linkish" data-action="back">' + tx("Назад") + "</button>"
      : '<button type="button" class="linkish" data-action="close">' + tx("Закрыть") + "</button>";
    return '<div class="mini-head">' + back +
      '<div class="grow">OnStagez</div><button type="button" class="linkish" data-action="menu">' +
      tx("Ещё") + "</button></div>";
  }

  function sheetWrap(inner) {
    return '<div class="dim" data-action="close-sheet"></div><div class="sheet" role="dialog"><div class="handle"></div>' +
      inner + "</div>";
  }

  function savedListHTML() {
    var ids = Object.keys(state.saved);
    if (!ids.length) {
      return '<p class="note">' + tx("Пока пусто. Фраза появится здесь, когда вы её сохраните.") + "</p>";
    }
    return ids.map(function (id) {
      var p = phraseById(id);
      if (!p) return "";
      var origin = isNetworkPhrase(p) ? '<p class="fine">' + tx("Из сети, без имени и без точки.") + "</p>" : "";
      return '<article class="phrase-card"><p class="tag">' + tx(p.tag) + "</p><blockquote>" +
        tx("«" + p.quote + "»") + '</blockquote><p class="after">' + tx(p.after) + "</p>" + origin + "</article>";
    }).join("");
  }

  function sheetHTML() {
    if (state.sheet === "menu") {
      var rules = PROTO.rules.map(function (r) {
        return "<p class=\"note\"><strong>" + tx(r.name) + ".</strong> " + tx(r.text) + "</p>";
      }).join("");
      var extra = PROTO.menuExtra.map(function (p) { return '<p class="note">' + tx(p) + "</p>"; }).join("");
      var count = Object.keys(state.saved).length;
      var savedLabel = count ? "Мои фразы, " + count : "Мои фразы";
      return sheetWrap("<h2>" + tx("Как устроены кольца") + "</h2>" + rules + extra +
        '<button type="button" class="btn" data-action="open" data-screen="saved">' + tx(savedLabel) + "</button>" +
        '<button type="button" class="btn quiet" data-action="close-sheet">' + tx("Закрыть") + "</button>");
    }
    if (state.sheet === "saved") {
      return sheetWrap("<h2>" + tx("Мои фразы") + "</h2>" + savedListHTML() +
        '<button type="button" class="btn quiet" data-action="close-sheet">' + tx("Закрыть") + "</button>");
    }
    if (state.sheet === "dispute") {
      var disputed = phraseById(state.disputePhraseId);
      var quote = disputed ? '<blockquote>' + tx("«" + disputed.quote + "»") + "</blockquote>" : "";
      return sheetWrap("<h2>" + tx("На проверке") + "</h2>" + quote + '<p class="note">' +
        tx("Оценка на проверке. Пока спор не разобран, она не влияет на кольца.") + "</p>" +
        '<button type="button" class="btn quiet" data-action="close-sheet">' + tx("Закрыть") + "</button>");
    }
    if (state.sheet === "share") {
      if (state.shareSent) {
        return sheetWrap("<h2>" + tx("Карточка собрана") + "</h2><p class=\"note\">" +
          tx("В прототипе сообщение не отправляется. В продукте здесь откроется выбранный чат с этой карточкой.") +
          '</p><button type="button" class="btn quiet" data-action="close-sheet">' + tx("Закрыть") + "</button>");
      }
      var title = state.shareKind === "month" ? "Показать итоги" : "Показать коллеге";
      var preview = "";
      if (state.shareKind === "month") preview = monthCardHTML();
      else {
        var card = phraseById(state.sharePhraseId) || PROTO.phrase;
        preview = shareCardHTML(card);
      }
      return sheetWrap("<h2>" + tx(title) + "</h2>" + preview + '<p class="note">' +
        tx("В карточке нет баллов и нет сравнения с коллегами.") + "</p>" +
        '<button type="button" class="btn" data-action="send" data-to="salon">' + tx("В чат салона") + "</button>" +
        '<button type="button" class="btn quiet" data-action="send" data-to="sveta">' + tx("Светлане") + "</button>" +
        '<button type="button" class="btn quiet" data-action="close-sheet">' + tx("Отмена") + "</button>");
    }
    if (state.sheet === "day") {
      var row = PROTO.month.filter(function (d) { return d.day === state.day; })[0];
      if (!row) return "";
      var lines = RING_KEYS.map(function (key) {
        return "<li><span class=\"name\"><i class=\"dot " + key + "\"></i>" + tx(RING_NAME[key]) + "</span><span>" +
          tx(describe(row[key])) + "</span></li>";
      }).join("");
      var goalLine = "<li><span class=\"name\">" + tx("Цель") + "</span><span>" + tx(goalDescribe(row.goal)) + "</span></li>";
      var note = "";
      if (row.goal == null && (row.offer == null || row.objection == null)) {
        note = '<p class="note">' + tx("Бейдж в этот день был выключен часть смены. Это не оценка.") + "</p>";
      }
      var phrase = row.phrase ? '<p class="note">' + tx("«" + row.phrase + "»") + "</p>" : "";
      var grew = row.grew ? '<p class="note">' + tx("Планка по предложению в этот день выросла.") + "</p>" : "";
      var thanks = row.thanks ? '<p class="note">' + tx(thanksLine(row.thanks)) + "</p>" : "";
      return sheetWrap("<h2>" + tx(row.day + " октября, " + WD[weekday(row.day)]) + "</h2><ul class=\"legend\">" +
        lines + goalLine + "</ul>" + phrase + grew + thanks + note +
        '<button type="button" class="btn quiet" data-action="close-sheet">' + tx("Закрыть") + "</button>");
    }
    return "";
  }

  function applyScroll() {
    var sel = step().scrollTo;
    if (!sel) return;
    var body = phone.querySelector(".screen-body");
    var el = phone.querySelector(sel);
    if (body && el) body.scrollTop = Math.max(0, el.offsetTop - body.offsetTop - 8);
  }

  function renderPhone() {
    var s = step();
    var navKey = state.nav.map(function (n) {
      return [n.screen, n.ring || "", n.day || "", n.view || "", n.mode || ""].join(".");
    }).join(">");
    var storyKey = state.story ? state.story.index : "";
    var key = [state.scenarioId, state.step, state.goalId, state.intensity, state.viewOverride, state.confirmMode, state.fromPhrase ? 1 : 0, state.fromNetwork ? 1 : 0, state.phraseFilter, storyKey, navKey].join("|");
    if (key !== state.renderedKey) {
      phone.innerHTML = '<div class="statusbar"><span>9:04</span><span>LTE</span></div><div class="screen">' +
        header(s) + '<div class="screen-body">' + screenHTML(s) + "</div></div>";
      animateRings(phone);
      animateCount(phone);
      applyScroll();
      state.renderedKey = key;
      state.skipAnim = false;
    }
    syncPhraseChips();
    var screen = phone.querySelector(".screen");
    if (!screen) return;
    var oldDim = screen.querySelector(".dim");
    var oldSheet = screen.querySelector(".sheet");
    if (oldDim) oldDim.remove();
    if (oldSheet) oldSheet.remove();
    if (state.sheet) screen.insertAdjacentHTML("beforeend", sheetHTML());
    armStoryTimer();
  }

  function renderSidebar() {
    var top = sidebar.scrollTop;
    var sc = scenario();
    var s = step();
    var options = PROTO.scenarios.map(function (item, index) {
      var sel = item.id === state.scenarioId ? " selected" : "";
      return '<option value="' + esc(item.id) + '"' + sel + ">" + (index + 1) + ". " + esc(item.title) + "</option>";
    }).join("");
    var list = PROTO.scenarios.map(function (item) {
      var current = item.id === state.scenarioId;
      return '<button type="button" class="scenario" data-action="scenario" data-id="' +
        esc(item.id) + '"' + (current ? ' aria-current="true"' : "") + '><span class="scenario-name">' + tx(item.title) +
        '</span><span class="scenario-line">' + tx(item.shows) + '</span><span class="scenario-line">' +
        tx("Проверяем: " + item.checks) + "</span></button>";
    }).join("");
    var stepper = '<ol class="steps">' + sc.steps.map(function (st, i) {
      var cur = i === state.step ? ' aria-current="step"' : "";
      return '<li><button type="button" data-action="step" data-step="' + i + '"' + cur + ">" + tx(st.title) + "</button></li>";
    }).join("") + "</ol>";
    sidebar.innerHTML = '<div class="presenter"><p class="kicker">' + tx("Прототип для показа") + "</p><h1>" +
      tx("Кольца и цель на день") + "</h1><p class=\"intro\">" +
      tx("Оптика, сотрудник в зале. Сценарий задаёт утро. Календарь, кольцо и фразы открываются внутри телефона. Демо-данные.") +
      '</p><label class="kicker mobile-only" for="scenario-select">' + tx("Сценарий") + "</label>" +
      '<select id="scenario-select" class="scenario-select">' + options + "</select>" + stepper +
      '<p class="now">' + tx(s.title) + '</p><p class="hint">' + tx(s.hint) + "</p>" +
      '<button type="button" class="restart" data-action="restart">' + tx("Начать заново") + "</button>" +
      '<p class="keys">' + tx("Стрелки влево и вправо переключают шаги.") + "</p></div>" +
      '<div class="scenario-list">' + list + "</div>";
    sidebar.scrollTop = top;
  }

  function hash() {
    var top = navTop();
    var next = "#" + state.scenarioId + "/" + state.step;
    if (!top && state.story && storyFrames().length) {
      next += "/story/" + state.story.index;
    } else if (top) {
      next += "/" + top.screen;
      if (top.screen === "ring") next += "/" + (top.ring || "tone");
      else if (top.screen === "day") next += "/" + top.day;
      else if (top.screen === "goals" && top.view) next += "/" + top.view;
    }
    if (location.hash !== next) history.replaceState(null, "", next);
  }

  function readHash() {
    var m = location.hash.match(/^#([a-z0-9-]+)\/(\d+)(?:\/([a-z]+))?(?:\/([a-z0-9]+))?$/);
    if (!m || !PROTO.scenarios.some(function (s) { return s.id === m[1]; })) return null;
    var known = { calendar: 1, ring: 1, day: 1, phrases: 1, saved: 1, goals: 1, confirm: 1, skip: 1, story: 1 };
    var entry = null;
    var storyIndex = null;
    if (m[3] === "story") storyIndex = +(m[4] || 0);
    else if (m[3] && known[m[3]]) {
      entry = { screen: m[3] };
      if (m[3] === "ring") entry.ring = m[4] || "tone";
      if (m[3] === "day") entry.day = +(m[4] || 24);
      if (m[3] === "goals" && m[4]) entry.view = m[4];
    }
    return { id: m[1], step: +m[2], entry: entry, storyIndex: storyIndex };
  }

  function push(entry) {
    var top = navTop();
    if (top && entry.screen === "ring" && top.screen === "ring") {
      top.ring = entry.ring;
      state.sheet = null;
      render();
      return;
    }
    if (top && top.screen === entry.screen && entry.screen !== "day" && entry.screen !== "ring") {
      if (entry.view) top.view = entry.view;
      if (entry.mode) top.mode = entry.mode;
      state.sheet = null;
      render();
      return;
    }
    state.sheet = null;
    state.nav.push(entry);
    render();
  }

  function pop() {
    state.nav.pop();
    state.sheet = null;
    state.skipAnim = true;
    render();
  }

  function render() {
    renderSidebar();
    renderPhone();
    hash();
  }

  function enter() {
    var s = step();
    state.sheet = s.openSheet || null;
    state.shareSent = null;
    state.saved = {};
    state.disputed = {};
    (s.savedIds || []).forEach(function (id) { state.saved[id] = true; });
    (s.disputedIds || []).forEach(function (id) { state.disputed[id] = true; });
    state.disputePhraseId = s.disputeId || null;
    state.sharePhraseId = s.sharePhrase || null;
    if (s.share) state.shareKind = s.share;
    if (s.mode) state.confirmMode = s.mode;
    if (s.goalId) state.goalId = s.goalId;
    else if (!state.goalId && s.preselect) state.goalId = s.preselect;
    state.fromPhrase = !!s.fromPhrase;
    state.fromNetwork = false;
    state.fromStory = false;
    clearStoryTimer();
    state.story = null;
  }

  function go(index, keepGoal) {
    var steps = scenario().steps;
    if (index < 0 || index >= steps.length) return;
    var carryPhrase = !!(keepGoal && state.fromPhrase && !state.plainGoal);
    var plain = state.plainGoal;
    state.step = index;
    state.nav = [];
    state.phraseFilter = "all";
    state.viewOverride = null;
    state.shareSent = null;
    state.plainGoal = false;
    if (!keepGoal) {
      state.goalId = null;
      state.intensity = 5;
    }
    enter();
    if (plain) state.fromPhrase = false;
    else if (carryPhrase) state.fromPhrase = true;
    beginStory(0);
    render();
  }

  function goId(id, keepGoal) {
    var i = scenario().steps.findIndex(function (s) { return s.id === id; });
    if (i >= 0) go(i, keepGoal);
  }

  function showView(view) {
    if (view === "skip") { push({ screen: "skip" }); return; }
    var top = navTop();
    if (top && top.screen === "goals") {
      top.view = view;
      render();
      return;
    }
    push({ screen: "goals", view: view });
  }

  function setScenario(id) {
    state.scenarioId = id;
    state.step = 0;
    state.goalId = null;
    state.intensity = 5;
    state.confirmMode = null;
    state.viewOverride = null;
    state.fromPhrase = false;
    state.fromNetwork = false;
    state.fromStory = false;
    state.nav = [];
    state.phraseFilter = "all";
    state.sheet = null;
    state.shareSent = null;
    state.saved = {};
    state.disputed = {};
    state.renderedKey = "";
    enter();
    beginStory(0);
    render();
  }

  function restart() {
    state.step = 0;
    state.goalId = null;
    state.intensity = 5;
    state.confirmMode = null;
    state.viewOverride = null;
    state.fromPhrase = false;
    state.fromNetwork = false;
    state.fromStory = false;
    state.nav = [];
    state.phraseFilter = "all";
    state.sheet = null;
    state.shareSent = null;
    state.saved = {};
    state.disputed = {};
    state.renderedKey = "";
    enter();
    beginStory(0);
    render();
  }

  document.body.addEventListener("click", function (e) {
    var el = e.target.closest("[data-action]");
    if (!el) return;
    var action = el.getAttribute("data-action");
    if (action === "scenario") { setScenario(el.getAttribute("data-id")); return; }
    if (action === "step") { go(+el.getAttribute("data-step"), false); return; }
    if (action === "restart") { restart(); return; }
    if (action === "next") { go(state.step + 1, true); return; }
    if (action === "goto") { goId(el.getAttribute("data-goto"), true); return; }
    if (action === "back") { pop(); return; }
    if (action === "story-skip") { endStory(); render(); return; }
    if (action === "story-replay") { state.nav = []; beginStory(0); render(); return; }
    if (action === "story-tomorrow") { storySeek("tomorrow"); return; }
    if (action === "story-prev") { storyMove(-1); return; }
    if (action === "story-next") {
      if (el.classList.contains("story-btn")) state.goalId = null;
      storyMove(1);
      return;
    }
    if (action === "story-all") {
      state.fromStory = true;
      state.fromPhrase = false;
      state.fromNetwork = false;
      push({ screen: "goals", view: "all" });
      return;
    }
    if (action === "open") {
      var screen = el.getAttribute("data-screen");
      if (!screen) return;
      var entry = { screen: screen };
      if (el.getAttribute("data-ring")) entry.ring = el.getAttribute("data-ring");
      if (el.getAttribute("data-day")) entry.day = +el.getAttribute("data-day");
      if (el.getAttribute("data-view")) entry.view = el.getAttribute("data-view");
      if (el.getAttribute("data-mode")) {
        entry.mode = el.getAttribute("data-mode");
        state.confirmMode = entry.mode;
      }
      state.sheet = null;
      push(entry);
      return;
    }
    if (action === "replace") {
      var topNow = navTop();
      if (topNow) {
        topNow.day = +el.getAttribute("data-day");
        state.skipAnim = true;
        render();
      }
      return;
    }
    if (action === "filter") {
      state.phraseFilter = el.getAttribute("data-filter") || "all";
      render();
      return;
    }
    if (action === "goal" || action === "goal-from-phrase") {
      state.goalId = el.getAttribute("data-goal");
      state.fromPhrase = action === "goal-from-phrase";
      state.fromNetwork = !state.fromPhrase && el.getAttribute("data-origin") === "network";
      if (state.story) state.fromStory = true;
      var goalsTop = navTop();
      if (goalsTop && goalsTop.screen === "goals") {
        goalsTop.view = "intensity";
        render();
      } else {
        push({ screen: "goals", view: "intensity" });
      }
      return;
    }
    if (action === "load") {
      state.intensity = +el.getAttribute("data-load");
      render();
      return;
    }
    if (action === "all" || action === "suggested" || action === "skip") { showView(action === "all" ? "all" : action); return; }
    if (action === "confirm") {
      state.confirmMode = "goal";
      push({ screen: "confirm", mode: "goal" });
      return;
    }
    if (action === "menu") {
      state.sheet = state.sheet === "menu" ? null : "menu";
      state.shareSent = null;
      render();
      return;
    }
    if (action === "saved") { state.sheet = null; push({ screen: "saved" }); return; }
    if (action === "save") {
      state.saved[el.getAttribute("data-phrase")] = true;
      render();
      return;
    }
    if (action === "dispute") {
      var id = el.getAttribute("data-phrase");
      state.disputed[id] = true;
      state.disputePhraseId = id;
      state.sheet = "dispute";
      render();
      return;
    }
    if (action === "share") {
      state.shareKind = el.getAttribute("data-kind") || "phrase";
      state.sharePhraseId = el.getAttribute("data-phrase") || state.sharePhraseId;
      state.shareSent = null;
      state.sheet = "share";
      render();
      return;
    }
    if (action === "send") { state.shareSent = el.getAttribute("data-to"); render(); return; }
    if (action === "close-sheet") { state.sheet = null; state.shareSent = null; render(); return; }
    if (action === "close") {
      if (state.sheet) { state.sheet = null; state.shareSent = null; render(); return; }
      if (state.nav.length) { pop(); return; }
      go(0, false);
    }
  });

  document.body.addEventListener("change", function (e) {
    if (e.target.id === "scenario-select") setScenario(e.target.value);
  });

  document.addEventListener("keydown", function (e) {
    if (e.target.matches("input, textarea, select")) return;
    if (e.key === "Escape" && state.sheet) { state.sheet = null; state.shareSent = null; render(); return; }
    if (state.story && !state.nav.length) {
      if (e.key === "Escape") { endStory(); render(); return; }
      if (e.key === "ArrowRight") { storyMove(1); return; }
      if (e.key === "ArrowLeft") { storyMove(-1); return; }
    }
    if (e.key === "Escape" && state.nav.length) { pop(); return; }
    if (e.key === "ArrowRight") go(state.step + 1, true);
    if (e.key === "ArrowLeft") go(state.step - 1, true);
  });

  window.addEventListener("hashchange", function () {
    var next = readHash();
    if (!next) return;
    var same = next.id === state.scenarioId && next.step === state.step;
    if (!same) {
      state.scenarioId = next.id;
      state.goalId = null;
      state.intensity = 5;
      state.confirmMode = null;
      state.viewOverride = null;
      state.fromPhrase = false;
      state.fromNetwork = false;
      state.fromStory = false;
      state.saved = {};
      state.disputed = {};
      state.renderedKey = "";
      state.step = Math.min(next.step, scenario().steps.length - 1);
      state.nav = [];
      enter();
    }
    state.sheet = null;
    if (next.storyIndex != null) {
      state.nav = [];
      beginStory(next.storyIndex);
    } else if (next.entry) {
      clearStoryTimer();
      state.story = null;
      state.nav = [next.entry];
    } else if (!same) {
      state.nav = [];
      beginStory(0);
    } else {
      state.nav = [];
    }
    state.renderedKey = "";
    render();
  });

  var hashMatch = readHash();
  if (hashMatch) {
    state.scenarioId = hashMatch.id;
    state.step = Math.min(hashMatch.step, scenario().steps.length - 1);
  }
  enter();
  if (hashMatch && hashMatch.storyIndex != null) beginStory(hashMatch.storyIndex);
  else if (hashMatch && hashMatch.entry) state.nav = [hashMatch.entry];
  else beginStory(0);
  render();
})();
