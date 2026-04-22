import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function Login() {
  return (
    <div className="auth-shell auth-shell--login container-fluid">
      <div className="row g-0 min-vh-100">
        <div className="col-lg-12 auth-form-panel">
          <div className="auth-panel-frame">
            <div className="" />
            <div className="auth-card">
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
                <Link className="auth-switcher-link auth-switcher-link--active" to="/login">
                  Login
                </Link>
                <Link className="auth-switcher-link" to="/register">
                  Register
                </Link>
              </div>
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await API.post("/auth/login", {
        email: email.trim(),
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userId", response.data.user._id);  // <--- ADD THIS LINE
      localStorage.setItem("user", JSON.stringify(response.data.user));
      
      console.log("Successfully logged in", response.data.user);
      console.log("Your userId is:", response.data.user._id); // This helps you see it's working

      navigate("/dashboard");
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Login failed. Please try again.";

      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <div className="auth-card-header">
        <span className="auth-card-kicker">Member Sign In</span>
        <h2 className="auth-card-title">Login to NexBank</h2>
        <p className="auth-card-copy">Access your account and continue straight to your dashboard.</p>
      </div>

      <div className="mb-3">
        <label className="form-label auth-label" htmlFor="login-email">
          Email or Access Card
        </label>
        <input
          id="login-email"
          className="form-control auth-control"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label auth-label" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          className="form-control auth-control"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="auth-utility-row">
        <div className="form-check auth-check">
          <input className="form-check-input" type="checkbox" id="rememberMe" />
          <label className="form-check-label" htmlFor="rememberMe">
            Remember me
          </label>
        </div>

        <Link className="auth-text-link" to="/forgot-password">
          Forgot password?
        </Link>
      </div>

      <button className="btn auth-primary-btn w-100" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </button>

      <div className="auth-divider">
        <span>New to NexBank?</span>
      </div>

      <p className="auth-footnote text-center">
        Don't have an account? <Link to="/register">Register</Link>
      </p>

      <div className="auth-support-box">
        <p className="mb-0">
          Need help from support? <span>We're ready to assist you.</span>
        </p>
      </div>
    </form>
  );
}

export default Login;