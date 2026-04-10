import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Toggle({ on, onToggle }) {
  return (
    <div className={`toggle ${on ? "toggle-on" : ""}`} onClick={onToggle}>
      <div className="toggle-circle" />
    </div>
  );
}

function SettingRow({ icon, title, subtitle, toggle, onToggle, chevron }) {
  return (
    <div className="setting-row">
      <div className="setting-icon">{icon}</div>

      <div className="setting-text">
        <div className="setting-title">{title}</div>
        <div className="setting-subtitle">{subtitle}</div>
      </div>

      {toggle !== undefined && (
        <Toggle on={toggle} onToggle={onToggle} />
      )}

      {chevron && <span className="setting-chevron">⚙️</span>}
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

export default function SettingsPage() {
  const [s, setS] = useState({
    biometric: true,
    privacy: true,
    txAlerts: true,
    doNotDisturb: false,
  });

  const toggle = (key) =>
    setS((prev) => ({ ...prev, [key]: !prev[key] }));

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
                subtitle="Update your 5-digit login PIN"
                chevron
              />

              <SettingRow
                icon="📱"
                title="Biometric Login"
                subtitle="Use FaceID or Fingerprint"
                toggle={s.biometric}
                onToggle={() => toggle("biometric")}
              />

              <SettingRow
                icon="👁️"
                title="Privacy Mode"
                subtitle="Hide balances on dashboard"
                toggle={s.privacy}
                onToggle={() => toggle("privacy")}
              />
            </Section>

            <Section label="Notifications">
              <SettingRow
                icon="🔔"
                title="Transaction Alerts"
                subtitle="Get notified for every spend"
                toggle={s.txAlerts}
                onToggle={() => toggle("txAlerts")}
              />

              <SettingRow
                icon="🌙"
                title="Do Not Disturb"
                subtitle="Mute alerts during night"
                toggle={s.doNotDisturb}
                onToggle={() => toggle("doNotDisturb")}
              />
            </Section>

            <Section label="Support">
              <SettingRow
                icon="❓"
                title="Help Center"
                subtitle="FAQs and support guides"
                chevron
              />

              <SettingRow
                icon="ℹ️"
                title="About NexBank"
                subtitle="Version 2.4.0 (Build 102)"
                chevron
              />
            </Section>

            <div className="settings-footer">
              NexBank Digital Banking • Made with ❤️ in South Africa
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
