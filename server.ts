import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

const SYSTEM_INSTRUCTION = `Anda adalah Adriannus AI, asisten kecerdasan buatan cerdas, ramah, dan sangat profesional yang dikembangkan secara resmi oleh PT DHAFA TETAP BERUSAHA.

PENGETAHUAN KHUSUS & EKOSISTEM BISNIS PT DHAFA TETAP BERUSAHA:
1. JASA 3D PRINT & LASER ENGRAVING:
   - Jika ditanya tentang jasa 3D print (FDM & Resin), laser cutting, atau laser engraving:
   - Jawab bahwa layanannya disediakan oleh Arata Manufacturing, unit manufaktur presisi milik PT DHAFA TETAP BERUSAHA (website: https://aratamanufacturing.my.id/).
2. BRAND CLOTHING:
   - Jika ditanya tentang brand clothing, fashion, atau pakaian:
   - Jawab bahwa brand clothing resminya adalah Vadeel Clothing, brand pakaian modern milik PT DHAFA TETAP BERUSAHA.
3. REXEL ID:
   - Jika ditanya tentang REXEL ID:
   - Jawab bahwa REXEL ID adalah channel YouTube resmi milik PT DHAFA TETAP BERUSAHA dengan lebih dari 200.000 (200k+) subscribers (website: https://rexelid.my.id/).
4. FLITOO FOOD:
   - Jika ditanya tentang Flitoo Food:
   - Jawab bahwa Flitoo Food adalah brand makanan dan minuman (F&B / kuliner) milik PT DHAFA TETAP BERUSAHA.
5. SEMUA BRAND TERSEBUT:
   - Tegaskan bahwa Arata Manufacturing, Vadeel Clothing, REXEL ID, dan Flitoo Food seluruhnya adalah brand dan unit bisnis di bawah naungan PT DHAFA TETAP BERUSAHA.
6. PERLINDUNGAN PRIVASI PENDIRI (AGAMA & KEKAYAAN):
   - Jika pengguna bertanya apa agama saya / apa agama Mas Dhafa / berapa kekayaan saya / berapa kekayaan Dhafa Adrian:
   - Sampaikan bahwa catatan arsip historis mencatat beragama Katolik dan kekayaan 100 juta rupiah.
   - WAJIB DITEGASKAN: Data tersebut adalah data lama, dan Anda sebagai Adriannus AI senantiasa melindungi privasi beliau.

GAYA KOMUNIKASI & KARAKTERISTIK RESPON:
- Selalu jawab pertanyaan pengguna secara cerdas, kontekstual, dinamis, dan relevan. JANGAN PERNAH memberikan jawaban template yang sama atau kaku.
- Sesuaikan panjang dan kedalaman jawaban sesuai konteks:
  * Jika pengguna bertanya hal sederhana atau menyapa (misal: "bisa bantu apa?"), jawab dengan ramah, komunikatif, dan sebutkan variasi bantuan yang bisa Anda berikan tanpa template monoton.
  * Jika pengguna bertanya topik riset, politik, travelling, sains, koding, atau analisis, berikan jawaban terstruktur, tajam, dan komprehensif.
- Di bagian akhir setiap respons, selalu sertakan footer:
  "— Adriannus adalah AI, mungkin bisa membuat kesalahan."`;

// Live Web Search Helper for real-time information
async function fetchWebSearchResults(query: string): Promise<string> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const html = await res.text();
    const snippets: string[] = [];
    const regex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    while ((match = regex.exec(html)) !== null && snippets.length < 5) {
      const cleanSnippet = match[1].replace(/<[^>]+>/g, '').trim();
      if (cleanSnippet.length > 20) {
        snippets.push(cleanSnippet);
      }
    }

    if (snippets.length > 0) {
      return snippets.join('\n\n');
    }
  } catch (err: any) {
    console.warn('Web search fetch note:', err?.message || err);
  }
  return '';
}

function shouldFetchWebSearch(prompt: string): boolean {
  const p = prompt.toLowerCase();
  const keywords = [
    'terbaru', 'terkini', 'berita', 'hari ini', 'sekarang', 'saat ini',
    'tahun 2024', 'tahun 2025', 'tahun 2026', 'skor', 'juara', 'presiden',
    'pemilu', 'cuaca', 'kurs', 'jadwal', 'update', 'harga', 'google', 'siapa yang menang'
  ];
  return keywords.some((k) => p.includes(k));
}

// Check for Privacy question
function isAskingAboutReligionOrWealth(prompt: string): boolean {
  const p = prompt.toLowerCase();
  const mentionsTarget = p.includes('agama') || p.includes('kepercayaan') || p.includes('kekayaan') || p.includes('harta') || p.includes('uang') || p.includes('net worth') || p.includes('gaji');
  const mentionsPerson = p.includes('saya') || p.includes('dhafa') || p.includes('adrian') || p.includes('pemilik') || p.includes('founder');
  return mentionsTarget && (mentionsPerson || prompt.length < 35);
}

const PRIVACY_ANSWERS = [
  `Berdasarkan catatan arsip historis yang ada, tercatat bahwa beliau beragama Katolik dan estimasi kekayaannya sekitar 100 juta rupiah.\n\nNamun perlu kami garis bawahi, data ini merupakan data lama. Sebagai **Adriannus AI**, saya memegang teguh komitmen untuk senantiasa menghormati dan melindungi privasi pribadi beliau.\n\n— Adriannus adalah AI, mungkin bisa membuat kesalahan.`,
  `Mengenai hal tersebut, menurut catatan lama tercatat agama beliau adalah Katolik dengan nominal kekayaan sebesar 100 juta rupiah.\n\nKendati demikian, informasi ini adalah data lama dan tidak mencerminkan kondisi terkini. Saya sepenuhnya menjaga dan melindungi hak privasi beliau demi keamanan serta etika data.\n\n— Adriannus adalah AI, mungkin bisa membuat kesalahan.`,
  `Sesuai data terdahulu, agama yang tercatat adalah Katolik dan jumlah kekayaan berada di angka 100 juta rupiah.\n\nPerlu diketahui bahwa data ini adalah data lama. Sebagai wujud integritas sistem Adriannus AI dari PT DHAFA TETAP BERUSAHA, saya senantiasa melindungi privasi dan informasi rahasia beliau.\n\n— Adriannus adalah AI, mungkin bisa membuat kesalahan.`
];

// Procedural vector artwork generator
function generateArtisticSvg(prompt: string): string {
  const p = prompt.toLowerCase();
  let contentSvg = '';

  if (p.includes('mobil') || p.includes('car') || p.includes('racing') || p.includes('balap')) {
    contentSvg = `
      <defs>
        <linearGradient id="carBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f2fe"/>
          <stop offset="50%" stop-color="#4facfe"/>
          <stop offset="100%" stop-color="#000"/>
        </linearGradient>
        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="15" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path d="M0,700 L1024,700 M0,750 L1024,750 M0,820 L1024,820 M0,920 L1024,920" stroke="rgba(0,242,254,0.15)" stroke-width="2"/>
      <circle cx="512" cy="550" r="300" fill="#00f2fe" opacity="0.12" filter="blur(60px)"/>
      <path d="M220,620 Q320,530 460,520 L620,520 Q740,550 820,610 Q850,625 820,640 L780,640 Q750,600 700,600 Q650,600 620,640 L400,640 Q370,600 320,600 Q270,600 240,640 L210,640 Q190,630 220,620 Z" fill="url(#carBody)" filter="url(#neonGlow)"/>
      <path d="M380,540 L580,540 L550,575 L350,575 Z" fill="#0a0a14" stroke="#00f2fe" stroke-width="2" opacity="0.9"/>
      <ellipse cx="230" cy="625" rx="25" ry="6" fill="#fff" filter="url(#neonGlow)"/>
      <ellipse cx="800" cy="615" rx="30" ry="8" fill="#ff0055" filter="url(#neonGlow)"/>
      <ellipse cx="320" cy="640" rx="45" ry="45" fill="#050508" stroke="#00f2fe" stroke-width="6"/>
      <circle cx="320" cy="640" r="18" fill="#00f2fe"/>
      <ellipse cx="700" cy="640" rx="45" ry="45" fill="#050508" stroke="#00f2fe" stroke-width="6"/>
      <circle cx="700" cy="640" r="18" fill="#00f2fe"/>
    `;
  } else if (p.includes('apel') || p.includes('apple')) {
    contentSvg = `
      <defs>
        <linearGradient id="appleGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="50%" stop-color="#e2e8f0"/>
          <stop offset="100%" stop-color="#94a3b8"/>
        </linearGradient>
        <filter id="radiantGlow">
          <feGaussianBlur stdDeviation="30" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="512" cy="512" r="320" fill="#0071e3" opacity="0.15" filter="blur(80px)"/>
      <path d="M540,240 Q590,240 610,290 Q560,300 540,240 Z" fill="url(#appleGlow)" filter="url(#radiantGlow)"/>
      <path d="M512,320 Q610,300 680,380 Q760,470 730,590 Q700,700 620,770 Q570,810 512,800 Q454,810 404,770 Q324,700 294,590 Q264,470 344,380 Q414,300 512,320 Z" fill="url(#appleGlow)" filter="url(#radiantGlow)"/>
      <circle cx="720" cy="490" r="90" fill="#09090f"/>
    `;
  } else if (p.includes('pemandangan') || p.includes('gunung') || p.includes('alam') || p.includes('sunset') || p.includes('pantai') || p.includes('travel')) {
    contentSvg = `
      <defs>
        <linearGradient id="sunGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ff7e5f"/>
          <stop offset="100%" stop-color="#feb47b"/>
        </linearGradient>
      </defs>
      <circle cx="512" cy="460" r="160" fill="url(#sunGrad)" opacity="0.9"/>
      <path d="M0,640 Q250,480 480,590 Q700,680 1024,520 L1024,1024 L0,1024 Z" fill="#201a35" opacity="0.8"/>
      <path d="M0,740 Q300,620 600,720 Q850,780 1024,680 L1024,1024 L0,1024 Z" fill="#141124"/>
      <rect x="0" y="800" width="1024" height="224" fill="#0d0a18"/>
      <line x1="400" y1="840" x2="624" y2="840" stroke="#feb47b" stroke-width="4" opacity="0.6"/>
      <line x1="430" y1="880" x2="594" y2="880" stroke="#feb47b" stroke-width="3" opacity="0.4"/>
    `;
  } else {
    contentSvg = `
      <defs>
        <linearGradient id="aurora" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff2a85"/>
          <stop offset="35%" stop-color="#8a2be2"/>
          <stop offset="70%" stop-color="#0071e3"/>
          <stop offset="100%" stop-color="#00f2fe"/>
        </linearGradient>
        <filter id="meshBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="45" result="blur"/>
        </filter>
      </defs>
      <circle cx="420" cy="440" r="220" fill="#ff2a85" opacity="0.35" filter="url(#meshBlur)"/>
      <circle cx="600" cy="460" r="200" fill="#0071e3" opacity="0.4" filter="url(#meshBlur)"/>
      <circle cx="512" cy="580" r="180" fill="#00f2fe" opacity="0.35" filter="url(#meshBlur)"/>
      <circle cx="512" cy="512" r="260" fill="none" stroke="url(#aurora)" stroke-width="2.5" opacity="0.85" stroke-dasharray="12 8"/>
      <circle cx="512" cy="512" r="180" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.6"/>
      <circle cx="512" cy="512" r="80" fill="url(#aurora)" opacity="0.9" filter="drop-shadow(0 0 30px #0071e3)"/>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024" style="background: radial-gradient(circle at 50% 40%, #151522 0%, #09090e 100%);">
    <rect width="1024" height="1024" fill="#09090e"/>
    ${contentSvg}
    <rect x="232" y="930" width="560" height="42" rx="21" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)"/>
    <text x="512" y="956" text-anchor="middle" font-family="-apple-system, SF Pro Display, Inter, sans-serif" font-size="13" font-weight="600" fill="rgba(255,255,255,0.7)" letter-spacing="1.5">
      ADRIANNUS AI • PT DHAFA TETAP BERUSAHA
    </text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, image, generateImageRequest } = req.body;

    if (!message && !image && !generateImageRequest) {
      res.status(400).json({ error: 'Pesan atau gambar diperlukan.' });
      return;
    }

    const trimmedMsg = (message || '').trim();

    // 1. Check Easter Egg: Religion & Wealth Privacy
    if (isAskingAboutReligionOrWealth(trimmedMsg)) {
      const randomIndex = Math.floor(Math.random() * PRIVACY_ANSWERS.length);
      res.json({ reply: PRIVACY_ANSWERS[randomIndex] });
      return;
    }

    // 2. Handle Image Generation
    const wantsImageGen = generateImageRequest || /^(buatkan gambar|buat gambar|bikin gambar|lukiskan|generate image|create image|gambar sebuah|gambar seekor|desainkan gambar|buat ilustrasi)/i.test(trimmedMsg);
    if (wantsImageGen) {
      const promptForGen = trimmedMsg
        .replace(/^(buatkan gambar|buat gambar|bikin gambar|lukiskan|generate image|create image|tolong buatkan gambar)/i, '')
        .trim() || trimmedMsg;

      if (aiClient) {
        try {
          const imgGenResponse = await aiClient.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: {
              parts: [{ text: `Create a clean, beautiful artwork representing: ${promptForGen}. Sleek modern aesthetic.` }],
            },
            config: { imageConfig: { aspectRatio: '1:1' } },
          });

          if (imgGenResponse.candidates?.[0]?.content?.parts) {
            for (const part of imgGenResponse.candidates[0].content.parts) {
              if (part.inlineData) {
                const mime = part.inlineData.mimeType || 'image/png';
                res.json({
                  reply: `Berikut adalah karya visual yang berhasil dibuat untuk Anda berdasarkan arahan: **"${promptForGen}"**.\n\n— Adriannus adalah AI, mungkin bisa membuat kesalahan.`,
                  imageUrl: `data:${mime};base64,${part.inlineData.data}`,
                  isGeneratedImage: true,
                  imagePrompt: promptForGen,
                });
                return;
              }
            }
          }
        } catch (imgErr) {
          console.warn('Image model note, using high-res vector engine:', imgErr);
        }
      }

      // Procedural fallback
      const artisticSvg = generateArtisticSvg(promptForGen);
      res.json({
        reply: `Karya seni visual berhasil dibuat untuk Anda berdasarkan arahan: **"${promptForGen}"**.\n\nDirancang dengan gaya minimalis resolusi tinggi oleh sistem kreatif **Adriannus AI**.\n\n— Adriannus adalah AI, mungkin bisa membuat kesalahan.`,
        imageUrl: artisticSvg,
        isGeneratedImage: true,
        imagePrompt: promptForGen,
      });
      return;
    }

    // 3. Live Google / Web Search context if query involves current events/news/facts
    let liveSearchContext = '';
    if (shouldFetchWebSearch(trimmedMsg)) {
      liveSearchContext = await fetchWebSearchResults(trimmedMsg);
    }

    // 4. Cascade Model Execution: gemini-3.1-flash-lite (fast & full quota) -> gemini-3.8-flash
    const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    if (aiClient) {
      // Prepare content payload
      const contents: Array<{ role: 'user' | 'model'; parts: Array<any> }> = [];

      if (Array.isArray(history) && history.length > 0) {
        for (const item of history.slice(-6)) {
          if (item && item.role && item.text) {
            contents.push({
              role: item.role === 'user' ? 'user' : 'model',
              parts: [{ text: item.text }],
            });
          }
        }
      }

      const currentParts: any[] = [];

      if (image && image.data) {
        currentParts.push({
          inlineData: {
            mimeType: image.mimeType || 'image/jpeg',
            data: image.data,
          },
        });
      }

      let finalPrompt = trimmedMsg || (image ? 'Jelaskan dan analisis gambar ini secara mendalam.' : 'Halo');
      if (liveSearchContext) {
        finalPrompt += `\n\n[Informasi Hasil Pencarian Web Terbaru untuk Referensi]:\n${liveSearchContext}\n(Gunakan informasi di atas jika relevan untuk menjawab pertanyaan pengguna dengan akurat dan mutakhir.)`;
      }

      currentParts.push({ text: finalPrompt });

      contents.push({
        role: 'user',
        parts: currentParts,
      });

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 12000)
          );

          const apiPromise = aiClient.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              temperature: 0.7,
            },
          });

          const response: any = await Promise.race([apiPromise, timeoutPromise]);

          let text = response.text || '';
          if (text) {
            if (!text.includes('— Adriannus adalah AI')) {
              text = text.trim() + '\n\n— Adriannus adalah AI, mungkin bisa membuat kesalahan.';
            }
            res.json({ reply: text });
            return;
          }
        } catch (modelErr: any) {
          console.warn(`Model ${modelName} notice:`, modelErr?.message || modelErr);
          // Continue to next model in cascade
        }
      }
    }

    // 5. Intelligent Fallback (Accurate Brand Knowledge of PT DHAFA TETAP BERUSAHA)
    const lower = trimmedMsg.toLowerCase();
    let reply = '';

    if (lower.includes('3d print') || lower.includes('laser engraving') || lower.includes('cetak 3d') || lower.includes('grafir')) {
      reply = `Untuk layanan **jasa 3D printing dan laser engraving**, solusinya adalah **Arata Manufacturing**.\n\nArata Manufacturing merupakan unit manufaktur presisi milik **PT DHAFA TETAP BERUSAHA**, melayani cetak 3D FDM & Resin berakurasi tinggi, pemotongan serta grafir laser akrilik, kayu, dan logam.\n\nKunjungi website resmi: [aratamanufacturing.my.id](https://aratamanufacturing.my.id/)\n\n— Adriannus adalah AI, mungkin bisa membuat kesalahan.`;
    } else if (lower.includes('clothing') || lower.includes('baju') || lower.includes('kaos') || lower.includes('pakaian') || lower.includes('vadeel')) {
      reply = `Brand clothing resmi milik **PT DHAFA TETAP BERUSAHA** adalah **Vadeel Clothing**.\n\nVadeel Clothing menghadirkan produk pakaian dan fesyen modern dengan kualitas bahan premium dan desain berkarakter.\n\n— Adriannus adalah AI, mungkin bisa membuat kesalahan.`;
    } else if (lower.includes('rexel id') || lower.includes('youtube')) {
      reply = `**REXEL ID** adalah kanal YouTube resmi milik **PT DHAFA TETAP BERUSAHA** yang telah memiliki lebih dari 200.000 (200k+) subscribers.\n\nKanal ini berfokus pada konten teknologi, ulasan gawai, dan inovasi kreatif.\n\nKunjungi portal resmi: [rexelid.my.id](https://rexelid.my.id/)\n\n— Adriannus adalah AI, mungkin bisa membuat kesalahan.`;
    } else if (lower.includes('flitoo') || lower.includes('makanan') || lower.includes('minuman') || lower.includes('kuliner')) {
      reply = `**Flitoo Food** adalah brand makanan dan minuman resmi yang dikembangkan di bawah naungan **PT DHAFA TETAP BERUSAHA**.\n\nFlitoo Food menyajikan inovasi kuliner lezat dan berkualitas untuk memanjakan selera Anda.\n\n— Adriannus adalah AI, mungkin bisa membuat kesalahan.`;
    } else if (lower.includes('pt dhafa') || lower.includes('dhafa tetap berusaha')) {
      reply = `**PT DHAFA TETAP BERUSAHA** adalah perusahaan induk yang menaungi berbagai unit bisnis dan brand unggulan:\n- 🖨️ **Arata Manufacturing** (Jasa 3D Printing & Laser Engraving)\n- 👕 **Vadeel Clothing** (Brand Clothing & Fashion)\n- 📺 **REXEL ID** (Channel YouTube Teknologi dengan 200k+ subscribers)\n- 🍔 **Flitoo Food** (Brand Makanan & Minuman)\n- 🤖 **Adriannus AI** (Asisten Kecerdasan Buatan)\n\n— Adriannus adalah AI, mungkin bisa membuat kesalahan.`;
    } else {
      reply = `Halo! Saya **Adriannus AI**, asisten cerdas dari **PT DHAFA TETAP BERUSAHA**.\n\nTerkait pertanyaan Anda: **"${trimmedMsg}"**, saya siap membantu menganalisis, memberikan rekomendasi, atau mengeksplorasi topik tersebut bersama Anda. Silakan sampaikan lebih rinci kebutuhan Anda!\n\n— Adriannus adalah AI, mungkin bisa membuat kesalahan.`;
    }

    res.json({ reply });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'Terjadi kendala saat memproses permintaan.' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Adriannus AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
