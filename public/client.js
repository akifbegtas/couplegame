const socket = io();
let currentRoom = null;
let myPlayerId = null;
let amIPlaying = false;
let timerInterval = null;
let pendingRoomData = null;

// --- GİRİŞ ---
function createRoom() {
  const username = document.getElementById("username").value;
  const gender = document.querySelector('input[name="gender"]:checked').value;
  const coupleCount = document.getElementById("coupleCountSelect").value;
  const roundCount = document.getElementById("roundCountInput").value;
  const roundTime = document.getElementById("roundTimeInput").value;

  if (!username) return alert("İsim giriniz!");

  pendingRoomData = { username, gender, coupleCount, roundCount, roundTime };
  showScreen("gameSelect");
}

function selectGame(type) {
  if (!pendingRoomData) return;
  pendingRoomData.gameType = type;
  socket.emit("createRoom", pendingRoomData);
  pendingRoomData = null;
}

function joinRoom() {
  const username = document.getElementById("username").value;
  const gender = document.querySelector('input[name="gender"]:checked').value;
  const code = document.getElementById("roomCodeInput").value;
  if (!username) return alert("İsim giriniz!");
  socket.emit("joinRoom", { roomId: code, username, gender });
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
  const code = document.getElementById("displayRoomCode").innerText;
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.querySelector(".copy-btn");
    btn.innerText = "✅";
    setTimeout(() => btn.innerText = "📋", 1500);
  });
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
    document.getElementById("left-status").innerText = "Bekleniyor...";
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
        } else {
          sendWord(true);
        }
      }
    }
  }, 1000);
}

// --- İSİM ŞEHİR ---
function sendIsimSehirWord(auto) {
  const inp = document.getElementById("isWordInput");
  let val = inp.value;
  if (auto && !val) val = "⏰";
  if (val) {
    socket.emit("submitIsimSehirWord", { roomId: currentRoom, word: val });
    inp.value = "";
    inp.disabled = true;
    document.getElementById("isSendBtn").disabled = true;
    document.getElementById("is-left-status").innerText = "Bekleniyor...";
    clearInterval(timerInterval);
  }
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
  const map = { "İSİM": "isim", "ŞEHİR": "sehir", "HAYVAN": "hayvan" };
  const key = map[activeCategory] || activeCategory;
  cats.forEach(c => {
    const tab = document.getElementById("cat-" + c);
    tab.classList.toggle("cat-active", c === key);
  });
}

// --- SOCKET ---
socket.on("connect", () => {
  myPlayerId = socket.id;
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
  data.teams.forEach((t, i) => {
    div.innerHTML += `<div class="team-card">
            <div class="team-title">${t.name}</div>
            <div class="slots-container">
                ${renderSlot(t.p1, i, "p1", data.hostId)}
                ${renderSlot(t.p2, i, "p2", data.hostId)}
            </div>
        </div>`;
  });

  const specs = data.spectators
    .map((p) => {
      const icon = p.gender === "female" ? "👩" : "👨";
      const cls = p.gender === "female" ? "spec-female" : "spec-male";
      return `<span class="${cls}">${icon} ${p.username}</span>`;
    })
    .join("");
  document.getElementById("spectator-list").innerHTML = specs;
});

function renderSlot(p, i, slot, hostId) {
  if (p) {
    const genderClass = p.gender === "female" ? "slot-female" : "slot-male";
    const icon = p.gender === "female" ? "👩" : "👨";
    const hostBadge = p.id === hostId ? ' <span class="host-badge">KURUCU</span>' : '';
    return `<div class="slot filled ${genderClass}">${icon} ${p.username}${hostBadge}</div>`;
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

  document.getElementById("wordInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendWord();
  });
});

socket.on("turnStarted", (data) => {
  const curR = data.currentRound || 1;
  const totR = data.totalRounds || window._totalRounds || 5;

  document.getElementById("attempts-display").innerText =
    `Tur: ${curR} / ${totR}`;
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

  const infoBar = document.getElementById("turn-info-bar");
  const inpArea = document.getElementById("input-area-left");
  const specL = document.getElementById("spectator-view-left");
  const specR = document.getElementById("spectator-view-right");

  if (amIPlaying) {
    infoBar.innerText = "SIRA SİZDE! 🚀";
    infoBar.style.backgroundColor = "#27ae60";
    inpArea.classList.remove("hidden");
    specL.classList.add("hidden");
    specR.classList.add("hidden");

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
      const el = data.slot === "p1"
        ? document.getElementById("is-spectator-left")
        : document.getElementById("is-spectator-right");
      el.innerText = data.word;
    } else {
      const el = data.slot === "p1"
        ? document.getElementById("spectator-view-left")
        : document.getElementById("spectator-view-right");
      el.innerText = data.word;
    }
  }
});

socket.on("spectatorUpdate", (res) => {
  clearInterval(timerInterval);
  const div = document.createElement("div");
  div.className = res.match ? "log-item log-success" : "log-item log-fail";
  div.innerHTML = `${res.p1Word} - ${res.p2Word} ${res.match ? "✅" : "❌"}`;

  if (window._currentGameType === "isimSehir") {
    document.getElementById("is-game-log").prepend(div);
    if (!amIPlaying) {
      document.getElementById("is-spectator-left").innerText = res.p1Word;
      document.getElementById("is-spectator-right").innerText = res.p2Word;
    }
  } else {
    document.getElementById("game-log").prepend(div);
    if (!amIPlaying) {
      document.getElementById("spectator-view-left").innerText = res.p1Word;
      document.getElementById("spectator-view-right").innerText = res.p2Word;
    } else if (!res.match) {
      setTimeout(() => {
        const inp = document.getElementById("wordInput");
        inp.value = "";
        inp.disabled = false;
        document.getElementById("sendWordBtn").disabled = false;
        inp.focus();
        document.getElementById("left-status").innerText = "Tekrar...";
        startTimer(window._roundTime);
      }, 1000);
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
            <span>${icon} ${s.name}</span>
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

// --- İSİM ŞEHİR SOCKET ---
socket.on("isimSehirStart", (data) => {
  window._currentGameType = "isimSehir";
  showScreen("isimSehir");
  window._roundTime = data.roundTime || 10;
  window._totalRounds = data.roundCount || 5;

  document.getElementById("scoreboard-panel").style.display = "block";
  document.getElementById("score-note-text").innerText = "En çok puan kazanır! 🏆";
  document.getElementById("is-round-display").innerText =
    `Tur: 1 / ${window._totalRounds}`;

  Swal.fire({ title: "İsim Şehir Başlıyor!", timer: 1500, showConfirmButton: false });

  document.getElementById("isWordInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendIsimSehirWord();
  });
});

socket.on("letterSelected", (data) => {
  animateLetter(data.letter, () => {
    // animation done, server will send categoryStart
  });
  if (data.currentRound) {
    document.getElementById("is-round-display").innerText =
      `Tur: ${data.currentRound} / ${data.totalRounds || window._totalRounds}`;
  }
});

socket.on("categoryStart", (data) => {
  updateCategoryTabs(data.category);
  document.getElementById("is-game-log").innerHTML = "";
  startTimer(window._roundTime, "is-timer");

  document.getElementById("isLeftName").innerText = data.p1.username;
  document.getElementById("isRightName").innerText = data.p2.username;

  const p1 = document.getElementById("is-left-panel");
  const p2 = document.getElementById("is-right-panel");
  p1.className = `game-panel panel-${data.p1.gender}`;
  p2.className = `game-panel panel-${data.p2.gender}`;

  const iamP1 = myPlayerId === data.p1.id;
  const iamP2 = myPlayerId === data.p2.id;
  amIPlaying = iamP1 || iamP2;

  const infoBar = document.getElementById("isimSehir-turn-info");
  const inpArea = document.getElementById("is-input-area");
  const specL = document.getElementById("is-spectator-left");
  const specR = document.getElementById("is-spectator-right");

  if (amIPlaying) {
    infoBar.innerText = `${data.category} - SIRA SİZDE! 🚀`;
    infoBar.style.backgroundColor = "#27ae60";
    inpArea.classList.remove("hidden");
    specL.classList.add("hidden");
    specR.classList.add("hidden");

    const inp = document.getElementById("isWordInput");
    inp.disabled = false;
    document.getElementById("isSendBtn").disabled = false;
    inp.value = "";
    inp.placeholder = data.category + "...";
    inp.focus();

    if (iamP2) {
      document.getElementById("isLeftName").innerText = data.p2.username;
      document.getElementById("isRightName").innerText = data.p1.username;
      p1.className = `game-panel panel-${data.p2.gender}`;
      p2.className = `game-panel panel-${data.p1.gender}`;
    }
  } else {
    infoBar.innerText = `${data.category} - ${data.p1.username} & ${data.p2.username}`;
    infoBar.style.backgroundColor = "#34495e";
    inpArea.classList.add("hidden");
    specL.classList.remove("hidden");
    specR.classList.remove("hidden");
    specL.innerText = "🤔";
    specR.innerText = "🤔";
  }
});

socket.on("isimSehirResult", (res) => {
  clearInterval(timerInterval);
  const div = document.createElement("div");
  div.className = res.match ? "log-item log-success" : "log-item log-fail";
  div.innerHTML = `${res.category}: ${res.p1Word} - ${res.p2Word} ${res.match ? "✅ +1" : "❌ 0"}`;
  document.getElementById("is-game-log").prepend(div);

  if (!amIPlaying) {
    document.getElementById("is-spectator-left").innerText = res.p1Word;
    document.getElementById("is-spectator-right").innerText = res.p2Word;
  }
});

socket.on("isimSehirGameOver", (msg) => {
  Swal.fire({ title: "BİTTİ", text: msg });
});

// --- PICTIONARY ---
let picIsDrawer = false;
let picDrawing = false;
let picLastEmit = 0;
let picEraserOn = false;
let picColor = "#000000";
let picThickness = 4;
let picCtx = null;
let picLastX = 0, picLastY = 0;

function initPictionaryCanvas() {
  const canvas = document.getElementById("pic-canvas");
  picCtx = canvas.getContext("2d");
  picCtx.lineCap = "round";
  picCtx.lineJoin = "round";

  // Color picker
  document.querySelectorAll(".pic-color").forEach(el => {
    el.addEventListener("click", () => {
      document.querySelectorAll(".pic-color").forEach(c => c.classList.remove("active"));
      el.classList.add("active");
      picColor = el.dataset.color;
      picEraserOn = false;
      document.getElementById("pic-eraser-btn").classList.remove("active");
    });
  });

  // Drawing events
  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => {
    if (!picIsDrawer) return;
    e.preventDefault();
    picDrawing = true;
    const pos = getPos(e);
    picLastX = pos.x;
    picLastY = pos.y;
  };
  const moveDraw = (e) => {
    if (!picIsDrawer || !picDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    const color = picEraserOn ? "#ffffff" : picColor;
    const thickness = parseInt(document.getElementById("pic-thickness").value);

    drawLine(picLastX, picLastY, pos.x, pos.y, color, thickness);

    const now = Date.now();
    if (now - picLastEmit > 50) {
      socket.emit("drawData", { roomId: currentRoom, x1: picLastX, y1: picLastY, x2: pos.x, y2: pos.y, color, thickness });
      picLastEmit = now;
    }

    picLastX = pos.x;
    picLastY = pos.y;
  };
  const endDraw = () => { picDrawing = false; };

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", moveDraw);
  canvas.addEventListener("mouseup", endDraw);
  canvas.addEventListener("mouseleave", endDraw);
  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove", moveDraw, { passive: false });
  canvas.addEventListener("touchend", endDraw);
}

function drawLine(x1, y1, x2, y2, color, thickness) {
  picCtx.strokeStyle = color;
  picCtx.lineWidth = thickness;
  picCtx.beginPath();
  picCtx.moveTo(x1, y1);
  picCtx.lineTo(x2, y2);
  picCtx.stroke();
}

function toggleEraser() {
  picEraserOn = !picEraserOn;
  document.getElementById("pic-eraser-btn").classList.toggle("active", picEraserOn);
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
  document.getElementById("score-note-text").innerText = "İlk bilene en çok puan! 🏆";
  document.getElementById("pic-round-display").innerText = `Tur: 1 / ${window._totalRounds}`;

  initPictionaryCanvas();

  Swal.fire({ title: "Resim Çiz Başlıyor!", timer: 1500, showConfirmButton: false });

  document.getElementById("pic-guess-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendPictionaryGuess();
  });
});

socket.on("pictionaryRound", (data) => {
  // data: { round, totalRounds, word (only for drawer), drawerId, guesserId, drawerName, guesserName }
  document.getElementById("pic-round-display").innerText = `Tur: ${data.round} / ${data.totalRounds}`;
  document.getElementById("pic-game-log").innerHTML = "";

  // Clear canvas
  const canvas = document.getElementById("pic-canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const amDrawer = myPlayerId === data.drawerId;
  const amGuesser = myPlayerId === data.guesserId;
  picIsDrawer = amDrawer;
  amIPlaying = amDrawer || amGuesser;

  const infoBar = document.getElementById("pic-turn-info");
  const wordDisplay = document.getElementById("pic-word-display");
  const toolbar = document.getElementById("pic-toolbar");
  const guessArea = document.getElementById("pic-guess-area");

  if (amDrawer) {
    infoBar.innerText = `ÇİZ! ${data.drawerName} (sen) çiziyorsun`;
    infoBar.style.backgroundColor = "#e67e22";
    wordDisplay.classList.remove("hidden");
    wordDisplay.innerText = `Kelime: ${data.word}`;
    toolbar.classList.remove("hidden");
    guessArea.classList.add("hidden");
    canvas.style.cursor = "crosshair";
  } else if (amGuesser) {
    infoBar.innerText = `TAHMİN ET! ${data.drawerName} çiziyor`;
    infoBar.style.backgroundColor = "#27ae60";
    wordDisplay.classList.add("hidden");
    toolbar.classList.add("hidden");
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
    toolbar.classList.add("hidden");
    guessArea.classList.add("hidden");
    canvas.style.cursor = "default";
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
  drawLine(data.x1, data.y1, data.x2, data.y2, data.color, data.thickness);
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
  div.innerHTML = `${data.guesserName}: "${data.guess}" ❌`;
  document.getElementById("pic-game-log").prepend(div);
});

socket.on("pictionaryCorrect", (data) => {
  // data: { teamName, points, order, word }
  clearInterval(timerInterval);
  const div = document.createElement("div");
  div.className = "log-item log-success";
  div.innerHTML = `${data.teamName} bildi! +${data.points} puan (${data.order}. sıra)`;
  document.getElementById("pic-game-log").prepend(div);

  if (amIPlaying) {
    const guessArea = document.getElementById("pic-guess-area");
    guessArea.classList.add("hidden");
    Swal.fire({ title: "Doğru!", text: `+${data.points} puan`, icon: "success", timer: 1500, showConfirmButton: false });
  }
});

socket.on("pictionaryRoundEnd", (data) => {
  // data: { word, scores }
  clearInterval(timerInterval);
  const wordDisplay = document.getElementById("pic-word-display");
  wordDisplay.classList.remove("hidden");
  wordDisplay.innerText = `Cevap: ${data.word}`;
  document.getElementById("pic-toolbar").classList.add("hidden");
  document.getElementById("pic-guess-area").classList.add("hidden");
  picIsDrawer = false;
});

socket.on("pictionaryGameOver", (msg) => {
  Swal.fire({ title: "BİTTİ", text: msg });
});

// --- EKRANLAR ---
const screens = {
  lobby: document.getElementById("lobby-screen"),
  waiting: document.getElementById("waiting-screen"),
  game: document.getElementById("game-screen"),
  gameSelect: document.getElementById("game-select-screen"),
  isimSehir: document.getElementById("isimSehir-screen"),
  pictionary: document.getElementById("pictionary-screen"),
};
function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
}
