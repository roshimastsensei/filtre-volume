import fetch from "node-fetch";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing ID" });
  }

  const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=91`;

  try {
    await new Promise((resolve) => setTimeout(resolve, 25000)); // Pause anti-429

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(500).json({ error: "CoinGecko error", code: response.status });
    }

    const data = await response.json();
    const volumes = data.total_volumes;

    if (!volumes || volumes.length < 90) {
      return res.status(500).json({ error: "Insufficient data" });
    }

    const sorted = volumes.sort((a, b) => a[0] - b[0]);
    const last90 = sorted.slice(-90).map(v => v[1]);
    const last3 = sorted.slice(-3).map(v => v[1]);

    const sum3 = last3.reduce((a, b) => a + b, 0);
    const avg90 = last90.reduce((a, b) => a + b, 0) / 90;
    const ratio = avg90 > 0 ? sum3 / avg90 : null;

    return res.status(200).json({ ratio });
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}

