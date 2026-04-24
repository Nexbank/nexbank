import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const DEFAULT_SETTINGS_STATE = {
  biometric: false,
  privacy: true,
  txAlerts: true,
  doNotDisturb: false,
};

function Toggle({ on, onToggle }) {
  return (
    <div className={`toggle ${on ? "toggle-on" : ""}`} onClick={onToggle}>
      <div className="toggle-circle" />
    </div>
  );
}

function SettingRow({ icon, title, subtitle, toggle, onToggle, chevron, onClick }) {
  return (
    <div
      className="setting-row"
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      <div className="setting-icon">{icon}</div>
      <div className="setting-text">
        <div className="setting-title">{title}</div>
        <div className="setting-subtitle">{subtitle}</div>
      </div>
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

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS_STATE);
  const [loading, setLoading] = useState(true);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [pinForm, setPinForm] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: "",
  });
  const [pinMessage, setPinMessage] = useState("");
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:5000/api/settings/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.preferences) {
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
  }, []);

  const saveSettings = async (updatedSettings) => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/settings/${userId}`,
        {
          twoFactor: updatedSettings.biometric,
          pushNotifications: updatedSettings.txAlerts,
          doNotDisturb: updatedSettings.doNotDisturb,
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
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
      Swal.fire({
        icon: 'success',
        title: 'Settings Saved!',
        text: 'Your preference has been updated.',
        timer: 1500,
        showConfirmButton: false,
        background: '#111111',
        color: '#e8e8e8'
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Failed to Save',
        text: 'Please try again later.',
        background: '#111111',
        color: '#e8e8e8'
      });
    }
  };

  const openPinModal = () => {
    setPinMessage("");
    setPinError("");
    setPinForm({ currentPin: "", newPin: "", confirmPin: "" });
    setIsPinModalOpen(true);
  };

  const closePinModal = () => {
    setPinMessage("");
    setPinError("");
    setIsPinModalOpen(false);
  };

  const openHelpModal = () => setIsHelpModalOpen(true);
  const closeHelpModal = () => setIsHelpModalOpen(false);
  
  const openAboutModal = () => setIsAboutModalOpen(true);
  const closeAboutModal = () => setIsAboutModalOpen(false);

  const handlePinChange = (event) => {
    const { name, value } = event.target;
    setPinForm((prev) => ({ ...prev, [name]: value }));
  };

  const savePin = async (event) => {
    event.preventDefault();

    if (!/^\d{4,5}$/.test(pinForm.currentPin) || !/^\d{4,5}$/.test(pinForm.newPin)) {
      setPinError("PIN must be 4 or 5 digits.");
      setPinMessage("");
      return;
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinError("New PIN and confirm PIN do not match.");
      setPinMessage("");
      return;
    }

    setPinError("");
    setPinMessage("PIN updated successfully!");
    
    Swal.fire({
      icon: 'success',
      title: 'PIN Updated!',
      text: 'Your PIN has been changed successfully.',
      timer: 1500,
      showConfirmButton: false,
      background: '#111111',
      color: '#e8e8e8'
    });
    
    setTimeout(() => {
      setPinMessage("");
      closePinModal();
    }, 1500);
  };

  if (loading) {
    return (
      <div className="app">
        <Sidebar />
        <div className="main">
          <Navbar />
          <div className="content">
            <div className="loading-spinner">Loading settings...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Navbar />
        <div className="content">
          <div className="settings-container">
            <Section label="Security">
              <SettingRow
                icon="🔑"
                title="Change PIN"
                subtitle="Update your security PIN"
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
      </div>

      {/* PIN Change Modal */}
      {isPinModalOpen && (
        <div className="cards-modal-backdrop" role="presentation" onClick={closePinModal}>
          <div className="cards-modal modal-dialog modal-dialog-centered" role="dialog" onClick={(event) => event.stopPropagation()}>
            <div className="cards-modal-content modal-content">
              <div className="cards-modal-header">
                <div>
                  <h2 className="cards-modal-title">Change PIN</h2>
                  <p className="cards-modal-copy">Update your security PIN</p>
                </div>
                <button type="button" className="cards-modal-close" onClick={closePinModal}>×</button>
              </div>

              <form className="cards-form row g-3" onSubmit={savePin}>
                <div className="col-12">
                  <label className="cards-form-label">Current PIN</label>
                  <input name="currentPin" type="password" inputMode="numeric" maxLength={5} className="form-control cards-form-control" value={pinForm.currentPin} onChange={handlePinChange} required />
                </div>

                <div className="col-12 col-md-6">
                  <label className="cards-form-label">New PIN</label>
                  <input name="newPin" type="password" inputMode="numeric" maxLength={5} className="form-control cards-form-control" value={pinForm.newPin} onChange={handlePinChange} required />
                </div>

                <div className="col-12 col-md-6">
                  <label className="cards-form-label">Confirm PIN</label>
                  <input name="confirmPin" type="password" inputMode="numeric" maxLength={5} className="form-control cards-form-control" value={pinForm.confirmPin} onChange={handlePinChange} required />
                </div>

                {pinError && <div className="col-12 text-danger">{pinError}</div>}
                {pinMessage && <div className="col-12 text-success">{pinMessage}</div>}

                <div className="col-12 cards-form-actions">
                  <button type="button" className="cards-form-cancel" onClick={closePinModal}>Cancel</button>
                  <button type="submit" className="cards-form-submit">Save PIN</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <HelpCenterModal isOpen={isHelpModalOpen} onClose={closeHelpModal} />
      <AboutModal isOpen={isAboutModalOpen} onClose={closeAboutModal} />
    </div>
  );
}