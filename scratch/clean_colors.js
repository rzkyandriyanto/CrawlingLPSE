const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'common', 'DetailModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The replacements to unify the theme into an elegant, monochromatic + indigo scheme
const replacements = [
  { from: /text-blue-[4-6]00/g, to: 'text-indigo-500' },
  { from: /text-blue-700/g, to: 'text-indigo-600' },
  { from: /bg-blue-50/g, to: 'bg-indigo-50' },
  { from: /border-blue-100/g, to: 'border-indigo-100' },
  { from: /border-blue-200/g, to: 'border-indigo-100' },

  { from: /text-purple-[4-6]00/g, to: 'text-indigo-500' },
  { from: /text-purple-700/g, to: 'text-indigo-600' },
  { from: /bg-purple-50/g, to: 'bg-indigo-50' },
  { from: /bg-gradient-to-br from-indigo-50 to-purple-50/g, to: 'bg-indigo-50/50' },

  { from: /text-pink-[4-6]00/g, to: 'text-slate-500' },
  { from: /text-pink-700/g, to: 'text-slate-600' },
  { from: /bg-pink-50/g, to: 'bg-slate-50' },

  { from: /text-orange-[4-6]00/g, to: 'text-slate-500' },
  { from: /bg-orange-50/g, to: 'bg-slate-50' },

  { from: /text-teal-[4-6]00/g, to: 'text-emerald-500' },
  { from: /bg-teal-50/g, to: 'bg-emerald-50' },

  { from: /text-violet-[4-6]00/g, to: 'text-indigo-500' },
  { from: /bg-violet-50/g, to: 'bg-indigo-50' },

  { from: /text-rose-[4-6]00/g, to: 'text-slate-500' },
  { from: /bg-rose-50/g, to: 'bg-slate-50' },
  
  { from: /text-fuchsia-[4-6]00/g, to: 'text-indigo-500' },
  { from: /bg-fuchsia-50/g, to: 'bg-indigo-50' },
  
  { from: /text-cyan-[4-6]00/g, to: 'text-indigo-500' },
  { from: /bg-cyan-50/g, to: 'bg-indigo-50' },

  { from: /text-sky-[4-6]00/g, to: 'text-indigo-500' },
  { from: /bg-sky-50/g, to: 'bg-indigo-50' },
];

let changedCount = 0;
replacements.forEach(rep => {
  const matches = content.match(rep.from);
  if (matches) {
    changedCount += matches.length;
    content = content.replace(rep.from, rep.to);
  }
});

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Replaced ${changedCount} colorful classes to unify the theme.`);
