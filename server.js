import express from 'express';
import cors from 'cors';
import ytSearch from 'yt-search';
import youtubedl from 'youtube-dl-exec';

const app = express();
app.use(cors());

app.get('/api/search', async (req, res) => {
  try {
    const r = await ytSearch(req.query.q);
    res.json(r.videos.slice(0, 15));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/download', async (req, res) => {
  const videoId = req.query.id;
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`🚀 Начинаю загрузку: ${videoId}`);

  res.header('Content-Disposition', `attachment; filename="${videoId}.mp3"`);
  res.header('Content-Type', 'audio/mpeg'); // <-- ДОБАВИТЬ ЭТУ СТРОКУ
  res.header('Access-Control-Allow-Origin', '*');
  
  try {
    const subprocess = youtubedl.exec(url, {
      extractAudio: true,
      audioFormat: 'mp3',
      output: '-',
      quiet: true,
    }, { stdio: ['ignore', 'pipe', 'pipe'] });

    subprocess.stdout.pipe(res);

    // Важно: не даем серверу упасть, если процесс завершился с ошибкой
    subprocess.on('error', (err) => {
      console.error('⚠️ Ошибка процесса:', err.message);
      if (!res.headersSent) res.status(500).end();
    });

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (!res.headersSent) res.status(500).send(error.message);
  }
});

// ГЛОБАЛЬНЫЙ ПРЕДОХРАНИТЕЛЬ: чтобы сервер не падал никогда
process.on('uncaughtException', (err) => console.error('🔥 Критическая ошибка:', err));

// Порт выдаст Render, либо используем 3001 локально
const PORT = process.env.PORT || 3001;

// Важно: добавляем '0.0.0.0', чтобы облако нас увидело!
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Pulsar: Сервер запущен на порту ${PORT}!`);
});
