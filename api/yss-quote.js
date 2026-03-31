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

      // Extract topic from h4 text (before the <small> date tag)
      const h4 = block.match(/<h4[^>]*>([\s\S]*?)<\/h4>/);
      if (h4) {
        const h4Clean = h4[1].replace(/<small[^>]*>[\s\S]*?<\/small>/g, "").replace(/<[^>]+>/g, "").trim();
        if (h4Clean) topic = h4Clean;
      }

      // All <p> tags in order
      const paragraphs = [...block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)];

      // First <p> = quote text, remaining <p> = attribution
      // Attribution typically starts with a dash character (–, —, &#8211;)
      const quoteParts = [];
      const attrParts = [];
      let hitAttribution = false;
      for (const m of paragraphs) {
        const text = m[1].replace(/<[^>]+>/g, "").trim();
        if (!text) continue;
        // Detect attribution: starts with dash/ndash/mdash or contains author name pattern
        if (!hitAttribution && /^[\u2013\u2014\-–—]|^&#821[012];/.test(m[1].trim())) {
          hitAttribution = true;
        }
        if (hitAttribution) {
          attrParts.push(text);
        } else {
          quoteParts.push(text);
        }
      }
      quote = quoteParts.join(" ");
      attribution = attrParts.join(" ").replace(/^[\u2013\u2014\-–—]\s*/, "");
    }

    // Decode HTML entities via a map + numeric entity handler
    const entityMap = {
      "&quot;": '"', "&#039;": "'", "&amp;": "&", "&nbsp;": " ",
      "&ldquo;": "\u201C", "&rdquo;": "\u201D", "&lsquo;": "\u2018", "&rsquo;": "\u2019",
      "&ndash;": "\u2013", "&mdash;": "\u2014", "&hellip;": "\u2026",
      "&lt;": "<", "&gt;": ">", "&apos;": "'",
    };
    const decodeEntities = (s) =>
      s.replace(/&[#a-zA-Z0-9]+;/g, (m) => {
        if (entityMap[m]) return entityMap[m];
        const num = m.startsWith("&#x")
          ? parseInt(m.slice(3, -1), 16)
          : m.startsWith("&#")
            ? parseInt(m.slice(2, -1), 10)
            : NaN;
        return isNaN(num) ? m : String.fromCodePoint(num);
      });
    quote = decodeEntities(quote);
    attribution = decodeEntities(attribution).replace(/^[\u2013\u2014\-–—]\s*/, "");

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
