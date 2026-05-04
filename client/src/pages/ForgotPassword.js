import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useNotification } from "../components/Notification";
import API from "../services/api";

export default function ForgotPassword() {
  const [step, setStep] = useState(0);
  const [emailGlobal, setEmailGlobal] = useState("");

  return (
    <div className="auth-shell auth-shell--forgot container-fluid">
      <div className="row g-0 min-vh-100">

        {/* LEFT PANEL */}
        <div className="col-lg-6 auth-brand-panel">
          <div className="auth-brand-inner">
            <img src="/NexBank-logo.png" alt="NexBank" />
            <h1>Recover your account securely</h1>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="col-lg-6 auth-form-panel">
          <div className="auth-card auth-card--compact">

            <div className="auth-switcher">
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </div>

            {step === 0 && <GuideStep next={() => setStep(1)} />}
            {step === 1 && <StepID next={() => setStep(2)} />}
            {step === 2 && (
              <StepEmail
                next={() => setStep(3)}
                setEmailGlobal={setEmailGlobal}
              />
            )}
            {step === 3 && (
              <StepPassword
                reset={() => setStep(0)}
                email={emailGlobal}
              />
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= GUIDE ================= */
function GuideStep({ next }) {
  const { showNotification } = useNotification();

  return (
    <>
      <h2>Start account recovery</h2>

      <button
        className="btn auth-primary-btn w-100"
        onClick={() => {
          showNotification("info", "Starting recovery process", {
            title: "Recovery",
          });
          next();
        }}
      >
        Continue
      </button>
    </>
  );
}

/* ================= STEP 1 ID ================= */
function StepID({ next }) {
  const [id, setId] = useState("");
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (id.length !== 13) {
      showNotification("error", "ID must be 13 digits", {
        title: "Invalid ID",
      });
      return;
    }

    setLoading(true);

    try {
      await API.post("/auth/verify-identity", { saIdNumber: id });

      showNotification("success", "ID verified", {
        title: "Success",
      });

      next();
    } catch {
      showNotification("error", "Verification failed", {
        title: "Error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <input
        placeholder="Enter SA ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
      />

      <button onClick={verify} disabled={loading}>
        {loading ? "Checking..." : "Verify ID"}
      </button>
    </>
  );
}

/* ================= STEP 2 EMAIL ================= */
function StepEmail({ next, setEmailGlobal }) {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const sendOTP = async () => {
    if (!email.includes("@")) {
      showNotification("error", "Invalid email", {
        title: "Error",
      });
      return;
    }

    setLoading(true);

    try {
      await API.post("/auth/send-email-otp", { email });
      setOtpSent(true);

      showNotification("success", "OTP sent to email", {
        title: "Sent",
      });
    } catch {
      showNotification("error", "Failed to send OTP", {
        title: "Error",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      showNotification("error", "Enter 6-digit OTP", {
        title: "Invalid OTP",
      });
      return;
    }

    setLoading(true);

    try {
      await API.post("/auth/verify-email-otp", {
        email,
        otp,
      });

      setEmailGlobal(email);

      showNotification("success", "Email verified", {
        title: "Success",
      });

      next();
    } catch {
      showNotification("error", "Invalid OTP", {
        title: "Error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!otpSent ? (
        <>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button onClick={sendOTP} disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </>
      ) : (
        <>
          <input
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          <button onClick={verifyOTP} disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </>
      )}
    </>
  );
}

/* ================= STEP 3 PASSWORD ================= */
function StepPassword({ reset, email }) {
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const resetPassword = async () => {
    if (pass.length < 6) {
      showNotification("error", "Password too short", {
        title: "Weak Password",
      });
      return;
    }

    if (pass !== confirm) {
      showNotification("error", "Passwords do not match", {
        title: "Mismatch",
      });
      return;
    }

    setLoading(true);

    try {
      await API.post("/auth/reset-password", {
        email,
        newPassword: pass,
      });

      showNotification("success", "Password reset successful", {
        title: "Done",
      });

      reset();
      navigate("/login");
    } catch {
      showNotification("error", "Reset failed", {
        title: "Error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <input
        type="password"
        placeholder="New password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />

      <input
        type="password"
        placeholder="Confirm password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      <button onClick={resetPassword} disabled={loading}>
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </>
  );
}
