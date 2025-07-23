import { NextRequest, NextResponse } from "next/server";

export const config = {
  runtime: "edge",
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const endpoint = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=91`;
    await delay(25000); // Pauses pour contourner les limites de l'API CoinGecko

    const res = await fetch(endpoint);
    if (!res.ok) {
      return NextResponse.json({ error: "CoinGecko error", code: res.status }, { status: 500 });
    }

    const data = await res.json();
    const volumes = data.total_volumes;

    if (!volumes || volumes.length < 90) {
      return NextResponse.json({ error: "Insufficient data" }, { status: 500 });
    }

    const sorted = volumes.sort((a: number[], b: number[]) => a[0] - b[0]);
    const last90 = sorted.slice(-90).map(v => v[1]);
    const last3 = sorted.slice(-3).map(v => v[1]);

    const sum3 = last3.reduce((a, b) => a + b, 0);
    const avg90 = last90.reduce((a, b) => a + b, 0) / 90;
    const ratio = avg90 > 0 ? sum3 / avg90 : null;

    return NextResponse.json({ ratio });
  } catch (error) {
    return NextResponse.json({ error: "Server error", detail: error }, { status: 500 });
  }
}
