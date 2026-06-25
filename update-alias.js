const fs = require("fs");
const path = require("path");

const FILE_PATH = path.join(__dirname, "scripts", "lpse-scraper", "lpse-list.js");
let content = fs.readFileSync(FILE_PATH, "utf8");

// Replace URL DKI Jakarta
content = content.replace(
  /"https:\/\/spse\.inaproc\.id\/dkijakarta(\/eproc4)?"/g, 
  '"https://spse.inaproc.id/jakarta"'
);

// Replace URL Kota Bogor (bisa jadi bogorkota atau bogorkota/eproc4)
content = content.replace(
  /"https:\/\/spse\.inaproc\.id\/bogorkota(\/eproc4)?"/g, 
  '"https://spse.inaproc.id/kotabogor"'
);

// Replace URL Tangsel (bisa jadi tangsel atau tangsel/eproc4)
content = content.replace(
  /"https:\/\/spse\.inaproc\.id\/tangsel(\/eproc4)?"/g, 
  '"https://spse.inaproc.id/tangerangselatankota"'
);

// Replace URL Tangerang Kota (bisa jadi tangerangkota/eproc4)
content = content.replace(
  /"https:\/\/spse\.inaproc\.id\/tangerangkota\/eproc4"/g, 
  '"https://spse.inaproc.id/tangerangkota"'
);

fs.writeFileSync(FILE_PATH, content, "utf8");
console.log("Berhasil mengganti URL alternatif di lpse-list.js!");
