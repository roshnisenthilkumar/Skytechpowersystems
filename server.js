/**
 * ============================================================
 * SKYTECH POWER SYSTEMS — server.js  (INT222 Full Coverage)
 * ============================================================
 * Unit I  : Node.js, npm, EventEmitter, Callbacks
 * Unit II : fs module, Streams, Zlib, Promises, async/await
 * Unit III: Express, GET, POST, Router, express-validator, Errors
 * Unit IV : HTTP module, Request/Response, Routing, Status codes
 * Unit V  : Socket.IO, Middleware, cookie-parser, session, JWT, RBAC
 * Unit VI : MongoDB, Mongoose, CRUD, Pagination, REST, Deployment
 * ============================================================
 */

'use strict';

// ── Unit I: Core Node.js modules ─────────────────────────────
const http             = require('http');
const path             = require('path');
const fs               = require('fs');
const zlib             = require('zlib');
const { EventEmitter } = require('events');

// ── Unit III: Express + third-party ──────────────────────────
const express      = require('express');
const mongoose     = require('mongoose');
const cookieParser = require('cookie-parser');
const session      = require('express-session');
const cors         = require('cors');
const morgan       = require('morgan');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const { Server }   = require('socket.io');
require('dotenv').config();

// ── Route files ───────────────────────────────────────────────
const authRoutes    = require('./routes/auth');
const enquiryRoutes = require('./routes/enquiry');
const reviewRoutes  = require('./routes/review');
const productRoutes = require('./routes/product');
const adminRoutes   = require('./routes/admin');

// ── Middleware files ──────────────────────────────────────────
const { authenticateToken } = require('./middleware/auth');
const errorHandler          = require('./middleware/errorHandler');
const requestLogger         = require('./middleware/requestLogger');

// ── Database ──────────────────────────────────────────────────
const connectDB = require('./config/database');

// ══════════════════════════════════════════════════════════════
//  UNIT I: EventEmitter — custom app event bus
// ══════════════════════════════════════════════════════════════
class AppEvents extends EventEmitter {}
const appEvents = new AppEvents();

appEvents.on('enquiry:new',  d => console.log(`📩 [EVENT] Enquiry: ${d.name} → ${d.service}`));
appEvents.on('review:new',   d => console.log(`⭐ [EVENT] Review: ${d.name} — ${d.stars} stars`));
appEvents.on('user:login',   d => console.log(`🔐 [EVENT] Login: ${d.email}`));
appEvents.on('chat:message', d => console.log(`💬 [EVENT] Chat: ${d.name}: ${d.message}`));
appEvents.on('server:start', d => console.log(`🚀 [EVENT] Server up on port ${d.port}`));

// ══════════════════════════════════════════════════════════════
//  UNIT II: fs module — ensure logs directory exists
// ══════════════════════════════════════════════════════════════
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Callback-based log write (Unit I: Callbacks)
const writeLog = (file, msg, cb) => {
  fs.appendFile(path.join(logsDir, file), `[${new Date().toISOString()}] ${msg}\n`, cb || (() => {}));
};

writeLog('startup.log', 'Server process started...');

// ══════════════════════════════════════════════════════════════
//  UNIT II: Zlib — compress app info on startup
// ══════════════════════════════════════════════════════════════
const appInfo = JSON.stringify({ app: 'Skytech', version: '1.0.0', started: new Date() });
zlib.gzip(Buffer.from(appInfo), (err, buf) => {
  if (!err) {
    fs.writeFile(path.join(logsDir, 'app_info.gz'), buf, () => {
      console.log(`📦 [Zlib] Compressed app info → ${buf.length} bytes`);
    });
  }
});

// ══════════════════════════════════════════════════════════════
//  EXPRESS APP + HTTP SERVER
// ══════════════════════════════════════════════════════════════
const app    = express();
const server = http.createServer(app);  // Unit IV: HTTP module

// ── Unit V: Socket.IO ─────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.set('io', io);
app.set('appEvents', appEvents);

// ══════════════════════════════════════════════════════════════
//  MIDDLEWARE STACK (Unit V: Creating middlewares)
// ══════════════════════════════════════════════════════════════

// Security headers (Unit V: helmet)
app.use(helmet({ contentSecurityPolicy: false }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));                              // HTTP logger
app.use(express.json());                            // Unit III: body parser
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET));  // Unit V: cookie-parser
app.use(session({                                   // Unit V: express-session
  secret: process.env.SESSION_SECRET || 'skytech_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(requestLogger);                             // Unit V: custom middleware
app.use(express.static(path.join(__dirname, 'public')));

// ══════════════════════════════════════════════════════════════
//  ROUTES (Unit III + IV)
// ══════════════════════════════════════════════════════════════
app.use('/api/v1/auth',     authRoutes);
app.use('/api/v1/enquiry',  enquiryRoutes);
app.use('/api/v1/reviews',  reviewRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/admin',    authenticateToken, adminRoutes);

// Serve frontend
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Health check (Unit IV: setting response headers + status codes)
app.get('/api/v1/health', (req, res) => {
  res.setHeader('X-App', 'Skytech Power Systems');
  res.status(200).json({
    status: 'OK', message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Unit II: Stream endpoint demo
app.get('/api/v1/stream', (req, res) => {
  const { Readable } = require('stream');
  const readable = new Readable({ read() {} });
  readable.push(JSON.stringify({ message: 'Streaming from Sky Tech API', time: new Date() }));
  readable.push(null);
  res.setHeader('Content-Type', 'application/json');
  readable.pipe(res);
});

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found', path: req.path }));

// Global error handler (Unit III)
app.use(errorHandler);

// ══════════════════════════════════════════════════════════════
//  SOCKET.IO — Real-time Chat with AI responses (Unit V)
// ══════════════════════════════════════════════════════════════
const onlineUsers = new Map();

// ── AI Knowledge Base for Sky Tech Products ──────────────────
const AI_KB = {
  ups: {
    keywords: ['ups', 'uninterruptible', 'power supply', 'online ups', 'offline ups', 'inverter ups'],
    products: [
      { name: 'Online UPS 6 KVA', price: '₹78,000', brand: 'Numeric', specs: 'Single Phase, 6 KVA' },
      { name: 'HYKON 10 KVA Industrial UPS', price: '₹1,45,000', brand: 'HYKON', specs: '3 Phase IN/OUT' },
      { name: 'APC 60 KVA Online UPS', price: '₹19,90,000', brand: 'APC', specs: '3 Phase IN/OUT, 60 KVA' },
      { name: 'IGBT Online UPS 5 KVA', price: '₹24,500', brand: 'Hitachi', specs: '1 Phase IN/OUT' },
      { name: '1 KVA Online UPS', price: '₹18,500', brand: 'Numeric', specs: 'Single Phase, 1 KVA' },
      { name: 'Numeric 15 KVA Online UPS', price: '₹3,20,000', brand: 'Numeric', specs: '3 Phase, 15 KVA' },
    ],
    info: 'We are authorized dealers for Numeric, APC, Hitachi, and HYKON UPS systems. All UPS systems come with warranty and AMC support.'
  },
  solar: {
    keywords: ['solar', 'ongrid', 'offgrid', 'off-grid', 'on-grid', 'solar pump', 'water pump', 'panel', 'inverter solar'],
    products: [
      { name: 'Ongrid Solar System 3 KW', price: 'Price on Request', brand: 'Multiple', specs: 'Grid-tied, No battery needed, Net metering eligible' },
      { name: 'Ongrid Solar System 5 KW', price: 'Price on Request', brand: 'Multiple', specs: 'Grid-tied, Reduces bill by 90%' },
      { name: 'Offline Solar UPS 2 KVA', price: 'Price on Request', brand: 'Multiple', specs: 'Battery backup 6-12 hours, Works without grid' },
      { name: 'Offline Solar UPS 5 KVA', price: 'Price on Request', brand: 'Multiple', specs: 'Battery backup, Ideal for homes & shops' },
      { name: 'Solar Water Pump 1 HP', price: 'Price on Request', brand: 'Multiple', specs: 'PM-KUSUM eligible, Agriculture use' },
      { name: 'Solar Water Pump 5 HP', price: 'Price on Request', brand: 'Multiple', specs: 'Borewell, drip irrigation, Zero running cost' },
    ],
    info: 'We offer complete solar solutions — supply, installation, and AMC. Eligible for PM Surya Ghar and PM-KUSUM government subsidies. Free site survey available.'
  },
  battery: {
    keywords: ['battery', 'tubular', 'smf', 'vrla', 'inverter battery', 'backup', 'ah', 'ampere'],
    products: [
      { name: 'Exide Tubular Battery 150 AH', price: '₹14,500', brand: 'Exide', specs: '5 Year warranty, Tall Tubular' },
      { name: 'Exide Tubular Battery 200 AH', price: '₹18,200', brand: 'Exide', specs: '5 Year warranty, Tall Tubular' },
      { name: 'Luminous Tubular Battery 150 AH', price: '₹13,800', brand: 'Luminous', specs: '4 Year warranty, Red Charge series' },
      { name: 'Okaya SMF Battery 150 AH', price: '₹12,800', brand: 'Okaya', specs: 'VRLA/SMF, Maintenance free' },
      { name: 'SF Sonic Battery 100 AH', price: '₹9,500', brand: 'SF Sonic', specs: 'SMF, Sealed maintenance free' },
      { name: 'Microtek MTek+ Battery 150 AH', price: '₹13,200', brand: 'Microtek', specs: '3.5 Year warranty, Tubular' },
    ],
    info: 'We stock all major battery brands — Exide, Luminous, Okaya, Microtek, and SF Sonic. All batteries are genuine and come with full warranty.'
  },
  stabilizer: {
    keywords: ['stabilizer', 'voltage', 'servo', 'avr', 'cvt', 'regulator'],
    products: [
      { name: 'Single Phase Stabilizer 5 KVA', price: '₹8,500', brand: 'Multiple', specs: 'Servo controlled, Single phase' },
      { name: 'Three Phase Stabilizer 10 KVA', price: '₹45,000', brand: 'Multiple', specs: 'Servo controlled, Industrial use' },
      { name: 'Three Phase Stabilizer 30 KVA', price: '₹1,10,000', brand: 'Multiple', specs: 'Industrial, Heavy duty' },
    ],
    info: 'We supply servo voltage stabilizers for homes, offices, and industrial use. Available in single and three phase configurations.'
  },
  inverter: {
    keywords: ['home inverter', 'lift inverter', 'inverter', 'power backup', 'home ups'],
    products: [
      { name: 'Home Inverter 700 VA', price: '₹4,500', brand: 'Luminous', specs: 'Suitable for home use, Pure sine wave' },
      { name: 'Home Inverter 1500 VA', price: '₹7,800', brand: 'Microtek', specs: 'Heavy duty, 3 fans + TV + lights' },
      { name: 'Lift Inverter 10 KVA', price: 'Price on Request', brand: 'Multiple', specs: 'Dedicated lift backup, 3 phase' },
    ],
    info: 'We supply home inverters and dedicated lift inverter systems for residential apartments and commercial buildings.'
  },
  amc: {
    keywords: ['amc', 'maintenance', 'service', 'repair', 'annual', 'contract'],
    products: [],
    info: 'We offer Annual Maintenance Contracts (AMC) for all brands of UPS, batteries, inverters, and solar systems. 24/7 emergency support is included. Call +91-99945 06370 for AMC pricing.'
  },
  contact: {
    keywords: ['address', 'location', 'phone', 'call', 'email', 'contact', 'where', 'hours', 'timing', 'visit'],
    products: [],
    info: 'Sky Tech Power Systems\n📍 5/270, Balaji Complex, 7th Street Ext, Opp. Syndicate Bank, Gandhipuram, Coimbatore – 641012\n📞 +91-99945 06370\n✉ skytechpowersystems@gmail.com\n🕐 Monday – Saturday: 9:00 AM – 9:00 PM'
  },
  survey: {
    keywords: ['survey', 'site visit', 'free', 'quote', 'estimate', 'assessment'],
    products: [],
    info: 'We offer FREE Technical Site Survey! Our expert engineers will visit your site, assess your power needs, and give you a detailed quotation — at no cost. Call +91-99945 06370 to book your free survey.'
  }
};

// ── AI Chat Response Generator ────────────────────────────────
const generateAIResponse = (message) => {
  const msg = message.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|hlo|hii|good|namaste|vanakkam)/.test(msg)) {
    return `Hello! 👋 Welcome to **Sky Tech Power Systems** support chat.\n\nI can help you with:\n⚡ UPS Systems\n☀️ Solar Solutions\n🔋 Batteries\n📊 Stabilizers\n🔌 Lift Inverters\n🛠️ AMC & Service\n\nWhat do you need help with today?`;
  }

  // Thanks / bye
  if (/(thank|thanks|bye|goodbye|ok thanks|got it)/.test(msg)) {
    return `You're welcome! 😊 If you need any further help, feel free to ask.\n\nFor quick assistance, call us at 📞 **+91-99945 06370**\n\nWe're open Monday – Saturday: **9 AM – 9 PM**.`;
  }

  // Search knowledge base
  for (const [category, data] of Object.entries(AI_KB)) {
    const matched = data.keywords.some(kw => msg.includes(kw));
    if (matched) {
      let response = `**${category.toUpperCase()} — Sky Tech Power Systems**\n\n`;
      response += data.info + '\n';

      if (data.products.length > 0) {
        response += `\n📦 **Our Products:**\n`;
        data.products.forEach(p => {
          response += `\n• **${p.name}**\n  Brand: ${p.brand} | Price: ${p.price}\n  ${p.specs}`;
        });
        response += `\n\n📞 For enquiry & pricing: **+91-99945 06370**\nOr go to the **Contact** page to send an enquiry form.`;
      }
      return response;
    }
  }

  // Price query
  if (/(price|cost|rate|how much|pricing|charges)/.test(msg)) {
    return `For accurate pricing, it depends on your specific requirements.\n\n💡 **Quick Prices:**\n• Home Inverter: from ₹4,500\n• UPS Systems: from ₹18,500\n• Batteries: from ₹9,500\n• Solar Systems: Site-dependent (free survey needed)\n\n📞 Call us for exact pricing: **+91-99945 06370**\nOr fill the **Contact** form for a detailed quote.`;
  }

  // Warranty
  if (/(warranty|guarantee|guarantee|support after)/.test(msg)) {
    return `**Warranty Information — Sky Tech:**\n\n🔋 Batteries: 3–5 years (brand dependent)\n⚡ UPS Systems: 1–2 years + AMC available\n☀️ Solar Panels: 25 years performance warranty\n📊 Stabilizers: 1 year warranty\n\nWe also offer **Annual Maintenance Contracts (AMC)** for all products with 24/7 emergency support.\n\n📞 Call: +91-99945 06370`;
  }

  // Default — helpful fallback
  return `I'm not sure about that specifically, but here's how I can help:\n\n🔍 **Ask me about:**\n• "What UPS systems do you have?"\n• "Tell me about solar solutions"\n• "What batteries are available?"\n• "How much does a stabilizer cost?"\n• "What is your address?"\n• "Do you offer free site survey?"\n\nOr contact us directly:\n📞 **+91-99945 06370**\n✉ skytechpowersystems@gmail.com`;
};

// ── Socket.IO connection handler ─────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 [Socket.IO] Connected: ${socket.id}`);

  socket.on('user:join', (data) => {
    onlineUsers.set(socket.id, { name: data.name, room: data.room || 'general' });
    socket.join(data.room || 'general');
    io.to(data.room || 'general').emit('user:joined', {
      name: data.name,
      message: `${data.name} joined the chat`,
      timestamp: new Date().toISOString(),
      onlineCount: onlineUsers.size
    });

    // AI welcome message
    setTimeout(() => {
      socket.emit('message:receive', {
        id: Date.now(),
        name: '🤖 Sky Tech AI',
        message: `Hello ${data.name}! 👋 Welcome to Sky Tech Power Systems support.\n\nI can answer your questions about UPS, Solar, Batteries, Stabilizers, and more. What can I help you with?`,
        timestamp: new Date().toISOString(),
        isAI: true
      });
    }, 600);
  });

  socket.on('message:send', (data) => {
    const user = onlineUsers.get(socket.id);
    const msgData = {
      id: Date.now(),
      name: user ? user.name : 'User',
      message: data.message,
      timestamp: new Date().toISOString(),
      isAI: false
    };

    // Broadcast human message to room
    io.to(data.room || 'general').emit('message:receive', msgData);
    appEvents.emit('chat:message', msgData);

    // Save to DB if needed
    const { ChatMsg } = require('./models');
    new ChatMsg({ name: msgData.name, message: msgData.message, room: data.room || 'general' })
      .save().catch(() => {});

    // Generate AI response
    setTimeout(() => {
      const aiReply = generateAIResponse(data.message);
      socket.emit('message:receive', {
        id: Date.now() + 1,
        name: '🤖 Sky Tech AI',
        message: aiReply,
        timestamp: new Date().toISOString(),
        isAI: true
      });
    }, 800 + Math.random() * 600); // slight delay for natural feel
  });

  socket.on('user:typing', (data) => {
    const user = onlineUsers.get(socket.id);
    socket.to(data.room || 'general').emit('user:typing', {
      name: user ? user.name : 'Someone'
    });
  });

  socket.on('rating:new', (data) => io.emit('rating:updated', data));

  socket.on('enquiry:submit', (data) => {
    io.emit('admin:enquiry', { ...data, timestamp: new Date().toISOString() });
  });

  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      io.to(user.room).emit('user:left', {
        name: user.name,
        message: `${user.name} left the chat`,
        onlineCount: onlineUsers.size - 1
      });
      onlineUsers.delete(socket.id);
    }
  });
});

// ══════════════════════════════════════════════════════════════
//  START SERVER — async/await (Unit II: Promises)
// ══════════════════════════════════════════════════════════════
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      writeLog('startup.log', `Server started on port ${PORT}`);
      appEvents.emit('server:start', { port: PORT });

      console.log(`
╔══════════════════════════════════════════════════════╗
║        SKYTECH POWER SYSTEMS — SERVER STARTED        ║
╠══════════════════════════════════════════════════════╣
║  🌐 Website    : http://localhost:${PORT}               ║
║  📊 Admin      : http://localhost:${PORT}/admin.html    ║
║  📡 API        : http://localhost:${PORT}/api/v1        ║
║  🔌 Socket.IO  : Active                              ║
║  🤖 AI Chat    : Active                              ║
║  📦 MongoDB    : Connected                           ║
╚══════════════════════════════════════════════════════╝`);
    });
  } catch (err) {
    writeLog('errors.log', `STARTUP ERROR: ${err.message}`);
    console.error('⚠️  Database connection failed. Proceeding without MongoDB:', err.message);
    // process.exit(1); // Allow server to start even if DB is down for UI viewing
  }
};

startServer();
module.exports = { app, server, io, appEvents };
