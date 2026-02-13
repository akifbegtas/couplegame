// Tüm ortamlarda sunucuya bağlan
const isNative = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
const isLocalDev = !isNative && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const SERVER_URL = isLocalDev
  ? window.location.origin
  : (window.location.hostname === 'duoduels.com' || window.location.hostname === 'www.duoduels.com')
    ? window.location.origin
    : 'https://duoduels.onrender.com';
const socket = io(SERVER_URL);

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

let currentRoom = null;
let myPlayerId = null;
let amIPlaying = false;
let timerInterval = null;
let pendingRoomData = null;
let letterAnimationDone = true;
let pendingCategoryData = null;
let currentTargetLetter = null;
let selectedMode = "cift";
let _listenersAttached = {};

// --- AYI UYARI ---
function showBearBubble(msg, target) {
  const bubble = document.getElementById("bear-bubble");
  const bear = document.getElementById("bear-hint");
  bubble.innerText = msg || "İsmini yazmadan nereye :)";
  bubble.classList.remove("hidden");
  bubble.classList.remove("bubble-enter");
  void bubble.offsetWidth;
  bubble.classList.add("bubble-enter");

  if (target === "gender") {
    bear.classList.add("bear-at-gender", "bear-grin");
  } else {
    bear.classList.remove("bear-at-gender", "bear-grin");
  }
}
function hideBearBubble() {
  const bubble = document.getElementById("bear-bubble");
  const bear = document.getElementById("bear-hint");
  const isAtGender = bear.classList.contains("bear-at-gender");

  if (isAtGender) {
    // Cinsiyet seçildi - teşekkür et, yerinde kal
    bear.classList.remove("bear-grin");
    bear.classList.add("bear-kiss");
    bubble.innerText = "Teşekkürler \u{1F618}";
    bubble.classList.remove("hidden", "bubble-enter");
    void bubble.offsetWidth;
    bubble.classList.add("bubble-enter");
    setTimeout(() => {
      bubble.classList.add("hidden");
      bear.classList.remove("bear-kiss");
    }, 1500);
  } else {
    bubble.classList.add("hidden");
    bear.classList.remove("bear-grin");
  }
}

// --- GİRİŞ ---
function createRoom() {
  const username = document.getElementById("username").value;
  const genderEl = document.querySelector('input[name="gender"]:checked');

  if (!username) return showBearBubble("İsmini yazmadan nereye :)", "name");
  if (!genderEl) return showBearBubble("Cinsiyetini seçsene :)", "gender");

  hideBearBubble();
  pendingRoomData = { username, gender: genderEl.value };
  showScreen("gameSelect");
}

function selectMode(mode) {
  selectedMode = mode;
  document.getElementById("mode-btn-cift").classList.toggle("active", mode === "cift");
  document.getElementById("mode-btn-duo").classList.toggle("active", mode === "duo");
  document.getElementById("mode-btn-tek").classList.toggle("active", mode === "tek");

  const telepati = document.getElementById("card-telepati");
  const isimSehir = document.getElementById("card-isimSehir");
  const ciftCount = document.getElementById("cift-count");
  const tabu = document.getElementById("card-tabu");
  const imposter = document.getElementById("card-imposter");
  const pictionary = document.getElementById("card-pictionary");
  const tekCount = document.getElementById("tek-count");
  const duoCount = document.getElementById("duo-count");

  // Tüm kartları ve sayaçları gizle
  telepati.style.display = "none";
  isimSehir.style.display = "none";
  tabu.style.display = "none";
  pictionary.style.display = "none";
  if (imposter) imposter.style.display = "none";
  ciftCount.style.display = "none";
  duoCount.style.display = "none";
  tekCount.style.display = "none";

  if (mode === "cift") {
    // Çiftler modu: takımlar arası yarış
    telepati.style.display = "";
    isimSehir.style.display = "";
    tabu.style.display = "";
    pictionary.style.display = "";
    ciftCount.style.display = "";
  } else if (mode === "duo") {
    // Başbaşa modu: tek çift kendi aralarında
    telepati.style.display = "";
    isimSehir.style.display = "";
    pictionary.style.display = "";
    duoCount.style.display = "";
  } else if (mode === "tek") {
    // Tek modu: herkes bireysel
    pictionary.style.display = "";
    if (imposter) {
      imposter.style.display = "";
      imposter.classList.remove("hidden");
    }
    tekCount.style.display = "";
  }
}

function selectGame(type) {
  if (!pendingRoomData) return;

  if (selectedMode === "cift") {
    const ciftVal = document.getElementById("ciftCountSelect").value;
    if (!ciftVal) {
      Swal.fire({
        html: `<div style="font-size:3.5rem;margin-bottom:10px">👆</div>
               <div style="font-size:1.3rem;font-weight:700;color:#fff;margin-bottom:6px">Dur bir dakika!</div>
               <div style="font-size:0.95rem;color:rgba(255,255,255,0.7)">Önce kaç çift oynayacak onu seç 💑</div>`,
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        color: '#fff',
        showConfirmButton: true,
        confirmButtonText: 'Anladım! 👍',
        confirmButtonColor: '#ff6b6b',
        timer: 3000,
        timerProgressBar: true,
        showClass: { popup: 'animate__animated animate__shakeX' },
      });
      return;
    }
    pendingRoomData.coupleCount = ciftVal;
  } else if (selectedMode === "duo") {
    pendingRoomData.coupleCount = 1;
  } else {
    const tekVal = document.getElementById("tekCountSelect").value;
    if (!tekVal) {
      Swal.fire({
        html: `<div style="font-size:3.5rem;margin-bottom:10px">👆</div>
               <div style="font-size:1.3rem;font-weight:700;color:#fff;margin-bottom:6px">Dur bir dakika!</div>
               <div style="font-size:0.95rem;color:rgba(255,255,255,0.7)">Önce kaç kişi oynayacak onu seç 🧑‍🤝‍🧑</div>`,
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        color: '#fff',
        showConfirmButton: true,
        confirmButtonText: 'Anladım! 👍',
        confirmButtonColor: '#ff6b6b',
        timer: 3000,
        timerProgressBar: true,
        showClass: { popup: 'animate__animated animate__shakeX' },
      });
      return;
    }
    pendingRoomData.maxPlayers = tekVal;
  }

  pendingRoomData.gameType = type;
  pendingRoomData.gameMode = selectedMode;

  // Oyun adını göster
  const names = {
    telepati: "Telepati",
    isimSehir: "İsim Şehir",
    pictionary: "Resim Çiz",
    tabu: "Tabu",
    imposter: "Imposter",
  };
  document.getElementById("settings-game-title").innerText =
    names[type] + " - Ayarlar";

  // Resim Çiz için süre sabit 45sn, gizle
  const timeInput = document.getElementById("roundTimeInput");
  const timeLabel = timeInput.parentElement;
  if (type === "pictionary") {
    timeLabel.style.display = "none";
    timeInput.value = 45;
  } else if (type === "tabu") {
    timeLabel.style.display = "";
    timeInput.value = 60;
  } else if (type === "imposter") {
    timeLabel.style.display = "";
    timeInput.value = 60;
  } else if (type === "isimSehir") {
    timeLabel.style.display = "";
    timeInput.value = 20;
  } else {
    timeLabel.style.display = "";
    timeInput.value = 10;
  }

  showScreen("gameSettings");
}

function goBackToGameSelect() {
  showScreen("gameSelect");
}

function confirmGameSettings() {
  if (!pendingRoomData) return;
  pendingRoomData.roundCount = document.getElementById("roundCountInput").value;
  pendingRoomData.roundTime = document.getElementById("roundTimeInput").value;

  if (currentRoom) {
    // Oda zaten var, ayarları güncelle
    socket.emit("updateRoom", {
      roomId: currentRoom,
      gameType: pendingRoomData.gameType,
      gameMode: pendingRoomData.gameMode,
      roundCount: pendingRoomData.roundCount,
      roundTime: pendingRoomData.roundTime,
    });
    pendingRoomData = null;
  } else {
    socket.emit("createRoom", pendingRoomData);
    pendingRoomData = null;
  }
}

function joinRoom() {
  const username = document.getElementById("username").value;
  const genderEl = document.querySelector('input[name="gender"]:checked');
  const code = document.getElementById("roomCodeInput").value;
  if (!username) return showBearBubble("İsmini yazmadan nereye :)", "name");
  if (!genderEl) return showBearBubble("Cinsiyetini seçsene :)", "gender");
  hideBearBubble();
  socket.emit("joinRoom", { roomId: code.toUpperCase(), username, gender: genderEl.value });
}

function switchTab(mode) {
  const slider = document.getElementById("forms-slider");
  const btns = document.querySelectorAll(".tab-btn");
  btns.forEach((b) => b.classList.remove("active"));
  if (mode === "create") {
    slider.style.transform = "translateX(0)";
    btns[0].classList.add("active");
  } else {
    slider.style.transform = "translateX(-50%)";
    btns[1].classList.add("active");
  }
}

function copyRoomCode() {
  const el = document.getElementById("displayRoomCode");
  const code = el.innerText;
  navigator.clipboard.writeText(code).then(() => {
    el.classList.add("code-copied");
    el.dataset.originalText = code;
    el.innerText = "Kopyalandı!";
    setTimeout(() => {
      el.innerText = code;
      el.classList.remove("code-copied");
    }, 1200);
  });
}

async function shareWhatsApp() {
  const code = document.getElementById("displayRoomCode").innerText;
  const url = 'https://www.duoduels.com';
  const message = `DuoDuels'a gel! 💖\n\nOda Kodu: ${code}\n\n${url}`;

  // Capacitor native share varsa onu kullan
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    try {
      const { Share } = window.Capacitor.Plugins;
      await Share.share({
        title: 'DuoDuels',
        text: message,
        dialogTitle: 'Arkadaşlarını davet et'
      });
      return;
    } catch (e) {
      // fallback to WhatsApp URL
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank");
}

function goToMainMenu() {
  if (currentRoom) {
    socket.emit("leaveRoom", currentRoom);
  }
  currentRoom = null;
  pendingRoomData = null;
  showScreen("lobby");
}

function joinTeamSlot(idx, slot) {
  socket.emit("selectTeam", { roomId: currentRoom, teamIndex: idx, slot });
}

function startGame() {
  socket.emit("startGame", currentRoom);
}

// --- OYUN (TELEPATİ) ---
function sendWord(auto) {
  const inp = document.getElementById("wordInput");
  let val = inp.value;
  if (auto && !val) val = "⏰";
  if (val) {
    socket.emit("submitWord", { roomId: currentRoom, word: val });
    inp.value = "";
    inp.disabled = true;
    document.getElementById("sendWordBtn").disabled = true;
    document.getElementById("left-status").innerText = "Gönderildi!";
    clearInterval(timerInterval);
  }
}

function startTimer(sec, timerElId) {
  const elId = timerElId || "timer-countdown";
  const el = document.getElementById(elId);
  if (timerInterval) clearInterval(timerInterval);
  let t = sec || window._roundTime || 10;
  el.innerText = t;
  el.style.color = "#27ae60";

  timerInterval = setInterval(() => {
    t--;
    el.innerText = t;
    if (t <= 3) el.style.color = "#e74c3c";
    if (t <= 0) {
      clearInterval(timerInterval);
      if (amIPlaying) {
        if (window._currentGameType === "isimSehir") {
          sendIsimSehirWord(true);
        } else if (window._currentGameType === "pictionary") {
          // Server handles timeout
        } else if (window._currentGameType === "tabu") {
          // Server handles timeout
        } else if (window._currentGameType === "imposter") {
          sendImposterWord(true);
        } else {
          sendWord(true);
        }
      }
    }
  }, 1000);
}

// --- İSİM ŞEHİR ---
let _isimSehirSubmitted = false;

function sendAllIsimSehir(auto) {
  // Çift gönderim koruması
  if (_isimSehirSubmitted) return;

  const answers = {};
  const cats = ["isim", "sehir", "hayvan"];
  const catMap = { isim: "İSİM", sehir: "ŞEHİR", hayvan: "HAYVAN" };

  cats.forEach((c) => {
    const inp = document.getElementById("isInput-" + c);
    let val = inp.value.trim();
    // Yanlış harfle başlayan cevabı sil (auto'da da temizle)
    if (val && currentTargetLetter && val.toLocaleUpperCase("tr-TR").charAt(0) !== currentTargetLetter) {
      val = "";
      inp.value = "";
    }
    if (!val) val = "⏰";
    answers[catMap[c]] = val;
    inp.disabled = true;
  });

  _isimSehirSubmitted = true;
  socket.emit("submitAllIsimSehir", { roomId: currentRoom, answers: answers });
  document.getElementById("isSendAllBtn").disabled = true;
  document.getElementById("is-left-status").innerText = "Gönderildi!";
  clearInterval(timerInterval);
}

// Eski fonksiyon uyumluluk için
function sendIsimSehirWord(auto) {
  sendAllIsimSehir(auto);
}

function animateLetter(targetLetter, callback) {
  const el = document.getElementById("spinning-letter");
  const letters = "ABCÇDEFGHIİJKLMNOÖPRSŞTUÜVYZ";
  let speed = 50;
  let iteration = 0;
  const totalIterations = 25;

  function spin() {
    el.innerText = letters[Math.floor(Math.random() * letters.length)];
    el.classList.add("letter-spinning");
    iteration++;

    if (iteration < totalIterations) {
      speed += 15;
      setTimeout(spin, speed);
    } else {
      el.innerText = targetLetter;
      el.classList.remove("letter-spinning");
      el.classList.add("letter-final");
      setTimeout(() => {
        el.classList.remove("letter-final");
        if (callback) callback();
      }, 1000);
    }
  }
  spin();
}

function updateCategoryTabs(activeCategory) {
  const cats = ["isim", "sehir", "hayvan"];
  const map = { İSİM: "isim", ŞEHİR: "sehir", HAYVAN: "hayvan" };
  const key = map[activeCategory] || activeCategory;
  cats.forEach((c) => {
    const tab = document.getElementById("cat-" + c);
    tab.classList.toggle("cat-active", c === key);
  });
}

// --- SOCKET ---
socket.on("connect", () => {
  myPlayerId = socket.id;
});
socket.on("gameError", (msg) => {
  Swal.fire({ title: "Hata", text: msg, icon: "error" });
});
socket.on("roomCreated", (id) => {
  currentRoom = id;
  showScreen("waiting");
  document.getElementById("displayRoomCode").innerText = id;
});
socket.on("joinedRoom", (id) => {
  currentRoom = id;
  showScreen("waiting");
  document.getElementById("displayRoomCode").innerText = id;
});

socket.on("hostLeft", () => {
  clearInterval(timerInterval);
  currentRoom = null;
  amIPlaying = false;
  alert("Oda kurucusu ayrıldı, oda kapatıldı!");
  showScreen("lobby");
});

socket.on("updateLobby", (data) => {
  const isHost = myPlayerId === data.hostId;
  const hostEl = document.getElementById("host-controls");
  const memberEl = document.getElementById("member-message");
  if (isHost) {
    hostEl.classList.remove("hidden");
    memberEl.classList.add("hidden");
  } else {
    hostEl.classList.add("hidden");
    memberEl.classList.remove("hidden");
  }

  const div = document.getElementById("teams-container");
  div.innerHTML = "";

  if (data.gameMode === "tek") {
    // Tek mod: oyuncu listesi
    const playerSlots = data.players
      .map((p) => {
        const icon = p.gender === "female" ? "👩" : "👨";
        const cls = p.gender === "female" ? "slot-female" : "slot-male";
        const hostBadge =
          p.id === data.hostId ? ' <span class="host-badge">KURUCU</span>' : "";
        return `<div class="slot filled ${cls}">${icon} ${escapeHtml(p.username)}${hostBadge}</div>`;
      })
      .join("");
    const maxLabel = data.maxPlayers > 0 ? `${data.players.length}/${data.maxPlayers}` : `${data.players.length}`;
    div.innerHTML = `<div class="team-card" style="grid-column:1/-1;">
      <div class="team-title">Oyuncular (${maxLabel})</div>
      <div class="tek-players-list">${playerSlots}</div>
    </div>`;
  } else {
    // Çift mod: takım kartları
    data.teams.forEach((t, i) => {
      div.innerHTML += `<div class="team-card">
              <div class="team-title">${t.name}</div>
              <div class="slots-container">
                  ${renderSlot(t.p1, i, "p1", data.hostId)}
                  ${renderSlot(t.p2, i, "p2", data.hostId)}
              </div>
          </div>`;
    });
  }

  // Seyirciler
  const specTitle = document.querySelector(".spectators-area h3");
  if (specTitle) {
    specTitle.innerText =
      data.gameMode === "tek" ? "İzleyiciler" : "Lobidekiler (Takım Seçin)";
  }
  const specs = data.spectators
    .map((p) => {
      const icon = p.gender === "female" ? "👩" : "👨";
      const cls = p.gender === "female" ? "spec-female" : "spec-male";
      return `<span class="${cls}">${icon} ${escapeHtml(p.username)}</span>`;
    })
    .join("");
  document.getElementById("spectator-list").innerHTML = specs;
});

function renderSlot(p, i, slot, hostId) {
  if (p) {
    const genderClass = p.gender === "female" ? "slot-female" : "slot-male";
    const icon = p.gender === "female" ? "👩" : "👨";
    const hostBadge =
      p.id === hostId ? ' <span class="host-badge">KURUCU</span>' : "";
    return `<div class="slot filled ${genderClass}">${icon} ${escapeHtml(p.username)}${hostBadge}</div>`;
  }
  return `<div class="slot empty" onclick="joinTeamSlot(${i}, '${slot}')">+ KATIL</div>`;
}

// --- TELEPATİ SOCKET ---
socket.on("gameInit", (data) => {
  window._currentGameType = "telepati";
  showScreen("game");
  window._roundTime = data.roundTime || 10;
  window._totalRounds = data.roundCount || 5;

  document.getElementById("scoreboard-panel").style.display = "block";
  document.getElementById("attempts-display").innerText =
    `Tur: 1 / ${window._totalRounds}`;

  Swal.fire({ title: "Başlıyor!", timer: 1500, showConfirmButton: false });

  if (!_listenersAttached.wordInput) {
    document.getElementById("wordInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendWord();
    });
    _listenersAttached.wordInput = true;
  }
});

socket.on("turnStarted", (data) => {
  const curR = data.currentRound || 1;
  const totR = data.totalRounds || window._totalRounds || 5;

  const mistakeText = data.totalMistakes !== undefined ? ` | Hata: ${data.totalMistakes} / 20` : "";
  document.getElementById("attempts-display").innerText =
    `Tur: ${curR} / ${totR}${mistakeText}`;
  document.getElementById("game-log").innerHTML = "";
  startTimer(window._roundTime);

  document.getElementById("leftName").innerText = data.p1.username;
  document.getElementById("rightName").innerText = data.p2.username;

  const p1 = document.getElementById("left-panel");
  const p2 = document.getElementById("right-panel");
  p1.className = `game-panel panel-${data.p1.gender}`;
  p2.className = `game-panel panel-${data.p2.gender}`;

  const iamP1 = myPlayerId === data.p1.id;
  const iamP2 = myPlayerId === data.p2.id;

  amIPlaying = iamP1 || iamP2;
  window._iamP2 = iamP2;

  const infoBar = document.getElementById("turn-info-bar");
  const inpArea = document.getElementById("input-area-left");
  const specL = document.getElementById("spectator-view-left");
  const specR = document.getElementById("spectator-view-right");

  const leftStatus = document.getElementById("left-status");
  const rightStatus = document.getElementById("right-status");

  if (amIPlaying) {
    infoBar.innerText = "SIRA SİZDE! 🚀";
    infoBar.style.backgroundColor = "#27ae60";
    inpArea.classList.remove("hidden");
    specL.classList.add("hidden");
    specR.classList.add("hidden");
    leftStatus.classList.remove("hidden");
    rightStatus.classList.remove("hidden");
    leftStatus.innerText = "...";
    rightStatus.innerText = "Yazıyor...";

    const inp = document.getElementById("wordInput");
    inp.disabled = false;
    document.getElementById("sendWordBtn").disabled = false;
    inp.value = "";
    inp.focus();

    if (iamP2) {
      document.getElementById("leftName").innerText = data.p2.username;
      document.getElementById("rightName").innerText = data.p1.username;
      p1.className = `game-panel panel-${data.p2.gender}`;
      p2.className = `game-panel panel-${data.p1.gender}`;
    }
  } else {
    infoBar.innerText = `${data.p1.username} & ${data.p2.username} Oynuyor...`;
    infoBar.style.backgroundColor = "#34495e";
    inpArea.classList.add("hidden");
    specL.classList.remove("hidden");
    specR.classList.remove("hidden");
    leftStatus.classList.add("hidden");
    rightStatus.classList.add("hidden");
    specL.innerText = "🤔";
    specR.innerText = "🤔";
  }
});

socket.on("partnerSubmitted", () => {
  if (amIPlaying) {
    if (window._currentGameType === "isimSehir") {
      document.getElementById("is-right-status").innerText = "YAZDI!";
    } else {
      document.getElementById("right-status").innerText = "YAZDI!";
    }
  }
});

socket.on("revealOneMove", (data) => {
  if (!amIPlaying) {
    if (window._currentGameType === "isimSehir") {
      const el =
        data.slot === "p1"
          ? document.getElementById("is-spectator-left")
          : document.getElementById("is-spectator-right");
      el.innerText = data.word;
    } else {
      const el =
        data.slot === "p1"
          ? document.getElementById("spectator-view-left")
          : document.getElementById("spectator-view-right");
      el.innerText = data.word;
    }
  }
});

function showMatchOverlay(leftName, rightName, leftWord, rightWord, isMatch, callback, categoryLabel) {
  const overlay = document.createElement("div");
  overlay.className = "match-overlay";
  overlay.innerHTML = `
    ${categoryLabel ? `<div class="match-category-label">${escapeHtml(categoryLabel)}</div>` : ''}
    <div class="match-player-names">
      <span class="match-player-name">${escapeHtml(leftName)}</span>
      <span class="match-player-name">${escapeHtml(rightName)}</span>
    </div>
    <div class="match-words-row">
      <div class="match-word-card word-left">${escapeHtml(leftWord)}</div>
      <div class="match-vs">VS</div>
      <div class="match-word-card word-right">${escapeHtml(rightWord)}</div>
    </div>
    <div class="match-result-badge ${isMatch ? 'result-success' : 'result-fail'}">
      ${isMatch ? 'EŞLEŞME! ✅' : 'EŞLEŞMEDİ ❌'}
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.classList.add("fade-out");
    setTimeout(() => {
      overlay.remove();
      if (callback) callback();
    }, 400);
  }, 2000);
}

socket.on("spectatorUpdate", (res) => {
  clearInterval(timerInterval);
  const div = document.createElement("div");
  div.className = res.match ? "log-item log-success" : "log-item log-fail";
  div.innerHTML = `${escapeHtml(res.p1Word)} - ${escapeHtml(res.p2Word)} ${res.match ? "✅" : "❌"}`;

  if (res.totalMistakes !== undefined && amIPlaying) {
    const attEl = document.getElementById("attempts-display");
    const turMatch = attEl.innerText.match(/Tur:\s*(.+?)(\s*\||$)/);
    const turText = turMatch ? turMatch[1].trim() : "?";
    attEl.innerText = `Tur: ${turText} | Hata: ${res.totalMistakes} / 20`;
  }

  {
    document.getElementById("game-log").prepend(div);
    const lName = document.getElementById("leftName").innerText;
    const rName = document.getElementById("rightName").innerText;
    const myWord = window._iamP2 ? res.p2Word : res.p1Word;
    const partnerWord = window._iamP2 ? res.p1Word : res.p2Word;
    if (!amIPlaying) {
      document.getElementById("spectator-view-left").innerText = res.p1Word;
      document.getElementById("spectator-view-right").innerText = res.p2Word;
      showMatchOverlay(lName, rName, res.p1Word, res.p2Word, res.match);
    } else {
      document.getElementById("left-status").innerText = myWord;
      document.getElementById("right-status").innerText = partnerWord;
      showMatchOverlay(lName, rName, myWord, partnerWord, res.match, () => {
        if (!res.match) {
          const inp = document.getElementById("wordInput");
          inp.value = "";
          inp.disabled = false;
          document.getElementById("sendWordBtn").disabled = false;
          inp.focus();
          document.getElementById("left-status").innerText = "Tekrar...";
          document.getElementById("right-status").innerText = "Yazıyor...";
          startTimer(window._roundTime);
        }
      });
    }
  }
});

socket.on("updateScoreboard", (scores) => {
  const list = document.getElementById("scoreboard-list");
  list.innerHTML = "";
  scores.forEach((s) => {
    let style = s.eliminated ? "text-decoration:line-through;opacity:0.6;" : "";
    let icon = s.eliminated ? "💀" : `#${s.rank}`;
    if (s.rank === 1 && !s.eliminated) icon = "🥇";
    else if (s.rank === 2 && !s.eliminated) icon = "🥈";
    else if (s.rank === 3 && !s.eliminated) icon = "🥉";

    list.innerHTML += `<div class="score-item" style="${style}">
            <span>${icon} ${escapeHtml(s.name)}</span>
            <span style="font-weight:bold">${s.score}${window._currentGameType === "telepati" ? "/20" : " puan"}</span>
        </div>`;
  });
});

socket.on("levelFinished", () =>
  Swal.fire({
    title: "EŞLEŞTİ!",
    icon: "success",
    timer: 1000,
    showConfirmButton: false,
  }),
);
socket.on("roundChanged", (r) =>
  Swal.fire({ title: `${r}. TUR`, timer: 1500, showConfirmButton: false }),
);
socket.on("gameOver", (msg) => Swal.fire({ title: "BİTTİ", text: msg }));

socket.on("telepatiGameOver", (data) => {
  clearInterval(timerInterval);
  const iWon = data.winnerIds && data.winnerIds.includes(myPlayerId);

  if (iWon) {
    // Kazanan takım
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } }), 500);
    Swal.fire({
      title: "KAZANDINIZ! 🏆",
      html: `<div style="font-size:1.2rem;margin:10px 0">
        <strong>${escapeHtml(data.winnerP1)} & ${escapeHtml(data.winnerP2)}</strong>
      </div>
      <div style="font-size:2.5rem;margin:10px 0">🎉🥳🎊</div>
      <div style="color:#27ae60;font-weight:bold">${data.lastStanding ? "Son hayatta kalan takım!" : "En az hatayla bitirdiniz!"}</div>`,
      background: "linear-gradient(135deg, #1a1a2e, #16213e)",
      color: "#fff",
      confirmButtonColor: "#27ae60",
      confirmButtonText: "Harikayız! 💪",
    });
  } else {
    // Kaybeden takım
    Swal.fire({
      title: "KAYBETTİNİZ 😔",
      html: `<div style="font-size:1rem;margin:10px 0">
        Kazanan: <strong>${escapeHtml(data.winnerTeam)}</strong>
      </div>
      <div style="font-size:1rem">${escapeHtml(data.winnerP1)} & ${escapeHtml(data.winnerP2)} kazandı!</div>
      <div style="font-size:2rem;margin:10px 0">😤</div>
      <div style="color:#e67e22;font-weight:bold">Bir dahaki sefere! 💪</div>`,
      background: "linear-gradient(135deg, #1a1a2e, #2d1b1b)",
      color: "#fff",
      confirmButtonColor: "#e74c3c",
      confirmButtonText: "Tekrar Dene",
    });
  }
});

socket.on("backToSelect", (data) => {
  clearInterval(timerInterval);
  Swal.close();
  document.getElementById("scoreboard-panel").style.display = "none";

  if (data.hostId && myPlayerId === data.hostId) {
    // Kurucu: oyun seçim ekranına git
    showScreen("gameSelect");

    const username = document.getElementById("username").value;
    const genderEl = document.querySelector('input[name="gender"]:checked');
    pendingRoomData = {
      username: username || "Kurucu",
      gender: genderEl ? genderEl.value : "male",
    };

    if (data.gameMode) {
      selectMode(data.gameMode);
    }

    // Oyuncu listesini göster
    const container = document.getElementById("select-players-container");
    const box = document.getElementById("select-players-box");
    if (container && box && data.players) {
      box.innerHTML = "";
      data.players.forEach((p) => {
        const icon = p.gender === "female" ? "👩" : "👨";
        const cls = p.gender === "female" ? "spec-female" : "spec-male";
        const span = document.createElement("span");
        span.className = cls;
        span.innerText = `${icon} ${p.username}`;
        box.appendChild(span);
      });
      container.classList.remove("hidden");
    }
  } else {
    // Diğer oyuncular: lobiye git
    showScreen("waiting");
    document.getElementById("displayRoomCode").innerText = currentRoom;
  }
});

// --- İSİM ŞEHİR SOCKET ---
socket.on("isimSehirStart", (data) => {
  window._currentGameType = "isimSehir";
  showScreen("isimSehir");
  window._roundTime = data.roundTime || 10;
  window._totalRounds = data.roundCount || 5;

  document.getElementById("scoreboard-panel").style.display = "block";
  document.getElementById("score-note-text").innerText =
    "En çok puan kazanır! 🏆";
  document.getElementById("is-round-display").innerText =
    `Tur: 1 / ${window._totalRounds}`;

  // Panelleri hemen renklendir
  if (data.firstPair) {
    const p1El = document.getElementById("is-left-panel");
    const p2El = document.getElementById("is-right-panel");
    document.getElementById("isLeftName").innerText =
      data.firstPair.p1.username;
    document.getElementById("isRightName").innerText =
      data.firstPair.p2.username;
    p1El.className = `game-panel panel-${data.firstPair.p1.gender}`;
    p2El.className = `game-panel panel-${data.firstPair.p2.gender}`;

    const iamP2 = myPlayerId === data.firstPair.p2.id;
    if (iamP2) {
      document.getElementById("isLeftName").innerText =
        data.firstPair.p2.username;
      document.getElementById("isRightName").innerText =
        data.firstPair.p1.username;
      p1El.className = `game-panel panel-${data.firstPair.p2.gender}`;
      p2El.className = `game-panel panel-${data.firstPair.p1.gender}`;
    }
  }

  Swal.fire({
    title: "İsim Şehir Başlıyor!",
    timer: 1500,
    showConfirmButton: false,
  });

  if (!_listenersAttached.isAllInputs) {
    ["isim", "sehir", "hayvan"].forEach((c) => {
      document.getElementById("isInput-" + c).addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendAllIsimSehir();
      });
    });
    _listenersAttached.isAllInputs = true;
  }
});

socket.on("letterSelected", (data) => {
  letterAnimationDone = false;
  currentTargetLetter = data.letter;
  pendingCategoryData = null;

  animateLetter(data.letter, () => {
    letterAnimationDone = true;
    // categoryStart/allCategoriesStart zaten geldiyse timer'ı şimdi başlat
    if (pendingCategoryData) {
      startTimer(window._roundTime, "is-timer");
    }
  });

  if (data.currentRound) {
    document.getElementById("is-round-display").innerText =
      `Tur: ${data.currentRound} / ${data.totalRounds || window._totalRounds}`;
  }
});

socket.on("categoryStart", (data) => {
  // Eski uyumluluk - yeni akışta kullanılmıyor
  pendingCategoryData = data;
  if (letterAnimationDone) startTimer(window._roundTime, "is-timer");
});

socket.on("allCategoriesStart", (data) => {
  pendingCategoryData = data;
  _isimSehirSubmitted = false; // yeni tur, tekrar gönderebilir

  const iamP1 = myPlayerId === data.p1.id;
  const iamP2 = myPlayerId === data.p2.id;
  amIPlaying = iamP1 || iamP2;
  window._iamP2 = iamP2;

  // Kategori tab'larını hepsini aktif yap
  document.querySelectorAll(".cat-tab").forEach((t) => t.classList.add("cat-active"));
  document.getElementById("is-game-log").innerHTML = "";

  const infoBar = document.getElementById("isimSehir-turn-info");
  const allInputs = document.getElementById("is-all-inputs");
  const specArea = document.getElementById("is-spectator-area");

  document.getElementById("isLeftName").innerText = data.p1.username;
  document.getElementById("isRightName").innerText = data.p2.username;

  const p1El = document.getElementById("is-left-panel");
  const p2El = document.getElementById("is-right-panel");
  p1El.className = `game-panel panel-${data.p1.gender}`;
  p2El.className = `game-panel panel-${data.p2.gender}`;

  if (amIPlaying) {
    infoBar.innerText = "SIRA SİZDE! 🚀 Hepsini doldurun";
    infoBar.style.backgroundColor = "#27ae60";
    allInputs.classList.remove("hidden");
    specArea.classList.add("hidden");

    // Inputları sıfırla ve aç
    ["isim", "sehir", "hayvan"].forEach((c) => {
      const inp = document.getElementById("isInput-" + c);
      inp.value = "";
      inp.disabled = false;
      inp.placeholder = data.letter + "...";
      // Her inputa harf doğrulaması ekle - ilk harf her zaman kontrol edilir
      const handler = function() {
        const typed = inp.value.toLocaleUpperCase("tr-TR");
        if (typed.length > 0 && typed.charAt(0) !== currentTargetLetter) {
          inp.value = "";
          inp.classList.add("pic-guess-wrong");
          setTimeout(() => inp.classList.remove("pic-guess-wrong"), 400);
        }
      };
      // Eski handler varsa kaldır
      if (inp._letterHandler) inp.removeEventListener("input", inp._letterHandler);
      inp.addEventListener("input", handler);
      inp._letterHandler = handler;
    });
    document.getElementById("isSendAllBtn").disabled = false;
    document.getElementById("is-left-status").innerText = "...";
    document.getElementById("isInput-isim").focus();

    if (iamP2) {
      document.getElementById("isLeftName").innerText = data.p2.username;
      document.getElementById("isRightName").innerText = data.p1.username;
      p1El.className = `game-panel panel-${data.p2.gender}`;
      p2El.className = `game-panel panel-${data.p1.gender}`;
    }
  } else {
    infoBar.innerText = `${data.p1.username} & ${data.p2.username} Oynuyor...`;
    infoBar.style.backgroundColor = "#34495e";
    allInputs.classList.add("hidden");
    specArea.classList.remove("hidden");
    document.getElementById("is-spectator-left").innerText = "🤔";
    document.getElementById("is-spectator-right").innerText = "🤔";
    document.getElementById("is-right-status").innerText = "Yazıyor...";
  }

  if (letterAnimationDone) startTimer(window._roundTime, "is-timer");
});

socket.on("isimSehirResult", (res) => {
  clearInterval(timerInterval);
  addIsimSehirLogItem(res);
});

socket.on("isimSehirAllResults", (data) => {
  console.log("[IS] isimSehirAllResults received:", data);
  clearInterval(timerInterval);
  const results = data.results;
  const p1 = data.p1;
  const p2 = data.p2;

  // Her sonucu sırayla log'a ekle ve overlay göster
  function showNext(index) {
    if (index >= results.length) return;
    const res = results[index];
    addIsimSehirLogItem(res);

    const leftName = amIPlaying && window._iamP2 ? p2.username : p1.username;
    const rightName = amIPlaying && window._iamP2 ? p1.username : p2.username;
    const leftWord = amIPlaying && window._iamP2 ? res.p2Word : res.p1Word;
    const rightWord = amIPlaying && window._iamP2 ? res.p1Word : res.p2Word;

    showMatchOverlay(
      leftName,
      rightName,
      leftWord,
      rightWord,
      res.match,
      () => { showNext(index + 1); },
      res.category
    );
  }
  showNext(0);
});

function addIsimSehirLogItem(res) {
  const div = document.createElement("div");
  div.className = res.match ? "log-item log-success" : "log-item log-fail";
  let resultText = `${escapeHtml(res.category)}: ${escapeHtml(res.p1Word)} - ${escapeHtml(res.p2Word)} ${res.match ? "✅ +1" : "❌ 0"}`;
  if (res.example) {
    resultText += ` (Örnek: ${res.example})`;
  }
  div.innerHTML = resultText;
  document.getElementById("is-game-log").prepend(div);
}

socket.on("isimSehirGameOver", (msg) => {
  Swal.fire({ title: "BİTTİ", text: msg });
});

// --- PICTIONARY ---
let picIsDrawer = false;
let picDrawing = false;
let picLastEmit = 0;
let picColor = "#000000";
let picCtx = null;
let picLastX = 0,
  picLastY = 0;
let picLastEmitX = 0,
  picLastEmitY = 0;
let picCurrentTool = "pen";
let picShapeStartX = 0,
  picShapeStartY = 0;
let picSnapshotData = null; // canvas snapshot for shape preview

function initPictionaryCanvas() {
  const canvas = document.getElementById("pic-canvas");
  picCtx = canvas.getContext("2d");
  picCtx.lineCap = "round";
  picCtx.lineJoin = "round";

  // Color picker
  document.querySelectorAll(".pic-color").forEach((el) => {
    el.addEventListener("click", () => {
      document
        .querySelectorAll(".pic-color")
        .forEach((c) => c.classList.remove("active"));
      el.classList.add("active");
      picColor = el.dataset.color;
      if (picCurrentTool === "eraser") {
        selectTool("pen");
      }
    });
  });

  // Tool picker
  document.querySelectorAll(".pic-tool-icon[data-tool]").forEach((el) => {
    if (el.dataset.tool === "clear") return;
    el.addEventListener("click", () => {
      selectTool(el.dataset.tool);
    });
  });

  // Drawing events
  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    if (!picIsDrawer) return;
    e.preventDefault();
    picDrawing = true;
    const pos = getPos(e);
    picLastX = pos.x;
    picLastY = pos.y;
    picLastEmitX = pos.x;
    picLastEmitY = pos.y;

    if (
      picCurrentTool === "square" ||
      picCurrentTool === "rectangle" ||
      picCurrentTool === "triangle" ||
      picCurrentTool === "circle"
    ) {
      picShapeStartX = pos.x;
      picShapeStartY = pos.y;
      picSnapshotData = picCtx.getImageData(0, 0, canvas.width, canvas.height);
    }
  };

  const moveDraw = (e) => {
    if (!picIsDrawer || !picDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    const color = picCurrentTool === "eraser" ? "#ffffff" : picColor;
    const thickness = parseInt(document.getElementById("pic-thickness").value);

    if (picCurrentTool === "pen" || picCurrentTool === "eraser") {
      drawLine(picLastX, picLastY, pos.x, pos.y, color, thickness);

      const now = Date.now();
      if (now - picLastEmit > 30) {
        socket.emit("drawData", {
          roomId: currentRoom,
          x1: picLastEmitX,
          y1: picLastEmitY,
          x2: pos.x,
          y2: pos.y,
          color,
          thickness,
        });
        picLastEmitX = pos.x;
        picLastEmitY = pos.y;
        picLastEmit = now;
      }

      picLastX = pos.x;
      picLastY = pos.y;
    } else {
      // Shape preview
      if (picSnapshotData) {
        picCtx.putImageData(picSnapshotData, 0, 0);
      }
      drawShapePreview(
        picShapeStartX,
        picShapeStartY,
        pos.x,
        pos.y,
        color,
        thickness,
      );
    }
  };

  const endDraw = (e) => {
    if (!picIsDrawer || !picDrawing) {
      picDrawing = false;
      return;
    }

    if (
      picCurrentTool === "square" ||
      picCurrentTool === "rectangle" ||
      picCurrentTool === "triangle" ||
      picCurrentTool === "circle"
    ) {
      const pos = e.changedTouches
        ? { x: 0, y: 0 }
        : e.type === "mouseleave"
          ? { x: picLastX, y: picLastY }
          : null;
      let endX, endY;
      if (e.changedTouches) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        endX = (e.changedTouches[0].clientX - rect.left) * scaleX;
        endY = (e.changedTouches[0].clientY - rect.top) * scaleY;
      } else {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        endX = (e.clientX - rect.left) * scaleX;
        endY = (e.clientY - rect.top) * scaleY;
      }

      const color = picColor;
      const thickness = parseInt(
        document.getElementById("pic-thickness").value,
      );

      if (picSnapshotData) {
        picCtx.putImageData(picSnapshotData, 0, 0);
      }
      drawShape(
        picCurrentTool,
        picShapeStartX,
        picShapeStartY,
        endX,
        endY,
        color,
        thickness,
      );
      socket.emit("drawData", {
        roomId: currentRoom,
        type: "shape",
        shape: picCurrentTool,
        x1: picShapeStartX,
        y1: picShapeStartY,
        x2: endX,
        y2: endY,
        color,
        thickness,
      });
      picSnapshotData = null;
    }

    picDrawing = false;
  };

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", moveDraw);
  canvas.addEventListener("mouseup", endDraw);
  canvas.addEventListener("mouseleave", endDraw);
  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove", moveDraw, { passive: false });
  canvas.addEventListener("touchend", endDraw);
}

function selectTool(tool) {
  picCurrentTool = tool;
  document.querySelectorAll(".pic-tool-icon[data-tool]").forEach((el) => {
    if (el.dataset.tool === "clear") return;
    el.classList.toggle("active", el.dataset.tool === tool);
  });
}

function drawLine(x1, y1, x2, y2, color, thickness) {
  picCtx.strokeStyle = color;
  picCtx.lineWidth = thickness;
  picCtx.beginPath();
  picCtx.moveTo(x1, y1);
  picCtx.lineTo(x2, y2);
  picCtx.stroke();
}

function drawShapePreview(x1, y1, x2, y2, color, thickness) {
  picCtx.strokeStyle = color;
  picCtx.lineWidth = thickness;
  picCtx.setLineDash([6, 4]);
  drawShapePath(picCurrentTool, x1, y1, x2, y2);
  picCtx.setLineDash([]);
}

function drawShape(shape, x1, y1, x2, y2, color, thickness) {
  picCtx.strokeStyle = color;
  picCtx.lineWidth = thickness;
  picCtx.setLineDash([]);
  drawShapePath(shape, x1, y1, x2, y2);
}

function drawShapePath(shape, x1, y1, x2, y2) {
  picCtx.beginPath();
  if (shape === "square") {
    const size = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    const sx = x2 > x1 ? x1 : x1 - size;
    const sy = y2 > y1 ? y1 : y1 - size;
    picCtx.rect(sx, sy, size, size);
  } else if (shape === "rectangle") {
    const w = x2 - x1;
    const h = y2 - y1;
    picCtx.rect(x1, y1, w, h);
  } else if (shape === "triangle") {
    const midX = (x1 + x2) / 2;
    picCtx.moveTo(midX, y1);
    picCtx.lineTo(x2, y2);
    picCtx.lineTo(x1, y2);
    picCtx.closePath();
  } else if (shape === "circle") {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const rx = Math.abs(x2 - x1) / 2;
    const ry = Math.abs(y2 - y1) / 2;
    picCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  }
  picCtx.stroke();
}

function clearCanvas() {
  if (!picIsDrawer) return;
  const canvas = document.getElementById("pic-canvas");
  picCtx.clearRect(0, 0, canvas.width, canvas.height);
  picCtx.fillStyle = "#ffffff";
  picCtx.fillRect(0, 0, canvas.width, canvas.height);
  socket.emit("drawData", { roomId: currentRoom, clear: true });
}

function sendPictionaryGuess() {
  const inp = document.getElementById("pic-guess-input");
  const val = inp.value.trim();
  if (!val) return;
  socket.emit("pictionaryGuess", { roomId: currentRoom, guess: val });
  inp.value = "";
}

// Pictionary socket events
socket.on("pictionaryStart", (data) => {
  window._currentGameType = "pictionary";
  showScreen("pictionary");
  window._roundTime = 45;
  window._totalRounds = data.roundCount || 5;

  document.getElementById("scoreboard-panel").style.display = "block";
  document.getElementById("score-note-text").innerText =
    "İlk bilene en çok puan! 🏆";
  document.getElementById("pic-round-display").innerText =
    `Tur: 1 / ${window._totalRounds}`;

  initPictionaryCanvas();

  Swal.fire({
    title: "Resim Çiz Başlıyor!",
    timer: 1500,
    showConfirmButton: false,
  });

  if (!_listenersAttached.picGuessInput) {
    document
      .getElementById("pic-guess-input")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendPictionaryGuess();
      });
    _listenersAttached.picGuessInput = true;
  }
});

socket.on("pictionaryRound", (data) => {
  document.getElementById("pic-round-display").innerText =
    `Tur: ${data.round} / ${data.totalRounds}`;
  document.getElementById("pic-game-log").innerHTML = "";

  const canvas = document.getElementById("pic-canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const amDrawer = myPlayerId === data.drawerId;
  picIsDrawer = amDrawer;

  const infoBar = document.getElementById("pic-turn-info");
  const wordDisplay = document.getElementById("pic-word-display");
  const leftTools = document.getElementById("pic-left-tools");
  const colorBar = document.getElementById("pic-color-bar");
  const guessArea = document.getElementById("pic-guess-area");

  // Reset tool
  selectTool("pen");

  if (data.gameMode === "tek") {
    // TEK MOD
    const amGuesser = !amDrawer && data.guesserId === myPlayerId;
    amIPlaying = amDrawer || amGuesser;

    if (amDrawer) {
      infoBar.innerText = `ÇİZ! Herkes tahmin edecek`;
      infoBar.style.backgroundColor = "#e67e22";
      wordDisplay.classList.remove("hidden");
      wordDisplay.innerText = `Kelime: ${data.word}`;
      leftTools.classList.remove("hidden");
      colorBar.classList.remove("hidden");
      guessArea.classList.add("hidden");
      canvas.style.cursor = "crosshair";
    } else if (amGuesser) {
      infoBar.innerText = `TAHMİN ET! ${data.drawerName} çiziyor`;
      infoBar.style.backgroundColor = "#27ae60";
      wordDisplay.classList.add("hidden");
      leftTools.classList.add("hidden");
      colorBar.classList.add("hidden");
      guessArea.classList.remove("hidden");
      canvas.style.cursor = "default";
      const inp = document.getElementById("pic-guess-input");
      inp.disabled = false;
      document.getElementById("pic-guess-btn").disabled = false;
      inp.value = "";
      inp.focus();
    } else {
      infoBar.innerText = `${data.drawerName} çiziyor`;
      infoBar.style.backgroundColor = "#34495e";
      wordDisplay.classList.add("hidden");
      leftTools.classList.add("hidden");
      colorBar.classList.add("hidden");
      guessArea.classList.add("hidden");
      canvas.style.cursor = "default";
    }
  } else {
    // ÇİFT MOD
    const amGuesser = myPlayerId === data.guesserId;
    amIPlaying = amDrawer || amGuesser;

    if (amDrawer) {
      infoBar.innerText = `ÇİZ! ${data.drawerName} (sen) çiziyorsun`;
      infoBar.style.backgroundColor = "#e67e22";
      wordDisplay.classList.remove("hidden");
      wordDisplay.innerText = `Kelime: ${data.word}`;
      leftTools.classList.remove("hidden");
      colorBar.classList.remove("hidden");
      guessArea.classList.add("hidden");
      canvas.style.cursor = "crosshair";
    } else if (amGuesser) {
      infoBar.innerText = `TAHMİN ET! ${data.drawerName} çiziyor`;
      infoBar.style.backgroundColor = "#27ae60";
      wordDisplay.classList.add("hidden");
      leftTools.classList.add("hidden");
      colorBar.classList.add("hidden");
      guessArea.classList.remove("hidden");
      canvas.style.cursor = "default";
      const inp = document.getElementById("pic-guess-input");
      inp.disabled = false;
      document.getElementById("pic-guess-btn").disabled = false;
      inp.value = "";
      inp.focus();
    } else {
      infoBar.innerText = `${data.drawerName} çiziyor, ${data.guesserName} tahmin ediyor`;
      infoBar.style.backgroundColor = "#34495e";
      wordDisplay.classList.add("hidden");
      leftTools.classList.add("hidden");
      colorBar.classList.add("hidden");
      guessArea.classList.add("hidden");
      canvas.style.cursor = "default";
    }
  }

  startTimer(45, "pic-timer");
});

socket.on("drawData", (data) => {
  if (data.clear) {
    const canvas = document.getElementById("pic-canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }
  // Ensure picCtx is initialized for spectators
  if (!picCtx) {
    const canvas = document.getElementById("pic-canvas");
    picCtx = canvas.getContext("2d");
    picCtx.lineCap = "round";
    picCtx.lineJoin = "round";
  }
  if (data.type === "shape") {
    drawShape(
      data.shape,
      data.x1,
      data.y1,
      data.x2,
      data.y2,
      data.color,
      data.thickness,
    );
  } else {
    drawLine(data.x1, data.y1, data.x2, data.y2, data.color, data.thickness);
  }
});

socket.on("pictionaryWrongGuess", (data) => {
  // data: { guess }
  if (amIPlaying && !picIsDrawer) {
    const inp = document.getElementById("pic-guess-input");
    inp.classList.add("pic-guess-wrong");
    setTimeout(() => inp.classList.remove("pic-guess-wrong"), 400);
  }
  const div = document.createElement("div");
  div.className = "log-item log-fail";
  div.innerHTML = `${escapeHtml(data.guesserName)}: "${escapeHtml(data.guess)}" ❌`;
  document.getElementById("pic-game-log").prepend(div);
});

socket.on("pictionaryCorrect", (data) => {
  const div = document.createElement("div");
  div.className = "log-item log-success";
  div.innerHTML = `${escapeHtml(data.teamName)} bildi! +${data.points} puan (${data.order}. sıra)`;
  document.getElementById("pic-game-log").prepend(div);

  if (data.gameMode === "tek") {
    // Tek modda sadece doğru bilen kişinin inputu kapansın
    if (data.guesserId === myPlayerId) {
      document.getElementById("pic-guess-input").disabled = true;
      document.getElementById("pic-guess-btn").disabled = true;
      Swal.fire({
        title: "Doğru!",
        text: `+${data.points} puan`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    }
    // Timer durmasın, tur devam ediyor
  } else {
    clearInterval(timerInterval);
    if (amIPlaying) {
      const guessArea = document.getElementById("pic-guess-area");
      guessArea.classList.add("hidden");
      Swal.fire({
        title: "Doğru!",
        text: `+${data.points} puan`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  }
});

socket.on("pictionaryRoundEnd", (data) => {
  // data: { word, scores }
  clearInterval(timerInterval);
  const wordDisplay = document.getElementById("pic-word-display");
  wordDisplay.classList.remove("hidden");
  wordDisplay.innerText = `Cevap: ${data.word}`;
  document.getElementById("pic-left-tools").classList.add("hidden");
  document.getElementById("pic-color-bar").classList.add("hidden");
  document.getElementById("pic-guess-area").classList.add("hidden");
  picIsDrawer = false;
});

socket.on("pictionaryGameOver", (msg) => {
  Swal.fire({ title: "BİTTİ", text: msg });
});

// --- TABU ---
let tabuRole = null; // "describer", "guesser", "spectator"

function sendTabuClue() {
  const inp = document.getElementById("tabu-clue-input");
  const val = inp.value.trim();
  if (!val) return;
  socket.emit("tabuClue", { roomId: currentRoom, clue: val });
  inp.value = "";
}

function sendTabuGuess() {
  const inp = document.getElementById("tabu-guess-input");
  const val = inp.value.trim();
  if (!val) return;
  socket.emit("tabuGuess", { roomId: currentRoom, guess: val });
  inp.value = "";
}

function sendTabuPass() {
  socket.emit("tabuPass", { roomId: currentRoom });
}

socket.on("tabuStart", (data) => {
  window._currentGameType = "tabu";
  showScreen("tabu");
  window._roundTime = data.roundTime || 60;
  window._totalRounds = data.roundCount || 5;

  document.getElementById("scoreboard-panel").style.display = "block";
  document.getElementById("score-note-text").innerText =
    "En çok kelime bilen kazanır! 🏆";
  document.getElementById("tabu-round-display").innerText =
    `Tur: 1 / ${window._totalRounds}`;

  Swal.fire({ title: "Tabu Başlıyor!", timer: 1500, showConfirmButton: false });

  if (!_listenersAttached.tabuClueInput) {
    document
      .getElementById("tabu-clue-input")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendTabuClue();
      });
    document
      .getElementById("tabu-guess-input")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendTabuGuess();
      });
    _listenersAttached.tabuClueInput = true;
  }
});

socket.on("tabuTurn", (data) => {
  document.getElementById("tabu-round-display").innerText =
    `Tur: ${data.currentRound} / ${data.totalRounds}`;
  document.getElementById("tabu-chat").innerHTML = "";
  document.getElementById("tabu-game-log").innerHTML = "";

  const infoBar = document.getElementById("tabu-turn-info");
  const cardEl = document.getElementById("tabu-card");
  const clueArea = document.getElementById("tabu-clue-area");
  const guessArea = document.getElementById("tabu-guess-area");
  const alertEl = document.getElementById("tabu-forbidden-alert");
  alertEl.classList.add("hidden");

  const amDescriber = myPlayerId === data.describer.id;
  const amGuesser = myPlayerId === data.guesser.id;
  amIPlaying = amDescriber || amGuesser;

  if (amDescriber) {
    tabuRole = "describer";
    infoBar.innerText = `ANLAT! ${data.guesser.username} tahmin edecek`;
    infoBar.style.backgroundColor = "#e67e22";
    cardEl.classList.remove("hidden");
    clueArea.classList.remove("hidden");
    guessArea.classList.add("hidden");
    const inp = document.getElementById("tabu-clue-input");
    inp.disabled = false;
    document.getElementById("tabu-clue-btn").disabled = false;
    inp.value = "";
    inp.focus();
  } else if (amGuesser) {
    tabuRole = "guesser";
    infoBar.innerText = `TAHMİN ET! ${data.describer.username} anlatıyor`;
    infoBar.style.backgroundColor = "#27ae60";
    cardEl.classList.add("hidden");
    clueArea.classList.add("hidden");
    guessArea.classList.remove("hidden");
    const inp = document.getElementById("tabu-guess-input");
    inp.disabled = false;
    document.getElementById("tabu-guess-btn").disabled = false;
    inp.value = "";
    inp.focus();
  } else {
    tabuRole = "spectator";
    infoBar.innerText = `${data.describer.username} anlatıyor, ${data.guesser.username} tahmin ediyor`;
    infoBar.style.backgroundColor = "#34495e";
    cardEl.classList.remove("hidden");
    clueArea.classList.add("hidden");
    guessArea.classList.add("hidden");
  }

  startTimer(data.roundTime, "tabu-timer");
});

socket.on("tabuNewWord", (data) => {
  // Only describer sees this
  document.getElementById("tabu-main-word").innerText = data.word;
  document.getElementById("tabu-f1").innerText = data.forbidden[0];
  document.getElementById("tabu-f2").innerText = data.forbidden[1];
  document.getElementById("tabu-f3").innerText = data.forbidden[2];
  document.getElementById("tabu-f4").innerText = data.forbidden[3];
  document.getElementById("tabu-f5").innerText = data.forbidden[4];
});

socket.on("tabuNewRound", () => {
  // Clear chat for new word
  document.getElementById("tabu-chat").innerHTML = "";
});

socket.on("tabuClue", (data) => {
  const chat = document.getElementById("tabu-chat");
  const div = document.createElement("div");
  div.className = "tabu-clue-item clue";
  div.innerText = `💡 ${data.describerName}: ${data.clue}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
});

socket.on("tabuGuessMsg", (data) => {
  const chat = document.getElementById("tabu-chat");
  const div = document.createElement("div");
  div.className = "tabu-clue-item guess";
  div.innerText = `🤔 ${data.guesserName}: ${data.guess}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
});

socket.on("tabuCorrect", (data) => {
  const chat = document.getElementById("tabu-chat");
  const div = document.createElement("div");
  div.className = "tabu-clue-item guess correct";
  div.innerText = `✅ DOĞRU! "${data.word}" - ${data.teamName} (${data.score} puan)`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;

  const logDiv = document.createElement("div");
  logDiv.className = "log-item log-success";
  logDiv.innerHTML = `${escapeHtml(data.teamName)}: "${escapeHtml(data.word)}" ✅ +1`;
  document.getElementById("tabu-game-log").prepend(logDiv);

  if (amIPlaying) {
    Swal.fire({
      title: "DOĞRU!",
      icon: "success",
      timer: 800,
      showConfirmButton: false,
    });
  }
});

socket.on("tabuForbidden", (data) => {
  const alertEl = document.getElementById("tabu-forbidden-alert");
  alertEl.innerText = `YASAKLI KELİME! 🚫 "${data.forbiddenWord}"`;
  alertEl.classList.remove("hidden");
  setTimeout(() => alertEl.classList.add("hidden"), 2500);

  const chat = document.getElementById("tabu-chat");
  const div = document.createElement("div");
  div.className = "tabu-clue-item system";
  div.innerText = `🚫 ${data.describerName} yasaklı kelime kullandı: "${data.forbiddenWord}" - Kelime geçildi!`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
});

socket.on("tabuPassed", (data) => {
  const chat = document.getElementById("tabu-chat");
  const div = document.createElement("div");
  div.className = "tabu-clue-item system";
  div.innerText = `⏭ PAS - "${data.word}" geçildi`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
});

socket.on("tabuTurnEnd", (data) => {
  clearInterval(timerInterval);
  const chat = document.getElementById("tabu-chat");
  const div = document.createElement("div");
  div.className = "tabu-clue-item system";
  div.innerText = `⏰ Süre doldu! ${data.teamName}: ${data.score} puan`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;

  document.getElementById("tabu-card").classList.add("hidden");
  document.getElementById("tabu-clue-area").classList.add("hidden");
  document.getElementById("tabu-guess-area").classList.add("hidden");
});

socket.on("tabuGameOver", (msg) => {
  Swal.fire({ title: "BİTTİ", text: msg });
});

// --- EKRANLAR ---
const screens = {
  lobby: document.getElementById("lobby-screen"),
  waiting: document.getElementById("waiting-screen"),
  game: document.getElementById("game-screen"),
  gameSelect: document.getElementById("game-select-screen"),
  gameSettings: document.getElementById("game-settings-screen"),
  isimSehir: document.getElementById("isimSehir-screen"),
  pictionary: document.getElementById("pictionary-screen"),
  tabu: document.getElementById("tabu-screen"),
  imposter: document.getElementById("imposter-screen"),
};
function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
  // Oyun ekranlarında header'ı gizle (mobil yer kazanımı)
  const gameScreens = ["game", "isimSehir", "pictionary", "tabu", "imposter"];
  if (gameScreens.includes(name)) {
    document.body.classList.add("game-active");
  } else {
    document.body.classList.remove("game-active");
  }
}

// --- İMPOSTOR ---
let imposterIsMe = false;

function sendImposterWord(auto) {
  const inp = document.getElementById("imposterWordInput");
  let val = inp.value;
  if (auto && !val) val = "⏰";
  if (val) {
    socket.emit("submitImposterWord", { roomId: currentRoom, word: val });
    inp.value = "";
    inp.disabled = true;
    document.getElementById("imposterSendBtn").disabled = true;
    clearInterval(timerInterval);
  }
}

function sendImposterVote(playerId) {
  socket.emit("submitImposterVote", {
    roomId: currentRoom,
    votedPlayerId: playerId,
  });
  document.querySelectorAll(".imposter-vote-btn").forEach((btn) => {
    btn.disabled = true;
    if (btn.dataset.pid === playerId) {
      btn.classList.add("voted");
    }
  });
}

socket.on("imposterStart", (data) => {
  window._currentGameType = "imposter";
  showScreen("imposter");
  window._roundTime = data.roundTime || 60;
  window._totalRounds = data.roundCount || 5;
  document.getElementById("scoreboard-panel").style.display = "none";
  document.getElementById("imposter-round-display").innerText =
    `Tur: 1 / ${window._totalRounds}`;

  Swal.fire({
    title: "Imposter Başlıyor!",
    timer: 1500,
    showConfirmButton: false,
  });

  if (!_listenersAttached.imposterWordInput) {
    document
      .getElementById("imposterWordInput")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendImposterWord();
      });
    _listenersAttached.imposterWordInput = true;
  }
});

socket.on("imposterRound", (data) => {
  amIPlaying = true;
  imposterIsMe = data.isImposter;
  document.getElementById("imposter-round-display").innerText =
    `Tur: ${data.currentRound} / ${data.totalRounds}`;
  document.getElementById("imposter-game-log").innerHTML = "";
  document.getElementById("imposter-answers").classList.add("hidden");
  document.getElementById("imposter-answers").innerHTML = "";
  document.getElementById("imposter-vote-area").classList.add("hidden");

  const inp = document.getElementById("imposterWordInput");
  inp.disabled = false;
  inp.value = "";
  document.getElementById("imposterSendBtn").disabled = false;
  document.getElementById("imposter-input-area").classList.remove("hidden");
  document.getElementById("imposter-submitted-list").classList.add("hidden");
  document.getElementById("imposter-submitted-list").innerHTML = "";

  const phaseLabel = document.getElementById("imposter-phase-label");
  phaseLabel.classList.remove("hidden");
  phaseLabel.innerText = "1. Yazma Turu";

  const hintEl = document.getElementById("imposter-hint");

  if (data.isImposter) {
    document.getElementById("imposter-turn-info").innerText =
      "Sen IMPOSTOR'sun! Yakalanma! 🕵️";
    document.getElementById("imposter-turn-info").style.backgroundColor =
      "#e74c3c";
    document.getElementById("imposter-screen").style.background =
      "linear-gradient(135deg, #e74c3c22, #c0392b22)";
    document.getElementById("imposter-title").innerText = "🕵️ IMPOSTOR";
    document.getElementById("imposter-main-word").innerText = "???";
    hintEl.classList.remove("hidden");
    hintEl.innerText = `İpucu: ${data.hint}`;
  } else {
    document.getElementById("imposter-turn-info").innerText =
      "Kelimeyle ilgili bir şey yaz! 🔍";
    document.getElementById("imposter-turn-info").style.backgroundColor =
      "#27ae60";
    document.getElementById("imposter-screen").style.background = "";
    document.getElementById("imposter-title").innerText = "Kelime";
    document.getElementById("imposter-main-word").innerText = data.word;
    hintEl.classList.add("hidden");
  }

  inp.focus();
  startTimer(data.roundTime, "imposter-timer");
});

socket.on("imposterPlayerSubmitted", (data) => {
  const list = document.getElementById("imposter-submitted-list");
  list.classList.remove("hidden");
  const span = document.createElement("div");
  span.className = "imposter-submitted-item";
  span.innerText = `✅ ${data.username} yazdı`;
  list.appendChild(span);
});

socket.on("imposterPhaseResults", (data) => {
  clearInterval(timerInterval);
  document.getElementById("imposter-input-area").classList.add("hidden");
  document.getElementById("imposter-submitted-list").classList.add("hidden");
  document.getElementById("imposter-timer").innerText = "";

  const answersEl = document.getElementById("imposter-answers");
  answersEl.classList.remove("hidden");

  if (data.phase === "write1") {
    answersEl.innerHTML = "<h4>1. Tur Cevapları</h4>";
    data.results.forEach((r) => {
      const div = document.createElement("div");
      div.className = "imposter-answer-item";
      div.innerText = `${r.username}: "${r.word}"`;
      answersEl.appendChild(div);
    });

    document.getElementById("imposter-turn-info").innerText =
      "Cevaplar açıklandı! 2. tur hazırlanıyor...";
    document.getElementById("imposter-turn-info").style.backgroundColor =
      "#8e44ad";
  } else if (data.phase === "write2") {
    answersEl.innerHTML = "<h4>1. Tur Cevapları</h4>";
    data.results1.forEach((r) => {
      const div = document.createElement("div");
      div.className = "imposter-answer-item";
      div.innerText = `${r.username}: "${r.word}"`;
      answersEl.appendChild(div);
    });
    const h2 = document.createElement("h4");
    h2.innerText = "2. Tur Cevapları";
    h2.style.marginTop = "12px";
    answersEl.appendChild(h2);
    data.results2.forEach((r) => {
      const div = document.createElement("div");
      div.className = "imposter-answer-item";
      div.innerText = `${r.username}: "${r.word}"`;
      answersEl.appendChild(div);
    });

    document.getElementById("imposter-turn-info").innerText =
      "Cevaplar açıklandı! Oylama hazırlanıyor...";
    document.getElementById("imposter-turn-info").style.backgroundColor =
      "#8e44ad";
  }
});

socket.on("imposterPhase2Start", (data) => {
  const phaseLabel = document.getElementById("imposter-phase-label");
  phaseLabel.innerText = "2. Yazma Turu";

  const inp = document.getElementById("imposterWordInput");
  inp.disabled = false;
  inp.value = "";
  document.getElementById("imposterSendBtn").disabled = false;
  document.getElementById("imposter-input-area").classList.remove("hidden");
  document.getElementById("imposter-submitted-list").classList.add("hidden");
  document.getElementById("imposter-submitted-list").innerHTML = "";

  if (imposterIsMe) {
    document.getElementById("imposter-turn-info").innerText =
      "2. Tur - Tekrar yaz! Yakalanma! 🕵️";
    document.getElementById("imposter-turn-info").style.backgroundColor =
      "#e74c3c";
  } else {
    document.getElementById("imposter-turn-info").innerText =
      "2. Tur - Tekrar bir şey yaz! 🔍";
    document.getElementById("imposter-turn-info").style.backgroundColor =
      "#27ae60";
  }

  inp.focus();
  startTimer(data.roundTime, "imposter-timer");
});

socket.on("imposterVoteStart", (data) => {
  document.getElementById("imposter-input-area").classList.add("hidden");
  document.getElementById("imposter-submitted-list").classList.add("hidden");
  document.getElementById("imposter-phase-label").innerText = "Oylama";
  document.getElementById("imposter-timer").innerText = "";

  document.getElementById("imposter-turn-info").innerText =
    "Imposter kim? Oy ver! 🗳️";
  document.getElementById("imposter-turn-info").style.backgroundColor =
    "#e67e22";

  const voteArea = document.getElementById("imposter-vote-area");
  const voteList = document.getElementById("imposter-vote-list");
  voteArea.classList.remove("hidden");
  voteList.innerHTML = "";

  data.players.forEach((p) => {
    if (p.playerId === myPlayerId) return;
    const btn = document.createElement("button");
    btn.className = "imposter-vote-btn";
    btn.dataset.pid = p.playerId;
    btn.innerText = p.username;
    btn.onclick = () => sendImposterVote(p.playerId);
    voteList.appendChild(btn);
  });
});

socket.on("imposterPlayerVoted", (data) => {
  const list = document.getElementById("imposter-submitted-list");
  list.classList.remove("hidden");
  const span = document.createElement("div");
  span.className = "imposter-submitted-item";
  span.innerText = `🗳️ ${data.username} oy verdi`;
  list.appendChild(span);
});

socket.on("imposterVoteResult", (data) => {
  document.getElementById("imposter-vote-area").classList.add("hidden");
  document.getElementById("imposter-submitted-list").classList.add("hidden");
  document.getElementById("imposter-phase-label").classList.add("hidden");

  const infoBar = document.getElementById("imposter-turn-info");
  if (data.imposterCaught) {
    infoBar.innerText = `Impostor yakalandı! 🎉 ${data.imposterName} impostor'du!`;
    infoBar.style.backgroundColor = "#27ae60";
  } else {
    infoBar.innerText = `Impostor kazandı! 🕵️ ${data.imposterName} impostor'du!`;
    infoBar.style.backgroundColor = "#e74c3c";
  }

  document.getElementById("imposter-title").innerText = "Sonuç";
  document.getElementById("imposter-main-word").innerText = data.secretWord;
  document.getElementById("imposter-hint").classList.add("hidden");
  document.getElementById("imposter-screen").style.background = "";

  const log = document.getElementById("imposter-game-log");
  log.innerHTML = "";

  data.voteDetails.forEach((v) => {
    const div = document.createElement("div");
    const badge = v.isImposter ? " 🕵️" : "";
    const voteBadge = v.votes > 0 ? ` (${v.votes} oy)` : "";
    div.className = v.isImposter ? "log-item log-fail" : "log-item log-success";
    div.innerHTML = `${escapeHtml(v.username)}${badge} → ${escapeHtml(v.votedFor)}${voteBadge}`;
    log.appendChild(div);
  });

  if (data.imposterCaught) {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }
});

socket.on("imposterGameOver", (msg) => {
  Swal.fire({ title: "BİTTİ", text: msg });
});
