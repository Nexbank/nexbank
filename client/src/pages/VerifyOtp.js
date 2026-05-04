import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

const handleVerify = async () => {
  if (!otp || otp.length < 6) {
    setError("Please enter a valid 6-digit OTP");
    return;
  }

  setError("");
  setIsVerifying(true);

  try {
    const res = await axios.post(
      "http://localhost:5000/api/auth/verify-login-otp",
      { email, otp }
    );

    localStorage.setItem("token", res.data.token);

    // Try to get user from response first
    let userData = res.data.user;

    if (!userData) {
      // If no user in response, fetch it
      const userRes = await axios.get(
        "http://localhost:5000/api/auth/me",
        {
          headers: {
            Authorization: `Bearer ${res.data.token}`,
          },
        }
      );
      userData = userRes.data;
    }
    
    // Store user data
    localStorage.setItem("user", JSON.stringify(userData));
    
    // Don't navigate immediately - let the storage event fire first
    window.dispatchEvent(new Event("storage"));
    
    // Small delay to ensure storage event is processed
    setTimeout(() => {
      navigate("/dashboard");
    }, 50);

  } catch (err) {
    const errorMessage = err.response?.data?.error || "Invalid or expired OTP";
    setError(errorMessage);
    setOtp("");
  } finally {
    setIsVerifying(false);
  }
};

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setError("");
    setIsResending(true);

    try {
      await axios.post("http://localhost:5000/api/auth/resend-login-otp", { email });
      setCountdown(60);
      alert("A new OTP has been sent to your email address");
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to resend OTP. Please try again.";
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="auth-shell auth-shell--verify container-fluid">
      <div className="row g-0 min-vh-100">
        <div className="col-lg-12 auth-form-panel">
          <div className="auth-panel-frame">
            <div className="auth-panel-glow" />
            <div className="auth-card auth-card--compact">
              {/* Logo with slogan */}
              <div className="auth-logo-container text-center">
                <div className="auth-logo-wrapper">
                  <img 
                    src="/NexBank-logo.png" 
                    alt="NexBank Logo" 
                    className="auth-logo"
                  />
                  <span className="auth-slogan">Your money simplified</span>
                </div>
              </div>

              <div className="auth-switcher" role="tablist" aria-label="Authentication pages">
                <Link className="auth-switcher-link" to="/login">
                  Login
                </Link>
                <Link className="auth-switcher-link" to="/register">
                  Register
                </Link>
              </div>

              <div className="auth-card-header">
                <span className="auth-card-kicker">Secure Verification</span>
                <h2 className="auth-card-title">Enter OTP Code</h2>
                <p className="auth-card-copy">
                  We've sent a one-time password to your registered email address.
                  Please enter the code below to complete your login.
                </p>
              </div>

              <div className="auth-step-preview mb-4">
                <div className="auth-step-preview-item">
                  <span>1</span>
                  <p>Check your inbox for the verification code</p>
                </div>
                <div className="auth-step-preview-item">
                  <span>2</span>
                  <p>Enter the 6-digit code below</p>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger mb-3" role="alert">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="form-label auth-label" htmlFor="otp-input">
                  One-Time Password (OTP)
                </label>
                <input
                  id="otp-input"
                  className="form-control auth-control text-center"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && otp.length === 6 && !isVerifying) {
                      handleVerify();
                    }
                  }}
                />
                <div className="text-muted mt-2 small text-center">
                  Enter the 6-digit code sent to: <strong>{email}</strong>
                </div>
              </div>

              <button 
                className="btn auth-primary-btn w-100" 
                onClick={handleVerify}
                disabled={isVerifying || otp.length < 6}
              >
                {isVerifying ? "Verifying..." : "Verify & Continue"}
              </button>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <div className="text-center">
                <button 
                  onClick={handleResendOtp}
                  disabled={isResending || countdown > 0}
                  className="btn btn-link auth-text-link"
                >
                  {isResending ? (
                    "Sending..."
                  ) : countdown > 0 ? (
                    `Resend OTP in ${countdown}s`
                  ) : (
                    "Resend OTP"
                  )}
                </button>
              </div>

              <div className="text-center mt-3">
                <Link to="/login" className="auth-text-link">
                  ← Back to Login
                </Link>
              </div>

              <div className="auth-support-box mt-4">
                <p className="mb-0 small">
                  <span>ℹ️</span> Didn't receive the code? Check your spam folder or use the resend button above.
                </p>
              </div>

              <p className="auth-footnote text-center mb-0 mt-4">
                Need help? <Link to="/contact">Contact Support</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;