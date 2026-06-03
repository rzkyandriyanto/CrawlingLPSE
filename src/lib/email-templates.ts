export function buildWelcomeEmailHtml(user: any, tenders: any[]) {
  const userName = user.nama_lengkap || user.perusahaan || "Pengguna";
  
  let tenderRows = '';
  
  if (tenders && tenders.length > 0) {
    tenderRows = tenders.map((t, i) => {
      return `
      <tr>
        <td style="padding: 0 0 16px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <tr>
              <td style="padding: 0;">
                <div style="height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 12px 12px 0 0;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px;">Rekomendasi #${i + 1}</p>
                      <p style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: #1e293b; line-height: 1.4;">${t.nama_paket}</p>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <table cellpadding="0" cellspacing="0">
                        ${t.instansi ? `<tr><td style="padding: 2px 0;"><span style="font-size: 12px; color: #64748b;">🏛&nbsp; ${t.instansi}</span></td></tr>` : ""}
                        ${t.wilayah ? `<tr><td style="padding: 2px 0;"><span style="font-size: 12px; color: #64748b;">📍&nbsp; ${t.wilayah}</span></td></tr>` : ""}
                        ${t.pagu ? `<tr><td style="padding: 2px 0;"><span style="font-size: 12px; color: #64748b;">💰&nbsp; ${t.pagu}</span></td></tr>` : ""}
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    }).join("");
  } else {
    tenderRows = `<tr><td style="padding: 16px; text-align: center; color: #64748b; font-size: 14px;">Saat ini belum ada tender di wilayah Anda, kami akan memberi tahu jika ada yang baru!</td></tr>`;
  }

  const wilayahText = user.kota || user.provinsi || 'Anda';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Selamat Datang di Seleno</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%); border-radius: 20px 20px 0 0; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">Seleno</h1>
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.6); letter-spacing: 2px; text-transform: uppercase;">Platform Intelijen Tender</p>
            </td>
          </tr>
          <!-- GREETING BAND -->
          <tr>
            <td style="background: #6366f1; padding: 18px 40px;">
              <p style="margin: 0; font-size: 14px; color: #e0e7ff; text-align: center;">
                <strong style="color: #ffffff;">Pendaftaran Berhasil 🎉</strong>
              </p>
            </td>
          </tr>
          <!-- BODY -->
          <tr>
            <td style="background: #f8fafc; padding: 32px 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #334155; line-height: 1.6;">
                Halo, <strong>${userName}</strong>! 👋<br/><br/>
                Selamat datang di Seleno! Kami sangat senang Anda bergabung bersama kami. Platform kami dirancang untuk membantu Anda memantau tender pemerintah dengan lebih mudah dan cepat.<br/><br/>
                Sebagai permulaan, kami telah menemukan beberapa rekomendasi tender di sekitar wilayah <strong>${wilayahText}</strong> yang mungkin menarik bagi bisnis Anda:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${tenderRows}
              </table>
              <!-- CTA BUTTON -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard"
                       style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(99,102,241,0.4);">
                      Eksplor Lebih Banyak Tender →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background: #f1f5f9; border-radius: 0 0 20px 20px; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #94a3b8;">
                Email ini dikirim otomatis oleh <strong style="color: #6366f1;">Seleno Platform</strong>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
