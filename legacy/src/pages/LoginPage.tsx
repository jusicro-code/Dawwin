import { useState } from "react";
import { Music2, Mail, Lock, Eye, EyeOff, KeyRound, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth, mapSupabaseUser } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Step = "email" | "otp" | "login";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ── SEND OTP ── */
  async function handleSendOtp() {
    if (!email.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setStep("otp");
    toast.success("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
  }

  /* ── REGISTER: verify OTP + set password ── */
  async function handleRegister() {
    if (otp.length < 4) {
      toast.error("يرجى إدخال رمز التحقق المكون من 4 أرقام");
      return;
    }
    if (password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    setLoading(true);
    const { error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    if (otpError) {
      setLoading(false);
      toast.error("رمز التحقق غير صحيح أو منتهي الصلاحية");
      return;
    }
    const { data: updateData, error: updateError } =
      await supabase.auth.updateUser({
        password,
        data: { username: email.split("@")[0] },
      });
    if (updateError) {
      setLoading(false);
      toast.error(updateError.message);
      return;
    }
    if (updateData.user) {
      login(mapSupabaseUser(updateData.user));
      navigate("/");
    }
  }

  /* ── LOGIN ── */
  async function handleLogin() {
    if (!password) {
      toast.error("يرجى إدخال كلمة المرور");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoading(false);
      toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      return;
    }
    if (data.user) {
      login(mapSupabaseUser(data.user));
      navigate("/");
    }
  }

  const inputClass =
    "w-full bg-[#ECE4D7] border border-[#DDC8B7] rounded-xl px-4 py-3 text-sm text-[#2C2A27] placeholder-[#A09880] focus:outline-none focus:ring-2 focus:ring-[#9FAC9D]/40 focus:border-[#9FAC9D] transition-all";

  return (
    <div className="min-h-screen bg-[#DFD8C5] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#9FAC9D]/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#89999A]/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9FAC9D] to-[#89999A] flex items-center justify-center shadow-lg mx-auto mb-4">
            <Music2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#2C2A27] tracking-tight">
            دوزان
          </h1>
          <p className="text-sm text-[#7A7060] mt-1">
            منصة إنتاج وإدارة المشاريع الموسيقية
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#ECE4D7] rounded-2xl shadow-xl border border-[#DDC8B7]/60 p-8">
          {/* Mode Toggle */}
          {step === "email" && (
            <div className="flex bg-[#DFD8C5] rounded-xl p-1 gap-1 mb-6">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-150",
                    mode === m
                      ? "bg-[#2C2A27] text-white shadow-sm"
                      : "text-[#5A5447] hover:text-[#2C2A27]"
                  )}
                >
                  {m === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
                </button>
              ))}
            </div>
          )}

          {/* Step: Email */}
          {step === "email" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A5447] mb-2">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9FAC9D]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (mode === "register" ? handleSendOtp() : setStep("login"))
                    }
                    placeholder="example@email.com"
                    className={cn(inputClass, "pr-10")}
                    dir="ltr"
                  />
                </div>
              </div>

              {mode === "login" ? (
                <button
                  onClick={() => {
                    if (!email.trim()) {
                      toast.error("يرجى إدخال البريد الإلكتروني");
                      return;
                    }
                    setStep("login");
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#9FAC9D] hover:bg-[#8A9A88] text-white font-semibold py-3 rounded-xl transition-all duration-150 shadow-sm"
                >
                  التالي
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#9FAC9D] hover:bg-[#8A9A88] text-white font-semibold py-3 rounded-xl transition-all duration-150 shadow-sm disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      إرسال رمز التحقق
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Step: OTP + Password (Register) */}
          {step === "otp" && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#9FAC9D]/20 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-5 h-5 text-[#5A7358]" />
                </div>
                <p className="text-sm text-[#5A5447]">
                  تم إرسال رمز التحقق إلى
                </p>
                <p className="text-sm font-bold text-[#2C2A27]" dir="ltr">
                  {email}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A5447] mb-2">
                  رمز التحقق (4 أرقام)
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="0000"
                  maxLength={4}
                  className={cn(inputClass, "text-center text-xl tracking-widest font-bold")}
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A5447] mb-2">
                  كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9FAC9D]" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6 أحرف على الأقل"
                    className={cn(inputClass, "pr-10 pl-10")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A8E80] hover:text-[#5A5447]"
                  >
                    {showPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#9FAC9D] hover:bg-[#8A9A88] text-white font-semibold py-3 rounded-xl transition-all duration-150 shadow-sm disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "إنشاء الحساب والدخول"
                )}
              </button>

              <button
                onClick={() => setStep("email")}
                className="w-full text-sm text-[#89999A] hover:text-[#5A7358] font-medium transition-colors"
              >
                ← تغيير البريد الإلكتروني
              </button>
            </div>
          )}

          {/* Step: Password (Login) */}
          {step === "login" && (
            <div className="space-y-4">
              <div className="bg-[#DFD8C5] rounded-xl px-4 py-2.5 text-sm text-[#5A5447] font-medium" dir="ltr">
                {email}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A5447] mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9FAC9D]" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="أدخل كلمة المرور"
                    className={cn(inputClass, "pr-10 pl-10")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A8E80] hover:text-[#5A5447]"
                  >
                    {showPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#9FAC9D] hover:bg-[#8A9A88] text-white font-semibold py-3 rounded-xl transition-all duration-150 shadow-sm disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "دخول إلى حسابي"
                )}
              </button>

              <button
                onClick={() => {
                  setStep("email");
                  setPassword("");
                }}
                className="w-full text-sm text-[#89999A] hover:text-[#5A7358] font-medium transition-colors"
              >
                ← تغيير البريد الإلكتروني
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#9A8E80] mt-6">
          بياناتك محفوظة بأمان ومرتبطة بحسابك الشخصي
        </p>
      </div>
    </div>
  );
}
