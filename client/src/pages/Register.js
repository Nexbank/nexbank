import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = (e) => {
    e.preventDefault();

    if (
      !form.firstname ||
      !form.surname ||
      !form.id ||
      !form.email ||
      !form.phone ||
      !form.address ||
      !form.password
    ) {
      alert("Please fill all required fields.");
      return;
    }

    if (form.id.length !== 13 || Number.isNaN(Number(form.id))) {
      alert("SA ID must be exactly 13 digits.");
      return;
    }

    if (form.password !== form.confirm) {
      alert("Passwords do not match.");
      return;
    }

    alert("Registration successful! Please login.");
    navigate("/login");
  };

  return (
    <div className="auth-shell auth-shell--register container-fluid">
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
            <span className="auth-brand-chip">New Account</span>
            <h1 className="auth-brand-title">Create a secure NexBank profile in a few clean steps.</h1>
            <p className="auth-brand-copy">
              Register with your personal details, address, and security credentials to get started.
            </p>

            <div className="auth-brand-highlights">
              <div className="auth-highlight-card">
                <span className="auth-highlight-label">Personal details</span>
                <strong>Full onboarding profile</strong>
              </div>
              <div className="auth-highlight-card">
                <span className="auth-highlight-label">Address added</span>
                <strong>Ready for account setup</strong>
              </div>
              <div className="auth-highlight-card">
                <span className="auth-highlight-label">Secure finish</span>
                <strong>Login after successful signup</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6 auth-form-panel">
          <div className="auth-panel-frame">
            <div className="auth-panel-glow" />
            <div className="auth-card auth-card--wide">
              <div className="auth-switcher" role="tablist" aria-label="Authentication pages">
                <Link className="auth-switcher-link" to="/login">
                  Login
                </Link>
                <Link className="auth-switcher-link auth-switcher-link--active" to="/register">
                  Register
                </Link>
              </div>
              <form onSubmit={handleRegister}>
                <div className="auth-card-header">
                  <span className="auth-card-kicker">Open Your Account</span>
                  <h2 className="auth-card-title">Register with NexBank</h2>
                  <p className="auth-card-copy">
                    A compact, professional form with the details needed to create your profile.
                  </p>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label auth-label" htmlFor="firstname">
                      First Name
                    </label>
                    <input
                      id="firstname"
                      className="form-control auth-control"
                      name="firstname"
                      placeholder="First name"
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label auth-label" htmlFor="surname">
                      Surname
                    </label>
                    <input
                      id="surname"
                      className="form-control auth-control"
                      name="surname"
                      placeholder="Surname"
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label auth-label" htmlFor="register-id">
                      SA ID Number
                    </label>
                    <input
                      id="register-id"
                      className="form-control auth-control"
                      name="id"
                      placeholder="13-digit South African ID number"
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label auth-label" htmlFor="register-email">
                      Email Address
                    </label>
                    <input
                      id="register-email"
                      className="form-control auth-control"
                      name="email"
                      type="email"
                      placeholder="Email address"
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label auth-label" htmlFor="register-phone">
                      Cellphone Number
                    </label>
                    <input
                      id="register-phone"
                      className="form-control auth-control"
                      name="phone"
                      placeholder="Cellphone number"
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label auth-label" htmlFor="register-address">
                      Home Address
                    </label>
                    <input
                      id="register-address"
                      className="form-control auth-control"
                      name="address"
                      placeholder="Street address"
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label auth-label" htmlFor="register-password">
                      Password
                    </label>
                    <input
                      id="register-password"
                      className="form-control auth-control"
                      type="password"
                      name="password"
                      placeholder="Password"
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label auth-label" htmlFor="register-confirm">
                      Confirm Password
                    </label>
                    <input
                      id="register-confirm"
                      className="form-control auth-control"
                      type="password"
                      name="confirm"
                      placeholder="Confirm password"
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <button className="btn auth-primary-btn w-100" type="submit">
                  Register
                </button>

                <p className="auth-footnote text-center mb-0">
                  Already have an account? <Link to="/login">Login</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
