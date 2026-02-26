import { NextRequest, NextResponse } from "next/server";

/* ── 타입 ── */
interface NaverLocalItem {
  title: string;
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
}

interface PharmacyResult {
  name: string;
  address: string;
  roadAddress: string;
  phone: string;
  distance: number;
  lat: number;
  lng: number;
  naverLink: string;
  category: string;
  is24h: boolean;
  openStatus: "open" | "closed" | "unknown";
  openLabel: string;
  todayHours: string;
}

interface DutyItem {
  dutyName: string;
  dutyAddr: string;
  dutyTel1: string;
  dutyTime1s: string;
  dutyTime1c: string;
  dutyTime2s: string;
  dutyTime2c: string;
  dutyTime3s: string;
  dutyTime3c: string;
  dutyTime4s: string;
  dutyTime4c: string;
  dutyTime5s: string;
  dutyTime5c: string;
  dutyTime6s: string;
  dutyTime6c: string;
  dutyTime7s: string;
  dutyTime7c: string;
  dutyTime8s: string;
  dutyTime8c: string;
  wgs84Lat: number | string;
  wgs84Lon: number | string;
}

/* ── Haversine 거리 ── */
function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── 시간 포맷 "0900" → "09:00" ── */
function fmtTime(raw: string | undefined | null): string {
  if (!raw || raw.length < 4) return "";
  return `${raw.slice(0, 2)}:${raw.slice(2, 4)}`;
}

/* ── 공공데이터 기반 실제 영업 상태 ── */
function getDutyStatus(duty: DutyItem) {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const day = kst.getUTCDay();
  const currentMins = kst.getUTCHours() * 60 + kst.getUTCMinutes();

  const dutyKey = day === 0 ? 7 : day;
  const fields: Record<number, [string | undefined, string | undefined]> = {
    1: [duty.dutyTime1s, duty.dutyTime1c],
    2: [duty.dutyTime2s, duty.dutyTime2c],
    3: [duty.dutyTime3s, duty.dutyTime3c],
    4: [duty.dutyTime4s, duty.dutyTime4c],
    5: [duty.dutyTime5s, duty.dutyTime5c],
    6: [duty.dutyTime6s, duty.dutyTime6c],
    7: [duty.dutyTime7s, duty.dutyTime7c],
  };

  const [sRaw, cRaw] = fields[dutyKey] ?? [undefined, undefined];

  if (!sRaw || !cRaw) {
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    return {
      openStatus: "closed" as const,
      openLabel: `${dayNames[day]}요일 휴무`,
      todayHours: "휴무",
      is24h: false,
    };
  }

  const startStr = fmtTime(sRaw);
  const endStr = fmtTime(cRaw);
  const todayHours = `${startStr}~${endStr}`;
  const startMins = parseInt(sRaw.slice(0, 2)) * 60 + parseInt(sRaw.slice(2, 4));
  const endMins = parseInt(cRaw.slice(0, 2)) * 60 + parseInt(cRaw.slice(2, 4));

  const is24h =
    (startMins === 0 && endMins === 0) ||
    (startMins === 0 && endMins >= 1439) ||
    endMins - startMins >= 1380;

  if (is24h)
    return { openStatus: "open" as const, openLabel: "24시 영업", todayHours: "00:00~24:00", is24h: true };

  if (currentMins >= startMins && currentMins < endMins)
    return { openStatus: "open" as const, openLabel: `영업중 ~${endStr}`, todayHours, is24h: false };

  if (currentMins < startMins)
    return { openStatus: "closed" as const, openLabel: `${startStr} 오픈`, todayHours, is24h: false };

  return { openStatus: "closed" as const, openLabel: "영업 종료", todayHours, is24h: false };
}

/* ── 추정 기반 영업 상태 (폴백) ── */
function estimateOpenStatus(is24h: boolean) {
  if (is24h)
    return { openStatus: "open" as const, openLabel: "24시 영업", todayHours: "00:00~24:00" };

  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const day = kst.getUTCDay();
  const mins = kst.getUTCHours() * 60 + kst.getUTCMinutes();

  if (day === 0) return { openStatus: "closed" as const, openLabel: "일요일 휴무", todayHours: "휴무" };

  if (day === 6) {
    const h = "09:00~13:00";
    if (mins >= 540 && mins < 780) return { openStatus: "open" as const, openLabel: "영업중 ~13:00", todayHours: h };
    if (mins < 540) return { openStatus: "closed" as const, openLabel: "09:00 오픈", todayHours: h };
    return { openStatus: "closed" as const, openLabel: "영업 종료", todayHours: h };
  }

  const h = "09:00~18:00";
  if (mins >= 540 && mins < 1080) return { openStatus: "open" as const, openLabel: "영업중 ~18:00", todayHours: h };
  if (mins < 540) return { openStatus: "closed" as const, openLabel: "09:00 오픈", todayHours: h };
  return { openStatus: "closed" as const, openLabel: "영업 종료", todayHours: h };
}

/* ── 네이버 로컬 검색 ── */
async function searchNaver(
  query: string,
  clientId: string,
  clientSecret: string
): Promise<NaverLocalItem[]> {
  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5&sort=comment`;
  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items ?? [];
}

/* ── 공공데이터 약국 검색 (선택적 보강) ── */
async function searchPublicPharmacy(
  lat: number,
  lng: number,
  serviceKey: string
): Promise<DutyItem[]> {
  try {
    // data.go.kr는 serviceKey를 직접 붙여야 이중 인코딩 방지됨
    const base = "https://apis.data.go.kr/B551182/pharmacyInfoService/getParmacyBasisList";
    const params = `serviceKey=${serviceKey}&numOfRows=30&pageNo=1&xPos=${lng}&yPos=${lat}&radius=3000&_type=json`;
    const res = await fetch(`${base}?${params}`);

    if (!res.ok) return [];

    const text = await res.text();
    if (text.trim().startsWith("<") || text.trim() === "Unauthorized") return [];

    const data = JSON.parse(text);
    if (data?.response?.header?.resultCode !== "00") return [];

    const items = data?.response?.body?.items?.item;
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  } catch {
    return [];
  }
}

/* ── 역지오코딩 ── */
async function reverseGeocode(lat: number, lng: number) {
  try {
    // zoom 레벨별로 시도 (세밀 → 넓은)
    for (const zoom of [18, 16, 14]) {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=${zoom}&accept-language=ko`,
        { headers: { "User-Agent": "PharmTalk/1.0" } }
      );
      if (!res.ok) continue;

      const data = await res.json();
      const addr = data.address ?? {};

      const dong = addr.neighbourhood ?? addr.quarter ?? addr.suburb ?? "";
      const gu = addr.city_district ?? addr.county ?? "";
      const city = addr.city ?? addr.town ?? addr.village ?? "";

      if (dong || gu) return { dong, gu, city };
    }
  } catch {
    // ignore
  }
  return { dong: "", gu: "", city: "" };
}

/* ════════════════════════════════════════════
   메인 핸들러
   ════════════════════════════════════════════ */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "0");
  const lng = parseFloat(searchParams.get("lng") ?? "0");

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  const publicDataKey = process.env.PUBLIC_DATA_API_KEY;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  try {
    // ── 1. 역지오코딩 + 공공데이터 동시 호출 ──
    const [area, dutyList] = await Promise.all([
      reverseGeocode(lat, lng),
      publicDataKey ? searchPublicPharmacy(lat, lng, publicDataKey) : Promise.resolve([]),
    ]);

    // 공공데이터 이름→영업시간 매핑
    const dutyMap = new Map<string, DutyItem>();
    for (const d of dutyList) {
      if (d.dutyName) dutyMap.set(d.dutyName.replace(/\s+/g, ""), d);
    }

    // ── 2. 네이버 로컬 검색 (메인) ──
    // 구체적 → 넓은 순서로 여러 쿼리
    const queries: string[] = [];
    if (area.dong && area.gu) queries.push(`${area.gu} ${area.dong} 약국`);
    if (area.dong) queries.push(`${area.dong} 약국`);
    if (area.gu) queries.push(`${area.gu} 약국`);
    if (area.dong) queries.push(`${area.dong} 근처 약국`);
    // 최소 보장
    if (queries.length === 0) queries.push("내주변 약국");

    const allItems: NaverLocalItem[] = [];
    const seen = new Set<string>();

    for (const query of queries) {
      const items = await searchNaver(query, clientId, clientSecret);
      for (const item of items) {
        // 약국 카테고리인지 체크
        if (!item.category.includes("약국")) continue;
        const key = (item.roadAddress || item.address).trim();
        if (key && !seen.has(key)) {
          seen.add(key);
          allItems.push(item);
        }
      }
    }

    // ── 3. 결과 가공 ──
    const pharmacies: PharmacyResult[] = [];

    for (const item of allItems) {
      const pLng = parseInt(item.mapx) / 10000000;
      const pLat = parseInt(item.mapy) / 10000000;
      const distance = lat && lng ? calcDistance(lat, lng, pLat, pLng) : 0;

      // 5km 초과 제외
      if (distance > 5000) continue;

      const cleanName = item.title.replace(/<[^>]*>/g, "").trim();
      const normalName = cleanName.replace(/\s+/g, "");

      const is24hByName =
        cleanName.includes("24시") ||
        cleanName.includes("이십사시") ||
        item.description.includes("24시") ||
        item.category.includes("24시");

      // 공공데이터 매칭 → 실제 영업시간
      const matched = dutyMap.get(normalName);
      let openStatus: "open" | "closed" | "unknown";
      let openLabel: string;
      let todayHours: string;
      let is24h: boolean;

      if (matched) {
        const real = getDutyStatus(matched);
        openStatus = real.openStatus;
        openLabel = real.openLabel;
        todayHours = real.todayHours;
        is24h = real.is24h || is24hByName;
      } else {
        const est = estimateOpenStatus(is24hByName);
        openStatus = est.openStatus;
        openLabel = est.openLabel;
        todayHours = est.todayHours;
        is24h = is24hByName;
      }

      pharmacies.push({
        name: cleanName,
        address: item.address,
        roadAddress: item.roadAddress,
        phone: item.telephone,
        distance: Math.round(distance),
        lat: pLat,
        lng: pLng,
        naverLink: item.link,
        category: item.category,
        is24h,
        openStatus,
        openLabel,
        todayHours,
      });
    }

    // ── 4. 공공데이터 전용 약국 추가 (네이버에 안 잡힌 것) ──
    if (dutyList.length > 0) {
      const existingNames = new Set(
        pharmacies.map((p) => p.name.replace(/\s+/g, ""))
      );

      for (const duty of dutyList) {
        const name = (duty.dutyName ?? "").trim();
        if (!name || existingNames.has(name.replace(/\s+/g, ""))) continue;

        const pLat = parseFloat(String(duty.wgs84Lat));
        const pLng = parseFloat(String(duty.wgs84Lon));
        if (!pLat || !pLng) continue;

        const distance = calcDistance(lat, lng, pLat, pLng);
        if (distance > 5000) continue;

        const { openStatus, openLabel, todayHours, is24h } = getDutyStatus(duty);

        pharmacies.push({
          name,
          address: duty.dutyAddr ?? "",
          roadAddress: duty.dutyAddr ?? "",
          phone: duty.dutyTel1 ?? "",
          distance: Math.round(distance),
          lat: pLat,
          lng: pLng,
          naverLink: "",
          category: "약국",
          is24h: is24h || name.includes("24시"),
          openStatus,
          openLabel,
          todayHours,
        });
      }
    }

    pharmacies.sort((a, b) => a.distance - b.distance);

    return NextResponse.json({
      pharmacies,
      hasRealHours: dutyList.length > 0,
    });
  } catch (error) {
    console.error("Pharmacy search error:", error);
    return NextResponse.json({ error: "약국 검색에 실패했습니다." }, { status: 500 });
  }
}
