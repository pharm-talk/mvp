"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Navigation,
  Loader2,
  MapPinOff,
  ExternalLink,
  RefreshCw,
  Clock,
  List,
  Map as MapIcon,
} from "lucide-react";

/* ── 타입 ── */
interface Pharmacy {
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

type FilterType = "all" | "open";
type ViewMode = "map" | "list";

/* ── 마커 SVG 생성 ── */
function pharmacyMarkerSvg(
  status: "open" | "24h" | "closed",
  selected: boolean
) {
  const colors = {
    open: { bg: "#16B364", ring: "#BBF7D0" },
    "24h": { bg: "#EF4444", ring: "#FECACA" },
    closed: { bg: "#9CA3AF", ring: "#E5E7EB" },
  };
  const { bg, ring } = colors[status];
  const size = selected ? 48 : 40;
  const r = size / 2;
  const crossSize = selected ? 10 : 8;
  const pinTail = selected ? 8 : 6;

  return `<svg width="${size}" height="${size + pinTail}" viewBox="0 0 ${size} ${size + pinTail}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-20%" y="-10%" width="140%" height="150%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.2"/>
      </filter>
    </defs>
    <g filter="url(#shadow)">
      <circle cx="${r}" cy="${r}" r="${r - 2}" fill="white"/>
      <circle cx="${r}" cy="${r}" r="${r - 5}" fill="${bg}"/>
      ${selected ? `<circle cx="${r}" cy="${r}" r="${r - 2}" fill="none" stroke="${ring}" stroke-width="2.5"/>` : ""}
      <rect x="${r - crossSize / 2}" y="${r - crossSize * 1.6}" width="${crossSize}" height="${crossSize * 3.2}" rx="2" fill="white" opacity="0.95"/>
      <rect x="${r - crossSize * 1.6}" y="${r - crossSize / 2}" width="${crossSize * 3.2}" height="${crossSize}" rx="2" fill="white" opacity="0.95"/>
      <polygon points="${r - 6},${size - 2} ${r},${size + pinTail - 2} ${r + 6},${size - 2}" fill="white"/>
    </g>
  </svg>`;
}

/* ── 내 위치 마커 (펄스 애니메이션) ── */
function myLocationMarkerHtml() {
  return `<div style="position:relative;width:20px;height:20px;">
    <div style="
      position:absolute;inset:-6px;
      border-radius:50%;
      background:rgba(59,130,246,0.15);
      animation:locPulse 2s ease-out infinite;
    "></div>
    <div style="
      position:absolute;inset:0;
      border-radius:50%;
      background:#3B82F6;
      border:3px solid white;
      box-shadow:0 2px 8px rgba(59,130,246,0.4);
    "></div>
  </div>`;
}

/* ── 팝업 HTML ── */
function popupHtml(pharmacy: Pharmacy) {
  const statusColor =
    pharmacy.is24h
      ? "#EF4444"
      : pharmacy.openStatus === "open"
        ? "#16B364"
        : "#9CA3AF";
  const statusLabel = pharmacy.is24h ? "24시 영업" : pharmacy.openLabel;
  const distLabel = pharmacy.distance < 1000 ? pharmacy.distance + "m" : (pharmacy.distance / 1000).toFixed(1) + "km";

  return `<div style="font-family:Pretendard,system-ui,sans-serif;min-width:180px;padding:4px 2px;">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
      <span style="
        display:inline-block;width:8px;height:8px;border-radius:50%;
        background:${statusColor};flex-shrink:0;
      "></span>
      <span style="font-size:13px;font-weight:700;color:#111827;line-height:1.3;">
        ${pharmacy.name}
      </span>
    </div>
    <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
      <span style="
        font-size:10px;font-weight:600;
        padding:2px 6px;border-radius:10px;
        background:${statusColor}15;color:${statusColor};
      ">${statusLabel}</span>
      ${pharmacy.todayHours && pharmacy.todayHours !== "휴무" ? `<span style="font-size:10px;color:#9CA3AF;">오늘 ${pharmacy.todayHours}</span>` : ""}
      <span style="font-size:11px;color:#9CA3AF;">${distLabel}</span>
    </div>
    <p style="font-size:11px;color:#6B7280;margin:0;line-height:1.4;">
      ${pharmacy.roadAddress || pharmacy.address}
    </p>
    ${pharmacy.phone ? `<p style="font-size:11px;color:#6B7280;margin:3px 0 0;">
      ${pharmacy.phone}
    </p>` : ""}
  </div>`;
}

export default function PharmacyPage() {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [hasRealHours, setHasRealHours] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);

  /* ── Leaflet 동적 로드 (SSR 방지) ── */
  useEffect(() => {
    import("leaflet").then((L) => {
      leafletRef.current = L;
      setMapReady(true);
    });
  }, []);

  /* ── 커스텀 CSS 주입 ── */
  useEffect(() => {
    const id = "pharmacy-map-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes locPulse {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(2.5); opacity: 0; }
      }
      .leaflet-popup-content-wrapper {
        border-radius: 16px !important;
        box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important;
        padding: 0 !important;
        border: none !important;
      }
      .leaflet-popup-content {
        margin: 12px 14px !important;
        font-size: 13px !important;
        line-height: 1.4 !important;
      }
      .leaflet-popup-tip {
        box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important;
      }
      .leaflet-control-zoom {
        border: none !important;
        box-shadow: 0 2px 12px rgba(0,0,0,0.1) !important;
        border-radius: 12px !important;
        overflow: hidden !important;
      }
      .leaflet-control-zoom a {
        width: 36px !important;
        height: 36px !important;
        line-height: 36px !important;
        font-size: 16px !important;
        color: #374151 !important;
        border-color: #F3F4F6 !important;
      }
      .leaflet-control-zoom a:hover {
        background: #F9FAFB !important;
      }
      .pharmacy-marker {
        transition: transform 0.15s ease-out;
      }
      .pharmacy-marker:hover {
        transform: scale(1.15) translateY(-2px);
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, []);

  /* ── 위치 가져오기 ── */
  const getLocation = useCallback(() => {
    setLocationError("");
    setLoading(true);

    if (!navigator.geolocation) {
      setLocationError("이 기기에서 위치 서비스를 지원하지 않아요.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError(
            "위치 권한을 허용해주세요.\n설정에서 위치 접근을 허용할 수 있어요."
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationError("현재 위치를 확인할 수 없어요.");
        } else {
          setLocationError("위치 정보를 가져오는 데 시간이 너무 걸려요.");
        }
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  /* ── 약국 검색 ── */
  const fetchPharmacies = useCallback(async () => {
    if (!userLocation) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/pharmacy/search?lat=${userLocation.lat}&lng=${userLocation.lng}&filter=all`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "검색에 실패했습니다.");
        setPharmacies([]);
      } else {
        setPharmacies(data.pharmacies ?? []);
        setHasRealHours(data.hasRealHours ?? false);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    }
    setLoading(false);
  }, [userLocation]);

  useEffect(() => {
    if (userLocation) fetchPharmacies();
  }, [userLocation, fetchPharmacies]);

  /* ── 지도 초기화 ── */
  useEffect(() => {
    if (
      !mapReady ||
      !mapContainerRef.current ||
      !userLocation ||
      !leafletRef.current
    )
      return;
    const L = leafletRef.current;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView([userLocation.lat, userLocation.lng], 15);

      L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);

      // CartoDB Voyager 타일 (깔끔하고 모던한 디자인, 무료)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
          subdomains: "abcd",
        }
      ).addTo(mapRef.current);

      // 내 위치 마커 (파란 펄스 점)
      const myIcon = L.divIcon({
        html: myLocationMarkerHtml(),
        className: "",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      L.marker([userLocation.lat, userLocation.lng], {
        icon: myIcon,
        zIndexOffset: 1000,
      }).addTo(mapRef.current);
    } else {
      mapRef.current.panTo([userLocation.lat, userLocation.lng]);
    }
  }, [mapReady, userLocation]);

  /* ── 약국 마커 ── */
  useEffect(() => {
    if (!mapReady || !mapRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    const map = mapRef.current;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const displayed =
      filter === "open"
        ? pharmacies.filter((p) => p.openStatus === "open")
        : pharmacies;

    displayed.forEach((pharmacy, idx) => {
      const status: "open" | "24h" | "closed" = pharmacy.is24h
        ? "24h"
        : pharmacy.openStatus === "open"
          ? "open"
          : "closed";

      const isSelected = selectedIdx === idx;
      const size = isSelected ? 48 : 40;
      const pinTail = isSelected ? 8 : 6;

      const icon = L.divIcon({
        html: `<div class="pharmacy-marker">${pharmacyMarkerSvg(status, isSelected)}</div>`,
        className: "",
        iconSize: [size, size + pinTail],
        iconAnchor: [size / 2, size + pinTail],
        popupAnchor: [0, -(size + pinTail - 4)],
      });

      const marker = L.marker([pharmacy.lat, pharmacy.lng], {
        icon,
        zIndexOffset: isSelected ? 500 : 0,
      })
        .addTo(map)
        .bindPopup(popupHtml(pharmacy), {
          closeButton: false,
          maxWidth: 240,
          minWidth: 180,
          className: "",
        });

      marker.on("click", () => setSelectedIdx(idx));
      markersRef.current.push(marker);
    });
  }, [pharmacies, filter, mapReady, selectedIdx]);

  /* ── 필터된 목록 ── */
  const displayed =
    filter === "open"
      ? pharmacies.filter((p) => p.openStatus === "open")
      : pharmacies;

  /* ── 유틸 ── */
  const formatDistance = (meters: number) =>
    meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;

  const handleCall = (phone: string) => {
    if (phone) window.location.href = `tel:${phone}`;
  };

  const handleNavigate = (pharmacy: Pharmacy) => {
    window.open(
      `https://map.naver.com/v5/directions/-/-/-/transit?c=${pharmacy.lng},${pharmacy.lat},15,0,0,0,dh`,
      "_blank"
    );
  };

  const focusOnMap = (pharmacy: Pharmacy, idx: number) => {
    setSelectedIdx(idx);
    if (mapRef.current) {
      mapRef.current.panTo([pharmacy.lat, pharmacy.lng]);
      setViewMode("map");
      const marker = markersRef.current[idx];
      if (marker) marker.openPopup();
    }
  };

  const openCount = pharmacies.filter(
    (p) => p.openStatus === "open"
  ).length;

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* Leaflet CSS */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />

      {/* 헤더 */}
      <header className="sticky top-0 z-[1000] bg-white border-b border-gray-100/60">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900">내 주변 약국</h1>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setViewMode(viewMode === "map" ? "list" : "map")
              }
              className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
              aria-label={viewMode === "map" ? "목록 보기" : "지도 보기"}
            >
              {viewMode === "map" ? (
                <List className="w-[1.1rem] h-[1.1rem] text-gray-400" />
              ) : (
                <MapIcon className="w-[1.1rem] h-[1.1rem] text-gray-400" />
              )}
            </button>
            <button
              type="button"
              onClick={getLocation}
              className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-50 transition-colors"
              aria-label="새로고침"
            >
              <RefreshCw className="w-[1.1rem] h-[1.1rem] text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* 위치 에러 */}
      {locationError && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-card flex items-center justify-center mb-4">
            <MapPinOff className="w-8 h-8 text-gray-200" />
          </div>
          <p className="text-sm text-gray-500 whitespace-pre-line mb-4">
            {locationError}
          </p>
          <button
            type="button"
            onClick={getLocation}
            className="h-10 px-5 rounded-xl bg-brand text-white text-sm font-semibold active:brightness-95 transition-all"
          >
            다시 시도
          </button>
        </div>
      )}

      {!locationError && (
        <>
          {/* 지도 */}
          {viewMode === "map" && (
            <div
              className="relative w-full max-w-lg mx-auto"
              style={{ height: "45dvh" }}
            >
              <div ref={mapContainerRef} className="w-full h-full z-0" />
              {!mapReady && (
                <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-brand animate-spin" />
                </div>
              )}
            </div>
          )}

          {/* 필터 */}
          <div className="px-5 pt-3 pb-2 max-w-lg mx-auto w-full">
            <div className="flex bg-white rounded-xl p-1 shadow-card">
              {(
                [
                  { key: "all" as const, label: "전체" },
                  { key: "open" as const, label: "영업 중" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    filter === tab.key
                      ? "bg-brand text-white"
                      : "text-gray-400 active:bg-gray-50"
                  }`}
                >
                  {tab.label}
                  {tab.key === "open" && (
                    <span className="ml-1 text-xs opacity-80">
                      {openCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 로딩 */}
          {loading && (
            <div className="px-5 max-w-lg mx-auto w-full">
              <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-4 shadow-card mb-3">
                <Loader2 className="w-5 h-5 text-brand animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    주변 약국을 찾고 있어요
                  </p>
                  <p className="text-xs text-gray-400">
                    위치 정보를 확인하는 중...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 에러 */}
          {error && !loading && (
            <div className="px-5 mt-6 max-w-lg mx-auto text-center">
              <p className="text-sm text-gray-500 mb-3">{error}</p>
              <button
                type="button"
                onClick={fetchPharmacies}
                className="h-9 px-4 rounded-xl bg-brand text-white text-sm font-semibold active:brightness-95 transition-all"
              >
                다시 검색
              </button>
            </div>
          )}

          {/* 영업 중 결과 없음 */}
          {!loading &&
            !error &&
            displayed.length === 0 &&
            pharmacies.length > 0 &&
            filter === "open" && (
              <div className="flex flex-col items-center justify-center pt-10 px-5 max-w-lg mx-auto">
                <Clock className="w-8 h-8 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">
                  현재 영업 중인 약국이 없어요
                </p>
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="mt-3 text-sm font-semibold text-brand active:opacity-70"
                >
                  전체 약국 보기
                </button>
              </div>
            )}

          {/* 전체 결과 없음 */}
          {!loading && !error && pharmacies.length === 0 && (
            <div className="flex flex-col items-center justify-center pt-10 px-5 max-w-lg mx-auto">
              <MapPin className="w-8 h-8 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">
                주변 약국을 찾지 못했어요
              </p>
            </div>
          )}

          {/* 약국 목록 */}
          {!loading && !error && displayed.length > 0 && (
            <div className="px-5 pb-8 max-w-lg mx-auto w-full space-y-2.5 mt-1">
              <p className="text-xs text-gray-400 px-1">
                {displayed.length}개의 약국
                {!hasRealHours && (
                  <span className="text-gray-300 ml-1">
                    · 영업시간은 추정이에요
                  </span>
                )}
              </p>
              {displayed.map((pharmacy, i) => (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => focusOnMap(pharmacy, i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") focusOnMap(pharmacy, i);
                  }}
                  className={`w-full bg-white rounded-2xl p-4 shadow-card text-left active:shadow-none active:scale-[0.98] transition-all duration-150 cursor-pointer ${
                    selectedIdx === i ? "ring-2 ring-brand" : ""
                  }`}
                >
                  {/* 이름 + 상태 + 거리 */}
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h3 className="text-[0.9375rem] font-bold text-gray-900 truncate">
                        {pharmacy.name}
                      </h3>
                      <span
                        className={`flex-shrink-0 text-[0.625rem] font-semibold px-1.5 py-0.5 rounded-full ${
                          pharmacy.is24h
                            ? "bg-red-50 text-red-500"
                            : pharmacy.openStatus === "open"
                              ? "bg-brand-light text-brand"
                              : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {pharmacy.is24h ? "24시" : pharmacy.openLabel}
                      </span>
                    </div>
                    <span className="flex-shrink-0 text-xs font-semibold text-brand ml-2">
                      {formatDistance(pharmacy.distance)}
                    </span>
                  </div>

                  {/* 주소 + 영업시간 */}
                  <p className="text-xs text-gray-500 mb-1">
                    {pharmacy.roadAddress || pharmacy.address}
                  </p>
                  {pharmacy.todayHours && (
                    <p className="text-xs text-gray-400 mb-2.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span>
                        오늘 {pharmacy.todayHours}
                      </span>
                    </p>
                  )}
                  {!pharmacy.todayHours && <div className="mb-1.5" />}

                  {/* 액션 버튼 */}
                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    {pharmacy.phone && (
                      <button
                        type="button"
                        onClick={() => handleCall(pharmacy.phone)}
                        className="flex-1 h-9 rounded-xl bg-brand-light text-brand text-xs font-semibold flex items-center justify-center gap-1.5 active:brightness-95 transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        전화
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleNavigate(pharmacy)}
                      className="flex-1 h-9 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold flex items-center justify-center gap-1.5 active:brightness-95 transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      길찾기
                    </button>
                    {pharmacy.naverLink && (
                      <button
                        type="button"
                        onClick={() =>
                          window.open(pharmacy.naverLink, "_blank")
                        }
                        className="h-9 w-9 rounded-xl bg-gray-50 flex items-center justify-center active:bg-gray-100 transition-colors flex-shrink-0"
                        aria-label="상세 보기"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
