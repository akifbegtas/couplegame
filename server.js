const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const rooms = {};
const TURKISH_LETTERS = [
  "A",
  "B",
  "C",
  "Ç",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "İ",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "Ö",
  "P",
  "R",
  "S",
  "Ş",
  "T",
  "U",
  "Ü",
  "V",
  "Y",
  "Z",
];
const CATEGORIES = ["İSİM", "ŞEHİR", "HAYVAN"];

const EXAMPLES = {
  A: { İSİM: "Ayşe", ŞEHİR: "Ankara", HAYVAN: "Aslan" },
  B: { İSİM: "Burak", ŞEHİR: "Bursa", HAYVAN: "Balina" },
  C: { İSİM: "Cem", ŞEHİR: "Canberra", HAYVAN: "Ceylan" },
  Ç: { İSİM: "Çiğdem", ŞEHİR: "Çanakkale", HAYVAN: "Çakal" },
  D: { İSİM: "Deniz", ŞEHİR: "Denizli", HAYVAN: "Deve" },
  E: { İSİM: "Elif", ŞEHİR: "Edirne", HAYVAN: "Eşek" },
  F: { İSİM: "Fatma", ŞEHİR: "Frankfurt", HAYVAN: "Flamingo" },
  G: { İSİM: "Gül", ŞEHİR: "Gaziantep", HAYVAN: "Gorilla" },
  H: { İSİM: "Hakan", ŞEHİR: "Hatay", HAYVAN: "Hamster" },
  I: { İSİM: "Işıl", ŞEHİR: "Isparta", HAYVAN: "Iguana" },
  İ: { İSİM: "İrem", ŞEHİR: "İstanbul", HAYVAN: "İnek" },
  J: { İSİM: "Jale", ŞEHİR: "Johannesburg", HAYVAN: "Jaguar" },
  K: { İSİM: "Kemal", ŞEHİR: "Konya", HAYVAN: "Kanguru" },
  L: { İSİM: "Leyla", ŞEHİR: "Londra", HAYVAN: "Lama" },
  M: { İSİM: "Murat", ŞEHİR: "Mersin", HAYVAN: "Maymun" },
  N: { İSİM: "Naz", ŞEHİR: "Nevşehir", HAYVAN: "Narval" },
  O: { İSİM: "Okan", ŞEHİR: "Ordu", HAYVAN: "Okapi" },
  Ö: { İSİM: "Özge", ŞEHİR: "Ödenburg", HAYVAN: "Ökse" },
  P: { İSİM: "Pınar", ŞEHİR: "Paris", HAYVAN: "Penguen" },
  R: { İSİM: "Rüya", ŞEHİR: "Rize", HAYVAN: "Rakun" },
  S: { İSİM: "Selin", ŞEHİR: "Samsun", HAYVAN: "Sincap" },
  Ş: { İSİM: "Şeyma", ŞEHİR: "Şanlıurfa", HAYVAN: "Şahin" },
  T: { İSİM: "Tolga", ŞEHİR: "Trabzon", HAYVAN: "Tavşan" },
  U: { İSİM: "Umut", ŞEHİR: "Uşak", HAYVAN: "Unicorn" },
  Ü: { İSİM: "Ümit", ŞEHİR: "Üsküp", HAYVAN: "Üveyik" },
  V: { İSİM: "Volkan", ŞEHİR: "Van", HAYVAN: "Vaşak" },
  Y: { İSİM: "Yasemin", ŞEHİR: "Yozgat", HAYVAN: "Yunus" },
  Z: { İSİM: "Zeynep", ŞEHİR: "Zonguldak", HAYVAN: "Zebra" },
};

const TABU_WORDS = [
  {
    word: "ARABA",
    forbidden: ["MOTOR", "TEKERLEK", "SÜRMEK", "ARAÇ", "TRAFİK"],
  },
  {
    word: "GÜNEŞ",
    forbidden: ["IŞIK", "SICAK", "GÖKYÜZÜ", "YILDIZ", "GÜNDÜZ"],
  },
  {
    word: "TELEFON",
    forbidden: ["ARAMAK", "KONUŞMAK", "CEP", "MESAJ", "EKRAN"],
  },
  {
    word: "OKUL",
    forbidden: ["ÖĞRETMEN", "ÖĞRENCİ", "DERS", "SINIF", "EĞİTİM"],
  },
  {
    word: "HASTANE",
    forbidden: ["DOKTOR", "HASTA", "İLAÇ", "AMELİYAT", "HEMŞİRE"],
  },
  { word: "FUTBOL", forbidden: ["TOP", "GOL", "SAHA", "MAÇ", "OYUNCU"] },
  { word: "DENİZ", forbidden: ["SU", "DALGA", "KUMSAL", "YÜZMEK", "OKYANUS"] },
  {
    word: "UÇAK",
    forbidden: ["UÇMAK", "PİLOT", "GÖKYÜZÜ", "HAVALİMANI", "KANAT"],
  },
  {
    word: "KİTAP",
    forbidden: ["OKUMAK", "SAYFA", "YAZAR", "KÜTÜPHANE", "ROMAN"],
  },
  {
    word: "MÜZİK",
    forbidden: ["ŞARKI", "ENSTRÜMAN", "DİNLEMEK", "NOTA", "MELODI"],
  },
  {
    word: "SİNEMA",
    forbidden: ["FİLM", "İZLEMEK", "EKRAN", "OYUNCU", "BİLET"],
  },
  {
    word: "BİLGİSAYAR",
    forbidden: ["EKRAN", "KLAVYE", "MOUSE", "İNTERNET", "PROGRAM"],
  },
  {
    word: "PIZZA",
    forbidden: ["HAMUR", "PEYNİR", "İTALYAN", "DİLİM", "FIRINDA"],
  },
  {
    word: "DOKTOR",
    forbidden: ["HASTA", "HASTANE", "İLAÇ", "MUAYENE", "SAĞLIK"],
  },
  {
    word: "ÖĞRETMEN",
    forbidden: ["OKUL", "DERS", "ÖĞRENCİ", "SINIF", "EĞİTİM"],
  },
  { word: "POLİS", forbidden: ["SUÇ", "KANUN", "KARAKOL", "EMNİYET", "SİREN"] },
  {
    word: "KÖPEK",
    forbidden: ["HAVLAMAK", "KUYRUK", "MAMA", "PATI", "HAYVAN"],
  },
  {
    word: "KEDİ",
    forbidden: ["MİYAVLAMAK", "PATI", "KUYRUK", "TÜYLÜ", "HAYVAN"],
  },
  { word: "BEBEK", forbidden: ["ÇOCUK", "AĞLAMAK", "KÜÇÜK", "ANNE", "DOĞMAK"] },
  { word: "DÜĞÜN", forbidden: ["EVLİLİK", "GELİN", "DAMAT", "NİKAH", "DANS"] },
  {
    word: "BAYRAM",
    forbidden: ["TATİL", "ŞEKER", "KURBAN", "KUTLAMA", "ZİYARET"],
  },
  { word: "TATİL", forbidden: ["DİNLENMEK", "SEYAHAT", "OTEL", "YAZ", "GEZİ"] },
  {
    word: "YAĞMUR",
    forbidden: ["SU", "BULUT", "ISLANMAK", "ŞEMSİYE", "DAMLA"],
  },
  {
    word: "KAR",
    forbidden: ["BEYAZ", "SOĞUK", "KIŞ", "KARDAN ADAM", "ERİMEK"],
  },
  { word: "RÜYA", forbidden: ["UYKU", "GÖRMEK", "GECE", "HAYAL", "UYUMAK"] },
  {
    word: "AŞK",
    forbidden: ["SEVGİ", "KALP", "SEVGİLİ", "ROMANTIK", "SEVMEK"],
  },
  {
    word: "ARKADAŞ",
    forbidden: ["DOST", "BERABER", "OKUL", "YAKINI", "TANINMAK"],
  },
  { word: "ANNE", forbidden: ["BABA", "ÇOCUK", "KADIN", "AİLE", "DOĞUM"] },
  { word: "BABA", forbidden: ["ANNE", "ÇOCUK", "ERKEK", "AİLE", "EVLAT"] },
  { word: "ÇOCUK", forbidden: ["KÜÇÜK", "BEBEK", "ANNE", "BABA", "OYNAMAK"] },
  { word: "UYKU", forbidden: ["YATAK", "GECE", "UYUMAK", "RÜYA", "YORGUN"] },
  {
    word: "KAHVALTI",
    forbidden: ["SABAH", "YEMEK", "ÇAY", "YUMURTA", "EKMEK"],
  },
  {
    word: "AKŞAM YEMEĞİ",
    forbidden: ["GECE", "SOFRA", "YİYECEK", "AİLE", "MUTFAK"],
  },
  { word: "ÇAY", forbidden: ["İÇMEK", "SICAK", "BARDAK", "DEMLİK", "ŞEKERLİ"] },
  { word: "KAHVE", forbidden: ["İÇMEK", "FİNCAN", "SICAK", "KAFEİN", "TÜRK"] },
  { word: "DONDURMA", forbidden: ["SOĞUK", "TATLI", "YEMEK", "KÜLAH", "YAZ"] },
  {
    word: "ÇİKOLATA",
    forbidden: ["TATLI", "KAKAO", "KAHVE", "BROWN", "YİYECEK"],
  },
  {
    word: "MARKET",
    forbidden: ["ALIŞVERİŞ", "MAĞAZA", "ÜRÜN", "KASA", "REYONLAR"],
  },
  { word: "PARK", forbidden: ["AĞAÇ", "BANK", "YEŞİL", "YÜRÜMEK", "BAHÇE"] },
  {
    word: "ASKER",
    forbidden: ["ORDU", "SİLAH", "ASKERİYE", "VATAN", "ÜNİFORMA"],
  },
  { word: "BAYRAK", forbidden: ["KIRMIZI", "BEYAZ", "AY", "YILDIZ", "VATAN"] },
  {
    word: "İSTANBUL",
    forbidden: ["ŞEHİR", "BOĞAZ", "KÖPRÜ", "BÜYÜK", "TÜRKİYE"],
  },
  {
    word: "ANKARA",
    forbidden: ["BAŞKENT", "ŞEHİR", "KIZILKULE", "ANITKADIR", "TÜRKİYE"],
  },
  {
    word: "TRABZON",
    forbidden: ["KARADENİZ", "ŞEHİR", "HAMSI", "YEŞİL", "UZUNGÖL"],
  },
  {
    word: "GALATASARAY",
    forbidden: ["FUTBOL", "SARI", "KIRMIZI", "TAKIM", "CİMBOM"],
  },
  {
    word: "FENERBAHÇE",
    forbidden: ["FUTBOL", "SARI", "LACİVERT", "TAKIM", "KANARYA"],
  },
  {
    word: "BEŞİKTAŞ",
    forbidden: ["FUTBOL", "SİYAH", "BEYAZ", "TAKIM", "KARTAL"],
  },
  { word: "RAMAZAN", forbidden: ["ORUÇ", "İFTAR", "SAHUR", "DUA", "DİN"] },
  { word: "NOEL", forbidden: ["BABA", "AĞAÇ", "HEDİYE", "KIRMIZI", "ARALIK"] },
  {
    word: "KAMERA",
    forbidden: ["FOTOĞRAF", "ÇEKİM", "VİDEO", "LENS", "KAYIT"],
  },
];

const PICTIONARY_WORDS = [
  "ARABA",
  "EV",
  "AĞAÇ",
  "GÜNEŞ",
  "YILDIZ",
  "AY",
  "BULUT",
  "YAĞMUR",
  "KAR",
  "DENİZ",
  "BALIK",
  "KEDİ",
  "KÖPEK",
  "KUŞ",
  "KELEBEK",
  "ÇİÇEK",
  "GÜL",
  "KALP",
  "YÜZÜK",
  "PASTA",
  "DONDURMA",
  "PİZZA",
  "HAMBURGER",
  "ELMA",
  "MUZ",
  "ÇİLEK",
  "KARPUZ",
  "PORTAKAL",
  "ÜZÜM",
  "ARMUT",
  "FUTBOL",
  "BASKETBOL",
  "BİSİKLET",
  "UÇAK",
  "GEMİ",
  "TREN",
  "ROKET",
  "HELİKOPTER",
  "OTOBÜS",
  "MOTOSİKLET",
  "TELEFON",
  "BİLGİSAYAR",
  "TELEVİZYON",
  "KAMERA",
  "SAAT",
  "GÖZLÜK",
  "ŞEMSIYE",
  "ÇANTA",
  "AYAKKABI",
  "ŞAPKA",
  "KİTAP",
  "KALEM",
  "MASA",
  "SANDALYE",
  "YATAK",
  "LAMBA",
  "ANAHTAR",
  "MAKAS",
  "BARDAK",
  "TABAK",
  "GÖKKUŞAĞI",
  "YANARDAĞ",
  "PALMIYE",
  "KÖPRÜ",
  "KALE",
  "PİRAMİT",
  "BAYRAK",
  "MERDIVEN",
  "ÇİT",
  "KUYU",
  "ASLAN",
  "FİL",
  "ZÜRAFA",
  "PENGUEN",
  "YUNUS",
  "KAPLUMBAĞA",
  "YILAN",
  "TAVŞAN",
  "MAYMUN",
  "KARTAL",
];

const IMPOSTER_WORDS = [
  { word: "PIZZA", hint: "Yiyecek" },
  { word: "KÖPEK", hint: "Hayvan" },
  { word: "KEDİ", hint: "Hayvan" },
  { word: "İSTANBUL", hint: "Şehir" },
  { word: "FUTBOL", hint: "Spor" },
  { word: "ARABA", hint: "Araç" },
  { word: "GÜNEŞ", hint: "Gökyüzü" },
  { word: "OKUL", hint: "Bina" },
  { word: "DENİZ", hint: "Doğa" },
  { word: "SİNEMA", hint: "Eğlence" },
  { word: "KAHVALTI", hint: "Öğün" },
  { word: "HASTANE", hint: "Bina" },
  { word: "UÇAK", hint: "Ulaşım" },
  { word: "KİTAP", hint: "Nesne" },
  { word: "MÜZİK", hint: "Sanat" },
  { word: "BAYRAM", hint: "Kutlama" },
  { word: "YAĞMUR", hint: "Hava Durumu" },
  { word: "AŞK", hint: "Duygu" },
  { word: "DONDURMA", hint: "Yiyecek" },
  { word: "PLAJ", hint: "Mekan" },
  { word: "DOKTOR", hint: "Meslek" },
  { word: "GALATASARAY", hint: "Spor Kulübü" },
  { word: "RAMAZAN", hint: "Kültür" },
  { word: "DÜĞÜN", hint: "Tören" },
  { word: "BEBEK", hint: "İnsan" },
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
      players.push(hostPlayer);
      maxPlayers = parseInt(data.maxPlayers) || 10;
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
      // Tabu specific
      tabuScores: {},
      tabuUsedWords: [],
      tabuTimer: null,
      tabuCurrentWord: null,
      tabuDescriberId: null,
      tabuGuesserId: null,
      tabuClues: [],
      tabuDescriberToggle: 0,
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
        if (room.maxPlayers > 0 && room.players.length >= room.maxPlayers) {
          socket.emit("error", "Oda dolu!");
          return;
        }
        room.players.push(newPlayer);
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

    // --- IMPOSTOR OYUNU ---
    if (room.gameType === "imposter") {
      if (room.gameMode !== "tek") {
        socket.emit("error", "Imposter sadece tek modda oynanabilir!");
        return;
      }
      if (!room.players || room.players.length < 3) {
        socket.emit("error", "Imposter için en az 3 oyuncu gerekli!");
        return;
      }
      room.gameStatus = "playing";
      room.currentRound = 1;
      room.roundCount = room.roundCount || 5;
      room.roundTime = room.roundTime || 60;
      room.imposterUsedWords = [];
      room.imposterSubmissions1 = {};
      room.imposterSubmissions2 = {};
      room.imposterVotes = {};
      room.imposterPhase = null;

      io.to(roomId).emit("imposterStart", {
        roundCount: room.roundCount,
        roundTime: room.roundTime,
      });

      setTimeout(() => startImposterRound(roomId), 2000);
      return;
    }

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
      room.soloPlayers.forEach((p) => {
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
      validPairs.forEach((p) => {
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
      validPairs.forEach((p) => {
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
    } else if (room.gameType === "tabu") {
      validPairs.forEach((p) => {
        room.tabuScores[p.id] = 0;
      });

      io.to(roomId).emit("tabuStart", {
        roundCount: room.roundCount,
        roundTime: room.roundTime,
      });

      updateTabuLeaderboard(roomId);

      setTimeout(() => {
        startTabuTurn(roomId);
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

    let cleanWord = word ? word.trim().toLocaleUpperCase("tr-TR") : "⏰";
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

    let cleanWord = word ? word.trim().toLocaleUpperCase("tr-TR") : "⏰";
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
      const example =
        bothFailed && EXAMPLES[room.currentLetter]
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
    if (
      !room ||
      room.gameStatus !== "playing" ||
      room.gameType !== "pictionary"
    )
      return;

    const cleanGuess = guess.trim().toLocaleUpperCase("tr-TR");
    const word = room._currentPictionaryWord;
    if (!word) return;

    if (room.gameMode === "tek") {
      // TEK MOD: bireysel tahmin
      const player = room.soloPlayers.find((p) => p.id === socket.id);
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

        room.pictionaryScores[socket.id] =
          (room.pictionaryScores[socket.id] || 0) + points;
        room.pictionaryScores[drawer.id] =
          (room.pictionaryScores[drawer.id] || 0) + 1;
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
        io.to(roomId).emit("pictionaryWrongGuess", {
          guess: cleanGuess,
          guesserName: player.username,
        });
      }
    } else {
      // ÇİFT MOD
      const pair = room.pairs.find(
        (p) => p.p1.id === socket.id || p.p2.id === socket.id,
      );
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

        room.pictionaryScores[pair.id] =
          (room.pictionaryScores[pair.id] || 0) + points;
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
        const guesserName =
          socket.id === pair.p1.id ? pair.p1.username : pair.p2.username;
        io.to(roomId).emit("pictionaryWrongGuess", {
          guess: cleanGuess,
          guesserName,
        });
      }
    }
  });

  // --- TABU: İPUCU ---
  socket.on("tabuClue", ({ roomId, clue }) => {
    const room = rooms[roomId];
    if (!room || room.gameStatus !== "playing" || room.gameType !== "tabu")
      return;
    if (socket.id !== room.tabuDescriberId) return;

    const currentWord = room.tabuCurrentWord;
    if (!currentWord) return;

    const cleanClue = clue.trim();
    if (!cleanClue) return;

    // Check forbidden words
    const clueUpper = cleanClue.toLocaleUpperCase("tr-TR");
    const wordUpper = currentWord.word.toLocaleUpperCase("tr-TR");
    const allForbidden = [
      wordUpper,
      ...currentWord.forbidden.map((f) => f.toLocaleUpperCase("tr-TR")),
    ];

    let usedForbidden = null;
    for (const fw of allForbidden) {
      if (clueUpper.includes(fw)) {
        usedForbidden = fw;
        break;
      }
    }

    if (usedForbidden) {
      // Forbidden word used - warn and skip word
      io.to(roomId).emit("tabuForbidden", {
        clue: cleanClue,
        forbiddenWord: usedForbidden,
        describerName: getPlayerName(room, socket.id),
      });
      // Skip to next word
      nextTabuWord(roomId);
      return;
    }

    // Valid clue - broadcast to everyone
    room.tabuClues.push({ text: cleanClue, type: "clue" });
    io.to(roomId).emit("tabuClue", {
      clue: cleanClue,
      describerName: getPlayerName(room, socket.id),
    });
  });

  // --- TABU: TAHMİN ---
  socket.on("tabuGuess", ({ roomId, guess }) => {
    const room = rooms[roomId];
    if (!room || room.gameStatus !== "playing" || room.gameType !== "tabu")
      return;
    if (socket.id !== room.tabuGuesserId) return;

    const currentWord = room.tabuCurrentWord;
    if (!currentWord) return;

    const cleanGuess = guess.trim();
    if (!cleanGuess) return;

    const guessUpper = cleanGuess.toLocaleUpperCase("tr-TR");
    const wordUpper = currentWord.word.toLocaleUpperCase("tr-TR");

    // Broadcast guess to everyone
    room.tabuClues.push({ text: cleanGuess, type: "guess" });
    io.to(roomId).emit("tabuGuessMsg", {
      guess: cleanGuess,
      guesserName: getPlayerName(room, socket.id),
    });

    if (guessUpper === wordUpper) {
      // Correct guess!
      const pair = room.pairs[room.currentPairIndex];
      room.tabuScores[pair.id] = (room.tabuScores[pair.id] || 0) + 1;
      updateTabuLeaderboard(roomId);

      io.to(roomId).emit("tabuCorrect", {
        word: currentWord.word,
        teamName: pair.teamName,
        score: room.tabuScores[pair.id],
      });

      // Next word
      setTimeout(() => nextTabuWord(roomId), 1000);
    }
  });

  // --- TABU: PAS ---
  socket.on("tabuPass", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.gameStatus !== "playing" || room.gameType !== "tabu")
      return;
    if (socket.id !== room.tabuDescriberId) return;

    io.to(roomId).emit("tabuPassed", {
      word: room.tabuCurrentWord ? room.tabuCurrentWord.word : "",
    });

    nextTabuWord(roomId);
  });

  // --- IMPOSTER: KELİME GÖNDERME ---
  socket.on("submitImposterWord", ({ roomId, word }) => {
    const room = rooms[roomId];
    if (!room || room.gameStatus !== "playing" || room.gameType !== "imposter")
      return;
    if (room.imposterPhase !== "write1" && room.imposterPhase !== "write2")
      return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    const subs =
      room.imposterPhase === "write1"
        ? room.imposterSubmissions1
        : room.imposterSubmissions2;
    if (subs[socket.id]) return;

    let cleanWord = word ? word.trim().toLocaleUpperCase("tr-TR") : "⏰";
    if (cleanWord === "") cleanWord = "⏰";

    subs[socket.id] = cleanWord;

    io.to(roomId).emit("imposterPlayerSubmitted", {
      username: player.username,
      playerId: socket.id,
      phase: room.imposterPhase,
    });

    if (Object.keys(subs).length >= room.players.length) {
      endImposterPhase(roomId);
    }
  });

  // --- IMPOSTER: OY VERME ---
  socket.on("submitImposterVote", ({ roomId, votedPlayerId }) => {
    const room = rooms[roomId];
    if (!room || room.gameStatus !== "playing" || room.gameType !== "imposter")
      return;
    if (room.imposterPhase !== "vote") return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;
    if (room.imposterVotes[socket.id]) return;
    if (socket.id === votedPlayerId) return;

    room.imposterVotes[socket.id] = votedPlayerId;

    io.to(roomId).emit("imposterPlayerVoted", {
      username: player.username,
      playerId: socket.id,
    });

    if (Object.keys(room.imposterVotes).length >= room.players.length) {
      endImposterVoting(roomId);
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
        room.players = room.players.filter((p) => p.id !== socket.id);
        if (room.soloPlayers) {
          room.soloPlayers = room.soloPlayers.filter((p) => p.id !== socket.id);
        }
      }

      room.spectators = room.spectators.filter((p) => p.id !== socket.id);

      // Boş oda kontrolü - tüm timerları temizle ve odayı sil
      const hasTeamPlayers = room.teams.some((t) => t.p1 || t.p2);
      const hasSoloPlayers = room.players && room.players.length > 0;
      const hasSpectators = room.spectators.length > 0;

      if (!hasTeamPlayers && !hasSoloPlayers && !hasSpectators) {
        if (room.pictionaryTimer) clearTimeout(room.pictionaryTimer);
        if (room.tabuTimer) clearTimeout(room.tabuTimer);
        if (room.imposterTimer) clearTimeout(room.imposterTimer);
        delete rooms[roomId];
        console.log(`Oda silindi (boş): ${roomId}`);
      } else {
        emitLobbyUpdate(roomId);
      }
    }
  });
});

// ============ TELEPATİ FONKSİYONLARI ============

function nextTurn(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  // İteratif olarak sıradaki elenmeyen çifti bul
  const maxIterations = room.pairs.length * (room.roundCount + 1);
  for (let i = 0; i < maxIterations; i++) {
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
      continue;
    }

    setTimeout(() => startTurn(roomId), 1500);
    return;
  }
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
  const available = TURKISH_LETTERS.filter(
    (l) => !room.usedLetters.includes(l),
  );
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
    io.to(roomId).emit(
      "isimSehirGameOver",
      `${winner.teamName} kazandı! (${winScore} puan) 🏆`,
    );
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
    (a, b) =>
      (room.isimSehirScores[b.id] || 0) - (room.isimSehirScores[a.id] || 0),
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

  room._pictionaryRoundEnding = false;

  // Pick unused word
  let available = PICTIONARY_WORDS.filter(
    (w) => !room.pictionaryUsedWords.includes(w),
  );
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

    room.soloPlayers.forEach((p) => {
      if (p.id !== drawer.id) {
        io.to(p.id).emit("pictionaryRound", {
          ...baseData,
          guesserId: p.id,
          guesserName: p.username,
        });
      }
    });

    room.spectators.forEach((s) => {
      io.to(s.id).emit("pictionaryRound", { ...baseData });
    });
  } else {
    // ÇİFT MOD
    const drawerIsP1 = room.pictionaryDrawerToggle % 2 === 0;

    room.pairs.forEach((pair) => {
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
    room.spectators.forEach((s) => {
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

  // Çift çağrı koruması
  if (room._pictionaryRoundEnding) return;
  room._pictionaryRoundEnding = true;

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
          (a, b) =>
            (room.pictionaryScores[b.id] || 0) -
            (room.pictionaryScores[a.id] || 0),
        );
        const winner = sorted[0];
        const winScore = room.pictionaryScores[winner.id] || 0;
        io.to(roomId).emit(
          "pictionaryGameOver",
          `${winner.username} kazandı! (${winScore} puan) 🏆`,
        );
      } else {
        const sorted = [...room.pairs].sort(
          (a, b) =>
            (room.pictionaryScores[b.id] || 0) -
            (room.pictionaryScores[a.id] || 0),
        );
        const winner = sorted[0];
        const winScore = room.pictionaryScores[winner.id] || 0;
        io.to(roomId).emit(
          "pictionaryGameOver",
          `${winner.teamName} kazandı! (${winScore} puan) 🏆`,
        );
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
      (a, b) =>
        (room.pictionaryScores[b.id] || 0) - (room.pictionaryScores[a.id] || 0),
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
      (a, b) =>
        (room.pictionaryScores[b.id] || 0) - (room.pictionaryScores[a.id] || 0),
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

// ============ TABU FONKSİYONLARI ============

function getPlayerName(room, socketId) {
  for (const pair of room.pairs) {
    if (pair.p1.id === socketId) return pair.p1.username;
    if (pair.p2.id === socketId) return pair.p2.username;
  }
  return "?";
}

function startTabuTurn(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const pair = room.pairs[room.currentPairIndex];
  const describerIsP1 = room.tabuDescriberToggle % 2 === 0;
  const describer = describerIsP1 ? pair.p1 : pair.p2;
  const guesser = describerIsP1 ? pair.p2 : pair.p1;

  room.tabuDescriberId = describer.id;
  room.tabuGuesserId = guesser.id;
  room.tabuClues = [];

  io.to(roomId).emit("tabuTurn", {
    pairId: pair.id,
    teamName: pair.teamName,
    describer: describer,
    guesser: guesser,
    currentRound: room.currentRound,
    totalRounds: room.roundCount,
    roundTime: room.roundTime,
  });

  // Send first word
  pickAndSendTabuWord(roomId);

  // Start timer
  if (room.tabuTimer) clearTimeout(room.tabuTimer);
  room.tabuTimer = setTimeout(() => {
    endTabuTurn(roomId);
  }, room.roundTime * 1000);
}

function pickAndSendTabuWord(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  let available = TABU_WORDS.filter(
    (w) => !room.tabuUsedWords.includes(w.word),
  );
  if (available.length === 0) {
    room.tabuUsedWords = [];
    available = [...TABU_WORDS];
  }
  const wordObj = available[Math.floor(Math.random() * available.length)];
  room.tabuUsedWords.push(wordObj.word);
  room.tabuCurrentWord = wordObj;
  room.tabuClues = [];

  // Send word to everyone except guesser
  const allInRoom = io.sockets.adapter.rooms.get(roomId);
  if (allInRoom) {
    for (const sid of allInRoom) {
      if (sid !== room.tabuGuesserId) {
        io.to(sid).emit("tabuNewWord", {
          word: wordObj.word,
          forbidden: wordObj.forbidden,
        });
      }
    }
  }

  // Tell everyone (including guesser) a new word is active
  io.to(roomId).emit("tabuNewRound");
}

function nextTabuWord(roomId) {
  const room = rooms[roomId];
  if (!room || room.gameStatus !== "playing") return;
  pickAndSendTabuWord(roomId);
}

function endTabuTurn(roomId) {
  const room = rooms[roomId];
  if (!room || room.gameStatus !== "playing") return;

  if (room.tabuTimer) {
    clearTimeout(room.tabuTimer);
    room.tabuTimer = null;
  }

  const pair = room.pairs[room.currentPairIndex];
  io.to(roomId).emit("tabuTurnEnd", {
    teamName: pair.teamName,
    score: room.tabuScores[pair.id] || 0,
  });

  // Move to next pair/round
  room.tabuDescriberToggle++;
  room.currentPairIndex++;

  if (room.currentPairIndex >= room.pairs.length) {
    room.currentPairIndex = 0;
    room.currentRound++;

    if (room.currentRound > room.roundCount) {
      // Game over
      setTimeout(() => {
        const sorted = [...room.pairs].sort(
          (a, b) => (room.tabuScores[b.id] || 0) - (room.tabuScores[a.id] || 0),
        );
        const winner = sorted[0];
        const winScore = room.tabuScores[winner.id] || 0;
        io.to(roomId).emit(
          "tabuGameOver",
          `${winner.teamName} kazandı! (${winScore} puan) 🏆`,
        );
        room.gameStatus = "finished";
      }, 2500);
      return;
    }

    io.to(roomId).emit("roundChanged", room.currentRound);
  }

  setTimeout(() => {
    startTabuTurn(roomId);
  }, 3000);
}

function updateTabuLeaderboard(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const sorted = [...room.pairs].sort(
    (a, b) => (room.tabuScores[b.id] || 0) - (room.tabuScores[a.id] || 0),
  );

  const scores = sorted.map((p, i) => ({
    rank: i + 1,
    name: p.teamName,
    score: room.tabuScores[p.id] || 0,
    eliminated: false,
  }));

  io.to(roomId).emit("updateScoreboard", scores);
}

// ============ IMPOSTER FONKSİYONLARI ============

function startImposterRound(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  // Kelime seç
  let available = IMPOSTER_WORDS.filter(
    (w) => !room.imposterUsedWords.includes(w.word),
  );
  if (available.length === 0) {
    room.imposterUsedWords = [];
    available = [...IMPOSTER_WORDS];
  }
  const wordObj = available[Math.floor(Math.random() * available.length)];
  room.imposterUsedWords.push(wordObj.word);
  room.imposterCurrentWord = wordObj;
  room.imposterSubmissions1 = {};
  room.imposterSubmissions2 = {};
  room.imposterVotes = {};
  room.imposterPhase = "write1";

  // Rastgele imposter seç
  const imposterIdx = Math.floor(Math.random() * room.players.length);
  room.imposterId = room.players[imposterIdx].id;

  // Herkese gönder
  room.players.forEach((p) => {
    const isImp = p.id === room.imposterId;
    io.to(p.id).emit("imposterRound", {
      currentRound: room.currentRound,
      totalRounds: room.roundCount,
      roundTime: room.roundTime,
      isImposter: isImp,
      word: isImp ? null : wordObj.word,
      hint: isImp ? wordObj.hint : null,
      phase: "write1",
    });
  });

  // Timer
  if (room.imposterTimer) clearTimeout(room.imposterTimer);
  room.imposterTimer = setTimeout(() => {
    endImposterPhase(roomId);
  }, room.roundTime * 1000);
}

function endImposterPhase(roomId) {
  const room = rooms[roomId];
  if (!room || room.gameStatus !== "playing") return;

  if (room.imposterTimer) {
    clearTimeout(room.imposterTimer);
    room.imposterTimer = null;
  }

  if (room.imposterPhase === "write1") {
    // Faz 1 bitti - boş kalanları doldur
    room.players.forEach((p) => {
      if (!room.imposterSubmissions1[p.id]) {
        room.imposterSubmissions1[p.id] = "⏰";
      }
    });

    const results1 = room.players.map((p) => ({
      username: p.username,
      playerId: p.id,
      word: room.imposterSubmissions1[p.id],
    }));

    // Faz 1 sonuçlarını göster, faz 2'ye geç
    io.to(roomId).emit("imposterPhaseResults", {
      phase: "write1",
      results: results1,
    });

    // Faz 2 başlat
    room.imposterPhase = "write2";
    setTimeout(() => {
      io.to(roomId).emit("imposterPhase2Start", {
        roundTime: room.roundTime,
      });

      if (room.imposterTimer) clearTimeout(room.imposterTimer);
      room.imposterTimer = setTimeout(() => {
        endImposterPhase(roomId);
      }, room.roundTime * 1000);
    }, 3000);
  } else if (room.imposterPhase === "write2") {
    // Faz 2 bitti - boş kalanları doldur
    room.players.forEach((p) => {
      if (!room.imposterSubmissions2[p.id]) {
        room.imposterSubmissions2[p.id] = "⏰";
      }
    });

    const results1 = room.players.map((p) => ({
      username: p.username,
      playerId: p.id,
      word: room.imposterSubmissions1[p.id],
    }));
    const results2 = room.players.map((p) => ({
      username: p.username,
      playerId: p.id,
      word: room.imposterSubmissions2[p.id],
    }));

    // Faz 2 sonuçlarını göster, oylamaya geç
    io.to(roomId).emit("imposterPhaseResults", {
      phase: "write2",
      results1: results1,
      results2: results2,
    });

    room.imposterPhase = "vote";
    setTimeout(() => {
      const playerList = room.players.map((p) => ({
        playerId: p.id,
        username: p.username,
      }));
      io.to(roomId).emit("imposterVoteStart", { players: playerList });

      // Oylama için timeout
      if (room.imposterTimer) clearTimeout(room.imposterTimer);
      room.imposterTimer = setTimeout(() => {
        if (room.imposterPhase !== "vote") return;
        // Oy vermeyenleri rastgele doldur
        room.players.forEach((p) => {
          if (!room.imposterVotes[p.id]) {
            const others = room.players.filter((o) => o.id !== p.id);
            if (others.length > 0) {
              room.imposterVotes[p.id] = others[Math.floor(Math.random() * others.length)].id;
            }
          }
        });
        endImposterVoting(roomId);
      }, 30000);
    }, 3000);
  }
}

function endImposterVoting(roomId) {
  const room = rooms[roomId];
  if (!room || room.gameStatus !== "playing") return;

  if (room.imposterTimer) {
    clearTimeout(room.imposterTimer);
    room.imposterTimer = null;
  }

  // Oyları say
  const voteCounts = {};
  room.players.forEach((p) => (voteCounts[p.id] = 0));
  Object.values(room.imposterVotes).forEach((votedId) => {
    voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
  });

  // En çok oy alanı bul
  let maxVotes = 0;
  let maxVotedId = null;
  for (const [pid, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      maxVotedId = pid;
    }
  }

  const imposterCaught = maxVotedId === room.imposterId;
  const imposterPlayer = room.players.find((p) => p.id === room.imposterId);
  const votedPlayer = room.players.find((p) => p.id === maxVotedId);

  const voteDetails = room.players.map((p) => {
    const votedFor = room.imposterVotes[p.id];
    const votedForPlayer = room.players.find((v) => v.id === votedFor);
    return {
      username: p.username,
      playerId: p.id,
      votedFor: votedForPlayer ? votedForPlayer.username : "-",
      votedForId: votedFor,
      isImposter: p.id === room.imposterId,
      votes: voteCounts[p.id] || 0,
    };
  });

  io.to(roomId).emit("imposterVoteResult", {
    imposterCaught: imposterCaught,
    imposterId: room.imposterId,
    imposterName: imposterPlayer ? imposterPlayer.username : "?",
    votedPlayerId: maxVotedId,
    votedPlayerName: votedPlayer ? votedPlayer.username : "?",
    maxVotes: maxVotes,
    secretWord: room.imposterCurrentWord.word,
    voteDetails: voteDetails,
  });

  // Sonraki tur
  room.currentRound++;
  if (room.currentRound > room.roundCount) {
    setTimeout(() => {
      io.to(roomId).emit("imposterGameOver", "Oyun bitti! 🏆");
      room.gameStatus = "finished";
    }, 8000);
    return;
  }

  setTimeout(() => {
    io.to(roomId).emit("roundChanged", room.currentRound);
    setTimeout(() => startImposterRound(roomId), 2000);
  }, 8000);
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
