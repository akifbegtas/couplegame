const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const rooms = {};
const TURKISH_LETTERS = ["A","B","C","Ç","D","E","F","G","H","I","İ","J","K","L","M","N","O","Ö","P","R","S","Ş","T","U","Ü","V","Y","Z"];
const CATEGORIES = ["İSİM", "ŞEHİR", "HAYVAN"];

const EXAMPLES = {
  "A": { "İSİM": "Ayşe", "ŞEHİR": "Ankara", "HAYVAN": "Aslan" },
  "B": { "İSİM": "Burak", "ŞEHİR": "Bursa", "HAYVAN": "Balina" },
  "C": { "İSİM": "Cem", "ŞEHİR": "Canberra", "HAYVAN": "Ceylan" },
  "Ç": { "İSİM": "Çiğdem", "ŞEHİR": "Çanakkale", "HAYVAN": "Çakal" },
  "D": { "İSİM": "Deniz", "ŞEHİR": "Denizli", "HAYVAN": "Deve" },
  "E": { "İSİM": "Elif", "ŞEHİR": "Edirne", "HAYVAN": "Eşek" },
  "F": { "İSİM": "Fatma", "ŞEHİR": "Frankfurt", "HAYVAN": "Flamingo" },
  "G": { "İSİM": "Gül", "ŞEHİR": "Gaziantep", "HAYVAN": "Gorilla" },
  "H": { "İSİM": "Hakan", "ŞEHİR": "Hatay", "HAYVAN": "Hamster" },
  "I": { "İSİM": "Işıl", "ŞEHİR": "Isparta", "HAYVAN": "Iguana" },
  "İ": { "İSİM": "İrem", "ŞEHİR": "İstanbul", "HAYVAN": "İnek" },
  "J": { "İSİM": "Jale", "ŞEHİR": "Johannesburg", "HAYVAN": "Jaguar" },
  "K": { "İSİM": "Kemal", "ŞEHİR": "Konya", "HAYVAN": "Kanguru" },
  "L": { "İSİM": "Leyla", "ŞEHİR": "Londra", "HAYVAN": "Lama" },
  "M": { "İSİM": "Murat", "ŞEHİR": "Mersin", "HAYVAN": "Maymun" },
  "N": { "İSİM": "Naz", "ŞEHİR": "Nevşehir", "HAYVAN": "Narval" },
  "O": { "İSİM": "Okan", "ŞEHİR": "Ordu", "HAYVAN": "Ördek" },
  "Ö": { "İSİM": "Özge", "ŞEHİR": "Ödenburg", "HAYVAN": "Ökse" },
  "P": { "İSİM": "Pınar", "ŞEHİR": "Paris", "HAYVAN": "Penguen" },
  "R": { "İSİM": "Rüya", "ŞEHİR": "Rize", "HAYVAN": "Rakun" },
  "S": { "İSİM": "Selin", "ŞEHİR": "Samsun", "HAYVAN": "Sincap" },
  "Ş": { "İSİM": "Şeyma", "ŞEHİR": "Şanlıurfa", "HAYVAN": "Şahin" },
  "T": { "İSİM": "Tolga", "ŞEHİR": "Trabzon", "HAYVAN": "Tavşan" },
  "U": { "İSİM": "Umut", "ŞEHİR": "Uşak", "HAYVAN": "Unicorn" },
  "Ü": { "İSİM": "Ümit", "ŞEHİR": "Üsküp", "HAYVAN": "Ülker" },
  "V": { "İSİM": "Volkan", "ŞEHİR": "Van", "HAYVAN": "Vaşak" },
  "Y": { "İSİM": "Yasemin", "ŞEHİR": "Yozgat", "HAYVAN": "Yunus" },
  "Z": { "İSİM": "Zeynep", "ŞEHİR": "Zonguldak", "HAYVAN": "Zebra" },
};

const PICTIONARY_WORDS = [
  "ARABA", "EV", "AĞAÇ", "GÜNEŞ", "YILDIZ", "AY", "BULUT", "YAĞMUR", "KAR", "DENİZ",
  "BALIK", "KEDİ", "KÖPEK", "KUŞ", "KELEBEK", "ÇİÇEK", "GÜL", "KALP", "YÜZÜK", "PASTA",
  "DONDURMA", "PİZZA", "HAMBURGER", "ELMA", "MUZ", "ÇİLEK", "KARPUZ", "PORTAKAL", "ÜZÜM", "ARMUT",
  "FUTBOL", "BASKETBOL", "BİSİKLET", "UÇAK", "GEMİ", "TREN", "ROKET", "HELİKOPTER", "OTOBÜS", "MOTOSİKLET",
  "TELEFON", "BİLGİSAYAR", "TELEVİZYON", "KAMERA", "SAAT", "GÖZLÜK", "ŞEMSIYE", "ÇANTA", "AYAKKABI", "ŞAPKA",
  "KİTAP", "KALEM", "MASA", "SANDALYE", "YATAK", "LAMBA", "ANAHTAR", "MAKAS", "BARDAK", "TABAK",
  "GÖKKUŞAĞI", "YANARDAĞ", "PALMIYE", "KÖPRÜ", "KALE", "PİRAMİT", "BAYRAK", "MERDIVEN", "ÇİT", "KUYU",
  "ASLAN", "FİL", "ZÜRAFA", "PENGUEN", "YUNUS", "KAPLUMBAĞA", "YILAN", "TAVŞAN", "MAYMUN", "KARTAL"
];

io.on("connection", (socket) => {
  // --- ODA OLUŞTURMA ---
  socket.on("createRoom", (data) => {
    const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();

    let count = parseInt(data.coupleCount);
    if (!count || count < 2) count = 2;

    let rounds = parseInt(data.roundCount);
    if (!rounds || rounds < 1) rounds = 5;

    let time = parseInt(data.roundTime);
    if (!time || time < 5) time = 10;

    const gameType = data.gameType || "telepati";
    const gameMode = data.gameMode || "cift";

    const hostPlayer = {
      id: socket.id,
      username: data.username,
      gender: data.gender,
      isHost: true,
    };

    let teams = [];
    let players = [];
    let maxPlayers = 0;

    if (gameMode === "tek") {
      maxPlayers = parseInt(data.playerCount) || 4;
      players.push(hostPlayer);
    } else {
      for (let i = 0; i < count; i++) {
        teams.push({ id: i, name: `Takım ${i + 1}`, p1: null, p2: null });
      }
      teams[0].p1 = hostPlayer;
    }

    rooms[roomId] = {
      id: roomId,
      gameMode: gameMode,
      teams: teams,
      players: players,
      maxPlayers: maxPlayers,
      spectators: [],
      gameStatus: "waiting",
      gameType: gameType,
      currentPairIndex: 0,
      roundCount: rounds,
      roundTime: time,
      currentRound: 1,
      pairs: [],
      moves: {},
      soloPlayers: [],
      currentDrawerIndex: 0,
      // Pictionary specific
      pictionaryScores: {},
      pictionaryUsedWords: [],
      pictionaryDrawerToggle: 0,
      pictionaryGuessOrder: [],
      pictionaryTimer: null,
      // İsim Şehir specific
      currentLetter: null,
      currentCategory: null,
      categoryIndex: 0,
      isimSehirScores: {},
      usedLetters: [],
    };

    console.log(
      `Oda Kuruldu: ${roomId} | Mod: ${gameMode} | Oyun: ${gameType} | Tur: ${rounds} | Süre: ${time}`,
    );

    socket.join(roomId);
    socket.emit("roomCreated", roomId);
    emitLobbyUpdate(roomId);
  });

  // --- ODAYA KATILMA ---
  socket.on("joinRoom", ({ roomId, username, gender }) => {
    const room = rooms[roomId];
    if (room && room.gameStatus === "waiting") {
      const newPlayer = { id: socket.id, username, gender, isHost: false };
      if (room.gameMode === "tek") {
        if (room.players.length < room.maxPlayers) {
          room.players.push(newPlayer);
        } else {
          room.spectators.push(newPlayer);
        }
      } else {
        room.spectators.push(newPlayer);
      }
      socket.join(roomId);
      socket.emit("joinedRoom", roomId);
      emitLobbyUpdate(roomId);
    } else {
      socket.emit("error", "Oda bulunamadı!");
    }
  });

  // --- TAKIM SEÇME ---
  socket.on("selectTeam", ({ roomId, teamIndex, slot }) => {
    const room = rooms[roomId];
    if (!room) return;
    const playerIndex = room.spectators.findIndex((p) => p.id === socket.id);
    if (playerIndex !== -1) {
      const player = room.spectators[playerIndex];
      const targetTeam = room.teams[teamIndex];
      if (slot === "p1" && targetTeam.p1 === null) {
        targetTeam.p1 = player;
        room.spectators.splice(playerIndex, 1);
      } else if (slot === "p2" && targetTeam.p2 === null) {
        targetTeam.p2 = player;
        room.spectators.splice(playerIndex, 1);
      }
      emitLobbyUpdate(roomId);
    }
  });

  // --- OYUN BAŞLATMA ---
  socket.on("startGame", (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    // TEK MOD
    if (room.gameMode === "tek") {
      if (room.gameType !== "pictionary") {
        socket.emit("error", "Tek modda sadece Resim Çiz oynanabilir!");
        return;
      }
      if (room.players.length < 2) {
        socket.emit("error", "En az 2 oyuncu gerekli!");
        return;
      }
      room.gameStatus = "playing";
      room.soloPlayers = [...room.players];
      room.currentRound = 1;
      room.currentDrawerIndex = 0;
      room.pictionaryScores = {};
      room.soloPlayers.forEach(p => {
        room.pictionaryScores[p.id] = 0;
      });

      io.to(roomId).emit("pictionaryStart", {
        roundCount: room.roundCount,
        gameMode: "tek",
      });

      updatePictionaryLeaderboard(roomId);
      setTimeout(() => startPictionaryRound(roomId), 2000);
      return;
    }

    // ÇİFT MOD
    const validPairs = [];
    room.teams.forEach((t) => {
      if (t.p1 && t.p2) {
        validPairs.push({
          id: `pair_${t.id}`,
          teamName: t.name,
          p1: t.p1,
          p2: t.p2,
          currentTurnAttempts: 0,
          totalAttempts: 0,
          isEliminated: false,
        });
      }
    });

    if (validPairs.length < 1) {
      socket.emit("error", "Yeterli takım yok!");
      return;
    }

    room.gameStatus = "playing";
    room.pairs = validPairs;
    room.currentPairIndex = 0;
    room.currentRound = 1;

    if (room.gameType === "pictionary") {
      validPairs.forEach(p => {
        room.pictionaryScores[p.id] = 0;
      });

      io.to(roomId).emit("pictionaryStart", {
        roundCount: room.roundCount,
      });

      updatePictionaryLeaderboard(roomId);

      setTimeout(() => {
        startPictionaryRound(roomId);
      }, 2000);
    } else if (room.gameType === "isimSehir") {
      // Initialize scores
      validPairs.forEach(p => {
        room.isimSehirScores[p.id] = 0;
      });

      io.to(roomId).emit("isimSehirStart", {
        roundCount: room.roundCount,
        roundTime: room.roundTime,
        firstPair: validPairs[0],
      });

      updateIsimSehirLeaderboard(roomId);

      setTimeout(() => {
        startIsimSehirRound(roomId);
      }, 2000);
    } else {
      // Telepati
      io.to(roomId).emit("gameInit", {
        roundCount: room.roundCount,
        roundTime: room.roundTime,
      });

      updateLeaderboard(roomId);

      setTimeout(() => {
        startTurn(roomId);
      }, 2000);
    }
  });

  // --- TELEPATİ: KELİME GÖNDERME ---
  socket.on("submitWord", ({ roomId, word }) => {
    const room = rooms[roomId];
    if (!room || room.gameStatus !== "playing") return;

    const currentPair = room.pairs[room.currentPairIndex];
    if (!currentPair) return;

    if (socket.id !== currentPair.p1.id && socket.id !== currentPair.p2.id)
      return;
    if (!room.moves[currentPair.id]) room.moves[currentPair.id] = {};

    let cleanWord = word ? word.trim().toUpperCase() : "⏰";
    if (cleanWord === "") cleanWord = "⏰";

    room.moves[currentPair.id][socket.id] = cleanWord;

    const partnerId =
      socket.id === currentPair.p1.id ? currentPair.p2.id : currentPair.p1.id;
    io.to(partnerId).emit("partnerSubmitted");

    const who = socket.id === currentPair.p1.id ? "p1" : "p2";
    io.to(roomId).emit("revealOneMove", { slot: who, word: cleanWord });

    const w1 = room.moves[currentPair.id][currentPair.p1.id];
    const w2 = room.moves[currentPair.id][currentPair.p2.id];

    if (w1 !== undefined && w2 !== undefined) {
      currentPair.currentTurnAttempts++;
      const isMatch = w1 === w2 && w1 !== "⏰";

      if (!isMatch) currentPair.totalAttempts++;

      updateLeaderboard(roomId);

      const result = {
        pairId: currentPair.id,
        p1Word: w1,
        p2Word: w2,
        attempts: currentPair.currentTurnAttempts,
        match: isMatch,
      };

      if (currentPair.totalAttempts >= 20 && !currentPair.isEliminated) {
        currentPair.isEliminated = true;
        io.to(roomId).emit("spectatorUpdate", result);
        io.to(roomId).emit("gameOver", `${currentPair.teamName} ELENDİ! 💀`);
        setTimeout(() => nextTurn(roomId), 2000);
        return;
      }

      setTimeout(() => {
        io.to(roomId).emit("spectatorUpdate", result);
        room.moves[currentPair.id] = {};

        if (isMatch) {
          io.to(currentPair.p1.id)
            .to(currentPair.p2.id)
            .emit("levelFinished", { success: true });
          nextTurn(roomId);
        }
      }, 500);
    }
  });

  // --- İSİM ŞEHİR: KELİME GÖNDERME ---
  socket.on("submitIsimSehirWord", ({ roomId, word }) => {
    const room = rooms[roomId];
    if (!room || room.gameStatus !== "playing") return;

    const currentPair = room.pairs[room.currentPairIndex];
    if (!currentPair) return;

    if (socket.id !== currentPair.p1.id && socket.id !== currentPair.p2.id)
      return;

    const moveKey = currentPair.id + "_" + room.currentCategory;
    if (!room.moves[moveKey]) room.moves[moveKey] = {};

    let cleanWord = word ? word.trim().toUpperCase() : "⏰";
    if (cleanWord === "") cleanWord = "⏰";

    room.moves[moveKey][socket.id] = cleanWord;

    const partnerId =
      socket.id === currentPair.p1.id ? currentPair.p2.id : currentPair.p1.id;
    io.to(partnerId).emit("partnerSubmitted");

    const who = socket.id === currentPair.p1.id ? "p1" : "p2";
    io.to(roomId).emit("revealOneMove", { slot: who, word: cleanWord });

    const w1 = room.moves[moveKey][currentPair.p1.id];
    const w2 = room.moves[moveKey][currentPair.p2.id];

    if (w1 !== undefined && w2 !== undefined) {
      const isMatch = w1 === w2 && w1 !== "⏰";

      if (isMatch) {
        room.isimSehirScores[currentPair.id]++;
      }

      updateIsimSehirLeaderboard(roomId);

      const bothFailed = w1 === "⏰" && w2 === "⏰";
      const example = bothFailed && EXAMPLES[room.currentLetter]
        ? EXAMPLES[room.currentLetter][room.currentCategory]
        : null;

      const result = {
        pairId: currentPair.id,
        p1Word: w1,
        p2Word: w2,
        match: isMatch,
        category: room.currentCategory,
        example: example,
      };

      setTimeout(() => {
        io.to(roomId).emit("isimSehirResult", result);

        if (isMatch) {
          io.to(currentPair.p1.id)
            .to(currentPair.p2.id)
            .emit("levelFinished", { success: true });
        }

        // Move to next: category or pair or round
        setTimeout(() => {
          nextIsimSehirStep(roomId);
        }, 1500);
      }, 500);
    }
  });

  // --- PICTIONARY: DRAW DATA ---
  socket.on("drawData", (data) => {
    const room = rooms[data.roomId];
    if (!room || room.gameType !== "pictionary") return;
    // Relay to everyone else in room
    socket.to(data.roomId).emit("drawData", data);
  });

  // --- PICTIONARY: GUESS ---
  socket.on("pictionaryGuess", ({ roomId, guess }) => {
    const room = rooms[roomId];
    if (!room || room.gameStatus !== "playing" || room.gameType !== "pictionary") return;

    const cleanGuess = guess.trim().toUpperCase();
    const word = room._currentPictionaryWord;
    if (!word) return;

    if (room.gameMode === "tek") {
      // TEK MOD: bireysel tahmin
      const player = room.soloPlayers.find(p => p.id === socket.id);
      if (!player) return;

      const drawerIndex = room.currentDrawerIndex % room.soloPlayers.length;
      const drawer = room.soloPlayers[drawerIndex];
      if (socket.id === drawer.id) return;

      if (room.pictionaryGuessOrder.includes(socket.id)) return;

      if (cleanGuess === word) {
        room.pictionaryGuessOrder.push(socket.id);
        const order = room.pictionaryGuessOrder.length;
        const guesserCount = room.soloPlayers.length - 1;
        const points = guesserCount - order + 1;

        room.pictionaryScores[socket.id] = (room.pictionaryScores[socket.id] || 0) + points;
        room.pictionaryScores[drawer.id] = (room.pictionaryScores[drawer.id] || 0) + 1;
        updatePictionaryLeaderboard(roomId);

        io.to(roomId).emit("pictionaryCorrect", {
          teamName: player.username,
          guesserId: socket.id,
          points: points,
          order: order,
          word: word,
          gameMode: "tek",
        });

        if (room.pictionaryGuessOrder.length >= room.soloPlayers.length - 1) {
          endPictionaryRound(roomId);
        }
      } else {
        io.to(roomId).emit("pictionaryWrongGuess", { guess: cleanGuess, guesserName: player.username });
      }
    } else {
      // ÇİFT MOD
      const pair = room.pairs.find(p => p.p1.id === socket.id || p.p2.id === socket.id);
      if (!pair) return;

      if (room.pictionaryGuessOrder.includes(pair.id)) return;

      const drawerIsP1 = room.pictionaryDrawerToggle % 2 === 0;
      const drawerId = drawerIsP1 ? pair.p1.id : pair.p2.id;
      if (socket.id === drawerId) return;

      if (cleanGuess === word) {
        room.pictionaryGuessOrder.push(pair.id);
        const order = room.pictionaryGuessOrder.length;
        const pairCount = room.pairs.length;
        const points = pairCount - order;

        room.pictionaryScores[pair.id] = (room.pictionaryScores[pair.id] || 0) + points;
        updatePictionaryLeaderboard(roomId);

        io.to(roomId).emit("pictionaryCorrect", {
          teamName: pair.teamName,
          points: points,
          order: order,
          word: word,
        });

        if (room.pictionaryGuessOrder.length >= room.pairs.length) {
          endPictionaryRound(roomId);
        }
      } else {
        const guesserName = socket.id === pair.p1.id ? pair.p1.username : pair.p2.username;
        io.to(roomId).emit("pictionaryWrongGuess", { guess: cleanGuess, guesserName });
      }
    }
  });

  socket.on("disconnect", () => {
    for (const roomId of Object.keys(rooms)) {
      const room = rooms[roomId];

      room.teams.forEach((t) => {
        if (t.p1 && t.p1.id === socket.id) t.p1 = null;
        if (t.p2 && t.p2.id === socket.id) t.p2 = null;
      });

      if (room.gameMode === "tek") {
        room.players = room.players.filter(p => p.id !== socket.id);
        if (room.soloPlayers) {
          room.soloPlayers = room.soloPlayers.filter(p => p.id !== socket.id);
        }
      }

      room.spectators = room.spectators.filter((p) => p.id !== socket.id);
      emitLobbyUpdate(roomId);
    }
  });
});

// ============ TELEPATİ FONKSİYONLARI ============

function nextTurn(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  room.currentPairIndex++;

  if (room.currentPairIndex >= room.pairs.length) {
    room.currentPairIndex = 0;
    room.currentRound++;

    if (room.currentRound > room.roundCount) {
      io.to(roomId).emit("gameOver", "Turnuva Bitti! Tebrikler! 🏆");
      room.gameStatus = "finished";
      return;
    }

    io.to(roomId).emit("roundChanged", room.currentRound);
  }

  const nextP = room.pairs[room.currentPairIndex];
  if (nextP.isEliminated) {
    if (room.pairs.every((p) => p.isEliminated)) {
      io.to(roomId).emit("gameOver", "Herkes Elendi! 💀");
      return;
    }
    nextTurn(roomId);
    return;
  }

  setTimeout(() => startTurn(roomId), 1500);
}

function startTurn(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  const p = room.pairs[room.currentPairIndex];

  p.currentTurnAttempts = 0;
  room.moves[p.id] = {};

  io.to(roomId).emit("turnStarted", {
    p1: p.p1,
    p2: p.p2,
    currentRound: room.currentRound,
    totalRounds: room.roundCount,
  });
}

function updateLeaderboard(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const sorted = [...room.pairs].sort(
    (a, b) => a.totalAttempts - b.totalAttempts,
  );

  const scores = sorted.map((p, i) => ({
    rank: i + 1,
    name: p.teamName,
    score: p.totalAttempts,
    eliminated: p.isEliminated,
  }));

  io.to(roomId).emit("updateScoreboard", scores);
}

// ============ İSİM ŞEHİR FONKSİYONLARI ============

function startIsimSehirRound(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  // Pick a random unused letter
  const available = TURKISH_LETTERS.filter(l => !room.usedLetters.includes(l));
  if (available.length === 0) {
    room.usedLetters = [];
    available.push(...TURKISH_LETTERS);
  }
  const letter = available[Math.floor(Math.random() * available.length)];
  room.usedLetters.push(letter);
  room.currentLetter = letter;
  room.categoryIndex = 0;
  room.currentPairIndex = 0;

  io.to(roomId).emit("letterSelected", {
    letter: letter,
    currentRound: room.currentRound,
    totalRounds: room.roundCount,
  });

  // Wait for animation then start first category for first pair
  setTimeout(() => {
    startCategory(roomId);
  }, 3500);
}

function startCategory(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const category = CATEGORIES[room.categoryIndex];
  room.currentCategory = category;
  const pair = room.pairs[room.currentPairIndex];

  const moveKey = pair.id + "_" + category;
  room.moves[moveKey] = {};

  io.to(roomId).emit("categoryStart", {
    category: category,
    letter: room.currentLetter,
    p1: pair.p1,
    p2: pair.p2,
    currentRound: room.currentRound,
    totalRounds: room.roundCount,
  });
}

function nextIsimSehirStep(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  // Next category
  room.categoryIndex++;

  if (room.categoryIndex < CATEGORIES.length) {
    // Same pair, next category
    startCategory(roomId);
    return;
  }

  // All categories done for this pair, next pair
  room.categoryIndex = 0;
  room.currentPairIndex++;

  if (room.currentPairIndex < room.pairs.length) {
    // New pair, start from first category
    startCategory(roomId);
    return;
  }

  // All pairs done, next round (new letter)
  room.currentPairIndex = 0;
  room.currentRound++;

  if (room.currentRound > room.roundCount) {
    // Game over
    const sorted = [...room.pairs].sort(
      (a, b) => room.isimSehirScores[b.id] - room.isimSehirScores[a.id],
    );
    const winner = sorted[0];
    const winScore = room.isimSehirScores[winner.id];
    io.to(roomId).emit("isimSehirGameOver",
      `${winner.teamName} kazandı! (${winScore} puan) 🏆`);
    room.gameStatus = "finished";
    return;
  }

  io.to(roomId).emit("roundChanged", room.currentRound);
  setTimeout(() => {
    startIsimSehirRound(roomId);
  }, 2000);
}

function updateIsimSehirLeaderboard(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const sorted = [...room.pairs].sort(
    (a, b) => (room.isimSehirScores[b.id] || 0) - (room.isimSehirScores[a.id] || 0),
  );

  const scores = sorted.map((p, i) => ({
    rank: i + 1,
    name: p.teamName,
    score: room.isimSehirScores[p.id] || 0,
    eliminated: false,
  }));

  io.to(roomId).emit("updateScoreboard", scores);
}

// ============ PICTIONARY FONKSİYONLARI ============

function startPictionaryRound(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  // Pick unused word
  let available = PICTIONARY_WORDS.filter(w => !room.pictionaryUsedWords.includes(w));
  if (available.length === 0) {
    room.pictionaryUsedWords = [];
    available = [...PICTIONARY_WORDS];
  }
  const word = available[Math.floor(Math.random() * available.length)];
  room.pictionaryUsedWords.push(word);
  room._currentPictionaryWord = word;
  room.pictionaryGuessOrder = [];

  if (room.gameMode === "tek") {
    // TEK MOD: bir kişi çizer, herkes tahmin eder
    const drawerIndex = room.currentDrawerIndex % room.soloPlayers.length;
    const drawer = room.soloPlayers[drawerIndex];

    const baseData = {
      round: room.currentRound,
      totalRounds: room.roundCount,
      drawerId: drawer.id,
      drawerName: drawer.username,
      gameMode: "tek",
    };

    io.to(drawer.id).emit("pictionaryRound", { ...baseData, word: word });

    room.soloPlayers.forEach(p => {
      if (p.id !== drawer.id) {
        io.to(p.id).emit("pictionaryRound", { ...baseData, guesserId: p.id, guesserName: p.username });
      }
    });

    room.spectators.forEach(s => {
      io.to(s.id).emit("pictionaryRound", { ...baseData });
    });
  } else {
    // ÇİFT MOD
    const drawerIsP1 = room.pictionaryDrawerToggle % 2 === 0;

    room.pairs.forEach(pair => {
      const drawer = drawerIsP1 ? pair.p1 : pair.p2;
      const guesser = drawerIsP1 ? pair.p2 : pair.p1;

      const baseData = {
        round: room.currentRound,
        totalRounds: room.roundCount,
        drawerId: drawer.id,
        guesserId: guesser.id,
        drawerName: drawer.username,
        guesserName: guesser.username,
      };

      io.to(drawer.id).emit("pictionaryRound", { ...baseData, word: word });
      io.to(guesser.id).emit("pictionaryRound", { ...baseData });
    });

    const firstPair = room.pairs[0];
    const drawer0 = drawerIsP1 ? firstPair.p1 : firstPair.p2;
    const guesser0 = drawerIsP1 ? firstPair.p2 : firstPair.p1;
    room.spectators.forEach(s => {
      io.to(s.id).emit("pictionaryRound", {
        round: room.currentRound,
        totalRounds: room.roundCount,
        drawerId: drawer0.id,
        guesserId: guesser0.id,
        drawerName: drawer0.username,
        guesserName: guesser0.username,
      });
    });
  }

  // 45s timer
  if (room.pictionaryTimer) clearTimeout(room.pictionaryTimer);
  room.pictionaryTimer = setTimeout(() => {
    endPictionaryRound(roomId);
  }, 45000);
}

function endPictionaryRound(roomId) {
  const room = rooms[roomId];
  if (!room || room.gameStatus !== "playing") return;

  if (room.pictionaryTimer) {
    clearTimeout(room.pictionaryTimer);
    room.pictionaryTimer = null;
  }

  io.to(roomId).emit("pictionaryRoundEnd", {
    word: room._currentPictionaryWord,
  });

  updatePictionaryLeaderboard(roomId);

  if (room.gameMode === "tek") {
    room.currentDrawerIndex++;
  } else {
    room.pictionaryDrawerToggle++;
  }
  room.currentRound++;

  if (room.currentRound > room.roundCount) {
    setTimeout(() => {
      if (room.gameMode === "tek") {
        const sorted = [...room.soloPlayers].sort(
          (a, b) => (room.pictionaryScores[b.id] || 0) - (room.pictionaryScores[a.id] || 0),
        );
        const winner = sorted[0];
        const winScore = room.pictionaryScores[winner.id] || 0;
        io.to(roomId).emit("pictionaryGameOver",
          `${winner.username} kazandı! (${winScore} puan) 🏆`);
      } else {
        const sorted = [...room.pairs].sort(
          (a, b) => (room.pictionaryScores[b.id] || 0) - (room.pictionaryScores[a.id] || 0),
        );
        const winner = sorted[0];
        const winScore = room.pictionaryScores[winner.id] || 0;
        io.to(roomId).emit("pictionaryGameOver",
          `${winner.teamName} kazandı! (${winScore} puan) 🏆`);
      }
      room.gameStatus = "finished";
    }, 2500);
    return;
  }

  io.to(roomId).emit("roundChanged", room.currentRound);
  setTimeout(() => {
    startPictionaryRound(roomId);
  }, 3000);
}

function updatePictionaryLeaderboard(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  if (room.gameMode === "tek") {
    const sorted = [...room.soloPlayers].sort(
      (a, b) => (room.pictionaryScores[b.id] || 0) - (room.pictionaryScores[a.id] || 0),
    );
    const scores = sorted.map((p, i) => ({
      rank: i + 1,
      name: p.username,
      score: room.pictionaryScores[p.id] || 0,
      eliminated: false,
    }));
    io.to(roomId).emit("updateScoreboard", scores);
  } else {
    const sorted = [...room.pairs].sort(
      (a, b) => (room.pictionaryScores[b.id] || 0) - (room.pictionaryScores[a.id] || 0),
    );
    const scores = sorted.map((p, i) => ({
      rank: i + 1,
      name: p.teamName,
      score: room.pictionaryScores[p.id] || 0,
      eliminated: false,
    }));
    io.to(roomId).emit("updateScoreboard", scores);
  }
}

function emitLobbyUpdate(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  let hostId = null;
  if (room.gameMode === "tek") {
    hostId = room.players.length > 0 ? room.players[0].id : null;
  } else {
    hostId = room.teams[0] && room.teams[0].p1 ? room.teams[0].p1.id : null;
  }
  io.to(roomId).emit("updateLobby", {
    gameMode: room.gameMode,
    teams: room.teams,
    players: room.players || [],
    maxPlayers: room.maxPlayers || 0,
    spectators: room.spectators,
    hostId: hostId,
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sunucu ${PORT} portunda!`));
