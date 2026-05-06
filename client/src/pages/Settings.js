import { useEffect, useState } from "react";
import API from "../services/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useAccount } from "../context/AccountContext";
import { showErrorAlert, showSuccessAlert, showSuccessToast } from "../utils/alerts";

const DEFAULT_SETTINGS_STATE = {
  biometric: false,
  privacy: true,
  txAlerts: true,
  doNotDisturb: false,
};

const DEFAULT_PIN_FORM = {
  currentPin: "",
  newPin: "",
  confirmPin: "",
};

const isValidPin = (pin) => /^\d{4,6}$/.test(pin);

function Toggle({ on, onToggle }) {
  return (
    <div className={`toggle ${on ? "toggle-on" : ""}`} onClick={onToggle}>
      <div className="toggle-circle" />
    </div>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  toggle,
  onToggle,
  chevron,
  onClick,
  disabled = false,
  badge = "",
}) {
  return (
    <div
      className={`setting-row ${disabled ? "setting-row--disabled" : ""}`}
      onClick={disabled ? undefined : onClick}
      style={!disabled && onClick ? { cursor: "pointer" } : undefined}
    >
      <div className="setting-icon">{icon}</div>
      <div className="setting-text">
        <div className="setting-title">{title}</div>
        <div className="setting-subtitle">{subtitle}</div>
      </div>
      {badge ? <span className="accounts-badge accounts-badge--unavailable">{badge}</span> : null}
      {toggle !== undefined && <Toggle on={toggle} onToggle={onToggle} />}
      {chevron && <span className="setting-chevron">→</span>}
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div className="settings-section">
      <div className="settings-label">{label}</div>
      <div className="settings-box">{children}</div>
    </div>
  );
}

function ChangePinModal({
  isOpen,
  form,
  hasExistingPin,
  isTemporaryPin,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  if (!isOpen) return null;

  return (
    <div className="cards-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cards-modal modal-dialog modal-dialog-centered"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <form className="cards-modal-content modal-content" onSubmit={onSubmit}>
          <div className="cards-modal-header">
            <div>
              <h2 className="cards-modal-title">{hasExistingPin ? "Change PIN" : "Set PIN"}</h2>
              <p className="cards-modal-copy">Use a 4 to 6 digit PIN for card detail reveal.</p>
            </div>
            <button type="button" className="cards-modal-close" onClick={onClose}>×</button>
          </div>

          <div className="settings-pin-form">
            {hasExistingPin ? (
              <>
                <label className="cards-form-label" htmlFor="current-pin">
                  {isTemporaryPin ? "Temporary PIN" : "Current PIN"}
                </label>
                <input
                  id="current-pin"
                  className="cards-form-control"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  value={form.currentPin}
                  onChange={(event) => onChange("currentPin", event.target.value)}
                />
              </>
            ) : null}

            <label className="cards-form-label" htmlFor="new-pin">New PIN</label>
            <input
              id="new-pin"
              className="cards-form-control"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={form.newPin}
              onChange={(event) => onChange("newPin", event.target.value)}
            />

            <label className="cards-form-label" htmlFor="confirm-pin">
              {hasExistingPin ? "Confirm New PIN" : "Confirm PIN"}
            </label>
            <input
              id="confirm-pin"
              className="cards-form-control"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={form.confirmPin}
              onChange={(event) => onChange("confirmPin", event.target.value)}
            />
          </div>

          <div className="cards-form-actions">
            <button type="button" className="cards-form-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="cards-form-submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : hasExistingPin ? "Update PIN" : "Set PIN"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Help Center Modal - NO INLINE STYLES
function HelpCenterModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="cards-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cards-modal modal-dialog modal-dialog-centered"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cards-modal-content modal-content">
          <div className="cards-modal-header">
            <div>
              <h2 className="cards-modal-title">Help Center</h2>
              <p className="cards-modal-copy">Quick answers to common questions</p>
            </div>
            <button type="button" className="cards-modal-close" onClick={onClose}>×</button>
          </div>

          <div className="help-modal-content">
            <div className="faq-section">
              <h3 className="faq-title">Top Questions</h3>
              
              <div className="faq-item">
                <div className="faq-question">🔐 How to reset password?</div>
                <div className="faq-answer">Click "Forgot Password" on login page</div>
              </div>

              <div className="faq-item">
                <div className="faq-question">💳 Lost or stolen card?</div>
                <div className="faq-answer">Call 24/7 support: +27 800 123 456</div>
              </div>

              <div className="faq-item">
                <div className="faq-question">⏱️ Transfer times?</div>
                <div className="faq-answer">Internal: Instant | External: 1-2 days</div>
              </div>
            </div>

            <div className="contact-section">
              <h3 className="contact-title">Contact Us</h3>
              <div className="contact-info">
                <p>📞 Phone: +27 800 123 456</p>
                <p>✉️ Email: support@nexbank.co.za</p>
                <p>💬 WhatsApp: +27 81 234 5678</p>
              </div>
            </div>
          </div>

          <div className="cards-form-actions">
            <button type="button" className="cards-form-cancel" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// About NexBank Modal - NO INLINE STYLES
function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="cards-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cards-modal modal-dialog modal-dialog-centered"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cards-modal-content modal-content">
          <div className="cards-modal-header">
            <div>
              <h2 className="cards-modal-title">About NexBank</h2>
              <p className="cards-modal-copy">Your trusted digital banking partner</p>
            </div>
            <button type="button" className="cards-modal-close" onClick={onClose}>×</button>
          </div>

          <div className="about-modal-content">
            <div className="about-logo">
              <div className="about-logo-circle">
                <span>N</span>
              </div>
            </div>
            
            <h3 className="about-title">NexBank</h3>
            <p className="about-version">Version 2.4.0</p>

            <div className="about-stats">
              <div className="about-stat">
                <div className="about-stat-number">500K+</div>
                <div className="about-stat-label">Users</div>
              </div>
              <div className="about-stat">
                <div className="about-stat-number">24/7</div>
                <div className="about-stat-label">Support</div>
              </div>
            </div>

            <p className="about-mission">
              Secure, accessible banking for all South Africans.
            </p>

            <div className="about-security">
              <p>🔒 Licensed by SARB • 256-bit SSL Encryption</p>
            </div>

            <div className="about-social">
              <span>📘</span>
              <span>🐦</span>
              <span>📷</span>
            </div>
          </div>

          <div className="cards-form-actions">
            <button type="button" className="cards-form-cancel" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage({ search, setSearch, searchResults }) {
  const { user, updateStoredUser } = useAccount();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS_STATE);
  const [loading, setLoading] = useState(true);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinForm, setPinForm] = useState(DEFAULT_PIN_FORM);
  const [isPinSubmitting, setIsPinSubmitting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        setLoading(false);
        return;
      }

      try {
        const profileResponse = await API.get("/profile/me");
        updateStoredUser(profileResponse.data);

        const response = await API.get(`/settings/${userId}`);

        if (response.data.preferences) {
          // 🔹 Future-ready
          // Persisted preferences are real, while unfinished security features stay explicitly disabled instead of pretending to work.
          setSettings({
            biometric: response.data.preferences.twoFactor || false,
            privacy: true,
            txAlerts: response.data.preferences.pushNotifications !== false,
            doNotDisturb: response.data.preferences.doNotDisturb || false,
          });
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [updateStoredUser]);

  const saveSettings = async (updatedSettings) => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      return;
    }

    try {
      await API.put(
        `/settings/${userId}`,
        {
          twoFactor: updatedSettings.biometric,
          pushNotifications: updatedSettings.txAlerts,
          doNotDisturb: updatedSettings.doNotDisturb,
        }
      );
      return true;
    } catch (error) {
      return false;
    }
  };

  const toggle = async (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    
    const success = await saveSettings(updated);
    
    if (success) {
      showSuccessToast("Your preference has been updated.");
    } else {
      await showErrorAlert("Failed to Save", "Please try again later.");
    }
  };

  const openPinModal = () => {
    setPinForm(DEFAULT_PIN_FORM);
    setIsPinModalOpen(true);
  };

  const closePinModal = () => {
    if (!isPinSubmitting) {
      setIsPinModalOpen(false);
      setPinForm(DEFAULT_PIN_FORM);
    }
  };

  const updatePinForm = (field, value) => {
    setPinForm((current) => ({
      ...current,
      [field]: value.replace(/\D/g, "").slice(0, 6),
    }));
  };

  const handleChangePin = async (event) => {
    event.preventDefault();

    const hasExistingPin = user?.hasPin !== false;

    if ((hasExistingPin && !isValidPin(pinForm.currentPin)) || !isValidPin(pinForm.newPin)) {
      await showErrorAlert("Invalid PIN", "PIN must be digits only and 4-6 digits long.");
      return;
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      await showErrorAlert("PINs do not match", "New PIN and Confirm New PIN must match.");
      return;
    }

    try {
      setIsPinSubmitting(true);
      const response = hasExistingPin
        ? await API.patch("/auth/change-pin", pinForm)
        : await API.post("/auth/set-pin", {
            newPin: pinForm.newPin,
            confirmPin: pinForm.confirmPin,
          });
      updateStoredUser(response.data.user);
      setIsPinModalOpen(false);
      setPinForm(DEFAULT_PIN_FORM);
      await showSuccessAlert(
        hasExistingPin ? "PIN updated" : "PIN set",
        response.data.message || "PIN updated successfully."
      );
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to update PIN.";
      await showErrorAlert("PIN update failed", message);
    } finally {
      setIsPinSubmitting(false);
    }
  };

  const openHelpModal = () => setIsHelpModalOpen(true);
  const closeHelpModal = () => setIsHelpModalOpen(false);
  
  const openAboutModal = () => setIsAboutModalOpen(true);
  const closeAboutModal = () => setIsAboutModalOpen(false);

  if (loading) {
    return (
      <div className="dashboard-page">
        <Sidebar />
        <div className="dashboard-main-panel">
          <Navbar search={search} setSearch={setSearch} searchResults={searchResults} />
          <main className="dashboard-content-area">
            <div className="container-fluid px-0 dashboard-shell">
              <div className="loading-spinner">Loading settings...</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Sidebar />
      <div className="dashboard-main-panel">
        <Navbar search={search} setSearch={setSearch} searchResults={searchResults} />
        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
          <div className="settings-container">
            <Section label="Security">
              <SettingRow
                icon="🔑"
                title={user?.hasPin === false ? "Set PIN" : "Change PIN"}
                subtitle={
                  user?.hasPin === false
                    ? "Set a PIN before viewing card details."
                    : user?.mustChangePin
                      ? "You are using a temporary PIN. Please change it before viewing card details."
                      : "Update the PIN used to reveal card details."
                }
                chevron
                onClick={openPinModal}
              />
              <SettingRow
                icon="📱"
                title="Biometric Login"
                subtitle="Use FaceID or Fingerprint"
                toggle={settings.biometric}
                onToggle={() => toggle("biometric")}
              />
              <SettingRow
                icon="👁️"
                title="Privacy Mode"
                subtitle="Hide balances on dashboard"
                toggle={settings.privacy}
                onToggle={() => toggle("privacy")}
              />
            </Section>

            <Section label="Notifications">
              <SettingRow
                icon="🔔"
                title="Transaction Alerts"
                subtitle="Get notified for every spend"
                toggle={settings.txAlerts}
                onToggle={() => toggle("txAlerts")}
              />
              <SettingRow
                icon="🌙"
                title="Do Not Disturb"
                subtitle="Mute alerts during night"
                toggle={settings.doNotDisturb}
                onToggle={() => toggle("doNotDisturb")}
              />
            </Section>

            <Section label="Support">
              <SettingRow
                icon="❓"
                title="Help Center"
                subtitle="FAQs and support guides"
                chevron
                onClick={openHelpModal}
              />
              <SettingRow
                icon="ℹ️"
                title="About NexBank"
                subtitle="Version 2.4.0 (Build 102)"
                chevron
                onClick={openAboutModal}
              />
            </Section>

            <div className="settings-footer">
              NexBank Digital Banking • Made with ❤️ in South Africa
            </div>
          </div>
          </div>
        </main>
      </div>

      <HelpCenterModal isOpen={isHelpModalOpen} onClose={closeHelpModal} />
      <AboutModal isOpen={isAboutModalOpen} onClose={closeAboutModal} />
      <ChangePinModal
        isOpen={isPinModalOpen}
        form={pinForm}
        hasExistingPin={user?.hasPin !== false}
        isTemporaryPin={Boolean(user?.mustChangePin)}
        onChange={updatePinForm}
        onClose={closePinModal}
        onSubmit={handleChangePin}
        isSubmitting={isPinSubmitting}
      />
    </div>
  );
}
