import type { LabTool } from '../registry';

const edgeEcho: LabTool & {
  labels: Record<'en' | 'tr', { environment: string; colo: string; servedAt: string; message: string }>;
} = {
  slug: 'edge-echo',
  title: { en: 'Edge echo', tr: 'Uç yankısı' },
  summary: {
    en: 'Calls a Cloudflare Pages Function and shows which environment and data centre answered. It exists to prove the lab pattern; real tools come next.',
    tr: "Bir Cloudflare Pages Function'ı çağırır ve yanıtı hangi ortamın ve veri merkezinin verdiğini gösterir. Lab düzenini kanıtlamak için var; gerçek araçlar sırada.",
  },
  howItWorks: {
    en: 'The button sends a GET request to /api/lab/edge-echo. A Pages Function in the nearest Cloudflare data centre answers with JSON: the environment it runs in (production or test, from a dashboard variable), the data centre code, the time, and a per-environment message. It keeps nothing: no visitor IP, no logs, no storage. Without JavaScript, the form opens the raw JSON instead.',
    tr: "Düğme /api/lab/edge-echo adresine bir GET isteği gönderir. En yakın Cloudflare veri merkezindeki bir Pages Function JSON ile yanıt verir: çalıştığı ortam (panelde tanımlı bir değişkenden gelen production veya test), veri merkezi kodu, zaman ve ortama özgü bir mesaj. Hiçbir şey saklamaz: ziyaretçi IP'si yok, kayıt yok, depolama yok. JavaScript kapalıysa form doğrudan ham JSON'u açar.",
  },
  status: 'live',
  apiPath: '/api/lab/edge-echo',
  labels: {
    en: { environment: 'Environment', colo: 'Data centre', servedAt: 'Served at', message: 'Message' },
    tr: { environment: 'Ortam', colo: 'Veri merkezi', servedAt: 'Yanıt zamanı', message: 'Mesaj' },
  },
};

export default edgeEcho;
