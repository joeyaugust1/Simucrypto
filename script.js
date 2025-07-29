function formatMoney(value) {
  return parseFloat(value).toFixed(2);
}

// --- Preset lists for signup ---
const RESIDENCES = ["Pacific", "Continental"];
const PACIFIC_LOCATIONS = ["California", "Oregon", "Washington", "Hawaii", "Alaska"];
const CONTINENTAL_LOCATIONS = ["New York", "Texas", "Illinois", "Florida", "Georgia"];
const AGE_OPTIONS = Array.from({length: 53}, (_, i) => 18 + i); // 18 to 70

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomDigits(len) { return Array.from({length: len}, () => Math.floor(Math.random()*10)).join(""); }

// --- Section switching with bank/signup logic ---
// Unified: includes all main app and whitepaper sections, and initializes each section as needed
function showSection(id) {
  [
    'results', 'bank', 'exchange', 'social', 'news', 'marketcap', 'signup',
    'whitepaper-solvex', 'whitepaper-neurax', 'whitepaper-corechain'
  ].forEach(sec => {
    const el = document.getElementById(sec);
    if (el) el.style.display = 'none';
  });
  const showEl = document.getElementById(id);
  if (showEl) showEl.style.display = 'block';

  // Special case: show signup page logic
  if (id === 'signup') showSignupPage();

  // Show bank account page if logged in, else show landing
  if (id === 'bank') {
    const accountData = JSON.parse(localStorage.getItem('cryptosimBankAccount') || "null");
    if (accountData) {
      showBankAccountPage(accountData);
    } else {
      document.getElementById('bank-account-summary').style.display = 'none';
      document.getElementById('bank-landing').style.display = '';
      hideLoginPrompt();
    }
  }

  // Render marketcap list if needed and clear/stop old intervals
  if (id === "marketcap") {
    clearMarketcapIntervals();
    renderMarketcapList();
  } else {
    clearMarketcapIntervals();
  }
}

function handleSearch() {
  const term = document.getElementById('searchInput').value.toLowerCase();
  if (term.includes('finance')) {
    showSection('results');
  } else {
    alert('No results found.');
  }
}

// ---------------- BANKING AUTH & TRANSACTION LOGIC ------------------
function getBankAccountData() {
  return JSON.parse(localStorage.getItem('cryptosimBankAccount') || "null");
}
function setBankAccountData(data) {
  localStorage.setItem('cryptosimBankAccount', JSON.stringify(data));
}
function getBankTransactions() {
  return JSON.parse(localStorage.getItem('cryptosimBankTransactions') || "[]");
}
function setBankTransactions(txs) {
  localStorage.setItem('cryptosimBankTransactions', JSON.stringify(txs));
}
function addBankTransaction(type, amount, details) {
  const txs = getBankTransactions();
  const dt = new Date();
  txs.unshift({
    type, // "Deposit", "Withdrawal", "Transfer", "Send"
    amount,
    details,
    date: dt.toLocaleString()
  });
  setBankTransactions(txs);
}

function showLoginPrompt() {
  document.getElementById('bank-auth-buttons').style.display = 'none';
  document.getElementById('bank-login-form').style.display = 'block';
}
function hideLoginPrompt() {
  document.getElementById('bank-auth-buttons').style.display = '';
  document.getElementById('bank-login-form').style.display = 'none';
}

function showSignupPage() {
  // Randomly assign residence and age each time page loads
  const residenceType = randomFrom(RESIDENCES);
  let residence;
  if (residenceType === "Pacific") {
    residence = randomFrom(PACIFIC_LOCATIONS);
  } else {
    residence = randomFrom(CONTINENTAL_LOCATIONS);
  }
  const age = randomFrom(AGE_OPTIONS);

  // Set dropdown options & values
  const residenceSel = document.getElementById('signupResidence');
  residenceSel.innerHTML = '';
  let opt = document.createElement('option');
  opt.value = residence;
  opt.textContent = residence;
  residenceSel.appendChild(opt);

  const ageSel = document.getElementById('signupAge');
  ageSel.innerHTML = '';
  let ageOpt = document.createElement('option');
  ageOpt.value = age;
  ageOpt.textContent = age;
  ageSel.appendChild(ageOpt);

  document.getElementById('signupName').value = '';
}
function submitSignup() {
  const name = document.getElementById('signupName').value.trim();
  const residence = document.getElementById('signupResidence').value;
  const age = document.getElementById('signupAge').value;
  if (!name) { alert("Please enter a name."); return; }

  // Generate account ID and bank account number (not editable)
  const accountId = "CB" + randomDigits(8);
  const bankAccountNumber = "9" + randomDigits(9);

  const accountData = {
    name, residence, age,
    accountId, bankAccountNumber,
    balance: 1000 // Start with $1000
  };
  // Save to localStorage
  localStorage.setItem('cryptosimBankAccount', JSON.stringify(accountData));
  // Clear transaction history
  setBankTransactions([]);
  // Log in user and go to bank
  showSection('bank');
}
function bankLogin() {
  const inputId = document.getElementById('loginAccountId').value.trim();
  const accountData = getBankAccountData();
  if (accountData && inputId === accountData.accountId) {
    showBankAccountPage(accountData);
    showSection('bank');
    hideLoginPrompt();
  } else {
    alert("Account not found or incorrect ID.");
  }
}
function bankLogout() {
  document.getElementById('bank-account-summary').style.display = 'none';
  document.getElementById('bank-landing').style.display = '';
}

// ---------------- BANK SEND MONEY MODAL WITH EXCHANGE OPTION ONLY ----------------
function showSendMoneyModal() {
  document.getElementById('bank-sendmoney-modal').style.display = 'flex';
  // Set recipient field for exchange only
  const recipientField = document.getElementById('sendRecipient');
  recipientField.value = "CoinFlip Exchange";
  recipientField.disabled = true;
  recipientField.style.display = "";
  // Hide or disable recipient type dropdown
  const recipientTypeDropdown = document.getElementById('sendRecipientType');
  if (recipientTypeDropdown) recipientTypeDropdown.style.display = "none";
  document.getElementById('sendAmount').value = "";
}

function closeSendMoneyModal() {
  document.getElementById('bank-sendmoney-modal').style.display = 'none';
}

function submitSendMoney() {
  // Only destination is exchange
  const amount = parseFloat(document.getElementById('sendAmount').value);
  const selfAccount = getBankAccountData();

  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  if (selfAccount.balance < amount) {
    alert("Not enough funds.");
    return;
  }
  selfAccount.balance -= amount;
  exchangeBalance += amount;
  setBankAccountData(selfAccount);
  localStorage.setItem('exchangeBalance', exchangeBalance);
  addBankTransaction("Send", -amount, "To: CoinFlip Exchange");
  closeSendMoneyModal();
  showBankAccountPage(selfAccount);
  renderMarket(); // update exchange balance display
  alert("Sent $" + formatMoney(amount) + " to CoinFlip Exchange.");
}

// ---------------- EXCHANGE SEND MONEY TO BANK MODAL ----------------
function showExchangeSendBankModal() {
  document.getElementById('exchange-sendbank-modal').style.display = 'flex';
  document.getElementById('exchangeSendRecipientType').value = "bank";
  document.getElementById('exchangeSendRecipient').value = "Bankerz";
  document.getElementById('exchangeSendRecipient').disabled = true;
  document.getElementById('exchangeSendAmount').value = "";
}

function closeExchangeSendBankModal() {
  document.getElementById('exchange-sendbank-modal').style.display = 'none';
}

function submitExchangeSendBank() {
  const amount = parseFloat(document.getElementById('exchangeSendAmount').value);
  if (isNaN(amount) || amount <= 0) {
    alert("Enter a valid amount.");
    return;
  }
  if (exchangeBalance < amount) {
    alert("Not enough funds in exchange.");
    return;
  }
  exchangeBalance -= amount;
  localStorage.setItem('exchangeBalance', exchangeBalance);

  // Add to bank
  const selfAccount = getBankAccountData();
  if (!selfAccount) {
    alert("You must have a bank account!");
    closeExchangeSendBankModal();
    renderMarket();
    return;
  }
  selfAccount.balance += amount;
  setBankAccountData(selfAccount);
  addBankTransaction("Deposit", amount, "From: CoinFlip Exchange");
  closeExchangeSendBankModal();
  renderMarket();
  showBankAccountPage(selfAccount);
  alert("Sent $" + formatMoney(amount) + " to your Bankerz account.");
}

// --- Transaction History Modal Logic ---
function showFullTransactionHistory() {
  const modal = document.getElementById('transaction-history-modal');
  const txs = getBankTransactions();
  const list = document.getElementById('transaction-history-list');
  list.innerHTML = "";
  if (txs.length === 0) {
    list.innerHTML = `<em>No transactions yet.</em>`;
  } else {
    txs.forEach(tx => {
      const div = document.createElement('div');
      div.className = "transaction-entry";
      div.innerHTML = `
        <span class="transaction-type">${tx.type}</span>
        <span class="transaction-amount ${tx.amount > 0 ? 'credit' : 'debit'}">${tx.amount > 0 ? '+' : ''}${formatMoney(tx.amount)}</span>
        <span class="transaction-date">${tx.date}</span>
        <span style="margin-left:8px; color:#1852a0;font-size:0.98em;">${tx.details || ""}</span>
      `;
      list.append(div);
    });
  }
  modal.style.display = "flex";
}
function closeTransactionHistory() {
  document.getElementById('transaction-history-modal').style.display = "none";
}

// --- Banking Action Buttons & Modals ---
function showWithdrawModal() {
  document.getElementById('bank-withdraw-modal').style.display = 'flex';
  document.getElementById('withdrawAmount').value = "";
}
function closeWithdrawModal() {
  document.getElementById('bank-withdraw-modal').style.display = 'none';
}
function submitWithdraw() {
  const amount = parseFloat(document.getElementById('withdrawAmount').value);
  const selfAccount = getBankAccountData();
  if (isNaN(amount) || amount <= 0) {
    alert("Enter a valid amount.");
    return;
  }
  if (selfAccount.balance < amount) {
    alert("Not enough funds.");
    return;
  }
  selfAccount.balance -= amount;
  setBankAccountData(selfAccount);
  addBankTransaction("Withdrawal", -amount, "Cash withdrawal");
  closeWithdrawModal();
  showBankAccountPage(selfAccount);
  alert("Withdrew $" + formatMoney(amount) + ".");
}
function showDepositModal() {
  document.getElementById('bank-deposit-modal').style.display = 'flex';
  document.getElementById('depositAmount').value = "";
}
function closeDepositModal() {
  document.getElementById('bank-deposit-modal').style.display = 'none';
}
function submitDeposit() {
  const amount = parseFloat(document.getElementById('depositAmount').value);
  const selfAccount = getBankAccountData();
  if (isNaN(amount) || amount <= 0) {
    alert("Enter a valid amount.");
    return;
  }
  selfAccount.balance += amount;
  setBankAccountData(selfAccount);
  addBankTransaction("Deposit", amount, "Cash deposit");
  closeDepositModal();
  showBankAccountPage(selfAccount);
  alert("Deposited $" + formatMoney(amount) + ".");
}

// --- Game Reset: also clears player bank account and transactions ---
function resetGame() {
  localStorage.removeItem('cryptosimBankAccount');
  localStorage.removeItem('cryptosimBankTransactions');
  exchangeBalance = 0;
  localStorage.setItem('exchangeBalance', 0);
  Object.keys(coins).forEach(name => {
    coins[name].owned = 0;
    localStorage.setItem(`owned_${name}`, 0);
    // Reset price history
    priceHistory[name].length = 0;
    const dt = new Date();
    const timestamp = dt.getFullYear() + '-' +
      String(dt.getMonth() + 1).padStart(2, '0') + '-' +
      String(dt.getDate()).padStart(2, '0') + ' ' +
      String(dt.getHours()).padStart(2, '0') + ':' +
      String(dt.getMinutes()).padStart(2, '0') + ':' +
      String(dt.getSeconds()).padStart(2, '0');
    priceHistory[name].push({ time: timestamp, price: parseFloat(coins[name].price) });
  });
  document.getElementById('exchangeBalance').textContent = formatMoney(0);
  renderMarket();
  renderPortfolio();
  showSection('results');
}

// --------------- EXCHANGE/COIN LOGIC ---------------
let exchangeBalance = parseFloat(localStorage.getItem('exchangeBalance')) || 0;
document.getElementById('exchangeBalance').textContent = formatMoney(exchangeBalance);

const coins = {
  "NeuraX": { symbol: "NRX", price: randomPrice(), owned: 0 },
  "Solvex": { symbol: "SVX", price: randomPrice(), owned: 0 },
  "CoreChain": { symbol: "CRC", price: randomPrice(), owned: 0 },
};

Object.keys(coins).forEach(name => {
  const owned = parseInt(localStorage.getItem(`owned_${name}`)) || 0;
  coins[name].owned = owned;
});

function randomPrice() {
  return (Math.random() * 90 + 10).toFixed(2);
}

const priceHistory = {
  "NeuraX": [],
  "Solvex": [],
  "CoreChain": []
};

// --- Initialization: Ensure at least one data point for each coin ---
Object.keys(priceHistory).forEach(name => {
  const dt = new Date();
  const timestamp = dt.getFullYear() + '-' +
    String(dt.getMonth() + 1).padStart(2, '0') + '-' +
    String(dt.getDate()).padStart(2, '0') + ' ' +
    String(dt.getHours()).padStart(2, '0') + ':' +
    String(dt.getMinutes()).padStart(2, '0') + ':' +
    String(dt.getSeconds()).padStart(2, '0');
  priceHistory[name].push({ time: timestamp, price: parseFloat(coins[name].price) });
});

// --- Update Coin Prices & log to history ---
function updateCoinPrices() {
  Object.keys(coins).forEach(name => {
    const base = parseFloat(coins[name].price);
    const change = (Math.random() * 4 - 2).toFixed(2);
    const newPrice = Math.max(1, base + parseFloat(change)).toFixed(2);
    coins[name].price = newPrice;
    // Store history
    const dt = new Date();
    const timestamp = dt.getFullYear() + '-' +
      String(dt.getMonth() + 1).padStart(2, '0') + '-' +
      String(dt.getDate()).padStart(2, '0') + ' ' +
      String(dt.getHours()).padStart(2, '0') + ':' +
      String(dt.getMinutes()).padStart(2, '0') + ':' +
      String(dt.getSeconds()).padStart(2, '0');
    priceHistory[name].push({ time: timestamp, price: parseFloat(newPrice) });
    if (priceHistory[name].length > 50) priceHistory[name].shift();
  });
  renderMarket();
}

// --- Chart.js Chart Rendering ---
let priceChart = null;
function showChart(coinName) {
  const ctx = document.getElementById('priceChart').getContext('2d');
  const data = priceHistory[coinName];
  const labels = data.map(point => point.time);
  const prices = data.map(point => point.price);
  if (priceChart) priceChart.destroy();
  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `${coinName} Price`,
        data: prices,
        borderColor: 'blue',
        borderWidth: 2,
        tension: 0.15,
        fill: false,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      },
      scales: {
        x: {
          title: { display: true, text: "Time" },
          ticks: { autoSkip: true, maxTicksLimit: 10 }
        },
        y: {
          title: { display: true, text: "Price ($)" },
          beginAtZero: false
        }
      }
    }
  });
}

// --- Market/Portfolio/Feed/News/Etc. ---
function renderMarket() {
  const market = document.getElementById('coinMarket');
  market.innerHTML = '';
  Object.entries(coins).forEach(([name, data]) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${name} (${data.symbol})</td>
      <td>$${data.price}</td>
      <td>
        <button onclick="buyCoin('${name}')">Buy 1</button>
        <button onclick="buyAll('${name}')">Buy All</button><br>
        <button onclick="sellCoin('${name}')">Sell 1</button>
        <button onclick="sellAll('${name}')">Sell All</button><br>
        Owned: ${data.owned}
      </td>
    `;
    market.appendChild(row);
  });
  renderPortfolio();
  document.getElementById('exchangeBalance').textContent = formatMoney(exchangeBalance);
}

function renderPortfolio() {
  const portfolioTable = document.getElementById('portfolioTable');
  const portfolioValueEl = document.getElementById('portfolioValue');
  let total = 0;
  portfolioTable.innerHTML = '';
  Object.entries(coins).forEach(([name, data]) => {
    if (data.owned > 0) {
      const totalValue = (data.owned * parseFloat(data.price)).toFixed(2);
      total += parseFloat(totalValue);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${name}</td>
        <td>${data.owned}</td>
        <td>$${data.price}</td>
        <td>$${totalValue}</td>
      `;
      portfolioTable.appendChild(row);
    }
  });
  portfolioValueEl.textContent = formatMoney(total);
}

function buyCoin(name) {
  const coin = coins[name];
  const price = parseFloat(coin.price);
  if (exchangeBalance >= price) {
    exchangeBalance -= price;
    coin.owned += 1;
    localStorage.setItem('exchangeBalance', exchangeBalance);
    localStorage.setItem(`owned_${name}`, coin.owned);
    document.getElementById('exchangeBalance').textContent = formatMoney(exchangeBalance);
    renderMarket();
  } else {
    alert('Not enough exchange balance.');
  }
}

function buyAll(name) {
  const coin = coins[name];
  const price = parseFloat(coin.price);
  const amount = Math.floor(exchangeBalance / price);
  if (amount > 0) {
    exchangeBalance -= price * amount;
    coin.owned += amount;
    localStorage.setItem('exchangeBalance', exchangeBalance);
    localStorage.setItem(`owned_${name}`, coin.owned);
    document.getElementById('exchangeBalance').textContent = formatMoney(exchangeBalance);
    renderMarket();
  } else {
    alert('Not enough exchange balance.');
  }
}

function sellCoin(name) {
  const coin = coins[name];
  const price = parseFloat(coin.price);
  if (coin.owned > 0) {
    coin.owned -= 1;
    exchangeBalance += price;
    localStorage.setItem('exchangeBalance', exchangeBalance);
    localStorage.setItem(`owned_${name}`, coin.owned);
    document.getElementById('exchangeBalance').textContent = formatMoney(exchangeBalance);
    renderMarket();
  } else {
    alert('You don’t own any of this coin.');
  }
}

function sellAll(name) {
  const coin = coins[name];
  const price = parseFloat(coin.price);
  const totalValue = price * coin.owned;
  if (coin.owned > 0) {
    exchangeBalance += totalValue;
    coin.owned = 0;
    localStorage.setItem('exchangeBalance', exchangeBalance);
    localStorage.setItem(`owned_${name}`, 0);
    document.getElementById('exchangeBalance').textContent = formatMoney(exchangeBalance);
    renderMarket();
  } else {
    alert('You don’t own any of this coin.');
  }
}

// ---------- CRYPTOCHAT MOCK SOCIAL MEDIA (NPC + USER POSTS) ----------

// NPC Accounts
const influencerAccounts = [
  { user: "CryptoQueen", isInfluencer: true },
  { user: "ChainGuru", isInfluencer: true }
];
const civilianAccounts = [
  { user: "TraderJoe", isInfluencer: false },
  { user: "BlockGal", isInfluencer: false },
  { user: "AltcoinAndy", isInfluencer: false },
  { user: "SatoshiFan", isInfluencer: false },
  { user: "DiamondHands", isInfluencer: false },
  { user: "WhaleWatcher", isInfluencer: false },
  { user: "BagHolder", isInfluencer: false },
  { user: "CryptoKid", isInfluencer: false }
];
const ALL_NPC = [...influencerAccounts, ...civilianAccounts];

// Branded cryptos
const CRYPTOS = ["NeuraX", "Solvex", "CoreChain"];

// Arrays of post templates for each crypto and sentiment
const npcTemplates = {
  NeuraX: {
    positive: [
      "NeuraX is unstoppable after that price jump! 🚀",
      "Bullish on NeuraX, more gains coming soon!",
      "NRX innovation is blowing my mind!",
      "NeuraX just changed the game again.",
      "Huge volume on NeuraX! Uptrend confirmed."
    ],
    negative: [
      "I sold my NeuraX after that recent dip...",
      "Is NeuraX losing steam?",
      "NRX holders, are you ok?",
      "NeuraX correction was rough today.",
      "Bearish signals on NRX, I'm out for now."
    ]
  },
  Solvex: {
    positive: [
      "Solvex just hit a new high, I'm all in!",
      "SVX community never disappoints!",
      "Solvex is the future of DeFi. #hodl",
      "Big partnership rumors for Solvex!",
      "SVX is trending everywhere today!"
    ],
    negative: [
      "Solvex is struggling lately...",
      "Did anyone else get rekt by that SVX drop?",
      "Bearish on Solvex for now.",
      "SVX can't hold support levels.",
      "Solvex correction was expected, but ouch."
    ]
  },
  CoreChain: {
    positive: [
      "CoreChain transactions are so fast lately!",
      "CRC is the sleeper hit of the cycle.",
      "CoreChain team is killing it!",
      "Love how CRC just keeps climbing.",
      "CoreChain just broke resistance, bullish!"
    ],
    negative: [
      "CoreChain volume is down, not good...",
      "CRC just dumped. Anyone buying?",
      "Bearish vibes on CoreChain today.",
      "I’m worried about CoreChain’s recent performance.",
      "CRC whales dumping again."
    ]
  }
};

// ---- UPDATED SOCIAL/NEWS POST ALGORITHMS ----
// Civilian use case posts
const civilianUseCasePosts = {
  NeuraX: [
    "Just tried NeuraX’s smart contracts – seamless!",
    "NRX is perfect for microtransactions.",
    "NeuraX might power the next wave of dApps.",
    "I use NeuraX to transfer crypto to friends – so fast.",
    "The voting dApp on NeuraX is awesome!"
  ],
  Solvex: [
    "Solvex's staking rewards are the best.",
    "I use SVX for DeFi farming, solid returns.",
    "Solvex is behind my favorite lending platform.",
    "SVX is the backbone for many NFT projects.",
    "Solvex wallet UI gets better every update."
  ],
  CoreChain: [
    "CoreChain’s speed is a game changer.",
    "I use CRC to pay for my online games.",
    "CoreChain’s gas fees are almost zero.",
    "CRC makes cross-border payments easy.",
    "CoreChain launchpad is bringing new tokens."
  ]
};
const civilianMarketHistoryPosts = {
  NeuraX: [
    "NeuraX has doubled this week, wild ride.",
    "NRX price action is crazy lately.",
    "Watched NeuraX dip then bounce back, classic.",
    "NRX is way more volatile than last month.",
    "NeuraX all-time high incoming?"
  ],
  Solvex: [
    "Solvex almost broke support yesterday.",
    "SVX recovered fast after last week's fall.",
    "Solvex price chart looks bullish.",
    "SVX holding steady after last pump.",
    "Solvex had a huge wick this morning."
  ],
  CoreChain: [
    "CoreChain up 15% in two days. 🚀",
    "CRC dipped but recovered quickly.",
    "CoreChain’s chart looks like a staircase up.",
    "CRC had an insane green candle last hour.",
    "CoreChain is finally getting noticed."
  ]
};
const civilianNewsPosts = [
  (news) => `Did you see the news? "${news.headline}" – big for ${news.coin}.`,
  (news) => `Market's moving because of: "${news.effectText}"`,
  (news) => `Everyone talking about: "${news.headline}"`,
  (news) => `That news event for ${news.coin} is wild: "${news.effectText}"`,
  (news) => `${news.coin} is all over the news: "${news.subtext.slice(0, 40)}..."`
];
// Influencer FUD posts
const influencerFUDPosts = [
  (coin) => `I'm seriously worried about ${coin} after recent events.`,
  (coin) => `${coin} is showing all the signs of a rug pull.`,
  (coin) => `Stay away from ${coin} for now, too risky.`,
  (coin) => `${coin} whales are dumping, be careful.`,
  (coin) => `Don't get caught holding ${coin} at the top!`
];
// Influencer technology posts
const influencerTechPosts = [
  (coin) => `${coin} tech update: new scalability record!`,
  (coin) => `${coin} just released a new whitepaper section.`,
  (coin) => `Major protocol upgrade coming for ${coin}, bullish.`,
  (coin) => `Excited for ${coin} dev conference this month.`,
  (coin) => `Rumors: ${coin} to integrate with another chain!`
];
// Influencer news event posts
const influencerNewsPosts = [
  (news) => `Insider info: "${news.headline}" is just the beginning for ${news.coin}.`,
  (news) => `My DMs are blowing up about: "${news.effectText}"`,
  (news) => `This news on ${news.coin} is a game changer: "${news.headline}"`,
  (news) => `Only smart money reacts to "${news.effectText}"`,
  (news) => `Not surprised by "${news.headline}" for ${news.coin}.`
];

// Last price snapshots for sentiment analysis
let lastPriceSnapshots = {
  NeuraX: [],
  Solvex: [],
  CoreChain: []
};

function recordPriceSnapshots() {
  CRYPTOS.forEach(name => {
    if (!lastPriceSnapshots[name]) lastPriceSnapshots[name] = [];
    lastPriceSnapshots[name].push(parseFloat(coins[name].price));
    if (lastPriceSnapshots[name].length > 20) lastPriceSnapshots[name].shift();
  });
}
setInterval(recordPriceSnapshots, 30000);

// Utility: get price movement over last X mins (5min = 10 samples)
function getPriceSentiment(coin, samples = 10) {
  const arr = lastPriceSnapshots[coin];
  if (!arr || arr.length < samples) return "neutral";
  const old = arr[arr.length - samples];
  const latest = arr[arr.length - 1];
  if (latest > old * 1.03) return "positive";
  if (latest < old * 0.97) return "negative";
  return "neutral";
}

// --- Social Media/Cryptochat Logic with Like/Comment/Share ---
let postId = 0;
let posts = []; // Store all posts and their comments

function postMessage() {
  const input = document.getElementById("postInput");
  const text = input.value.trim();
  if (!text) return;
  const newPost = {
    id: ++postId,
    user: "You",
    text,
    timestamp: new Date().toLocaleString(),
    likes: 0,
    liked: false,
    comments: [],
    showCommentBox: false,
    isInfluencer: false
  };
  posts.unshift(newPost);
  input.value = "";
  renderFeed();
}

// --- NPC Posting Logic (UPDATED) ---
function randomFromArr(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function npcAutoPost() {
  // 5% influencer, 95% civilian
  const isInfluencer = Math.random() < 0.05;
  const npcArr = isInfluencer ? influencerAccounts : civilianAccounts;
  const npc = randomFromArr(npcArr);

  let postText = '';
  let showCoin, usedNews = false;

  if (!isInfluencer) {
    // Civilian post
    const r = Math.random();
    if (r < 0.4) {
      // 40% use case
      showCoin = randomFromArr(CRYPTOS);
      postText = randomFromArr(civilianUseCasePosts[showCoin]);
    } else if (r < 0.7) {
      // 30% market price history
      showCoin = randomFromArr(CRYPTOS);
      postText = randomFromArr(civilianMarketHistoryPosts[showCoin]);
    } else {
      // 30% news event, only if active
      if (activeNewsEvent) {
        usedNews = true;
        postText = randomFromArr(civilianNewsPosts)(activeNewsEvent);
      } else {
        // fallback to use-case if no news event
        showCoin = randomFromArr(CRYPTOS);
        postText = randomFromArr(civilianUseCasePosts[showCoin]);
      }
    }
  } else {
    // Influencer post
    const r = Math.random();
    if (r < 0.3) {
      // 30% FUD
      showCoin = randomFromArr(CRYPTOS);
      postText = randomFromArr(influencerFUDPosts)(showCoin);
    } else if (r < 0.6) {
      // 30% tech
      showCoin = randomFromArr(CRYPTOS);
      postText = randomFromArr(influencerTechPosts)(showCoin);
    } else {
      // 40% news, if active
      if (activeNewsEvent) {
        usedNews = true;
        postText = randomFromArr(influencerNewsPosts)(activeNewsEvent);
      } else {
        // fallback to tech if no news event
        showCoin = randomFromArr(CRYPTOS);
        postText = randomFromArr(influencerTechPosts)(showCoin);
      }
    }
  }

  let likes = isInfluencer ? Math.floor(Math.random() * 145) + 55 : Math.floor(Math.random() * 13);

  const newPost = {
    id: ++postId,
    user: npc.user,
    text: postText,
    timestamp: new Date().toLocaleString(),
    likes,
    liked: false,
    comments: [],
    showCommentBox: false,
    isInfluencer: isInfluencer
  };

  posts.unshift(newPost);

  // Market effect: influencer only, if post references news event, apply a small price jolt
  if (isInfluencer && usedNews && activeNewsEvent) {
    const coin = activeNewsEvent.coin;
    const base = parseFloat(coins[coin].price);
    const jolt = base * (Math.random() * 0.01 + 0.01); // 1-2% extra
    coins[coin].price = (base + jolt).toFixed(2);
    const dt = new Date();
    const timestamp = dt.toISOString().replace('T',' ').slice(0,19);
    priceHistory[coin].push({ time: timestamp, price: parseFloat(coins[coin].price) });
    if (priceHistory[coin].length > 50) priceHistory[coin].shift();
    renderMarket();
  }

  renderFeed();
  scheduleNextNpcPost();
}

// Schedules the next NPC post randomly 7-20 seconds from now
let npcPostTimeout = null;
function scheduleNextNpcPost() {
  if (npcPostTimeout) clearTimeout(npcPostTimeout);
  const next = Math.floor(Math.random()*13000) + 7000;
  npcPostTimeout = setTimeout(npcAutoPost, next);
}

// Like/Unlike
function likePost(id) {
  const post = posts.find(p => p.id === id);
  if (!post) return;
  if (post.liked) {
    post.liked = false;
    post.likes--;
  } else {
    post.liked = true;
    post.likes++;
  }
  renderFeed();
}
function toggleCommentBox(id) {
  posts.forEach(p => { if (p.id === id) p.showCommentBox = !p.showCommentBox; else p.showCommentBox = false; });
  renderFeed();
}
function addComment(id) {
  const commentInput = document.getElementById(`comment-input-${id}`);
  const text = commentInput.value.trim();
  if (!text) return;
  const post = posts.find(p => p.id === id);
  post.comments.push({
    user: "You",
    text,
    timestamp: new Date().toLocaleString()
  });
  commentInput.value = "";
  post.showCommentBox = false;
  renderFeed();
}
function sharePost(id) {
  alert("Shared post #" + id + " to your timeline!");
}
function renderFeed() {
  const feed = document.getElementById("feed");
  if (!feed) return;
  feed.innerHTML = posts.map(post => `
    <div class="social-post-card">
      <div class="post-header">
        <span class="post-username${post.isInfluencer ? " influencer-acc" : ""}">${post.user}${post.isInfluencer ? ' <span style="font-size:0.9em;color:#a400ff;">✔️</span>' : ""}</span>
        <span class="post-timestamp">${post.timestamp}</span>
      </div>
      <div class="post-content">${post.text}</div>
      <div class="post-actions">
        <button class="social-action-btn ${post.liked ? 'liked' : ''}" onclick="likePost(${post.id})">
          👍 Like${post.likes > 0 ? ` (${post.likes})` : ""}
        </button>
        <button class="social-action-btn" onclick="toggleCommentBox(${post.id})">💬 Comment</button>
        <button class="social-action-btn" onclick="sharePost(${post.id})">🔗 Share</button>
      </div>
      <div class="post-comments">
        ${post.comments.map(comment => `
          <div class="comment-row">
            <span class="comment-user">${comment.user}</span>
            <span class="comment-text">${comment.text}</span>
            <span class="comment-time">${comment.timestamp}</span>
          </div>
        `).join("")}
      </div>
      ${post.showCommentBox ? `
        <div class="comment-compose">
          <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." />
          <button class="social-btn" onclick="addComment(${post.id})">Post</button>
        </div>
      ` : ""}
    </div>
  `).join("");
}
window.renderFeed = renderFeed;
window.likePost = likePost;
window.toggleCommentBox = toggleCommentBox;
window.addComment = addComment;
window.sharePost = sharePost;

// --- MARKETCAP PAGE: Improved UI/UX with mini charts and live updating ---

const MARKETCAP_ASSETS = [
  {
    name: "NeuraX",
    logo: "assets/file_000000002e8061fbb00adf493d6a1134.png",
    coin: "NeuraX"
  },
  {
    name: "Solvex",
    logo: "assets/file_00000000c2d4622fb9f7ff0b3e1dfbe2.png",
    coin: "Solvex"
  },
  {
    name: "CoreChain",
    logo: "assets/C_20250615_233410_0000.png",
    coin: "CoreChain"
  }
];

// For live updating
let miniChartIntervals = {};
let fullChartInterval = null;
let currentFullChartCoin = null;

function showMarketcapFullChart(coinName) {
  // Clear previous interval and chart
  if (fullChartInterval) clearInterval(fullChartInterval);
  if (priceChart) {
    priceChart.destroy();
    priceChart = null;
  }
  currentFullChartCoin = coinName;

  // Set UI elements
  const asset = MARKETCAP_ASSETS.find(a => a.coin === coinName);
  if (!asset) return;
  document.getElementById("marketcap-fullchart-icon").src = asset.logo;
  document.getElementById("marketcap-fullchart-title").textContent = asset.name + " Chart";
  document.getElementById("marketcap-fullchart-container").style.display = "";

  // Draw chart immediately, then start live updating
  renderMarketcapFullChart(coinName);
  fullChartInterval = setInterval(() => {
    renderMarketcapFullChart(coinName);
  }, 2000);
}

function renderMarketcapList() {
  const container = document.getElementById("marketcap-list");
  if (!container) return;
  container.innerHTML = "";
  MARKETCAP_ASSETS.forEach(asset => {
    // Get coin data for price and change calculation
    const coinData = coins[asset.coin];
    if (!coinData) return;
    
    // Calculate price change (simplified - using a small random change for demo)
    const priceHistory = window.priceHistory && window.priceHistory[asset.coin] ? window.priceHistory[asset.coin] : [];
    let changePercent = 0;
    let changeClass = '';
    let changeSymbol = '';
    
    if (priceHistory.length >= 2) {
      const currentPrice = parseFloat(coinData.price);
      const previousPrice = priceHistory[priceHistory.length - 2].price;
      changePercent = ((currentPrice - previousPrice) / previousPrice * 100);
      
      if (changePercent > 0) {
        changeClass = 'up';
        changeSymbol = '+';
      } else if (changePercent < 0) {
        changeClass = 'down';
        changeSymbol = '';
      } else {
        changeClass = '';
        changeSymbol = '';
      }
    }
    
    // Create unique canvas id for each mini chart
    const miniChartId = `minichart-${asset.coin}`;
    const card = document.createElement("div");
    card.className = "marketcap-chart-card";
    card.innerHTML = `
      <div class="marketcap-card-header">
        <div class="marketcap-card-info">
          <img src="${asset.logo}" alt="${asset.name} Logo" class="marketcap-coin-logo" />
          <h3 class="marketcap-coin-name">${asset.name}</h3>
        </div>
        <div class="marketcap-card-price-change">
          <div class="marketcap-card-price">$${coinData.price}</div>
          <div class="marketcap-card-change ${changeClass}">
            ${changeSymbol}${Math.abs(changePercent).toFixed(2)}%
          </div>
        </div>
      </div>
      <div class="marketcap-chart-container">
        <canvas id="${miniChartId}" class="marketcap-minichart"></canvas>
      </div>
      <button class="marketcap-fullchart-btn" onclick="showMarketcapFullChart('${asset.coin}')">Show Full Chart</button>
    `;
    container.appendChild(card);
    drawMiniChart(asset.coin, miniChartId);
    if (miniChartIntervals[asset.coin]) clearInterval(miniChartIntervals[asset.coin]);
    miniChartIntervals[asset.coin] = setInterval(() => drawMiniChart(asset.coin, miniChartId), 2000);
  });
  document.getElementById("marketcap-fullchart-container").style.display = "none";
}

// Draws a minimal sparkline chart for last 40 seconds (last 5 samples if 8s/sample)
function drawMiniChart(coinName, canvasId) {
  const el = document.getElementById(canvasId);
  if (!el) return;
  const ctx = el.getContext('2d');
  // Get last 5 price points (approx 40s if 8s/sample)
  const data = priceHistory[coinName];
  if (!data || data.length < 2) return;
  const N = Math.min(5, data.length);
  const lastN = data.slice(-N);
  const prices = lastN.map(p => p.price);
  // Chart dimensions
  const W = el.width = el.offsetWidth || 200;
  const H = el.height = 60;
  ctx.clearRect(0, 0, W, H);
  // Find min/max for scaling
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  // Draw line with improved styling
  ctx.strokeStyle = "#16a34a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  prices.forEach((p, i) => {
    const x = (i / (N-1)) * (W-20) + 10;
    const y = H - 10 - ((p-minP) / (maxP-minP || 1)) * (H-20);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  // Dot for latest with improved styling
  ctx.beginPath();
  const lastX = ((N-1) / (N-1)) * (W-20) + 10;
  const lastY = H - 10 - ((prices[N-1]-minP) / (maxP-minP || 1)) * (H-20);
  ctx.arc(lastX, lastY, 5, 0, 2*Math.PI);
  ctx.fillStyle = "#16a34a";
  ctx.fill();
  // Add white border to dot
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function renderMarketcapFullChart(coinName) {
  const ctx = document.getElementById('priceChart').getContext('2d');
  const data = priceHistory[coinName];
  if (!data || data.length < 2) return;
  const labels = data.map(point => point.time);
  const prices = data.map(point => point.price);
  if (priceChart) priceChart.destroy();
  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `${coinName} Price`,
        data: prices,
        borderColor: '#16a34a',
        borderWidth: 3,
        tension: 0.15,
        fill: false,
        pointRadius: 2,
        pointBackgroundColor: '#16a34a',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        backgroundColor: "#dcfdf7"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      animation: false,
      scales: {
        x: {
          title: { display: true, text: "Time" },
          ticks: { autoSkip: true, maxTicksLimit: 10 }
        },
        y: {
          title: { display: true, text: "Price ($)" },
          beginAtZero: false
        }
      }
    }
  });
}

// PATCHED: Clear intervals and chart on navigation (now called from showSection)
function clearMarketcapIntervals() {
  Object.values(miniChartIntervals).forEach(interval => clearInterval(interval));
  miniChartIntervals = {};
  if (fullChartInterval) clearInterval(fullChartInterval);
  fullChartInterval = null;
  if (priceChart) {
    priceChart.destroy();
    priceChart = null;
  }
  currentFullChartCoin = null;
}

// --------- BlockBuzz News Section Logic (UPDATED) ---------

const NEWS_STORIES = [
  {
    coin: "NeuraX",
    headline: "neuraX blockchain used in brain chip",
    subtext: "Founder has announced that neuraX will power the network that facilitates the technology. Talks are already underway on the possible next steps proceeding this leap of humanity.",
    img: "assets/file_00000000e7b861f5b3a0f44ec2d40ad9 (2).png",
    effect: 1.35, // +35%
    effectText: "🚀 NeuraX surges after tech breakthrough!"
  },
  {
    coin: "Solvex",
    headline: "solvex founder under investigation",
    subtext: "Linel Whelsh, founder of Solvex blockchain network, found to have possibly hindered production assets to steer network's progress to personal preference. Investors are seeking answers as millions in possible increased revenue has been held back due to founder's beliefs.",
    img: "assets/file_00000000a59061f58e91626c0873f611 (1).png",
    effect: 0.68, // -32%
    effectText: "⚠️ Solvex tumbles on founder scandal!"
  },
  {
    coin: "CoreChain",
    headline: "CoreChain partnership with several major banking firms",
    subtext: "CoreChain is going financially mainstream as several contracts have been laid out and most are already finalized.",
    img: "assets/file_00000000706461f79097213a2bb8a7f2.png",
    effect: 1.25, // +25%
    effectText: "💼 CoreChain jumps on banking partnerships!"
  }
];

// News event engine
let activeNewsEvent = null;
let newsEventTimeout = null;
let newsCooldownUntil = 0;

// Every 1 minute, 30% chance to trigger a news event if not active and not in cooldown
function maybeTriggerNewsEvent() {
  const now = Date.now();
  if (activeNewsEvent || now < newsCooldownUntil) return;
  if (Math.random() < 0.3) {
    triggerNewsEvent();
  }
}

function triggerNewsEvent() {
  // Pick a random news story
  const idx = Math.floor(Math.random() * NEWS_STORIES.length);
  const story = NEWS_STORIES[idx];
  activeNewsEvent = {
    ...story,
    effect: story.effect * 2, // 2x effect
    startedAt: Date.now(),
    expiresAt: Date.now() + 3 * 60 * 1000 // 3 min
  };

  // Apply effect automatically
  const coin = story.coin;
  const oldPrice = parseFloat(coins[coin].price);
  const newPrice = (oldPrice * activeNewsEvent.effect).toFixed(2);
  coins[coin].price = newPrice;
  renderMarket();

  // Show news UI
  renderActiveNewsEvent();

  // Start timer to clear after 3 mins
  if (newsEventTimeout) clearTimeout(newsEventTimeout);
  newsEventTimeout = setTimeout(() => {
    clearActiveNewsEvent();
  }, 3 * 60 * 1000);

  // Set cooldown for next possible event
  newsCooldownUntil = Date.now() + 3 * 60 * 1000;
}

function clearActiveNewsEvent() {
  activeNewsEvent = null;
  renderActiveNewsEvent();
}

function renderActiveNewsEvent() {
  const newsFeed = document.getElementById("newsFeed");
  if (!newsFeed) return;
  if (!activeNewsEvent) {
    newsFeed.innerHTML = "";
    return;
  }
  newsFeed.innerHTML = `
    <div class="news-card">
      <img src="${activeNewsEvent.img}" alt="News Image" class="news-img" />
      <div class="news-headline">${activeNewsEvent.headline}</div>
      <div class="news-subtext">${activeNewsEvent.subtext}</div>
      <div class="news-story-footer">
        <span class="news-story-coin">${activeNewsEvent.coin}</span>
        <span style="font-weight:bold;color:#be2323;">${activeNewsEvent.effectText}</span>
        <span style="color:#888;font-size:0.95em;">Event ends in <span id="news-event-timer"></span></span>
      </div>
    </div>
  `;
  updateNewsEventTimer();
}

function updateNewsEventTimer() {
  if (!activeNewsEvent) return;
  const timerEl = document.getElementById('news-event-timer');
  if (!timerEl) return;
  const msLeft = Math.max(0, activeNewsEvent.expiresAt - Date.now());
  timerEl.textContent = `${Math.ceil(msLeft / 1000)}s`;
  if (msLeft > 0) {
    setTimeout(updateNewsEventTimer, 1000);
  }
}

// Start news event engine
setInterval(maybeTriggerNewsEvent, 60 * 1000);

// ---- NEWS FEED INITIALIZATION ----
document.addEventListener("DOMContentLoaded", function() {
  renderFeed();
  scheduleNextNpcPost();
  renderActiveNewsEvent();
});

function applyNewsEffect(coinName, multiplier) {
  const oldPrice = parseFloat(coins[coinName].price);
  const newPrice = (oldPrice * multiplier).toFixed(2);
  coins[coinName].price = newPrice;
  renderMarket();
  alert(`${coinName} reacted to the news! New price: $${newPrice}`);
}

setInterval(updateCoinPrices, 8000);
renderMarket();
showSection('results');

window.addEventListener('DOMContentLoaded', function() {
  const settingsIcon = document.getElementById('settings-icon');
  const settingsDropdown = document.getElementById('settings-dropdown');
  const resetGameBtn = document.getElementById('reset-game-btn');

  settingsIcon.onclick = function(event) {
    event.stopPropagation();
    settingsDropdown.style.display = (settingsDropdown.style.display === 'block') ? 'none' : 'block';
  };

  document.body.onclick = function() {
    settingsDropdown.style.display = 'none';
  };

  resetGameBtn.onclick = function() {
    if (confirm("Are you sure you want to reset your game?")) {
      resetGame();
    }
  };
});

// --- LEDGER: NET, CREDIT, DEBIT ---
function showBankAccountPage(accountData) {
  document.getElementById('bank-landing').style.display = 'none';
  document.getElementById('bank-account-summary').style.display = '';
  document.getElementById('accountName').textContent = accountData.name;
  document.getElementById('accountId').textContent = accountData.accountId;
  document.getElementById('bankAccountNumber').textContent = accountData.bankAccountNumber;
  document.getElementById('accountResidence').textContent = accountData.residence;
  document.getElementById('accountAge').textContent = accountData.age;

  // Calculate balances
  let credit = 0, debit = 0;
  const txs = getBankTransactions();
  txs.forEach(tx => {
    if (tx.amount > 0) credit += tx.amount;
    if (tx.amount < 0) debit += -tx.amount;
  });
  const netBalance = accountData.balance;

  document.getElementById('creditBalance').textContent = "$" + formatMoney(credit);
  document.getElementById('debitBalance').textContent = "$" + formatMoney(debit);
  document.getElementById('bankBalance').textContent = formatMoney(netBalance);
  document.getElementById('bankBalanceBig').textContent = "$" + formatMoney(netBalance);

  // Render last 5 transactions
  let txList = document.getElementById('transaction-list');
  txList.innerHTML = "";
  (txs.slice(0, 5)).forEach(tx => {
    const div = document.createElement('div');
    div.className = "transaction-entry";
    div.innerHTML = `
      <span class="transaction-type">${tx.type}</span>
      <span class="transaction-amount ${tx.amount > 0 ? 'credit' : 'debit'}">${tx.amount > 0 ? '+' : ''}${formatMoney(tx.amount)}</span>
      <span class="transaction-date">${tx.date}</span>
    `;
    txList.append(div);
  });
  if (txs.length === 0) {
    txList.innerHTML = `<em>No transactions yet.</em>`;
  }
}
