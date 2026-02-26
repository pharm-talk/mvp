"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Mail, ArrowRight } from "lucide-react";
import logo from "@/constants/logo/PharmTalk.png";

type Provider = "google" | "kakao";
type Mode = "main" | "email-login" | "email-signup";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<Provider | "email" | null>(null);
  const [mode, setMode] = useState<Mode>("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSocialLogin = async (provider: Provider) => {
    setLoading(provider);
    setError("");
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setLoading(null);
      setError(error.message);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setLoading("email");
    setError("");
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(null);
      setError(
        error.message === "Invalid login credentials"
          ? "이메일 또는 비밀번호가 올바르지 않습니다."
          : error.message
      );
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleEmailSignup = async () => {
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    setLoading("email");
    setError("");
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setLoading(null);
      setError(error.message);
    } else {
      // 이메일 인증 없이 바로 로그인되는 경우 리다이렉트
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push("/");
        router.refresh();
      } else {
        setLoading(null);
        setMessage("인증 메일을 보냈습니다. 이메일을 확인해주세요.");
      }
    }
  };

  const resetToMain = () => {
    setMode("main");
    setEmail("");
    setPassword("");
    setError("");
    setMessage("");
    setLoading(null);
  };

  // 이메일 로그인/회원가입 폼
  if (mode !== "main") {
    const isSignup = mode === "email-signup";

    return (
      <div className="min-h-dvh bg-white flex flex-col">
        <div className="flex-1 flex flex-col px-6 pt-16">
          {/* 뒤로가기 */}
          <button
            type="button"
            onClick={resetToMain}
            className="self-start text-gray-400 text-sm mb-8 active:text-gray-600 transition-colors"
          >
            &larr; 돌아가기
          </button>

          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {isSignup ? "이메일로 가입하기" : "이메일로 로그인"}
          </h2>
          <p className="text-sm text-gray-400 mb-8">
            {isSignup
              ? "이메일과 비밀번호를 입력해주세요."
              : "가입한 이메일로 로그인해주세요."}
          </p>

          <div className="space-y-3 mb-4">
            <input
              type="email"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading !== null}
              className="w-full h-12 rounded-xl border border-gray-200 px-4 text-[0.9375rem] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 disabled:opacity-60"
            />
            <input
              type="password"
              placeholder="비밀번호 (6자 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading !== null}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  isSignup ? handleEmailSignup() : handleEmailLogin();
                }
              }}
              className="w-full h-12 rounded-xl border border-gray-200 px-4 text-[0.9375rem] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 disabled:opacity-60"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 mb-4">{error}</p>
          )}

          {message && (
            <p className="text-sm text-brand mb-4">{message}</p>
          )}

          <button
            type="button"
            onClick={isSignup ? handleEmailSignup : handleEmailLogin}
            disabled={loading !== null}
            className="w-full h-12 rounded-xl bg-brand text-white font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:brightness-95 transition-all duration-150 disabled:opacity-60"
          >
            {loading === "email"
              ? "처리 중..."
              : isSignup
                ? "가입하기"
                : "로그인"}
            {loading !== "email" && <ArrowRight className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setError("");
              setMessage("");
              setMode(isSignup ? "email-login" : "email-signup");
            }}
            className="mt-4 text-sm text-gray-400 text-center active:text-gray-600 transition-colors"
          >
            {isSignup
              ? "이미 계정이 있으신가요? 로그인"
              : "계정이 없으신가요? 회원가입"}
          </button>
        </div>
      </div>
    );
  }

  // 메인 로그인 화면
  return (
    <div className="min-h-dvh bg-white flex flex-col">
      {/* 상단 여백 + 로고 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-20 pb-8">
        {/* 로고 */}
        <div className="mb-5">
          <Image src={logo} alt="팜톡" height={140} className="h-[140px] w-auto" />
        </div>
        <p className="text-sm text-gray-400 text-center leading-relaxed">
          면허 인증 약사의 맞춤 복약 상담
        </p>
      </div>

      {/* 로그인 버튼들 */}
      <div className="px-6 pb-10">
        <div className="space-y-3 mb-4">
          {/* 카카오 */}
          <button
            type="button"
            onClick={() => handleSocialLogin("kakao")}
            disabled={loading !== null}
            className="relative w-full h-12 rounded-xl bg-[#FEE500] text-[#191919] font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:brightness-95 transition-all duration-150 disabled:opacity-60"
          >
            <KakaoIcon />
            {loading === "kakao" ? "로그인 중..." : "카카오로 시작하기"}
          </button>

          {/* 구글 */}
          <button
            type="button"
            onClick={() => handleSocialLogin("google")}
            disabled={loading !== null}
            className="relative w-full h-12 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:bg-gray-50 transition-all duration-150 disabled:opacity-60"
          >
            <GoogleIcon />
            {loading === "google" ? "로그인 중..." : "Google로 시작하기"}
          </button>

          {/* 이메일 */}
          <button
            type="button"
            onClick={() => setMode("email-login")}
            disabled={loading !== null}
            className="relative w-full h-12 rounded-xl bg-gray-100 text-gray-600 font-semibold text-[0.9375rem] flex items-center justify-center gap-2 active:bg-gray-150 transition-all duration-150 disabled:opacity-60"
          >
            <Mail className="w-[18px] h-[18px]" />
            이메일로 시작하기
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center mb-4">{error}</p>
        )}

        {/* 이용약관 안내 */}
        <p className="text-center text-xs text-gray-300 leading-relaxed">
          시작하면{" "}
          <span className="text-gray-400 underline underline-offset-2">
            이용약관
          </span>{" "}
          및{" "}
          <span className="text-gray-400 underline underline-offset-2">
            개인정보 처리방침
          </span>
          에 동의하는 것으로 간주합니다.
        </p>
      </div>
    </div>
  );
}

/* ── 소셜 로그인 아이콘 ── */

const KakaoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M9 1.5C4.86 1.5 1.5 4.14 1.5 7.38C1.5 9.48 2.88 11.31 4.95 12.33L4.2 15.15C4.14 15.39 4.41 15.57 4.62 15.42L7.95 13.17C8.28 13.2 8.64 13.23 9 13.23C13.14 13.23 16.5 10.59 16.5 7.35C16.5 4.14 13.14 1.5 9 1.5Z"
      fill="#191919"
    />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M17.64 9.2C17.64 8.57 17.58 7.95 17.48 7.36H9V10.85H13.84C13.63 11.97 12.99 12.92 12.04 13.56V15.82H14.96C16.66 14.25 17.64 11.95 17.64 9.2Z"
      fill="#4285F4"
    />
    <path
      d="M9 18C11.43 18 13.47 17.2 14.96 15.82L12.04 13.56C11.24 14.1 10.21 14.42 9 14.42C6.66 14.42 4.67 12.84 3.96 10.71H0.96V13.04C2.44 15.98 5.48 18 9 18Z"
      fill="#34A853"
    />
    <path
      d="M3.96 10.71C3.78 10.17 3.68 9.59 3.68 9C3.68 8.41 3.78 7.83 3.96 7.29V4.96H0.96C0.35 6.17 0 7.55 0 9C0 10.45 0.35 11.83 0.96 13.04L3.96 10.71Z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.58C10.32 3.58 11.51 4.03 12.44 4.93L15.02 2.35C13.46 0.89 11.43 0 9 0C5.48 0 2.44 2.02 0.96 4.96L3.96 7.29C4.67 5.16 6.66 3.58 9 3.58Z"
      fill="#EA4335"
    />
  </svg>
);
