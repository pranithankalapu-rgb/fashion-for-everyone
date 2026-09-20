import pptxgen from 'pptxgenjs';
import path from 'path';
import fs from 'fs';

const OUTPUT_FILE = path.resolve('./Fashion_for_Everyone_Presentation.pptx');
const SCREENSHOTS_DIR = path.resolve('./presentation_assets/screenshots');

function getScreenshotPath(filename) {
  const p = path.join(SCREENSHOTS_DIR, filename);
  return fs.existsSync(p) ? p : null;
}

const pres = new pptxgen();
pres.defineLayout({ name: 'WIDESCREEN_16_9', width: 13.333, height: 7.5 });
pres.layout = 'WIDESCREEN_16_9';

// Color Palette Constants
const C = {
  bg: '0A0F1D',
  cardBg: '131C31',
  cardBgLight: '18233C',
  cardBorder: '25334D',
  gold: 'F59E0B',
  goldLight: 'FDE68A',
  rose: 'F43F5E',
  roseLight: 'FECDD3',
  purple: 'A855F7',
  purpleLight: 'E9D5FF',
  emerald: '10B981',
  emeraldLight: 'A7F3D0',
  sky: '0EA5E9',
  skyLight: 'BAE6FD',
  textWhite: 'FFFFFF',
  textLight: 'E2E8F0',
  textMuted: '94A3B8',
  textDim: '64748B',
  badgeBg: '1E293B',
};

// Helper: Common Header
function addSlideHeader(slide, category, title, subtitle) {
  // Category Pill
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.8,
    y: 0.45,
    w: Math.max(1.8, category.length * 0.11 + 0.5),
    h: 0.32,
    fill: { color: C.badgeBg },
    line: { color: C.cardBorder, width: 1 },
    rectRadius: 0.16,
  });
  slide.addText(category.toUpperCase(), {
    x: 0.8,
    y: 0.45,
    w: Math.max(1.8, category.length * 0.11 + 0.5),
    h: 0.32,
    fontSize: 9,
    fontFace: 'Calibri',
    bold: true,
    color: C.gold,
    align: 'center',
    valign: 'middle',
  });

  // Main Slide Title
  slide.addText(title, {
    x: 0.8,
    y: 0.85,
    w: 11.7,
    h: 0.55,
    fontSize: 22,
    fontFace: 'Georgia',
    bold: true,
    color: C.textWhite,
  });

  // Subtitle
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.8,
      y: 1.4,
      w: 11.7,
      h: 0.35,
      fontSize: 11,
      fontFace: 'Calibri',
      color: C.textMuted,
    });
  }
}

// Helper: Create a Standard Card
function addCard(slide, x, y, w, h, options = {}) {
  const bg = options.fillColor || C.cardBg;
  const border = options.borderColor || C.cardBorder;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x,
    y,
    w,
    h,
    fill: { color: bg },
    line: { color: border, width: options.borderWidth || 1 },
    rectRadius: options.radius || 0.15,
  });
  if (options.accentColor) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x,
      y,
      w,
      h: 0.08,
      fill: { color: options.accentColor },
      line: { color: options.accentColor },
      rectRadius: 0.04,
    });
  }
}

// Helper: Draw Flow Node
function addFlowNode(slide, x, y, w, h, text, subtext, color = C.gold, stepNum = null) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x,
    y,
    w,
    h,
    fill: { color: C.cardBg },
    line: { color: color, width: 1.5 },
    rectRadius: 0.14,
  });

  if (stepNum !== null) {
    // Mini circular step badge
    slide.addShape(pres.shapes.OVAL, {
      x: x + 0.12,
      y: y + h / 2 - 0.18,
      w: 0.36,
      h: 0.36,
      fill: { color: color },
      line: { color: color },
    });
    slide.addText(String(stepNum), {
      x: x + 0.12,
      y: y + h / 2 - 0.18,
      w: 0.36,
      h: 0.36,
      fontSize: 9,
      fontFace: 'Calibri',
      bold: true,
      color: '0A0F1D',
      align: 'center',
      valign: 'middle',
    });
  }

  const textX = stepNum !== null ? x + 0.55 : x + 0.12;
  const textW = stepNum !== null ? w - 0.65 : w - 0.24;

  if (subtext) {
    slide.addText(
      [
        { text: text + '\n', options: { fontSize: 10, bold: true, color: C.textWhite } },
        { text: subtext, options: { fontSize: 8, color: C.textMuted } },
      ],
      {
        x: textX,
        y: y + 0.06,
        w: textW,
        h: h - 0.12,
        fontFace: 'Calibri',
        valign: 'middle',
      }
    );
  } else {
    slide.addText(text, {
      x: textX,
      y,
      w: textW,
      h,
      fontSize: 10.5,
      fontFace: 'Calibri',
      bold: true,
      color: C.textWhite,
      valign: 'middle',
    });
  }
}

// Helper: Flow Arrow
function addArrow(slide, x1, y1, x2, y2, color = C.gold) {
  const isHorizontal = Math.abs(y2 - y1) < 0.2;
  if (isHorizontal) {
    slide.addText('➔', {
      x: Math.min(x1, x2),
      y: y1 - 0.15,
      w: Math.abs(x2 - x1),
      h: 0.3,
      fontSize: 13,
      color: color,
      align: 'center',
      valign: 'middle',
    });
  } else {
    slide.addText('↓', {
      x: x1 - 0.2,
      y: Math.min(y1, y2),
      w: 0.4,
      h: Math.abs(y2 - y1),
      fontSize: 14,
      color: color,
      align: 'center',
      valign: 'middle',
    });
  }
}

// ==========================================
// SLIDE 1: TITLE SLIDE
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };

  // Background subtle decorative accent glow
  s.addShape(pres.shapes.OVAL, {
    x: 0.5,
    y: 0.5,
    w: 5,
    h: 5,
    fill: { color: '1A1D36', transparency: 75 },
    line: { color: '000000', transparency: 100 },
  });

  // Left Side: Branding and Hero Text
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 1.0,
    y: 1.0,
    w: 2.8,
    h: 0.38,
    fill: { color: C.badgeBg },
    line: { color: C.cardBorder, width: 1 },
    rectRadius: 0.19,
  });
  s.addText('ENTERPRISE FASHION-TECH PLATFORM', {
    x: 1.0,
    y: 1.0,
    w: 2.8,
    h: 0.38,
    fontSize: 9,
    fontFace: 'Calibri',
    bold: true,
    color: C.gold,
    align: 'center',
    valign: 'middle',
  });

  s.addText('Fashion for Everyone', {
    x: 1.0,
    y: 1.55,
    w: 6.2,
    h: 1.4,
    fontSize: 42,
    fontFace: 'Georgia',
    bold: true,
    color: C.textWhite,
  });

  s.addText('AI-Powered Fashion Discovery & Shopping Platform', {
    x: 1.0,
    y: 3.0,
    w: 5.8,
    h: 0.8,
    fontSize: 18,
    fontFace: 'Calibri',
    color: C.goldLight,
  });

  s.addText(
    'A unified multi-tenant ecosystem bridging Customers, Independent Designers, and Retailers with AI-assisted styling, community color voting, live inventory synchronization, and omnichannel order fulfillment.',
    {
      x: 1.0,
      y: 3.9,
      w: 5.5,
      h: 1.2,
      fontSize: 12,
      fontFace: 'Calibri',
      color: C.textMuted,
    }
  );

  // Metadata Card
  addCard(s, 1.0, 5.3, 5.5, 1.4, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.gold });
  s.addText(
    [
      { text: 'VERIFIED ARCHITECTURE STACK:\n', options: { fontSize: 10, bold: true, color: C.gold } },
      { text: '• Full-Stack Web: ', options: { fontSize: 10, bold: true, color: C.textWhite } },
      { text: 'React 19, TypeScript, Vite 8, Tailwind CSS v4\n', options: { fontSize: 10, color: C.textMuted } },
      { text: '• Mobile Experience: ', options: { fontSize: 10, bold: true, color: C.textWhite } },
      { text: 'React Native 0.86, Expo 57, Android APK Configuration\n', options: { fontSize: 10, color: C.textMuted } },
      { text: '• Backend & Database: ', options: { fontSize: 10, bold: true, color: C.textWhite } },
      { text: 'Express 5, Prisma ORM 5.22, PostgreSQL, Socket.io Real-Time Engine', options: { fontSize: 10, color: C.textMuted } },
    ],
    { x: 1.2, y: 5.4, w: 5.1, h: 1.2, fontFace: 'Calibri' }
  );

  // Right Side: High-Res Application Showcase Mockup
  const heroImg = getScreenshotPath('01_customer_home.png');
  addCard(s, 6.9, 1.0, 5.4, 5.7, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.rose });
  s.addText('LIVE APPLICATION DASHBOARD', {
    x: 7.1,
    y: 1.15,
    w: 5.0,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.roseLight,
  });

  if (heroImg) {
    s.addImage({
      path: heroImg,
      x: 7.1,
      y: 1.5,
      w: 5.0,
      h: 5.0,
      sizing: { type: 'contain', w: 5.0, h: 5.0 },
    });
  }
}

// ==========================================
// SLIDE 2: THE PROBLEM
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addSlideHeader(
    s,
    'Problem Statement',
    'The Modern Fashion Discovery & Fragmentation Dilemma',
    'Real systemic friction experienced by fashion consumers, independent creators, and fashion merchants today.'
  );

  const problems = [
    {
      num: '01',
      title: 'Discovery Overwhelm',
      desc: 'Consumers face millions of unsorted items with generic search engines that ignore personal body shape, skin tone, and individual proportions.',
      color: C.rose,
    },
    {
      num: '02',
      title: 'Styling Indecision',
      desc: 'Users struggle with daily outfit coordination, color matching, and occasion-specific etiquette without personalized stylist guidance.',
      color: C.gold,
    },
    {
      num: '03',
      title: 'Stylist Exclusivity',
      desc: 'Personal styling has traditionally been an expensive luxury service inaccessible to everyday consumers seeking confidence in their appearance.',
      color: C.purple,
    },
    {
      num: '04',
      title: 'Color Coordination Gap',
      desc: 'Lack of community feedback on color harmonies, leading to uncertainty when combining seasonal palettes, undertones, and silhouettes.',
      color: C.sky,
    },
    {
      num: '05',
      title: 'Siloed Ecosystem',
      desc: 'Disconnection between Customers (who want curation), Designers (who need exposure), and Retailers (who manage physical store inventory).',
      color: C.emerald,
    },
  ];

  problems.forEach((p, idx) => {
    const x = 0.8 + idx * 2.38;
    const y = 2.0;
    const w = 2.25;
    const h = 4.7;

    addCard(s, x, y, w, h, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: p.color });

    // Number Badge
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.2,
      y: y + 0.3,
      w: 0.6,
      h: 0.35,
      fill: { color: C.badgeBg },
      line: { color: p.color, width: 1 },
      rectRadius: 0.1,
    });
    s.addText(p.num, {
      x: x + 0.2,
      y: y + 0.3,
      w: 0.6,
      h: 0.35,
      fontSize: 11,
      fontFace: 'Calibri',
      bold: true,
      color: p.color,
      align: 'center',
      valign: 'middle',
    });

    s.addText(p.title, {
      x: x + 0.2,
      y: y + 0.85,
      w: w - 0.4,
      h: 0.8,
      fontSize: 15,
      fontFace: 'Georgia',
      bold: true,
      color: C.textWhite,
    });

    s.addText(p.desc, {
      x: x + 0.2,
      y: y + 1.8,
      w: w - 0.4,
      h: 2.5,
      fontSize: 11,
      fontFace: 'Calibri',
      color: C.textMuted,
    });
  });
}

// ==========================================
// SLIDE 3: THE SOLUTION
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addSlideHeader(
    s,
    'The Solution',
    'One Unified Ecosystem: Customers, Designers & Retailers',
    'A single interconnected digital platform synchronizing discovery, community curation, and transactional commerce.'
  );

  // Top Section: Triad Ecosystem Card
  addCard(s, 0.8, 1.9, 11.73, 1.9, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.gold });
  s.addText('THE UNIFIED FASHION TRIAD', {
    x: 1.1,
    y: 2.1,
    w: 5.0,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.gold,
  });

  // 3 Nodes in Triad
  const triadNodes = [
    { title: 'CUSTOMERS', desc: 'Personalized AI styling, wishlist, omnichannel cart, store pickup & order tracking', color: C.rose, x: 1.1 },
    { title: 'DESIGNERS', desc: 'Portfolio showcase, design creation, community voting & merit leaderboard rankings', color: C.purple, x: 4.8 },
    { title: 'RETAILERS', desc: 'Product catalog CRUD, multi-store stock locator, real-time orders & fulfillment status', color: C.emerald, x: 8.5 },
  ];

  triadNodes.forEach((node, idx) => {
    addCard(s, node.x, 2.45, 3.4, 1.1, { fillColor: C.cardBgLight, borderColor: node.color, borderWidth: 1.5 });
    s.addText(node.title, {
      x: node.x + 0.2,
      y: 2.55,
      w: 3.0,
      h: 0.3,
      fontSize: 12,
      fontFace: 'Calibri',
      bold: true,
      color: node.color,
    });
    s.addText(node.desc, {
      x: node.x + 0.2,
      y: 2.85,
      w: 3.0,
      h: 0.6,
      fontSize: 9.5,
      fontFace: 'Calibri',
      color: C.textLight,
    });
  });

  // Two directional indicators between triad nodes
  s.addText('⟷', { x: 4.45, y: 2.7, w: 0.4, h: 0.4, fontSize: 16, color: C.gold, align: 'center' });
  s.addText('⟷', { x: 8.15, y: 2.7, w: 0.4, h: 0.4, fontSize: 16, color: C.gold, align: 'center' });

  // Bottom Section: Complete Unified Journey Pipeline
  addCard(s, 0.8, 4.1, 11.73, 2.6, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.rose });
  s.addText('END-TO-END PLATFORM VALUE LIFECYCLE', {
    x: 1.1,
    y: 4.3,
    w: 6.0,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.roseLight,
  });

  const journeySteps = [
    { title: '1. Fashion Discovery', desc: 'Browse catalog, curated trends & social feed', color: C.rose },
    { title: '2. AI Styling', desc: 'Biometric harmony, body shape & color advice', color: C.gold },
    { title: '3. Product Match', desc: 'Real retailer SKU discovery & store locator', color: C.sky },
    { title: '4. Wishlist / Cart', desc: 'Curate favorites & persistent bag storage', color: C.purple },
    { title: '5. Fast Checkout', desc: 'Payment intent creation & address confirmation', color: C.gold },
    { title: '6. Orders & Pickup', desc: 'Lifecycle tracking from Shipped to Delivered', color: C.emerald },
  ];

  journeySteps.forEach((step, idx) => {
    const x = 1.1 + idx * 1.9;
    const y = 4.8;
    addCard(s, x, y, 1.7, 1.6, { fillColor: C.cardBgLight, borderColor: step.color });
    s.addText(step.title, {
      x: x + 0.12,
      y: y + 0.15,
      w: 1.46,
      h: 0.45,
      fontSize: 11,
      fontFace: 'Calibri',
      bold: true,
      color: step.color,
    });
    s.addText(step.desc, {
      x: x + 0.12,
      y: y + 0.65,
      w: 1.46,
      h: 0.85,
      fontSize: 9,
      fontFace: 'Calibri',
      color: C.textLight,
    });

    if (idx < journeySteps.length - 1) {
      s.addText('➔', {
        x: x + 1.65,
        y: y + 0.6,
        w: 0.3,
        h: 0.3,
        fontSize: 12,
        color: C.gold,
        align: 'center',
      });
    }
  });
}

// ==========================================
// SLIDE 4: CORE FEATURES
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addSlideHeader(
    s,
    'Core Capabilities',
    'Verified Implemented Features in Current Codebase',
    'Every capability listed below is fully realized with active backend API endpoints, Prisma database models, and responsive UI components.'
  );

  const features = [
    { name: 'Product Discovery', desc: 'Filterable catalog with silhouettes, price, occasion & live stock badges', cat: 'Commerce', color: C.rose },
    { name: 'Product Search', desc: 'Fast full-text search across titles, brands, occasions & garment attributes', cat: 'Discovery', color: C.sky },
    { name: 'Search Suggestions', desc: 'Instant keyword autocomplete and occasion suggestions (Ctrl+K keyboard shortcut)', cat: 'UX', color: C.gold },
    { name: 'AI Stylist Chat', desc: 'Conversational assistant analyzing skin undertones, body shapes & color harmony', cat: 'AI Engine', color: C.purple },
    { name: 'Color Voting Arena', desc: 'Interactive community palette voting with real-time socket updates and star rating', cat: 'Community', color: C.rose },
    { name: 'Designer Showcase', desc: 'Independent designer portfolios, design publishing modal, and merit leaderboards', cat: 'Designers', color: C.purple },
    { name: 'Wishlist System', desc: 'Persistent item bookmarking, saved curated favorites, and stock alerts', cat: 'Customer', color: C.rose },
    { name: 'Shopping Cart', desc: 'Dynamic bag management with size/color selection and tax calculation', cat: 'Commerce', color: C.emerald },
    { name: 'Checkout Pipeline', desc: 'Multi-field shipping form, payment gateway intent creation, and instant verification', cat: 'Fulfillment', color: C.emerald },
    { name: 'Order Management', desc: 'Customer order tracking modal and retailer status transitions (Pending to Delivered)', cat: 'Operations', color: C.gold },
    { name: 'Profile & Settings', desc: 'Biometric attributes (skin tone, measurements), occasion vibes, and security update', cat: 'Account', color: C.sky },
    { name: 'Store Stock Locator', desc: 'Nearby brick-and-mortar physical store inventory check with 48h pickup reservation', cat: 'Omnichannel', color: C.emerald },
  ];

  features.forEach((f, idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const x = 0.8 + col * 2.98;
    const y = 2.0 + row * 1.65;
    const w = 2.82;
    const h = 1.5;

    addCard(s, x, y, w, h, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: f.color });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.15,
      y: y + 0.18,
      w: Math.max(1.0, f.cat.length * 0.09 + 0.3),
      h: 0.24,
      fill: { color: C.badgeBg },
      line: { color: f.color, width: 1 },
      rectRadius: 0.12,
    });
    s.addText(f.cat.toUpperCase(), {
      x: x + 0.15,
      y: y + 0.18,
      w: Math.max(1.0, f.cat.length * 0.09 + 0.3),
      h: 0.24,
      fontSize: 8,
      fontFace: 'Calibri',
      bold: true,
      color: f.color,
      align: 'center',
      valign: 'middle',
    });

    s.addText(f.name, {
      x: x + 0.15,
      y: y + 0.48,
      w: w - 0.3,
      h: 0.32,
      fontSize: 12,
      fontFace: 'Georgia',
      bold: true,
      color: C.textWhite,
    });

    s.addText(f.desc, {
      x: x + 0.15,
      y: y + 0.82,
      w: w - 0.3,
      h: 0.6,
      fontSize: 9,
      fontFace: 'Calibri',
      color: C.textMuted,
    });
  });
}

// ==========================================
// SLIDE 5: CUSTOMER FLOW
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addSlideHeader(
    s,
    'Customer User Flow',
    'Visual Customer Journey & Discovery Architecture',
    'Chronological customer progression through authentication, personalized discovery branches, cart, and order fulfillment.'
  );

  // Main Linear Customer Flow Bar
  addCard(s, 0.8, 1.9, 11.73, 2.7, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.rose });
  s.addText('PRIMARY PURCHASE FLOW (LINEAR PIPELINE)', {
    x: 1.1,
    y: 2.1,
    w: 6.0,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.roseLight,
  });

  const linearSteps = [
    { title: 'Customer', sub: 'New or Returning', num: 1 },
    { title: 'Register / Login', sub: 'Auth / Token Sync', num: 2 },
    { title: 'Home Feed', sub: 'Personalized Hub', num: 3 },
    { title: 'Explore / Search', sub: 'Instant Auto-suggest', num: 4 },
    { title: 'Product Details', sub: 'Size/Color/Fit Score', num: 5 },
    { title: 'Cart or Wishlist', sub: 'Persistent Storage', num: 6 },
    { title: 'Secure Checkout', sub: 'Address & Payment', num: 7 },
    { title: 'Order Tracking', sub: 'Status Progression', num: 8 },
  ];

  linearSteps.forEach((st, idx) => {
    const x = 1.1 + idx * 1.42;
    const y = 2.6;
    addFlowNode(s, x, y, 1.25, 1.6, st.title, st.sub, C.rose, st.num);
    if (idx < linearSteps.length - 1) {
      s.addText('➔', {
        x: x + 1.22,
        y: y + 0.65,
        w: 0.25,
        h: 0.3,
        fontSize: 11,
        color: C.gold,
        align: 'center',
      });
    }
  });

  // Discovery Branches Box
  addCard(s, 0.8, 4.8, 11.73, 2.1, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.gold });
  s.addText('OPTIONAL DISCOVERY & ENGAGEMENT PATHWAYS (ACCESSIBLE FROM HOME)', {
    x: 1.1,
    y: 5.0,
    w: 8.0,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.goldLight,
  });

  const branchNodes = [
    { title: 'AI Stylist Chat', sub: 'Conversational styling queries, body shape analysis & curated outfits', color: C.purple, x: 1.1 },
    { title: 'Color Voting Arena', sub: 'Upvote/downvote palettes with direct transfer to AI Stylist', color: C.rose, x: 4.0 },
    { title: 'Designer Showcase', sub: 'Explore creator collections, rate garments & follow designer profiles', color: C.gold, x: 6.9 },
    { title: 'Stock Locator', sub: 'Find nearby brick-and-mortar stores with 48-hour pickup reservations', color: C.emerald, x: 9.8 },
  ];

  branchNodes.forEach((b) => {
    addCard(s, b.x, 5.4, 2.7, 1.2, { fillColor: C.cardBgLight, borderColor: b.color, borderWidth: 1.5 });
    s.addText(b.title, {
      x: b.x + 0.15,
      y: 5.5,
      w: 2.4,
      h: 0.3,
      fontSize: 11,
      fontFace: 'Calibri',
      bold: true,
      color: b.color,
    });
    s.addText(b.desc || b.sub, {
      x: b.x + 0.15,
      y: 5.8,
      w: 2.4,
      h: 0.7,
      fontSize: 9,
      fontFace: 'Calibri',
      color: C.textLight,
    });
  });
}

// ==========================================
// SLIDE 6: CUSTOMER FEATURES
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addSlideHeader(
    s,
    'Customer Experience',
    'Customer Features & Interactive Interfaces',
    'Interactive fashion interfaces designed for intuitive exploration, instant feedback, and seamless mobile-responsive shopping.'
  );

  // Left Column: Features List
  addCard(s, 0.8, 1.9, 5.7, 5.0, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.rose });
  s.addText('KEY CUSTOMER CAPABILITIES', {
    x: 1.1,
    y: 2.1,
    w: 5.0,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.roseLight,
  });

  const custFeats = [
    { title: 'AI Conversational Stylist', desc: 'Chat assistant calculating color harmony scores & recommending matched retail SKUs.' },
    { title: 'Interactive Color Voting', desc: '5-star community voting arena with real-time socket events and trending filters.' },
    { title: 'Smart Search & Suggestions', desc: 'Keyboard-accelerated (Cmd/Ctrl+K) instant search across styles, brands, and categories.' },
    { title: 'Curated Wishlist & Bag', desc: 'Persistent customer favorites, size and color selectors, and cart summary calculations.' },
    { title: 'Order Tracking Modal', desc: 'Real-time order lifecycle visualizer detailing shipping status, tracking numbers, and delivery dates.' },
    { title: 'Biometric Profile & Vibe Preferences', desc: 'Customizable undertone, hair color, body silhouette, and measurements stored in PostgreSQL.' },
  ];

  custFeats.forEach((f, idx) => {
    const y = 2.45 + idx * 0.72;
    s.addShape(pres.shapes.OVAL, {
      x: 1.1,
      y: y + 0.05,
      w: 0.16,
      h: 0.16,
      fill: { color: C.rose },
      line: { color: C.rose },
    });
    s.addText(f.title, {
      x: 1.35,
      y: y,
      w: 4.8,
      h: 0.28,
      fontSize: 11,
      fontFace: 'Calibri',
      bold: true,
      color: C.textWhite,
    });
    s.addText(f.desc, {
      x: 1.35,
      y: y + 0.25,
      w: 4.8,
      h: 0.42,
      fontSize: 9,
      fontFace: 'Calibri',
      color: C.textMuted,
    });
  });

  // Right Column: Application Screenshots
  const homeImg = getScreenshotPath('01_customer_home.png');
  const stylistImg = getScreenshotPath('02_ai_stylist_drawer.png');

  addCard(s, 6.8, 1.9, 5.73, 5.0, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.gold });
  s.addText('VERIFIED APPLICATION SCREENSHOTS', {
    x: 7.1,
    y: 2.1,
    w: 5.0,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.goldLight,
  });

  if (homeImg) {
    s.addImage({
      path: homeImg,
      x: 7.1,
      y: 2.45,
      w: 5.1,
      h: 2.0,
      sizing: { type: 'contain', w: 5.1, h: 2.0 },
    });
  }
  if (stylistImg) {
    s.addImage({
      path: stylistImg,
      x: 7.1,
      y: 4.65,
      w: 5.1,
      h: 2.0,
      sizing: { type: 'contain', w: 5.1, h: 2.0 },
    });
  }
}

// ==========================================
// SLIDE 7: DESIGNER FLOW
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addSlideHeader(
    s,
    'Designer User Flow',
    'Designer Workflow & Showcase Pipeline',
    'Dedicated flow for independent fashion creators: from role authentication to design creation, publication, and community rating engagement.'
  );

  // 4 Dedicated Stage Containers
  const stages = [
    {
      num: 'STAGE 1',
      title: 'Authentication & Workspace',
      color: C.purple,
      nodes: [
        { text: 'Designer Entry', sub: 'Portal access' },
        { text: 'Role Switch / Login', sub: 'Designer identity' },
        { text: 'Designer Dashboard', sub: 'Portfolio workspace' },
      ],
      x: 0.8,
    },
    {
      num: 'STAGE 2',
      title: 'Design Creation & Metadata',
      color: C.gold,
      nodes: [
        { text: 'Upload Design Modal', sub: 'Initiate creation' },
        { text: 'Specify Information', sub: 'Title, occasion, price' },
        { text: 'Palette & Image URL', sub: 'Color hex & CDN photo' },
      ],
      x: 3.8,
    },
    {
      num: 'STAGE 3',
      title: 'Catalog Publishing',
      color: C.rose,
      nodes: [
        { text: 'Validate Attributes', sub: 'Prisma schema validation' },
        { text: 'Publish Design API', sub: 'POST /api/designs' },
        { text: 'Active Showcase', sub: 'Live in public gallery' },
      ],
      x: 6.8,
    },
    {
      num: 'STAGE 4',
      title: 'Community Engagement',
      color: C.emerald,
      nodes: [
        { text: 'Community Showcase', sub: 'Public feed display' },
        { text: 'Interactive Star Voting', sub: '1-5 star user ratings' },
        { text: 'Merit Leaderboard', sub: 'Trending rank updates' },
      ],
      x: 9.8,
    },
  ];

  stages.forEach((st, idx) => {
    const w = 2.73;
    const h = 4.8;
    addCard(s, st.x, 2.0, w, h, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: st.color });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: st.x + 0.15,
      y: 2.2,
      w: 1.0,
      h: 0.28,
      fill: { color: C.badgeBg },
      line: { color: st.color, width: 1 },
      rectRadius: 0.14,
    });
    s.addText(st.num, {
      x: st.x + 0.15,
      y: 2.2,
      w: 1.0,
      h: 0.28,
      fontSize: 8.5,
      fontFace: 'Calibri',
      bold: true,
      color: st.color,
      align: 'center',
      valign: 'middle',
    });

    s.addText(st.title, {
      x: st.x + 0.15,
      y: 2.55,
      w: w - 0.3,
      h: 0.5,
      fontSize: 12,
      fontFace: 'Georgia',
      bold: true,
      color: C.textWhite,
    });

    st.nodes.forEach((node, nIdx) => {
      const ny = 3.2 + nIdx * 1.1;
      addFlowNode(s, st.x + 0.2, ny, w - 0.4, 0.8, node.text, node.sub, st.color, nIdx + 1);
      if (nIdx < st.nodes.length - 1) {
        s.addText('↓', {
          x: st.x + w / 2 - 0.15,
          y: ny + 0.78,
          w: 0.3,
          h: 0.3,
          fontSize: 12,
          color: st.color,
          align: 'center',
        });
      }
    });

    if (idx < stages.length - 1) {
      s.addText('➔', {
        x: st.x + w - 0.05,
        y: 4.2,
        w: 0.35,
        h: 0.35,
        fontSize: 15,
        color: C.gold,
        align: 'center',
      });
    }
  });
}

// ==========================================
// SLIDE 8: DESIGNER FEATURES
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addSlideHeader(
    s,
    'Designer Studio',
    'Designer Showcase, Creation & Rating Tools',
    'Empowering independent fashion talent with digital portfolio management, studio publishing modals, and merit-based voting.'
  );

  // Left Column: Real Screenshot of Designer Showcase
  const desImg = getScreenshotPath('04_designer_showcase.png');
  addCard(s, 0.8, 1.9, 6.2, 5.0, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.purple });
  s.addText('LIVE DESIGNER SHOWCASE & LEADERBOARD', {
    x: 1.1,
    y: 2.1,
    w: 5.5,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.purpleLight,
  });

  if (desImg) {
    s.addImage({
      path: desImg,
      x: 1.1,
      y: 2.45,
      w: 5.6,
      h: 4.2,
      sizing: { type: 'contain', w: 5.6, h: 4.2 },
    });
  }

  // Right Column: Implemented Designer Features
  addCard(s, 7.3, 1.9, 5.23, 5.0, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.gold });
  s.addText('DESIGNER TOOLS & SYSTEM INTEGRATIONS', {
    x: 7.6,
    y: 2.1,
    w: 4.5,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.goldLight,
  });

  const desFeatures = [
    { title: 'Designer Showcase Portfolio', desc: 'Showcase grid highlighting creator handle, bio, verification badges, and average rating.' },
    { title: 'Design Upload Modal', desc: 'Modal form collecting title, collection season, price, occasion, and garment photo URL.' },
    { title: 'Custom Palette Definition', desc: 'Specify curated color hex codes associated with each garment silhouette.' },
    { title: 'Interactive Star Voting', desc: 'Community rating algorithm updating live `votesCount` and composite `rating`.' },
    { title: 'Designer Following System', desc: 'Audience follow/unfollow capability with dynamic follower counter synchronization.' },
    { title: 'Merit-Based Leaderboard', desc: 'Top rated designs automatically boosted on community merit boards.' },
  ];

  desFeatures.forEach((f, idx) => {
    const y = 2.45 + idx * 0.72;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 7.6,
      y: y + 0.05,
      w: 0.22,
      h: 0.22,
      fill: { color: C.purple },
      line: { color: C.purple },
      rectRadius: 0.05,
    });
    s.addText(f.title, {
      x: 7.95,
      y: y,
      w: 4.3,
      h: 0.28,
      fontSize: 11,
      fontFace: 'Calibri',
      bold: true,
      color: C.textWhite,
    });
    s.addText(f.desc, {
      x: 7.95,
      y: y + 0.25,
      w: 4.3,
      h: 0.42,
      fontSize: 9,
      fontFace: 'Calibri',
      color: C.textMuted,
    });
  });
}

// ==========================================
// SLIDE 9: RETAILER FLOW
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addSlideHeader(
    s,
    'Retailer User Flow',
    'Retailer Operations & Inventory Lifecycle Flow',
    'Comprehensive operational workflow for store partners: stock management, catalog synchronization, and multi-stage order fulfillment.'
  );

  // Top Section: Step-by-Step Operations Flow
  addCard(s, 0.8, 1.9, 11.73, 2.4, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.gold });
  s.addText('RETAILER WORKSPACE EXECUTION PIPELINE', {
    x: 1.1,
    y: 2.1,
    w: 6.0,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.goldLight,
  });

  const retSteps = [
    { title: 'Retailer Entry', sub: 'Store portal login', num: 1 },
    { title: 'Retailer Dashboard', sub: 'Executive metrics', num: 2 },
    { title: 'Product Catalog', sub: 'Create & edit SKUs', num: 3 },
    { title: 'Stock Adjustment', sub: 'Inventory counter', num: 4 },
    { title: 'Order Queue', sub: 'Inspect line items', num: 5 },
    { title: 'Status Update', sub: 'Progress shipment', num: 6 },
    { title: 'Store Settings', sub: 'Configure alert thresholds', num: 7 },
  ];

  retSteps.forEach((st, idx) => {
    const x = 1.1 + idx * 1.62;
    const y = 2.6;
    addFlowNode(s, x, y, 1.45, 1.45, st.title, st.sub, C.gold, st.num);
    if (idx < retSteps.length - 1) {
      s.addText('➔', {
        x: x + 1.42,
        y: y + 0.58,
        w: 0.25,
        h: 0.3,
        fontSize: 11,
        color: C.rose,
        align: 'center',
      });
    }
  });

  // Bottom Section: Order Status Progression Flow
  addCard(s, 0.8, 4.5, 11.73, 2.4, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.emerald });
  s.addText('ORDER LIFECYCLE STATE MACHINE (VERIFIED IN CODEBASE)', {
    x: 1.1,
    y: 4.7,
    w: 7.0,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.emeraldLight,
  });

  const orderStatuses = [
    { status: 'Pending', desc: 'Order received & payment confirmed via intent gateway', badgeColor: 'D97706', x: 1.2 },
    { status: 'Processing', desc: 'Warehouse picking, garment packaging & inventory reserve check', badgeColor: '2563EB', x: 4.1 },
    { status: 'Shipped', desc: 'Courier dispatch with generated tracking number (TRK-...)', badgeColor: '7C3AED', x: 7.0 },
    { status: 'Delivered', desc: 'Confirmed delivery to customer address or store pickup point', badgeColor: '059669', x: 9.9 },
  ];

  orderStatuses.forEach((st, idx) => {
    addCard(s, st.x, 5.2, 2.5, 1.4, { fillColor: C.cardBgLight, borderColor: st.badgeColor, borderWidth: 1.5 });

    // Status Pill
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: st.x + 0.15,
      y: 5.35,
      w: 1.1,
      h: 0.28,
      fill: { color: st.badgeColor },
      line: { color: st.badgeColor },
      rectRadius: 0.14,
    });
    s.addText(st.status.toUpperCase(), {
      x: st.x + 0.15,
      y: 5.35,
      w: 1.1,
      h: 0.28,
      fontSize: 9,
      fontFace: 'Calibri',
      bold: true,
      color: C.textWhite,
      align: 'center',
      valign: 'middle',
    });

    s.addText(st.desc, {
      x: st.x + 0.15,
      y: 5.75,
      w: 2.2,
      h: 0.75,
      fontSize: 9.5,
      fontFace: 'Calibri',
      color: C.textLight,
    });

    if (idx < orderStatuses.length - 1) {
      s.addText('➔', {
        x: st.x + 2.5,
        y: 5.75,
        w: 0.4,
        h: 0.3,
        fontSize: 14,
        color: C.emerald,
        align: 'center',
      });
    }
  });
}

// ==========================================
// SLIDE 10: RETAILER FEATURES
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addSlideHeader(
    s,
    'Retailer Workspace',
    'Retailer Features & Store Operations Console',
    'Real-time retail management tools built into the application: inventory tracking, stock adjustments, and order progression.'
  );

  // Left Column: Real Retailer Dashboard Screenshot
  const retDashImg = getScreenshotPath('06_retailer_dashboard.png');
  const retOrdersImg = getScreenshotPath('07_retailer_orders.png');

  addCard(s, 0.8, 1.9, 6.2, 5.0, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.gold });
  s.addText('LIVE RETAILER DASHBOARD & ORDERS VIEW', {
    x: 1.1,
    y: 2.1,
    w: 5.5,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.goldLight,
  });

  if (retDashImg) {
    s.addImage({
      path: retDashImg,
      x: 1.1,
      y: 2.45,
      w: 5.6,
      h: 2.0,
      sizing: { type: 'contain', w: 5.6, h: 2.0 },
    });
  }
  if (retOrdersImg) {
    s.addImage({
      path: retOrdersImg,
      x: 1.1,
      y: 4.65,
      w: 5.6,
      h: 2.0,
      sizing: { type: 'contain', w: 5.6, h: 2.0 },
    });
  }

  // Right Column: Verified Retailer Features
  addCard(s, 7.3, 1.9, 5.23, 5.0, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.emerald });
  s.addText('IMPLEMENTED RETAILER CAPABILITIES', {
    x: 7.6,
    y: 2.1,
    w: 4.5,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.emeraldLight,
  });

  const retFeats = [
    { title: 'Operations Dashboard', desc: 'KPI metrics tracking gross sales, active listings, pending fulfillments, and average order value.' },
    { title: 'Product Catalog Management', desc: 'Add new garments with image upload, brand, price, sizes, silhouette, and occasion.' },
    { title: 'Inventory & Stock Counters', desc: 'Real-time stock quantity adjustment with automatic "Low Stock" and "Out of Stock" status triggers.' },
    { title: 'Order Status Lifecycle', desc: 'Transition customer orders from Pending to Processing, Shipped, or Delivered with tracking.' },
    { title: 'Retailer Customer CRM', desc: 'Customer directory recording lifetime orders count, total spend, and recent order history.' },
    { title: 'Store Settings & Alerts', desc: 'Manage tax ID, manager contact, low stock thresholds, and email/SMS notification toggles.' },
  ];

  retFeats.forEach((f, idx) => {
    const y = 2.45 + idx * 0.72;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 7.6,
      y: y + 0.05,
      w: 0.22,
      h: 0.22,
      fill: { color: C.emerald },
      line: { color: C.emerald },
      rectRadius: 0.05,
    });
    s.addText(f.title, {
      x: 7.95,
      y: y,
      w: 4.3,
      h: 0.28,
      fontSize: 11,
      fontFace: 'Calibri',
      bold: true,
      color: C.textWhite,
    });
    s.addText(f.desc, {
      x: 7.95,
      y: y + 0.25,
      w: 4.3,
      h: 0.42,
      fontSize: 9,
      fontFace: 'Calibri',
      color: C.textMuted,
    });
  });
}

// ==========================================
// SLIDE 11: ADMIN FLOW
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addSlideHeader(
    s,
    'Admin User Flow',
    'Admin Executive Flow & Platform Governance',
    'Verified administrative architecture: JWT staff authentication, executive operations dashboard, and multi-tenant approval workflows.'
  );

  // Top Box: Admin Authentication & Dashboard Flow
  addCard(s, 0.8, 1.9, 11.73, 2.0, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.emerald });
  s.addText('ADMIN AUTHENTICATION & EXECUTIVE ACCESS PIPELINE', {
    x: 1.1,
    y: 2.1,
    w: 7.0,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.emeraldLight,
  });

  const adminAuthNodes = [
    { title: 'Admin Staff Access', sub: '/admin URL or header toggle', num: 1 },
    { title: 'Admin Login Page', sub: 'POST /api/admin/auth/login', num: 2 },
    { title: 'JWT Token Issuance', sub: 'Secure Bearer token generation', num: 3 },
    { title: 'AdminGuard Validation', sub: 'GET /api/admin/auth/me check', num: 4 },
    { title: 'Executive Dashboard', sub: 'Aggregated PostgreSQL KPIs', num: 5 },
  ];

  adminAuthNodes.forEach((nd, idx) => {
    const x = 1.1 + idx * 2.3;
    const y = 2.5;
    addFlowNode(s, x, y, 2.0, 1.15, nd.title, nd.sub, C.emerald, nd.num);
    if (idx < adminAuthNodes.length - 1) {
      s.addText('➔', {
        x: x + 1.98,
        y: y + 0.42,
        w: 0.35,
        h: 0.3,
        fontSize: 12,
        color: C.gold,
        align: 'center',
      });
    }
  });

  // Bottom Box: 4 Implemented Platform Management Modules
  addCard(s, 0.8, 4.1, 11.73, 2.8, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.gold });
  s.addText('ACTIVE PLATFORM MANAGEMENT MODULES (CONFIRMED IN ADMIN ROUTES)', {
    x: 1.1,
    y: 4.3,
    w: 8.0,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.goldLight,
  });

  const adminModules = [
    {
      title: 'User Management',
      route: '/api/admin/users',
      desc: 'Inspect customer profiles, toggle account status (Active / Suspended), and review requested role promotions.',
      color: C.rose,
      x: 1.1,
    },
    {
      title: 'Designer Governance',
      route: '/api/admin/designers',
      desc: 'Audit submitted designs, verify creator credentials, grant verified badges, or reject violating uploads.',
      color: C.purple,
      x: 4.0,
    },
    {
      title: 'Retailer Governance',
      route: '/api/admin/retailers',
      desc: 'Review merchant onboarding applications, inspect store tax IDs, approve boutique listings, or issue rejections.',
      color: C.emerald,
      x: 6.9,
    },
    {
      title: 'Orders & Catalog Audit',
      route: '/api/admin/orders',
      desc: 'Cross-tenant transaction monitoring, global order status inspection, revenue verification, and catalog oversight.',
      color: C.sky,
      x: 9.8,
    },
  ];

  adminModules.forEach((m) => {
    addCard(s, m.x, 4.75, 2.7, 1.9, { fillColor: C.cardBgLight, borderColor: m.color, borderWidth: 1.5 });
    s.addText(m.title, {
      x: m.x + 0.15,
      y: 4.9,
      w: 2.4,
      h: 0.3,
      fontSize: 12,
      fontFace: 'Calibri',
      bold: true,
      color: m.color,
    });
    s.addText(m.route, {
      x: m.x + 0.15,
      y: 5.2,
      w: 2.4,
      h: 0.25,
      fontSize: 8.5,
      fontFace: 'Consolas',
      color: C.goldLight,
    });
    s.addText(m.desc, {
      x: m.x + 0.15,
      y: 5.5,
      w: 2.4,
      h: 1.0,
      fontSize: 9.5,
      fontFace: 'Calibri',
      color: C.textLight,
    });
  });
}

// ==========================================
// SLIDE 12: ROLE COMPARISON
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addSlideHeader(
    s,
    'Architecture Roles',
    'One Platform, Four Distinct User Roles',
    'Clean separation of concerns: tailored permissions, specialized dashboards, and custom user journeys for every stakeholder.'
  );

  const roles = [
    {
      role: 'CUSTOMER',
      badge: 'B2C Shopper',
      color: C.rose,
      x: 0.8,
      items: [
        'AI Conversational Stylist consultation',
        'Body shape & color harmony recommendations',
        'Community color voting in the arena',
        'Multi-product search & stock locator',
        'Curated Wishlist & Shopping Cart',
        'Omnichannel checkout & order tracking',
      ],
    },
    {
      role: 'DESIGNER',
      badge: 'Independent Creator',
      color: C.purple,
      x: 3.8,
      items: [
        'Creator Showcase & portfolio profile',
        'Design upload with palette hex definitions',
        'Collection management & categorization',
        'Community rating feedback & star voting',
        'Audience follower growth tracking',
        'Merit leaderboard top ranking visibility',
      ],
    },
    {
      role: 'RETAILER',
      badge: 'Merchant & Brand Partner',
      color: C.gold,
      x: 6.8,
      items: [
        'Executive store performance metrics',
        'Product catalog creation & SKU updates',
        'Real-time inventory & stock adjustments',
        'Multi-stage order lifecycle fulfillment',
        'Retailer customer CRM history tracking',
        'Store alert settings & pickup coordination',
      ],
    },
    {
      role: 'ADMIN',
      badge: 'Platform Governance Staff',
      color: C.emerald,
      x: 9.8,
      items: [
        'JWT-protected executive dashboard',
        'Cross-platform aggregated KPIs in PostgreSQL',
        'Customer account status & role approvals',
        'Designer verification & design approvals',
        'Merchant onboarding & store compliance',
        'Global order audit & system health monitoring',
      ],
    },
  ];

  roles.forEach((r) => {
    const w = 2.73;
    const h = 5.0;
    addCard(s, r.x, 2.0, w, h, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: r.color });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: r.x + 0.15,
      y: 2.2,
      w: 1.2,
      h: 0.28,
      fill: { color: C.badgeBg },
      line: { color: r.color, width: 1 },
      rectRadius: 0.14,
    });
    s.addText(r.badge.toUpperCase(), {
      x: r.x + 0.15,
      y: 2.2,
      w: 1.2,
      h: 0.28,
      fontSize: 8,
      fontFace: 'Calibri',
      bold: true,
      color: r.color,
      align: 'center',
      valign: 'middle',
    });

    s.addText(r.role, {
      x: r.x + 0.15,
      y: 2.55,
      w: w - 0.3,
      h: 0.4,
      fontSize: 16,
      fontFace: 'Georgia',
      bold: true,
      color: C.textWhite,
    });

    r.items.forEach((item, iIdx) => {
      const iy = 3.1 + iIdx * 0.58;
      s.addShape(pres.shapes.OVAL, {
        x: r.x + 0.2,
        y: iy + 0.08,
        w: 0.1,
        h: 0.1,
        fill: { color: r.color },
        line: { color: r.color },
      });
      s.addText(item, {
        x: r.x + 0.38,
        y: iy,
        w: w - 0.55,
        h: 0.5,
        fontSize: 9.5,
        fontFace: 'Calibri',
        color: C.textLight,
      });
    });
  });
}

// ==========================================
// SLIDE 13: AI STYLIST FLOW
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addSlideHeader(
    s,
    'AI Stylist User Flow',
    'Conversational AI Stylist & Recommendation Pipeline',
    'Interactive fashion advisory workflow: natural language fashion requests processed through color harmony rules and silhouette matching.'
  );

  // Left Column: Visual Flow Diagram
  addCard(s, 0.8, 1.9, 6.7, 5.0, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.purple });
  s.addText('AI STYLING DECISION PIPELINE', {
    x: 1.1,
    y: 2.1,
    w: 5.5,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.purpleLight,
  });

  const aiSteps = [
    { text: 'User Opens AI Stylist', sub: 'Floating button or header nav', col: C.purple },
    { text: 'Enter Fashion Request', sub: '"Formal autumn dinner outfit under $400"', col: C.gold },
    { text: 'Occasion & Budget Filters', sub: 'Work, Casual, Formal, Party constraints', col: C.sky },
    { text: 'AI Engine Processing', sub: 'Color harmony score + body shape rules', col: C.rose },
    { text: 'Curated Recommendations', sub: 'Coordinated palette & styling rationale', col: C.purple },
    { text: 'Matched Retail Products', sub: 'Actual catalog items matching the palette', col: C.emerald },
    { text: 'Add to Wishlist / Cart', sub: 'Direct one-click conversion to purchase', col: C.emerald },
  ];

  aiSteps.forEach((st, idx) => {
    const y = 2.45 + idx * 0.62;
    addFlowNode(s, 1.1, y, 6.1, 0.52, st.text, st.sub, st.col, idx + 1);
    if (idx < aiSteps.length - 1) {
      s.addText('↓', {
        x: 4.1,
        y: y + 0.48,
        w: 0.3,
        h: 0.2,
        fontSize: 10,
        color: C.gold,
        align: 'center',
      });
    }
  });

  // Right Column: AI Stylist Drawer Screenshot
  const stylistImg = getScreenshotPath('02_ai_stylist_drawer.png');
  addCard(s, 7.8, 1.9, 4.73, 5.0, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.gold });
  s.addText('CONVERSATIONAL STYLIST INTERFACE', {
    x: 8.0,
    y: 2.1,
    w: 4.2,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.goldLight,
  });

  if (stylistImg) {
    s.addImage({
      path: stylistImg,
      x: 8.0,
      y: 2.45,
      w: 4.33,
      h: 4.2,
      sizing: { type: 'contain', w: 4.33, h: 4.2 },
    });
  }
}

// ==========================================
// SLIDE 14: COLOR VOTING FLOW
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addSlideHeader(
    s,
    'Community Color Voting Flow',
    'Crowdsourced Color Harmony Arena to AI Stylist',
    'Direct integration between community-driven palette validation and the personalized AI Stylist recommendation engine.'
  );

  // Left Column: Flow Diagram
  addCard(s, 0.8, 1.9, 6.5, 5.0, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.rose });
  s.addText('COMMUNITY COLOR ARENA ➔ AI STYLIST PIPELINE', {
    x: 1.1,
    y: 2.1,
    w: 6.0,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.roseLight,
  });

  const cvSteps = [
    { text: 'User Opens Color Voting', sub: 'Access community color combination arena', col: C.rose },
    { text: 'Filter by Occasion', sub: 'Work, Casual, Gala, Date Night, Resort', col: C.gold },
    { text: 'Inspect Palette Harmonies', sub: 'View 3-color hex combinations & trending score', col: C.purple },
    { text: 'Cast Interactive Vote', sub: '1-to-5 star vote rating or upvote/downvote', col: C.rose },
    { text: 'Real-Time Socket Sync', sub: 'Socket.io broadcasts updated average to community', col: C.emerald },
    { text: 'Select Winning Palette', sub: 'User clicks favored color combination', col: C.gold },
    { text: 'Direct Transition to AI Stylist', sub: 'Transfers exact hex palette & occasion to Stylist', col: C.purple },
  ];

  cvSteps.forEach((st, idx) => {
    const y = 2.45 + idx * 0.62;
    addFlowNode(s, 1.1, y, 5.9, 0.52, st.text, st.sub, st.col, idx + 1);
    if (idx < cvSteps.length - 1) {
      s.addText('↓', {
        x: 4.0,
        y: y + 0.48,
        w: 0.3,
        h: 0.2,
        fontSize: 10,
        color: C.gold,
        align: 'center',
      });
    }
  });

  // Right Column: Color Voting Live Screenshot
  const cvImg = getScreenshotPath('03_color_voting.png');
  addCard(s, 7.6, 1.9, 4.93, 5.0, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.gold });
  s.addText('LIVE COLOR VOTING ARENA', {
    x: 7.9,
    y: 2.1,
    w: 4.4,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.goldLight,
  });

  if (cvImg) {
    s.addImage({
      path: cvImg,
      x: 7.9,
      y: 2.45,
      w: 4.4,
      h: 4.2,
      sizing: { type: 'contain', w: 4.4, h: 4.2 },
    });
  }
}

// ==========================================
// SLIDE 15: PRODUCT SHOPPING FLOW
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addSlideHeader(
    s,
    'Commerce Pipeline',
    'From Search to Purchase: Omnichannel Shopping Flow',
    'The complete transaction journey: real-time suggestions, detailed garment inspection, store reservations, and multi-gateway checkout.'
  );

  // Top Section: Step-by-Step Flow Pipeline
  addCard(s, 0.8, 1.9, 11.73, 2.0, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.emerald });
  s.addText('COMPLETE SHOPPING CONVERSION FUNNEL', {
    x: 1.1,
    y: 2.1,
    w: 6.0,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.emeraldLight,
  });

  const shopSteps = [
    { title: 'Search Input', sub: 'Instant queries', num: 1 },
    { title: 'Suggestions', sub: 'Category tags', num: 2 },
    { title: 'Product Card', sub: 'Price & rating', num: 3 },
    { title: 'Product Modal', sub: 'Silhouette & fit', num: 4 },
    { title: 'Size / Color', sub: 'In-stock check', num: 5 },
    { title: 'Cart Review', sub: 'Bag calculation', num: 6 },
    { title: 'Checkout', sub: 'Address & Pay', num: 7 },
    { title: 'Orders Sync', sub: 'Prisma commit', num: 8 },
  ];

  shopSteps.forEach((st, idx) => {
    const x = 1.1 + idx * 1.42;
    const y = 2.5;
    addFlowNode(s, x, y, 1.25, 1.15, st.title, st.sub, C.emerald, st.num);
    if (idx < shopSteps.length - 1) {
      s.addText('➔', {
        x: x + 1.22,
        y: y + 0.42,
        w: 0.25,
        h: 0.3,
        fontSize: 11,
        color: C.gold,
        align: 'center',
      });
    }
  });

  // Bottom Section: Screenshots of Product Modal and Stock Locator
  const modalImg = getScreenshotPath('05b_product_modal.png');
  const stockImg = getScreenshotPath('05_stock_locator.png');

  addCard(s, 0.8, 4.1, 5.7, 2.8, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.rose });
  s.addText('GARMENT DETAILS & SIZE SELECTION MODAL', {
    x: 1.0,
    y: 4.25,
    w: 5.0,
    h: 0.3,
    fontSize: 9.5,
    fontFace: 'Calibri',
    bold: true,
    color: C.roseLight,
  });
  if (modalImg) {
    s.addImage({
      path: modalImg,
      x: 1.0,
      y: 4.55,
      w: 5.3,
      h: 2.2,
      sizing: { type: 'contain', w: 5.3, h: 2.2 },
    });
  }

  addCard(s, 6.8, 4.1, 5.73, 2.8, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.sky });
  s.addText('OMNICHANNEL STORE STOCK & PICKUP RESERVATION', {
    x: 7.0,
    y: 4.25,
    w: 5.0,
    h: 0.3,
    fontSize: 9.5,
    fontFace: 'Calibri',
    bold: true,
    color: C.skyLight,
  });
  if (stockImg) {
    s.addImage({
      path: stockImg,
      x: 7.0,
      y: 4.55,
      w: 5.3,
      h: 2.2,
      sizing: { type: 'contain', w: 5.3, h: 2.2 },
    });
  }
}

// ==========================================
// SLIDE 16: TECHNOLOGY STACK
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addSlideHeader(
    s,
    'Technical Architecture',
    'Verified Implementation Technology Stack',
    'Strictly detailing technologies present and running in the repository — no speculative or uninstalled frameworks.'
  );

  const techCategories = [
    {
      cat: 'Frontend Web',
      color: C.rose,
      techs: ['React 19.2 (Modern Hooks & State)', 'TypeScript 6.0', 'Vite 8.2 (Fast HMR & Bundler)', 'Tailwind CSS v4 (Modern Styling)', 'Lucide React & Canvas Confetti'],
    },
    {
      cat: 'Mobile Application',
      color: C.purple,
      techs: ['React Native 0.86', 'Expo 57 (Cross-Platform SDK)', 'React Navigation v7 (Native Tabs/Stack)', 'Expo SecureStore & LinearGradient', 'EAS Build Config (Android APK/AAB)'],
    },
    {
      cat: 'Backend API Engine',
      color: C.gold,
      techs: ['Node.js & Express 5.2', 'TypeScript Runtime (tsx engine)', 'Socket.io 4.8 (Real-time events)', 'Multer 2.3 (File & Avatar Uploads)', 'CORS & Cookie-Parser Middleware'],
    },
    {
      cat: 'Database & Data Layer',
      color: C.emerald,
      techs: ['PostgreSQL (Enterprise Relational DB)', 'Prisma ORM 5.22 (Type-safe client)', 'Prisma Schema with 14 Data Models', 'Atomic Transactions ($transaction)', 'JSON File Cache Fallback Engine'],
    },
    {
      cat: 'Authentication & Security',
      color: C.sky,
      techs: ['JSON Web Tokens (JWT Access/Refresh)', 'Bcryptjs Password Hashing', '4-Role RBAC (Customer, Designer, Retailer, Admin)', 'XSS Sanitization & RegEx Escaping', 'Rate Limiter & Security HTTP Headers'],
    },
    {
      cat: 'AI & Fashion Algorithms',
      color: C.purple,
      techs: ['Rule-Based Styling Matcher', 'Biometric Color Harmony Scorer', 'Occasion & Silhouette Filter Engine', 'Semantic Search Query Matcher', 'Virtual Try-On Job Queue Model'],
    },
    {
      cat: 'Cloud & Deployment',
      color: C.gold,
      techs: ['Render (Backend Express API & DB)', 'Vercel (Frontend SPA Hosting)', 'Expo EAS (Cloud Android Builds)', 'Multi-environment (.env.production)', 'Vite Reverse Proxy Routing'],
    },
    {
      cat: 'Testing & Verification',
      color: C.emerald,
      techs: ['Custom End-to-End Test Suite', 'PostgreSQL DB Integration Tests', 'Admin Full E2E (`test_admin_*_e2e.ts`)', 'CRUD API Automated Verification', 'Oxlint TypeScript Code Quality'],
    },
  ];

  techCategories.forEach((tc, idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const x = 0.8 + col * 2.98;
    const y = 2.0 + row * 2.45;
    const w = 2.82;
    const h = 2.3;

    addCard(s, x, y, w, h, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: tc.color });

    s.addText(tc.cat, {
      x: x + 0.15,
      y: y + 0.2,
      w: w - 0.3,
      h: 0.35,
      fontSize: 13,
      fontFace: 'Georgia',
      bold: true,
      color: tc.color,
    });

    tc.techs.forEach((t, tIdx) => {
      const ty = y + 0.6 + tIdx * 0.32;
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.15,
        y: ty + 0.08,
        w: 0.08,
        h: 0.08,
        fill: { color: tc.color },
        line: { color: tc.color },
      });
      s.addText(t, {
        x: x + 0.3,
        y: ty,
        w: w - 0.45,
        h: 0.3,
        fontSize: 9,
        fontFace: 'Calibri',
        color: C.textLight,
      });
    });
  });
}

// ==========================================
// SLIDE 17: MOBILE APPLICATION
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addSlideHeader(
    s,
    'Mobile Experience',
    'Native Android Mobile Application Architecture',
    'Powered by React Native 0.86 & Expo 57: high-performance native touch navigation, biometric styling, and ready-to-deploy APK configurations.'
  );

  // Left Column: Native Architecture Highlights
  addCard(s, 0.8, 1.9, 6.2, 5.0, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.purple });
  s.addText('EXPO 57 & REACT NATIVE MOBILE CAPABILITIES', {
    x: 1.1,
    y: 2.1,
    w: 5.5,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.purpleLight,
  });

  const mobFeatures = [
    { screen: 'HomeScreen', desc: 'Featured hero collections, trending garments, and instant occasion category shortcuts.' },
    { screen: 'ExploreScreen', desc: 'Comprehensive product search with price filtering, brand filtering, and real-time query match.' },
    { screen: 'AiStylistScreen', desc: 'Native AI consultation with interactive occasion chips, color harmony scores, and outfit cards.' },
    { screen: 'ColorVotingScreen', desc: 'Community color combination voting with direct navigation parameter passing to AiStylist.' },
    { screen: 'ProductDetailScreen', desc: 'Full-bleed imagery, size selection chips, color picker, and store reservation buttons.' },
    { screen: 'CartScreen & CheckoutScreen', desc: 'Persistent item counter, delivery address entry, and payment intent order creation.' },
    { screen: 'ProfileScreen & Settings', desc: 'Personalized undertone settings, measurements, theme toggle, and secure credential editing.' },
  ];

  mobFeatures.forEach((mf, idx) => {
    const y = 2.45 + idx * 0.62;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 1.1,
      y: y + 0.05,
      w: Math.max(1.3, mf.screen.length * 0.08 + 0.3),
      h: 0.24,
      fill: { color: C.badgeBg },
      line: { color: C.purple, width: 1 },
      rectRadius: 0.12,
    });
    s.addText(mf.screen, {
      x: 1.1,
      y: y + 0.05,
      w: Math.max(1.3, mf.screen.length * 0.08 + 0.3),
      h: 0.24,
      fontSize: 8.5,
      fontFace: 'Calibri',
      bold: true,
      color: C.purpleLight,
      align: 'center',
      valign: 'middle',
    });

    s.addText(mf.desc, {
      x: 2.7,
      y: y,
      w: 4.1,
      h: 0.55,
      fontSize: 9,
      fontFace: 'Calibri',
      color: C.textLight,
    });
  });

  // Right Column: Mobile Screen Mockups
  const mobHome = getScreenshotPath('13_mobile_home.png');
  const mobStylist = getScreenshotPath('14_mobile_ai_stylist.png');

  addCard(s, 7.3, 1.9, 5.23, 5.0, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.gold });
  s.addText('VERIFIED MOBILE APPLICATION INTERFACES', {
    x: 7.6,
    y: 2.1,
    w: 4.5,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Calibri',
    bold: true,
    color: C.goldLight,
  });

  if (mobHome) {
    s.addImage({
      path: mobHome,
      x: 7.6,
      y: 2.45,
      w: 2.2,
      h: 4.2,
      sizing: { type: 'contain', w: 2.2, h: 4.2 },
    });
  }
  if (mobStylist) {
    s.addImage({
      path: mobStylist,
      x: 10.0,
      y: 2.45,
      w: 2.2,
      h: 4.2,
      sizing: { type: 'contain', w: 2.2, h: 4.2 },
    });
  }
}

// ==========================================
// SLIDE 18: SECURITY & RELIABILITY
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addSlideHeader(
    s,
    'Security Architecture',
    'Implemented Security, Privacy & Reliability Controls',
    'Strict defense-in-depth measures confirmed in the backend codebase (`backend/security.ts` and `backend/middleware/auth.ts`).'
  );

  const securityPillars = [
    {
      title: 'Authentication & Session Integrity',
      iconColor: C.gold,
      points: [
        'JWT tokens with configurable expiry (15m access / 7d refresh)',
        'Bcryptjs salted password hashing preventing plaintext compromise',
        'HttpOnly cookie storage and Authorization Bearer header support',
      ],
    },
    {
      title: '4-Tier Role-Based Access Control',
      iconColor: C.rose,
      points: [
        'Strict middleware guards (`authenticateRole`, `requireRole`, `requireAuth`)',
        'Independent role permissions for Customer, Designer, Retailer, and Admin',
        'Protected administrative endpoints restricted to verified staff tokens',
      ],
    },
    {
      title: 'Input Sanitization & Anti-XSS',
      iconColor: C.purple,
      points: [
        'Custom `sanitizeString` recursively stripping `<script>` tags & handler attributes',
        'Null-byte removal preventing binary injection',
        'JSON-level sanitization safeguarding against malicious input payloads',
      ],
    },
    {
      title: 'Path Traversal & Injection Defense',
      iconColor: C.sky,
      points: [
        '`validateSafePath` enforcing path boundary containment for uploads',
        '`escapeRegex` escaping user search strings against ReDoS attacks',
        'Prisma parameterized SQL queries preventing SQL Injection',
      ],
    },
    {
      title: 'HTTP Security Headers & Rate Limiting',
      iconColor: C.emerald,
      points: [
        'Strict defense headers: X-Content-Type-Options (nosniff), X-Frame-Options (DENY)',
        'Referrer-Policy: strict-origin-when-cross-origin to protect user data',
        'In-memory window rate limiter preventing denial-of-service spam',
      ],
    },
    {
      title: 'Database Reliability & ACID Transactions',
      iconColor: C.gold,
      points: [
        'Atomic Prisma transactions (`$transaction`) for store stock & orders',
        'Graceful in-memory / JSON fallback when database connectivity drops',
        'Automated database seeding and migration scripts for quick disaster recovery',
      ],
    },
  ];

  securityPillars.forEach((p, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = 0.8 + col * 3.98;
    const y = 2.0 + row * 2.45;
    const w = 3.75;
    const h = 2.3;

    addCard(s, x, y, w, h, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: p.iconColor });

    s.addText(p.title, {
      x: x + 0.2,
      y: y + 0.2,
      w: w - 0.4,
      h: 0.35,
      fontSize: 13,
      fontFace: 'Georgia',
      bold: true,
      color: p.iconColor,
    });

    p.points.forEach((pt, ptIdx) => {
      const py = y + 0.65 + ptIdx * 0.48;
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.2,
        y: py + 0.06,
        w: 0.08,
        h: 0.08,
        fill: { color: p.iconColor },
        line: { color: p.iconColor },
      });
      s.addText(pt, {
        x: x + 0.35,
        y: py,
        w: w - 0.55,
        h: 0.45,
        fontSize: 9.5,
        fontFace: 'Calibri',
        color: C.textLight,
      });
    });
  });
}

// ==========================================
// SLIDE 19: CURRENT IMPLEMENTATION STATUS
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addSlideHeader(
    s,
    'Verification Status',
    'Current Implementation & Automated Verification Status',
    'Real-world test results and functional delivery confirmed by automated TypeScript test suites and active builds.'
  );

  const statusItems = [
    { module: 'Web Application', status: '100% Operational', desc: 'React 19 Vite application running live on localhost:5173 with complete multi-tab layout', color: C.emerald },
    { module: 'Mobile Android App', status: 'Ready for Build', desc: 'Expo 57 React Native app with tab navigation, custom themes & EAS Android build profile', color: C.emerald },
    { module: 'Unified Authentication', status: 'Fully Tested', desc: 'JWT token issuance, bcrypt passwords, refresh token rotation, and 4-tier RBAC middleware', color: C.emerald },
    { module: 'AI Stylist Chat Engine', status: 'Active & Interactive', desc: 'Conversational assistant with color harmony scoring, body shape heuristics & SKU recommendations', color: C.emerald },
    { module: 'Color Voting Arena', status: 'Live with Sockets', desc: 'Occasion filtering, interactive 5-star voting, real-time socket events & AI Stylist navigation', color: C.emerald },
    { module: 'Designer Showcase', status: 'Functional & Tested', desc: 'Portfolio showcase, design upload modal with palette hex inputs, and merit rating system', color: C.emerald },
    { module: 'Retailer Dashboard', status: 'Functional & Tested', desc: 'Product CRUD, live stock adjustments, low-stock threshold alerts, and order status updates', color: C.emerald },
    { module: 'Admin Governance', status: 'Functional & Tested', desc: 'Admin login, executive KPI overview, user management, and retailer/designer approval views', color: C.emerald },
    { module: 'Automated E2E Tests', status: 'Passing Against DB', desc: 'Automated suites (`test_all_e2e.ts`, `test_admin_*_e2e.ts`) verifying DB transactions & guards', color: C.emerald },
    { module: 'Database Layer', status: 'PostgreSQL Live', desc: 'Prisma client with 14 models, relational constraints, foreign keys, and JSON fallback mode', color: C.emerald },
  ];

  statusItems.forEach((it, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.8 + col * 5.98;
    const y = 2.0 + row * 0.95;
    const w = 5.75;
    const h = 0.85;

    addCard(s, x, y, w, h, { fillColor: C.cardBg, borderColor: C.cardBorder });

    // Status Pill
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.15,
      y: y + 0.15,
      w: 1.35,
      h: 0.26,
      fill: { color: '064E3B' },
      line: { color: C.emerald, width: 1 },
      rectRadius: 0.13,
    });
    s.addText('✓ ' + it.status.toUpperCase(), {
      x: x + 0.15,
      y: y + 0.15,
      w: 1.35,
      h: 0.26,
      fontSize: 7.5,
      fontFace: 'Calibri',
      bold: true,
      color: C.emeraldLight,
      align: 'center',
      valign: 'middle',
    });

    s.addText(it.module, {
      x: x + 1.6,
      y: y + 0.12,
      w: 3.9,
      h: 0.3,
      fontSize: 12,
      fontFace: 'Georgia',
      bold: true,
      color: C.textWhite,
    });

    s.addText(it.desc, {
      x: x + 0.15,
      y: y + 0.45,
      w: w - 0.3,
      h: 0.35,
      fontSize: 8.8,
      fontFace: 'Calibri',
      color: C.textMuted,
    });
  });
}

// ==========================================
// SLIDE 20: FUTURE SCOPE
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addSlideHeader(
    s,
    'Future Roadmap',
    'Future Scope & Planned Innovations (Strictly Labeled Future)',
    'High-impact engineering extensions planned for upcoming development phases — clearly separated from current code.'
  );

  const futureRoadmap = [
    {
      title: 'Advanced Semantic Fashion Search',
      tag: 'Vector AI Embeddings',
      desc: 'Integration of vector embeddings (via pgvector or Pinecone) allowing open-ended conceptual queries such as "vintage Parisian café look for rainy weather".',
      color: C.purple,
    },
    {
      title: 'Visual Similarity & Reverse Image Search',
      tag: 'Computer Vision',
      desc: 'Allowing customers to upload real-world street style photos and find instant visual matches or affordable dupes from active retailer catalogs using CLIP.',
      color: C.rose,
    },
    {
      title: 'Production Virtual Try-On (VTON)',
      tag: 'Diffusion Neural Models',
      desc: 'Upgrade from current schema queue to distributed GPU-powered diffusion models (e.g. IDM-VTON) for photorealistic draping over user selfie uploads.',
      color: C.gold,
    },
    {
      title: 'Multi-Gateway Live Payment Onboarding',
      tag: 'Fintech Rails',
      desc: 'Transitioning from current test intent mock to production Stripe Connect and Razorpay automated merchant payouts and split-tender settlements.',
      color: C.emerald,
    },
    {
      title: 'Deep Machine Learning Personalization',
      tag: 'Recommendation ML',
      desc: 'Dynamic collaborative filtering models learning from user purchase history, color voting preferences, and fit ratings to personalize the home feed.',
      color: C.sky,
    },
    {
      title: 'Mobile Push Notifications (FCM / APNs)',
      tag: 'Cloud Messaging',
      desc: 'Native mobile push notification service alerting shoppers to restocks, price drops, delivery status milestones, and trending color combinations.',
      color: C.rose,
    },
  ];

  futureRoadmap.forEach((f, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = 0.8 + col * 3.98;
    const y = 2.0 + row * 2.45;
    const w = 3.75;
    const h = 2.3;

    addCard(s, x, y, w, h, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: f.color });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.2,
      y: y + 0.2,
      w: Math.max(1.2, f.tag.length * 0.08 + 0.3),
      h: 0.24,
      fill: { color: C.badgeBg },
      line: { color: f.color, width: 1 },
      rectRadius: 0.12,
    });
    s.addText(f.tag.toUpperCase(), {
      x: x + 0.2,
      y: y + 0.2,
      w: Math.max(1.2, f.tag.length * 0.08 + 0.3),
      h: 0.24,
      fontSize: 8,
      fontFace: 'Calibri',
      bold: true,
      color: f.color,
      align: 'center',
      valign: 'middle',
    });

    s.addText(f.title, {
      x: x + 0.2,
      y: y + 0.52,
      w: w - 0.4,
      h: 0.48,
      fontSize: 13,
      fontFace: 'Georgia',
      bold: true,
      color: C.textWhite,
    });

    s.addText(f.desc, {
      x: x + 0.2,
      y: y + 1.05,
      w: w - 0.4,
      h: 1.15,
      fontSize: 10,
      fontFace: 'Calibri',
      color: C.textMuted,
    });
  });
}

// ==========================================
// SLIDE 21: CONCLUSION
// ==========================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };

  // Subtle background aesthetic circle
  s.addShape(pres.shapes.OVAL, {
    x: 4.0,
    y: 1.0,
    w: 5.5,
    h: 5.5,
    fill: { color: '1A1D36', transparency: 75 },
    line: { color: '000000', transparency: 100 },
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 4.8,
    y: 0.6,
    w: 3.7,
    h: 0.35,
    fill: { color: C.badgeBg },
    line: { color: C.cardBorder, width: 1 },
    rectRadius: 0.175,
  });
  s.addText('EXECUTIVE SUMMARY & CONCLUSION', {
    x: 4.8,
    y: 0.6,
    w: 3.7,
    h: 0.35,
    fontSize: 9.5,
    fontFace: 'Calibri',
    bold: true,
    color: C.gold,
    align: 'center',
    valign: 'middle',
  });

  s.addText('Fashion for Everyone', {
    x: 1.5,
    y: 1.05,
    w: 10.3,
    h: 0.8,
    fontSize: 34,
    fontFace: 'Georgia',
    bold: true,
    color: C.textWhite,
    align: 'center',
  });

  s.addText('Bridging AI Intelligence, Community Creativity, and Omnichannel Commerce', {
    x: 1.5,
    y: 1.85,
    w: 10.3,
    h: 0.4,
    fontSize: 14,
    fontFace: 'Calibri',
    color: C.goldLight,
    align: 'center',
  });

  // The Big Platform Equation
  addCard(s, 1.2, 2.4, 10.93, 1.5, { fillColor: C.cardBg, borderColor: C.gold, borderWidth: 1.5 });

  const eqBlocks = [
    { label: 'AI STYLING', color: C.purple, x: 1.4 },
    { label: '+', color: C.textMuted, x: 2.7, isOp: true },
    { label: 'DISCOVERY', color: C.rose, x: 3.1 },
    { label: '+', color: C.textMuted, x: 4.4, isOp: true },
    { label: 'COMMUNITY', color: C.gold, x: 4.8 },
    { label: '+', color: C.textMuted, x: 6.2, isOp: true },
    { label: 'SHOPPING', color: C.emerald, x: 6.6 },
    { label: '+', color: C.textMuted, x: 7.9, isOp: true },
    { label: 'DESIGNERS', color: C.purple, x: 8.3 },
    { label: '+', color: C.textMuted, x: 9.7, isOp: true },
    { label: 'RETAILERS', color: C.emerald, x: 10.1 },
  ];

  eqBlocks.forEach((b) => {
    if (b.isOp) {
      s.addText(b.label, {
        x: b.x,
        y: 2.85,
        w: 0.35,
        h: 0.4,
        fontSize: 18,
        bold: true,
        color: b.color,
        align: 'center',
      });
    } else {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: b.x,
        y: 2.75,
        w: 1.25,
        h: 0.65,
        fill: { color: C.cardBgLight },
        line: { color: b.color, width: 1.5 },
        rectRadius: 0.12,
      });
      s.addText(b.label, {
        x: b.x,
        y: 2.75,
        w: 1.25,
        h: 0.65,
        fontSize: 10,
        fontFace: 'Calibri',
        bold: true,
        color: b.color,
        align: 'center',
        valign: 'middle',
      });
    }
  });

  // Summary Statement Box
  addCard(s, 1.2, 4.15, 10.93, 2.7, { fillColor: C.cardBg, borderColor: C.cardBorder, accentColor: C.rose });

  const summaryBullets = [
    { title: 'Democratized Fashion Styling', desc: 'Delivers accessible, personalized garment advice tailored to real body shapes, skin undertones, and individual occasions.' },
    { title: 'True Multi-Tenant Synergy', desc: 'Seamlessly unites consumers, independent designers seeking recognition, and brick-and-mortar retailers needing inventory velocity.' },
    { title: 'Production-Grade Architecture', desc: 'Built with React 19, Expo 57, Express 5, PostgreSQL, and Prisma ORM, verified through rigorous end-to-end testing suites.' },
    { title: 'Omnichannel Velocity', desc: 'Connects digital discovery directly to physical store stock reservations and reliable home order delivery.' },
  ];

  summaryBullets.forEach((sb, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 1.5 + col * 5.3;
    const y = 4.4 + row * 1.05;

    s.addShape(pres.shapes.OVAL, {
      x,
      y: y + 0.06,
      w: 0.14,
      h: 0.14,
      fill: { color: C.gold },
      line: { color: C.gold },
    });
    s.addText(sb.title, {
      x: x + 0.25,
      y,
      w: 4.8,
      h: 0.3,
      fontSize: 12,
      fontFace: 'Georgia',
      bold: true,
      color: C.textWhite,
    });
    s.addText(sb.desc, {
      x: x + 0.25,
      y: y + 0.28,
      w: 4.8,
      h: 0.65,
      fontSize: 9.5,
      fontFace: 'Calibri',
      color: C.textMuted,
    });
  });

  s.addText('Thank You • Questions & Discussion Welcome', {
    x: 1.2,
    y: 6.95,
    w: 10.93,
    h: 0.4,
    fontSize: 11,
    fontFace: 'Calibri',
    bold: true,
    color: C.goldLight,
    align: 'center',
  });
}

// Write Presentation File
console.log('Generating presentation:', OUTPUT_FILE);
pres
  .writeFile({ fileName: OUTPUT_FILE })
  .then(() => {
    console.log('✅ PRESENTATION GENERATED SUCCESSFULLY:', OUTPUT_FILE);
  })
  .catch((err) => {
    console.error('❌ Failed to generate presentation:', err);
    process.exit(1);
  });
