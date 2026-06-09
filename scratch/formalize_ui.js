const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'common', 'DetailModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The goal: Strip away ALL colorful backgrounds, text colors, and borders.
// Replace with a highly formal, monochromatic and elegant slate/zinc theme.

const replacements = [
  // 1. Remove all colored backgrounds for containers/icons and replace with neutral slate-50 or white
  { from: /bg-(indigo|emerald|amber|red|blue|violet|purple|pink|orange|teal|rose|cyan|sky|fuchsia)-50/g, to: 'bg-slate-50' },
  { from: /bg-(indigo|emerald|amber|red|blue|violet|purple|pink|orange|teal|rose|cyan|sky|fuchsia)-100/g, to: 'bg-slate-100' },
  { from: /bg-(indigo|emerald|amber|red|blue|violet|purple|pink|orange|teal|rose|cyan|sky|fuchsia)-200/g, to: 'bg-slate-200' },
  
  // 2. Change colorful texts (like icons) to formal slate colors
  // Keep amber for stars, maybe red for delete, but standard icons should be slate-500/600
  { from: /text-(indigo|emerald|blue|violet|purple|pink|orange|teal|rose|cyan|sky|fuchsia)-500/g, to: 'text-slate-500' },
  { from: /text-(indigo|emerald|blue|violet|purple|pink|orange|teal|rose|cyan|sky|fuchsia)-600/g, to: 'text-slate-600' },
  { from: /text-(indigo|emerald|blue|violet|purple|pink|orange|teal|rose|cyan|sky|fuchsia)-700/g, to: 'text-slate-700' },

  // 3. Change solid colored backgrounds (buttons, active badges) to a formal dark slate (slate-800 or slate-900)
  { from: /bg-(indigo|emerald|blue|violet|purple|pink|orange|teal|rose|cyan|sky|fuchsia)-600/g, to: 'bg-slate-800' },
  { from: /bg-(indigo|emerald|blue|violet|purple|pink|orange|teal|rose|cyan|sky|fuchsia)-700/g, to: 'bg-slate-900' },
  { from: /hover:bg-(indigo|emerald|blue|violet|purple|pink|orange|teal|rose|cyan|sky|fuchsia)-700/g, to: 'hover:bg-slate-900' },

  // 4. Change borders
  { from: /border-(indigo|emerald|amber|red|blue|violet|purple|pink|orange|teal|rose|cyan|sky|fuchsia)-100/g, to: 'border-slate-200' },
  { from: /border-(indigo|emerald|amber|red|blue|violet|purple|pink|orange|teal|rose|cyan|sky|fuchsia)-200/g, to: 'border-slate-200' },
  { from: /border-(indigo|emerald|amber|red|blue|violet|purple|pink|orange|teal|rose|cyan|sky|fuchsia)-300/g, to: 'border-slate-300' },
  { from: /border-(indigo|emerald|amber|red|blue|violet|purple|pink|orange|teal|rose|cyan|sky|fuchsia)-500/g, to: 'border-slate-800' },
  { from: /border-(indigo|emerald|amber|red|blue|violet|purple|pink|orange|teal|rose|cyan|sky|fuchsia)-600/g, to: 'border-slate-900' },

  // 5. Focus rings
  { from: /focus:ring-(indigo|emerald|amber|red|blue|violet|purple|pink|orange|teal|rose|cyan|sky|fuchsia)-500\/50/g, to: 'focus:ring-slate-400/50' },
  { from: /focus:border-(indigo|emerald|amber|red|blue|violet|purple|pink|orange|teal|rose|cyan|sky|fuchsia)-200/g, to: 'focus:border-slate-400' },
  { from: /focus:border-(indigo|emerald|amber|red|blue|violet|purple|pink|orange|teal|rose|cyan|sky|fuchsia)-300/g, to: 'focus:border-slate-400' },

  // Exceptions / Overrides if necessary:
  // e.g., if we want to keep star colors amber, let's revert amber texts for stars.
  // We'll run the regex, but since we grouped amber above only in backgrounds and borders, wait, I included amber in text? No, I excluded amber and red from text regex!
  // Regex 2: (indigo|emerald|blue|violet|purple|pink|orange|teal|rose|cyan|sky|fuchsia). Amber and red are NOT there!
  // Regex 3: excluded amber and red.
  // Regex 4: included amber and red for borders. That's fine, borders should be neutral.
];

let changedCount = 0;
replacements.forEach(rep => {
  const matches = content.match(rep.from);
  if (matches) {
    changedCount += matches.length;
    content = content.replace(rep.from, rep.to);
  }
});

// A few specific overrides for ultimate elegance:
// Instead of rounded-2xl or 3xl, sometimes rounded-xl or rounded-lg is more formal.
content = content.replace(/rounded-2xl/g, 'rounded-xl');
content = content.replace(/rounded-3xl/g, 'rounded-xl');
content = content.replace(/shadow-lg/g, 'shadow-sm');
content = content.replace(/shadow-md/g, 'shadow-sm');

// Change modal background from anything fancy to plain white or slate-50
content = content.replace(/bg-gradient-to-br from-slate-50 to-white/g, 'bg-white');

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Formalized UI. Replaced ${changedCount} wild color/shape classes to unify the theme.`);
