(function () {
  var cards = window.FLASHCARDS || [];
  var storageKey = "gre-saad-flashcards-progress-v2";
  var oldStorageKey = "gre-saad-flashcards-progress-v1";
  var dailyLimit = 60;

  var state = loadState();
  var activeSection = "All";
  var activeSet = "All";
  var queue = [];
  var currentIndex = 0;
  var revealed = false;
  var browseMode = false;

  var els = {
    dueCount: q("#dueCount"),
    startDueBtn: q("#startDueBtn"),
    startNewBtn: q("#startNewBtn"),
    sectionNav: q("#sectionNav"),
    resetBtn: q("#resetBtn"),
    exportBtn: q("#exportBtn"),
    importInput: q("#importInput"),
    activeModeLabel: q("#activeModeLabel"),
    viewTitle: q("#viewTitle"),
    searchInput: q("#searchInput"),
    decksBtn: q("#decksBtn"),
    browseBtn: q("#browseBtn"),
    totalCards: q("#totalCards"),
    newCards: q("#newCards"),
    learningCards: q("#learningCards"),
    reviewCards: q("#reviewCards"),
    masteredCards: q("#masteredCards"),
    streakCount: q("#streakCount"),
    studyView: q("#studyView"),
    deckView: q("#deckView"),
    browseView: q("#browseView"),
    queueMeta: q("#queueMeta"),
    queueProgress: q("#queueProgress"),
    cardMiniStats: q("#cardMiniStats"),
    setFilter: q("#setFilter"),
    flashcard: q("#flashcard"),
    cardSection: q("#cardSection"),
    cardWord: q("#cardWord"),
    cardPrompt: q("#cardPrompt"),
    cardAnswer: q("#cardAnswer"),
    cardMeaning: q("#cardMeaning"),
    cardSynonyms: q("#cardSynonyms"),
    cardMemory: q("#cardMemory"),
    cardExample: q("#cardExample"),
    cardPdfMeaning: q("#cardPdfMeaning"),
    ratingRow: q("#ratingRow"),
    deckCount: q("#deckCount"),
    deckList: q("#deckList"),
    browseCount: q("#browseCount"),
    wordList: q("#wordList")
  };

  function q(selector) {
    return document.querySelector(selector);
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function addDays(days) {
    var date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function blankState() {
    return {
      version: 2,
      cards: {},
      streak: 0,
      lastStudyDate: null,
      studiedToday: 0,
      totalReviews: 0,
      createdAt: new Date().toISOString()
    };
  }

  function loadState() {
    var parsed = readStorage(storageKey) || readStorage(oldStorageKey);
    if (!parsed || !parsed.cards) return blankState();
    parsed.version = 2;
    parsed.cards = parsed.cards || {};
    parsed.streak = parsed.streak || 0;
    parsed.studiedToday = parsed.studiedToday || 0;
    parsed.totalReviews = parsed.totalReviews || 0;
    return parsed;
  }

  function readStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (error) {
      return null;
    }
  }

  function saveState() {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function defaultProgress() {
    return {
      status: "new",
      due: today(),
      reps: 0,
      interval: 0,
      ease: 2.5,
      lapses: 0,
      lastGrade: null,
      lastReviewed: null
    };
  }

  function progress(card) {
    if (!state.cards[card.id]) state.cards[card.id] = defaultProgress();
    return state.cards[card.id];
  }

  function unique(values) {
    return Array.from(new Set(values));
  }

  function dueCards(source) {
    return (source || cards).filter(function (card) {
      return progress(card).due <= today();
    });
  }

  function newCards(source) {
    return (source || cards).filter(function (card) {
      return progress(card).status === "new";
    });
  }

  function statusCounts() {
    var counts = { fresh: 0, learning: 0, review: 0, mastered: 0, due: 0 };
    cards.forEach(function (card) {
      var item = progress(card);
      if (item.status === "new") counts.fresh += 1;
      if (item.status === "learning") counts.learning += 1;
      if (item.status === "review") counts.review += 1;
      if (item.status === "mastered") counts.mastered += 1;
      if (item.due <= today()) counts.due += 1;
    });
    return counts;
  }

  function stats() {
    var counts = statusCounts();
    els.totalCards.textContent = cards.length;
    els.newCards.textContent = counts.fresh;
    els.learningCards.textContent = counts.learning;
    els.reviewCards.textContent = counts.review;
    els.masteredCards.textContent = counts.mastered;
    els.streakCount.textContent = state.streak;
    els.dueCount.textContent = counts.due + " due";
  }

  function sectionCounts() {
    var sections = ["All"].concat(unique(cards.map(function (card) { return card.section; })));
    return sections.map(function (section) {
      return {
        section: section,
        count: section === "All" ? cards.length : cards.filter(function (card) { return card.section === section; }).length
      };
    });
  }

  function renderNav() {
    els.sectionNav.innerHTML = "";
    sectionCounts().forEach(function (item) {
      var btn = document.createElement("button");
      btn.className = "nav-btn" + (item.section === activeSection ? " active" : "");
      btn.type = "button";
      btn.innerHTML = "<span>" + escapeHtml(item.section) + "</span><small>" + item.count + "</small>";
      btn.addEventListener("click", function () {
        activeSet = "All";
        startSection(item.section);
      });
      els.sectionNav.appendChild(btn);
    });
  }

  function deckGroups() {
    var groups = {};
    cards.forEach(function (card) {
      var key = card.section + "||" + card.set;
      if (!groups[key]) groups[key] = { section: card.section, set: card.set, cards: [] };
      groups[key].cards.push(card);
    });
    return Object.keys(groups).map(function (key) { return groups[key]; });
  }

  function deckProgress(group) {
    var result = { mastered: 0, learning: 0, review: 0, fresh: 0, due: 0 };
    group.cards.forEach(function (card) {
      var item = progress(card);
      if (item.status === "mastered") result.mastered += 1;
      else if (item.status === "review") result.review += 1;
      else if (item.status === "learning") result.learning += 1;
      else result.fresh += 1;
      if (item.due <= today()) result.due += 1;
    });
    return result;
  }

  function renderDecks() {
    browseMode = false;
    els.deckView.hidden = false;
    els.studyView.hidden = true;
    els.browseView.hidden = true;
    els.activeModeLabel.textContent = "Decks";
    els.viewTitle.textContent = "GRE Vocabulary Flashcards";
    els.deckList.innerHTML = "";

    var groups = deckGroups();
    els.deckCount.textContent = groups.length + " decks";
    groups.forEach(function (group) {
      var counts = deckProgress(group);
      var btn = document.createElement("article");
      btn.className = "deck-card";
      btn.innerHTML = "<div><small>" + escapeHtml(group.section) + "</small><h3>" + escapeHtml(group.set) + "</h3><p><strong>" + counts.mastered + "</strong> of " + group.cards.length + " words mastered</p><p>" + counts.due + " due / " + counts.learning + " learning / " + counts.review + " review</p></div><button type=\"button\" class=\"primary-btn\">Practice this deck</button>";
      btn.querySelector("button").addEventListener("click", function () {
        startDeck(group.section, group.set);
      });
      els.deckList.appendChild(btn);
    });
  }

  function startDeck(section, set) {
    browseMode = false;
    activeSection = section;
    activeSet = set;
    renderSetFilter(cards.filter(function (card) { return card.section === section; }));
    queue = filteredCards().sort(sortForStudy);
    currentIndex = 0;
    els.deckView.hidden = true;
    els.studyView.hidden = false;
    els.browseView.hidden = true;
    els.activeModeLabel.textContent = section;
    els.viewTitle.textContent = set;
    renderNav();
    renderCard();
  }

  function filteredCards() {
    var search = els.searchInput.value.trim().toLowerCase();
    return cards.filter(function (card) {
      var sectionOk = activeSection === "All" || card.section === activeSection;
      var setOk = activeSet === "All" || card.set === activeSet;
      var searchable = [
        card.word,
        card.meaning,
        card.shortMeaning,
        card.pdfMeaning,
        (card.greSynonyms || []).join(" ")
      ].join(" ").toLowerCase();
      var searchOk = !search || searchable.indexOf(search) > -1;
      return sectionOk && setOk && searchOk;
    });
  }

  function renderSetFilter(source) {
    var sets = ["All"].concat(unique(source.map(function (card) { return card.set; })));
    els.setFilter.innerHTML = "";
    sets.forEach(function (set) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = set === activeSet ? "active" : "";
      btn.textContent = set === "All" ? "All sets" : set;
      btn.addEventListener("click", function () {
        activeSet = set;
        startSection(activeSection);
      });
      els.setFilter.appendChild(btn);
    });
  }

  function sortForStudy(a, b) {
    var pa = progress(a);
    var pb = progress(b);
    return pa.due.localeCompare(pb.due) || pa.reps - pb.reps || a.sourcePage - b.sourcePage || a.sourceNumber - b.sourceNumber;
  }

  function startSection(section) {
    browseMode = false;
    activeSection = section;
    var sectionSource = cards.filter(function (card) {
      return section === "All" || card.section === section;
    });
    renderSetFilter(sectionSource);
    queue = filteredCards().sort(sortForStudy);
    currentIndex = 0;
    els.studyView.hidden = false;
    els.deckView.hidden = true;
    els.browseView.hidden = true;
    els.activeModeLabel.textContent = section === "All" ? "All Words" : section;
    els.viewTitle.textContent = section === "All" ? "Full vocabulary deck" : section;
    renderNav();
    renderCard();
  }

  function startDue() {
    browseMode = false;
    activeSection = "All";
    activeSet = "All";
    queue = dueCards().sort(sortForStudy).slice(0, dailyLimit);
    renderSetFilter(cards);
    currentIndex = 0;
    els.studyView.hidden = false;
    els.deckView.hidden = true;
    els.browseView.hidden = true;
    els.activeModeLabel.textContent = "Review";
    els.viewTitle.textContent = "Due flashcards";
    renderNav();
    renderCard();
  }

  function startNew() {
    browseMode = false;
    activeSection = "All";
    activeSet = "All";
    queue = newCards().sort(function (a, b) {
      return a.sourcePage - b.sourcePage || a.sourceNumber - b.sourceNumber;
    }).slice(0, 25);
    renderSetFilter(cards);
    currentIndex = 0;
    els.studyView.hidden = false;
    els.deckView.hidden = true;
    els.browseView.hidden = true;
    els.activeModeLabel.textContent = "New";
    els.viewTitle.textContent = "Learn new words";
    renderNav();
    renderCard();
  }

  function renderCard() {
    revealed = false;
    els.cardAnswer.hidden = true;
    els.ratingRow.hidden = true;
    els.queueMeta.textContent = (queue.length ? currentIndex + 1 : 0) + " / " + queue.length + " cards";
    els.queueProgress.style.width = queue.length ? Math.round((currentIndex / queue.length) * 100) + "%" : "0%";

    var card = queue[currentIndex];
    if (!card) {
      els.cardSection.textContent = "Complete";
      els.cardWord.textContent = "No cards here";
      els.cardPrompt.textContent = "Choose another section, learn new words, or browse the deck.";
      els.cardMeaning.textContent = "";
      els.cardSynonyms.textContent = "";
      els.cardMemory.textContent = "";
      els.cardExample.textContent = "";
      els.cardPdfMeaning.textContent = "";
      els.cardMiniStats.innerHTML = "Queue complete.";
      return;
    }

    var item = progress(card);
    els.cardSection.textContent = card.section + " / " + card.set;
    els.cardWord.textContent = card.word;
    els.cardPrompt.textContent = "Click the card or press Space to reveal.";
    els.cardMeaning.textContent = card.aiMeaning || card.meaning;
    els.cardSynonyms.textContent = (card.greSynonyms && card.greSynonyms.length) ? card.greSynonyms.join(", ") : "No close synonyms listed yet.";
    els.cardMemory.textContent = card.memoryTrick;
    els.cardExample.textContent = card.example;
    els.cardPdfMeaning.textContent = card.pdfMeaning || "Not available from the extracted PDF text.";
    els.cardMiniStats.innerHTML = "<strong>Status:</strong> " + labelStatus(item.status) +
      "<br><strong>Reviews:</strong> " + item.reps +
      "<br><strong>Mistakes:</strong> " + item.lapses +
      "<br><strong>Next due:</strong> " + item.due;
  }

  function labelStatus(status) {
    if (status === "new") return "Not learned yet";
    if (status === "learning") return "Learning";
    if (status === "review") return "Learned, in review";
    if (status === "mastered") return "Mastered";
    return status;
  }

  function reveal() {
    if (!queue[currentIndex] || revealed) return;
    revealed = true;
    els.cardAnswer.hidden = false;
    els.ratingRow.hidden = false;
    els.cardPrompt.textContent = "Rate honestly so the word returns at the right time.";
  }

  function gradeCurrent(grade) {
    var card = queue[currentIndex];
    if (!card) return;

    var item = progress(card);
    var nextInterval = nextIntervalFor(grade, item);
    if (grade === "again") {
      item.status = "learning";
      item.lapses += 1;
      item.ease = Math.max(1.3, item.ease - 0.2);
    }
    if (grade === "hard") {
      item.status = "learning";
      item.ease = Math.max(1.3, item.ease - 0.05);
    }
    if (grade === "good") {
      item.status = item.reps >= 2 ? "review" : "learning";
    }
    if (grade === "easy") {
      item.status = item.reps >= 2 ? "mastered" : "review";
      item.ease += 0.1;
    }

    item.reps += 1;
    item.interval = nextInterval;
    item.due = addDays(nextInterval);
    item.lastGrade = grade;
    item.lastReviewed = today();

    markStudied();
    saveState();
    stats();
    currentIndex += 1;
    renderCard();
  }

  function nextIntervalFor(grade, item) {
    if (grade === "again") return 0;
    if (grade === "hard") return 1;
    if (grade === "good") return Math.max(3, Math.round((item.interval || 1) * item.ease));
    return Math.max(7, Math.round((item.interval || 3) * (item.ease + 1)));
  }

  function markStudied() {
    var current = today();
    if (state.lastStudyDate !== current) {
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      state.streak = state.lastStudyDate === yesterday.toISOString().slice(0, 10) ? state.streak + 1 : 1;
      state.lastStudyDate = current;
      state.studiedToday = 0;
    }
    state.studiedToday += 1;
    state.totalReviews += 1;
  }

  function renderBrowse() {
    browseMode = true;
    els.studyView.hidden = true;
    els.deckView.hidden = true;
    els.browseView.hidden = false;
    els.activeModeLabel.textContent = "Browse";
    els.viewTitle.textContent = "Find a word";

    var list = filteredCards();
    els.browseCount.textContent = list.length + " cards";
    els.wordList.innerHTML = "";
    list.slice(0, 300).forEach(function (card) {
      var item = progress(card);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "word-item";
      var synonymText = card.greSynonyms && card.greSynonyms.length ? "Synonyms: " + card.greSynonyms.slice(0, 3).join(", ") : "";
      btn.innerHTML = "<small>" + escapeHtml(card.section) + " / " + escapeHtml(card.set) + " / " + escapeHtml(labelStatus(item.status)) + "</small><strong>" + escapeHtml(card.word) + "</strong><p>" + escapeHtml(card.shortMeaning || card.meaning) + "</p><p>" + escapeHtml(synonymText) + "</p>";
      btn.addEventListener("click", function () {
        queue = [card];
        currentIndex = 0;
        els.studyView.hidden = false;
        els.browseView.hidden = true;
        renderCard();
      });
      els.wordList.appendChild(btn);
    });
  }

  function exportProgress() {
    var payload = {
      app: "GRE Flashcards",
      exportedAt: new Date().toISOString(),
      storageKey: storageKey,
      progress: state
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "gre-flashcards-progress-" + today() + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function importProgress(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result || ""));
        var incoming = parsed.progress || parsed;
        if (!incoming.cards) throw new Error("Progress file is missing cards.");
        state = incoming;
        state.version = 2;
        saveState();
        stats();
        renderNav();
        startDue();
      } catch (error) {
        alert("That progress file could not be imported.");
      }
    };
    reader.readAsText(file);
  }

  function resetProgress() {
    if (!confirm("Reset all study progress for this browser?")) return;
    localStorage.removeItem(storageKey);
    localStorage.removeItem(oldStorageKey);
    state = blankState();
    saveState();
    stats();
    startSection("All");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char];
    });
  }

  els.flashcard.addEventListener("click", reveal);
  els.startDueBtn.addEventListener("click", startDue);
  els.startNewBtn.addEventListener("click", startNew);
  els.decksBtn.addEventListener("click", renderDecks);
  els.browseBtn.addEventListener("click", renderBrowse);
  els.resetBtn.addEventListener("click", resetProgress);
  els.exportBtn.addEventListener("click", exportProgress);
  els.importInput.addEventListener("change", function (event) {
    importProgress(event.target.files[0]);
    event.target.value = "";
  });
  els.searchInput.addEventListener("input", function () {
    if (browseMode) renderBrowse();
    else startSection(activeSection);
  });
  els.ratingRow.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-grade]");
    if (btn) gradeCurrent(btn.dataset.grade);
  });
  document.addEventListener("keydown", function (event) {
    if (event.target.matches("input")) return;
    if (event.code === "Space") {
      event.preventDefault();
      reveal();
    }
    if (["Digit1", "Digit2", "Digit3", "Digit4"].indexOf(event.code) > -1 && revealed) {
      gradeCurrent(["again", "hard", "good", "easy"][Number(event.code.slice(-1)) - 1]);
    }
  });

  saveState();
  stats();
  renderNav();
  renderDecks();
})();
