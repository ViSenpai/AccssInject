// URL directa al archivo JSON con las reglas en tu GitHub (Raw)
const CONFIG_URL = "https://raw.githubusercontent.com/ViSenpai/AccssInject/refs/heads/main/AccssInject/rules.json?token=GHSAT0AAAAAAEPAIL7SAHQFGATYIEDJ37GC2XLQBSA";

// Caché para evitar peticiones en cada cambio de pestaña
let rulesCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos de caché

async function getRules() {
  const now = Date.now();
  if (rulesCache && (now - lastFetchTime < CACHE_TTL)) {
    return rulesCache;
  }
  try {
    const response = await fetch(`${CONFIG_URL}?t=${now}`); // cache buster
    if (!response.ok) throw new Error("No se pudo cargar rules.json");
    rulesCache = await response.json();
    lastFetchTime = now;
    return rulesCache;
  } catch (error) {
    console.error("Error al obtener reglas de GitHub:", error);
    return rulesCache || [];
  }
}

// Inyectar CSS cuando una página completa su carga
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    const rules = await getRules();
    
    for (const rule of rules) {
      // Comprueba si la URL actual coincide con alguna regla
      const regex = new RegExp(rule.urlPattern);
      if (regex.test(tab.url)) {
        try {
          // Obtener el CSS remoto
          const cssResponse = await fetch(`${rule.cssUrl}?t=${Date.now()}`);
          if (!cssResponse.ok) continue;
          
          const cssText = await cssResponse.text();

          // Inyectar el CSS en la pestaña activa
          await chrome.scripting.insertCSS({
            target: { tabId: tabId },
            css: cssText
          });
          console.log(`CSS inyectado en ${tab.url} desde ${rule.cssUrl}`);
        } catch (err) {
          console.error("Error inyectando CSS:", err);
        }
      }
    }
  }
});
