const cache = { data: null, ts: 0 };
const CACHE_TTL = 60 * 60 * 1000; // 1 hour — quote changes daily

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const now = Date.now();
  if (cache.data && now - cache.ts < CACHE_TTL) {
    res.setHeader("Cache-Control", "no-store");
    return res.json({ ...cache.data, cached: true });
  }

  try {
    const resp = await fetch("https://yssofindia.org/quote");
    const html = await resp.text();

    // Extract quote text from .yss-dynamic-quote > p (excluding p.quoteby)
    const quoteMatch = html.match(
      /<div[^>]*class="[^"]*yss-dynamic-quote[^"]*"[^>]*>([\s\S]*?)<\/div>/
    );
    let quote = "";
    let attribution = "";
    let topic = "";

    if (quoteMatch) {
      const block = quoteMatch[1];

      // Extract topic from h3
      const h3 = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
      if (h3) topic = h3[1].replace(/<[^>]+>/g, "").trim();

      // Extract quote paragraphs (exclude p.quoteby)
      const paragraphs = [...block.matchAll(/<p(?![^>]*quoteby)[^>]*>([\s\S]*?)<\/p>/g)];
      quote = paragraphs
        .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
        .filter(Boolean)
        .join(" ");

      // Extract attribution from p.quoteby or h4
      const quoteby = block.match(/<p[^>]*class="[^"]*quoteby[^"]*"[^>]*>([\s\S]*?)<\/p>/);
      if (quoteby) {
        attribution = quoteby[1].replace(/<[^>]+>/g, "").trim();
      } else {
        const h4 = block.match(/<h4[^>]*>([\s\S]*?)<\/h4>/);
        if (h4) attribution = h4[1].replace(/<[^>]+>/g, "").trim();
      }
    }

    // Clean up unicode/HTML entities
    quote = quote.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");
    attribution = attribution.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");

    const result = { quote, attribution, topic };
    cache.data = result;
    cache.ts = now;

    res.setHeader("Cache-Control", "no-store");
    res.json({ ...result, cached: false });
  } catch (err) {
    console.error("[yss-quote] error:", err);
    res.json({
      quote: "",
      attribution: "",
      topic: "",
      warning: err.message,
    });
  }
}
