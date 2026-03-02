// =============================================
//  SwiftCipher - Main Application JS
// =============================================

const EXTERNAL_LINK = 'https://swiftcipherdashboard-web.github.io/Dashboard/';

// ── Navbar scroll effect ──────────────────────
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// ── Mobile menu toggle ────────────────────────
const menuToggle = document.querySelector('.menu-toggle');
const mobileOverlay = document.querySelector('.mobile-overlay');

if (menuToggle && mobileOverlay) {
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('open');
    mobileOverlay.classList.toggle('active');
    document.body.style.overflow = mobileOverlay.classList.contains('active') ? 'hidden' : '';
  });

  // Close on link click
  mobileOverlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('open');
      mobileOverlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

// ── Scroll fade-in animation ──────────────────
const fadeEls = document.querySelectorAll('.fade-up');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

fadeEls.forEach(el => observer.observe(el));

// ── Live Ticker (CoinGecko API) ───────────────
const COIN_IDS = 'bitcoin,ethereum,tether,binancecoin,solana,cardano,ripple';
const tickerTrack = document.querySelector('.ticker-track');

async function fetchTicker() {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${COIN_IDS}&vs_currencies=usd&include_24hr_change=true`);
    const data = await res.json();

    const coins = [
      { id: 'bitcoin',      sym: 'BTC', icon: '₿' },
      { id: 'ethereum',     sym: 'ETH', icon: 'Ξ' },
      { id: 'tether',       sym: 'USDT', icon: '₮' },
      { id: 'binancecoin',  sym: 'BNB', icon: 'B' },
      { id: 'solana',       sym: 'SOL', icon: '◎' },
      { id: 'cardano',      sym: 'ADA', icon: '₳' },
      { id: 'ripple',       sym: 'XRP', icon: 'X' },
    ];

    if (tickerTrack) {
      let html = '';
      coins.forEach(c => {
        if (data[c.id]) {
          const price = data[c.id].usd;
          const change = data[c.id].usd_24h_change?.toFixed(2);
          const dir = change >= 0 ? 'up' : 'down';
          const arrow = change >= 0 ? '▲' : '▼';
          html += `
            <div class="ticker-item">
              <span class="coin-name">${c.icon} ${c.sym}</span>
              <span class="price">$${price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              <span class="change ${dir}">${arrow} ${Math.abs(change)}%</span>
            </div>`;
        }
      });
      // Duplicate for seamless loop
      tickerTrack.innerHTML = html + html;
    }

    // Update hero asset prices if on home page
    updateHeroAssets(data);

  } catch (e) {
    // Use fallback static data if API fails
    console.warn('Ticker API unavailable, using fallback.');
    useFallbackTicker();
  }
}

function useFallbackTicker() {
  const fallback = [
    { sym: 'BTC', icon: '₿', price: '67,842.50', change: '+2.34%', dir: 'up' },
    { sym: 'ETH', icon: 'Ξ', price: '3,521.80', change: '+1.87%', dir: 'up' },
    { sym: 'USDT', icon: '₮', price: '1.000', change: '+0.01%', dir: 'up' },
    { sym: 'BNB', icon: 'B', price: '412.60', change: '+0.92%', dir: 'up' },
    { sym: 'SOL', icon: '◎', price: '184.30', change: '+3.12%', dir: 'up' },
    { sym: 'ADA', icon: '₳', price: '0.6812', change: '-0.44%', dir: 'down' },
    { sym: 'XRP', icon: 'X', price: '0.5934', change: '+1.21%', dir: 'up' },
  ];

  if (tickerTrack) {
    let html = '';
    fallback.forEach(c => {
      html += `
        <div class="ticker-item">
          <span class="coin-name">${c.icon} ${c.sym}</span>
          <span class="price">$${c.price}</span>
          <span class="change ${c.dir}">${c.dir === 'up' ? '▲' : '▼'} ${c.change.replace(/[+-]/,'')}</span>
        </div>`;
    });
    tickerTrack.innerHTML = html + html;
  }
}

function updateHeroAssets(data) {
  const priceMap = {
    'hero-btc-price': data.bitcoin?.usd,
    'hero-eth-price': data.ethereum?.usd,
    'hero-usdt-price': data.tether?.usd,
  };
  const changeMap = {
    'hero-btc-change': data.bitcoin?.usd_24h_change,
    'hero-eth-change': data.ethereum?.usd_24h_change,
    'hero-usdt-change': data.tether?.usd_24h_change,
  };

  Object.entries(priceMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el && val) el.textContent = '$' + val.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  });

  Object.entries(changeMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) {
      const pct = val.toFixed(2);
      el.textContent = (pct >= 0 ? '▲ +' : '▼ ') + pct + '%';
      el.className = 'asset-change-sm ' + (pct >= 0 ? 'up' : 'down');
    }
  });
}

// Run ticker
fetchTicker();
setInterval(fetchTicker, 30000); // refresh every 30s

// ── Mini sparkline chart (Hero) ───────────────
function drawSparkline(canvasId, data, color = '#F3BA2F') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth;
  const h = canvas.height = canvas.offsetHeight;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  ctx.clearRect(0, 0, w, h);

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, color.replace('#F3BA2F', 'rgba(243,186,47,0.25)').replace('#627EEA', 'rgba(98,126,234,0.25)').replace('#26A17B', 'rgba(38,161,123,0.25)'));
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  // Build path
  ctx.beginPath();
  data.forEach((val, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((val - min) / range) * (h * 0.8) - h * 0.1;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });

  // Stroke
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Fill
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
}

// Generate random walk sparkline data
function randomWalk(start, steps, volatility = 0.02) {
  let val = start;
  return Array.from({ length: steps }, () => {
    val = val * (1 + (Math.random() - 0.48) * volatility);
    return val;
  });
}

// Draw sparklines on load
window.addEventListener('load', () => {
  setTimeout(() => {
    drawSparkline('hero-sparkline', randomWalk(67000, 20, 0.03), '#F3BA2F');
    drawSparkline('market-btc-chart', randomWalk(67000, 30, 0.025), '#F7931A');
    drawSparkline('market-eth-chart', randomWalk(3500, 30, 0.03), '#627EEA');
    drawSparkline('market-usdt-chart', randomWalk(1.0, 30, 0.002), '#26A17B');
    drawSparkline('market-bnb-chart', randomWalk(410, 30, 0.025), '#F3BA2F');
    drawSparkline('market-sol-chart', randomWalk(183, 30, 0.04), '#9945FF');
    drawSparkline('market-ada-chart', randomWalk(0.68, 30, 0.035), '#0033AD');

    if (document.getElementById('main-chart-canvas')) {
      drawMainChart('1W');
    }
  }, 300);
});

// ── Main BTC Chart ────────────────────────────
let mainChartData = {};
let currentTab = '1W';

function generateOHLC(days, base, vol) {
  const labels = [];
  const prices = [];
  let price = base;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    price = price * (1 + (Math.random() - 0.48) * vol);
    prices.push(parseFloat(price.toFixed(2)));
  }
  return { labels, prices };
}

mainChartData = {
  '1D': generateOHLC(1, 67000, 0.008),
  '1W': generateOHLC(7, 65000, 0.02),
  '1M': generateOHLC(30, 60000, 0.025),
  '3M': generateOHLC(90, 55000, 0.03),
  '1Y': generateOHLC(365, 42000, 0.04),
};

function drawMainChart(period) {
  currentTab = period;
  const canvas = document.getElementById('main-chart-canvas');
  if (!canvas) return;

  const { labels, prices } = mainChartData[period];
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth;
  const h = canvas.height = canvas.offsetHeight;

  const min = Math.min(...prices) * 0.99;
  const max = Math.max(...prices) * 1.01;
  const range = max - min;

  ctx.clearRect(0, 0, w, h);

  const padL = 70, padR = 20, padT = 20, padB = 40;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  // Grid
  const gridLines = 5;
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= gridLines; i++) {
    const y = padT + (i / gridLines) * chartH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.stroke();

    // Y labels
    const val = max - (i / gridLines) * range;
    ctx.fillStyle = 'rgba(160,169,184,0.7)';
    ctx.font = '11px Inter';
    ctx.textAlign = 'right';
    ctx.fillText('$' + val.toLocaleString('en-US', {maximumFractionDigits: 0}), padL - 8, y + 4);
  }

  // X labels (every Nth)
  const step = Math.max(1, Math.floor(labels.length / 7));
  ctx.fillStyle = 'rgba(160,169,184,0.7)';
  ctx.font = '11px Inter';
  ctx.textAlign = 'center';
  labels.forEach((lbl, i) => {
    if (i % step === 0) {
      const x = padL + (i / (prices.length - 1)) * chartW;
      ctx.fillText(lbl, x, h - 8);
    }
  });

  // Area gradient
  const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
  grad.addColorStop(0, 'rgba(243, 186, 47, 0.2)');
  grad.addColorStop(1, 'rgba(243, 186, 47, 0)');

  ctx.beginPath();
  prices.forEach((price, i) => {
    const x = padL + (i / (prices.length - 1)) * chartW;
    const y = padT + (1 - (price - min) / range) * chartH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });

  // Line
  ctx.strokeStyle = '#F3BA2F';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Fill
  const lastX = padL + chartW;
  const lastY = padT + chartH;
  ctx.lineTo(lastX, lastY);
  ctx.lineTo(padL, lastY);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
}

// Tab switching
document.querySelectorAll('.chart-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    drawMainChart(tab.dataset.period);
  });
});

window.addEventListener('resize', () => {
  if (document.getElementById('main-chart-canvas')) {
    drawMainChart(currentTab);
  }
  setTimeout(() => {
    drawSparkline('hero-sparkline', randomWalk(67000, 20, 0.03), '#F3BA2F');
    drawSparkline('market-btc-chart', randomWalk(67000, 30, 0.025), '#F7931A');
    drawSparkline('market-eth-chart', randomWalk(3500, 30, 0.03), '#627EEA');
    drawSparkline('market-usdt-chart', randomWalk(1.0, 30, 0.002), '#26A17B');
    drawSparkline('market-bnb-chart', randomWalk(410, 30, 0.025), '#F3BA2F');
    drawSparkline('market-sol-chart', randomWalk(183, 30, 0.04), '#9945FF');
    drawSparkline('market-ada-chart', randomWalk(0.68, 30, 0.035), '#0033AD');
  }, 100);
});

// ── Counter animation ─────────────────────────
function animateCounter(el, target, suffix = '', prefix = '') {
  const duration = 2000;
  const start = performance.now();
  const isFloat = target % 1 !== 0;

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = isFloat ? (ease * target).toFixed(1) : Math.floor(ease * target);
    el.textContent = prefix + current.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      animateCounter(el, target, suffix, prefix);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

// ── Active nav link ───────────────────────────
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(link => {
  if (link.getAttribute('href') === currentPage || (currentPage === '' && link.getAttribute('href') === 'index.html')) {
    link.classList.add('active');
  }
});
