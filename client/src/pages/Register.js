import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useNotification } from "../components/Notification";

function Register() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [form, setForm] = useState({
    firstname: "",
    surname: "",
    id: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirm: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (
      !form.firstname ||
      !form.surname ||
      !form.id ||
      !form.email ||
      !form.phone ||
      !form.address ||
      !form.password
    ) {
      showNotification("warning", "Please complete every required registration field.", {
        title: "Incomplete Registration",
      });
      return;
    }

    if (form.id.length !== 13 || Number.isNaN(Number(form.id))) {
      showNotification("error", "South African ID numbers must contain exactly 13 digits.", {
        title: "Invalid ID Number",
      });
      return;
    }

    if (form.password !== form.confirm) {
      showNotification("error", "Your password confirmation does not match.", {
        title: "Password Mismatch",
      });
      return;
    }

    showNotification("info", "Creating your NexBank profile and preparing your onboarding journey.", {
      title: "Registration In Progress",
      duration: 2200,
    });

    try {
      setIsSubmitting(true);

      await API.post("/auth/register", {
        firstname: form.firstname.trim(),
        surname: form.surname.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        saIdNumber: form.id.trim(),
        address: form.address.trim(),
        password: form.password,
      });

      showNotification("success", "Your account has been created. You can log in now.", {
        title: "Registration Successful",
      });

      showNotification("warning", "Keep your login details private and enable extra security after signing in.", {
        title: "Security Tip",
        duration: 6500,
      });

      navigate("/login");
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Registration failed. Please try again.";

      showNotification("error", message, {
        title: "Registration Failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell auth-shell--register container-fluid">
      <div className="row g-0 min-vh-100">
        <div className="col-lg-12 auth-form-panel">
          <div className="auth-panel-frame">
            <div className="auth-panel-glow" />
            <div className="auth-card auth-card--wide">
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
                      value={form.firstname}
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
                      value={form.surname}
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
                      value={form.id}
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
                      value={form.email}
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
                      value={form.phone}
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
                      value={form.address}
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
                      value={form.password}
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
                      value={form.confirm}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <button className="btn auth-primary-btn w-100" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Registering..." : "Register"}
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
