import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

const recoverySteps = [
  {
    title: "Step 1",
    heading: "Confirm your South African ID",
    description:
      "Enter the 13-digit ID number linked to your NexBank profile so we can verify your identity."
  },
  {
    title: "Step 2",
    heading: "Verify your email address",
    description:
      "Enter your email address, receive a one-time PIN, and verify your identity."
  },
  {
    title: "Step 3",
    heading: "Create your new password",
    description:
      "Choose a strong new password, confirm it, and return to login securely."
  }
];

function ForgotPassword() {
  const [step, setStep] = useState(0);
  const [emailGlobal, setEmailGlobal] = useState("");

  return (
    <div className="auth-shell auth-shell--forgot container-fluid">
      <div className="row g-0 min-vh-100">
        <div className="col-lg-6 auth-brand-panel">
          <div className="auth-brand-inner">
            <div className="auth-brand-lockup">
              <img
                src="/NexBank-logo.png"
                alt="NexBank"
                className="auth-brand-logo"
              />
              <div className="auth-brand-lockup-copy">
                <span className="auth-brand-name">NexBank</span>
                <span className="auth-brand-slogan">Your money simplified</span>
              </div>
            </div>
            <span className="auth-brand-chip">Password Recovery</span>
            <h1 className="auth-brand-title">Recover access with guided security checks.</h1>
            <p className="auth-brand-copy">
              Each step protects the account before a new password is created.
            </p>

            <div className="auth-brand-steps">
              {recoverySteps.map((item) => (
                <div className="auth-brand-step" key={item.title}>
                  <span className="auth-brand-step-tag">{item.title}</span>
                  <div>
                    <h3>{item.heading}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-6 auth-form-panel">
          <div className="auth-panel-frame">
            <div className="auth-panel-glow" />
            <div className="auth-card auth-card--compact">
              <div className="auth-switcher" role="tablist" aria-label="Authentication pages">
                <Link className="auth-switcher-link" to="/login">
                  Login
                </Link>
                <Link className="auth-switcher-link" to="/register">
                  Register
                </Link>
              </div>
              {step === 0 && <ForgotPasswordGuide onStart={() => setStep(1)} />}
              {step === 1 && (
                <StepID 
                  next={() => setStep(2)} 
                />
              )}
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
    </div>
  );
}

function ForgotPasswordGuide({ onStart }) {
  return (
    <>
      <div className="auth-card-header">
        <span className="auth-card-kicker">Before you begin</span>
        <h2 className="auth-card-title">Follow these steps to reset your password.</h2>
        <p className="auth-card-copy">
          Keep your ID number and email nearby so the process is quick.
        </p>
      </div>

      <div className="auth-instruction-list">
        {recoverySteps.map((item) => (
          <div className="auth-instruction-item" key={item.title}>
            <span className="auth-instruction-badge">{item.title}</span>
            <div>
              <h3>{item.heading}</h3>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="btn auth-primary-btn w-100" type="button" onClick={onStart}>
        Continue to Recovery
      </button>

      <p className="auth-footnote text-center mb-0">
        Remembered your password? <Link to="/login">Back to login</Link>
      </p>
    </>
  );
}

function StepID({ next }) {
  const [id, setId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    if (id.length !== 13 || Number.isNaN(Number(id))) {
      alert("SA ID must be exactly 13 digits.");
      return;
    }

    setIsLoading(true);
    try {
      await API.post("/auth/verify-identity", {
        saIdNumber: id,
      });

      alert("ID verified successfully!");
      next();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to verify identity");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="auth-card-header">
        <span className="auth-card-kicker">Step 1 of 3</span>
        <h2 className="auth-card-title">Verify your South African ID</h2>
        <p className="auth-card-copy">Enter the ID number linked to your NexBank profile.</p>
      </div>

      <div className="mb-3">
        <label className="form-label auth-label" htmlFor="forgot-id">
          SA ID Number
        </label>
        <input
          id="forgot-id"
          className="form-control auth-control"
          placeholder="Enter your 13-digit ID number"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
      </div>

      <button 
        className="btn auth-primary-btn w-100" 
        type="button" 
        onClick={handleNext}
        disabled={isLoading}
      >
        {isLoading ? "Verifying..." : "Verify Identity"}
      </button>
    </>
  );
}

function StepEmail({ next, setEmailGlobal }) {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendOTP = async () => {
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      await API.post("/auth/send-email-otp", {
        email: email,
      });
      
      alert(`OTP sent to ${email}`);
      setOtpSent(true);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      alert("Please enter the 6-digit OTP.");
      return;
    }

    setIsLoading(true);
    try {
      await API.post("/auth/verify-email-otp", {
        email: email,
        otp: otp,
      });
      
      setEmailGlobal(email);
      alert("Email verified successfully!");
      next();
    } catch (err) {
      alert(err.response?.data?.error || "Invalid or expired OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="auth-card-header">
        <span className="auth-card-kicker">Step 2 of 3</span>
        <h2 className="auth-card-title">Verify your email address</h2>
        <p className="auth-card-copy">Enter your email address and verify with a one-time PIN.</p>
      </div>

      {!otpSent ? (
        <>
          <div className="mb-3">
            <label className="form-label auth-label" htmlFor="forgot-email">
              Email Address
            </label>
            <input
              id="forgot-email"
              className="form-control auth-control"
              type="email"
              placeholder="Enter your registered email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button 
            className="btn auth-primary-btn w-100" 
            type="button" 
            onClick={sendOTP}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send OTP"}
          </button>
        </>
      ) : (
        <>
          <div className="alert alert-info mb-3">
            <small>We've sent a 6-digit code to {email}</small>
          </div>
          
          <div className="mb-3">
            <label className="form-label auth-label" htmlFor="forgot-email-otp">
              One-Time PIN
            </label>
            <input
              id="forgot-email-otp"
              className="form-control auth-control"
              type="text"
              placeholder="Enter 6-digit code"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          <button 
            className="btn auth-primary-btn w-100" 
            type="button" 
            onClick={handleVerify}
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Verify Email"}
          </button>
          
          <button 
            className="btn btn-link w-100 mt-2" 
            type="button" 
            onClick={sendOTP}
            disabled={isLoading}
          >
            Resend OTP
          </button>
        </>
      )}
    </>
  );
}

function StepPassword({ reset, email }) {
  const navigate = useNavigate();
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (pass.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (pass !== confirm) {
      alert("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await API.post("/auth/reset-password", {
        email: email,
        newPassword: pass,
      });

      alert("Password reset successful! Please login with your new password.");
      reset();
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="auth-card-header">
        <span className="auth-card-kicker">Step 3 of 3</span>
        <h2 className="auth-card-title">Create your new password</h2>
        <p className="auth-card-copy">Make it strong and confirm it before returning to login.</p>
      </div>

      <div className="mb-3">
        <label className="form-label auth-label" htmlFor="forgot-pass">
          New Password
        </label>
        <input
          id="forgot-pass"
          className="form-control auth-control"
          type="password"
          placeholder="New password (min. 6 characters)"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label auth-label" htmlFor="forgot-confirm">
          Confirm Password
        </label>
        <input
          id="forgot-confirm"
          className="form-control auth-control"
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      <button 
        className="btn auth-primary-btn w-100" 
        type="button" 
        onClick={handleReset}
        disabled={isLoading}
      >
        {isLoading ? "Resetting..." : "Reset Password"}
      </button>
    </>
  );
}

export default ForgotPassword;