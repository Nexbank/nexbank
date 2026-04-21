import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useNotification } from "../components/Notification";

const DEFAULT_SETTINGS_STATE = {
  biometric: true,
  privacy: true,
  txAlerts: true,
  doNotDisturb: false,
};

const DEFAULT_SETTINGS_META = {
  language: "en",
  cardPin: "12345",
  cardNumber: "",
  cardPreferences: {},
  notificationPreferences: {
    transactionAlerts: true,
    doNotDisturb: false,
  },
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
      {chevron && <span className="setting-chevron">Open</span>}
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
  const { showNotification } = useNotification();
  const [s, setS] = useState(DEFAULT_SETTINGS_STATE);
  const [settingsMeta, setSettingsMeta] = useState(DEFAULT_SETTINGS_META);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinForm, setPinForm] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: "",
  });
  const [pinMessage, setPinMessage] = useState("");
  const [pinError, setPinError] = useState("");

  const mapApiSettingsToUi = (data, previousState) => ({
    ...previousState,
    biometric: data?.twoFactorEnabled ?? previousState.biometric,
    txAlerts: data?.pushNotificationsEnabled ?? previousState.txAlerts,
    privacy: data?.theme ? data.theme === "dark" : previousState.privacy,
    doNotDisturb: data?.doNotDisturbEnabled ?? previousState.doNotDisturb,
  });

  const buildSettingsPayload = (state, meta = settingsMeta) => ({
    twoFactorEnabled: state.biometric,
    pushNotificationsEnabled: state.txAlerts,
    theme: state.privacy ? "dark" : "light",
    language: meta?.language ?? "en",
    doNotDisturbEnabled: state.doNotDisturb,
    notificationPreferences: {
      ...(meta?.notificationPreferences ?? {}),
      transactionAlerts: state.txAlerts,
      doNotDisturb: state.doNotDisturb,
    },
    cardPin: meta?.cardPin ?? "",
    cardPreferences: meta?.cardPreferences ?? {},
    cardNumber: meta?.cardNumber ?? "",
  });

  const getUserId = () => localStorage.getItem("userId");

  const saveSettings = async (updatedState, updatedMeta = settingsMeta) => {
    const userId = getUserId();

    if (!userId) {
      showNotification("info", "Settings are being saved locally until your profile is linked.", {
        title: "Offline Preferences",
        duration: 4200,
      });
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/settings/${userId}`,
        buildSettingsPayload(updatedState, updatedMeta)
      );
    } catch (error) {
      console.error("Failed to save settings:", error);
      showNotification("error", "We could not save this setting to the server right now.", {
        title: "Settings Sync Failed",
      });
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const userId = getUserId();

      if (!userId) {
        return;
      }

      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/settings/${userId}`
        );

        if (!data) {
          return;
        }

        setS((prev) => mapApiSettingsToUi(data, prev));
        setSettingsMeta((prev) => ({
          ...prev,
          language: data?.language ?? prev.language,
          cardPin: data?.cardPin ?? prev.cardPin,
          cardNumber: data?.cardNumber ?? prev.cardNumber,
          cardPreferences: data?.cardPreferences ?? prev.cardPreferences,
          notificationPreferences: {
            ...prev.notificationPreferences,
            ...(data?.notificationPreferences ?? {}),
            transactionAlerts:
              data?.pushNotificationsEnabled ??
              prev.notificationPreferences.transactionAlerts,
            doNotDisturb:
              data?.doNotDisturbEnabled ??
              prev.notificationPreferences.doNotDisturb,
          },
        }));
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        showNotification("error", "We could not load your latest settings from the server.", {
          title: "Settings Unavailable",
        });
      }
    };

    fetchSettings();
  }, [showNotification]);

  const toggle = async (key) => {
    const updated = { ...s, [key]: !s[key] };
    const nextMeta = {
      ...settingsMeta,
      notificationPreferences: {
        ...settingsMeta.notificationPreferences,
        transactionAlerts: key === "txAlerts" ? updated.txAlerts : s.txAlerts,
        doNotDisturb: key === "doNotDisturb" ? updated.doNotDisturb : s.doNotDisturb,
      },
    };

    setS(updated);
    setSettingsMeta(nextMeta);
    await saveSettings(updated, nextMeta);

    const messages = {
      biometric: updated.biometric
        ? ["warning", "Biometric sign-in has been enabled for extra account protection.", "Biometric Enabled"]
        : ["info", "Biometric sign-in has been disabled.", "Biometric Disabled"],
      privacy: updated.privacy
        ? ["info", "Privacy mode is on. Sensitive values can stay hidden on shared screens.", "Privacy Mode Enabled"]
        : ["info", "Privacy mode is off. Full balances remain visible.", "Privacy Mode Disabled"],
      txAlerts: updated.txAlerts
        ? ["success", "Transaction alerts are active again.", "Alerts Enabled"]
        : ["warning", "Transaction alerts have been muted.", "Alerts Paused"],
      doNotDisturb: updated.doNotDisturb
        ? ["info", "Do Not Disturb is enabled. Non-critical alerts will stay quiet.", "Do Not Disturb Enabled"]
        : ["success", "Do Not Disturb is off. Real-time alerts are back.", "Do Not Disturb Disabled"],
    };

    const [type, message, title] = messages[key];
    showNotification(type, message, { title });
  };

  const openPinModal = () => {
    setPinMessage("");
    setPinError("");
    setPinForm({
      currentPin: settingsMeta.cardPin ?? "",
      newPin: "",
      confirmPin: "",
    });
    setIsPinModalOpen(true);
  };

  const closePinModal = () => {
    setPinMessage("");
    setPinError("");
    setIsPinModalOpen(false);
  };

  const handlePinChange = (event) => {
    const { name, value } = event.target;

    setPinForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const savePin = async (event) => {
    event.preventDefault();

    if (!/^\d{4,5}$/.test(pinForm.currentPin) || !/^\d{4,5}$/.test(pinForm.newPin)) {
      setPinError("PIN must be 4 or 5 digits.");
      setPinMessage("");
      showNotification("error", "PIN values must be 4 or 5 digits.", {
        title: "Invalid PIN",
      });
      return;
    }

    if (pinForm.currentPin !== (settingsMeta.cardPin ?? "")) {
      setPinError("Current PIN does not match.");
      setPinMessage("");
      showNotification("error", "Current PIN does not match our records.", {
        title: "PIN Verification Failed",
      });
      return;
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinError("New PIN and confirm PIN do not match.");
      setPinMessage("");
      showNotification("error", "New PIN and confirm PIN do not match.", {
        title: "PIN Mismatch",
      });
      return;
    }

    const nextMeta = {
      ...settingsMeta,
      cardPin: pinForm.newPin,
    };

    setSettingsMeta(nextMeta);
    setPinError("");
    setPinMessage("PIN updated.");
    await saveSettings(s, nextMeta);

    showNotification("success", "Your card PIN has been updated.", {
      title: "PIN Updated",
    });
  };

  return (
    <div className="app">
      <Sidebar />

      <div className="main">
        <Navbar />

        <div className="content">
          <div className="settings-container">
            <Section label="Security">
              <SettingRow
                icon="PIN"
                title="Change PIN"
                subtitle={`Current PIN: ${settingsMeta.cardPin ?? "12345"}`}
                chevron
                onClick={openPinModal}
              />

              <SettingRow
                icon="BIO"
                title="Biometric Login"
                subtitle="Use FaceID or Fingerprint"
                toggle={s.biometric}
                onToggle={() => toggle("biometric")}
              />

              <SettingRow
                icon="PRV"
                title="Privacy Mode"
                subtitle="Hide balances on dashboard"
                toggle={s.privacy}
                onToggle={() => toggle("privacy")}
              />
            </Section>

            <Section label="Notifications">
              <SettingRow
                icon="ALRT"
                title="Transaction Alerts"
                subtitle="Get notified for every spend"
                toggle={s.txAlerts}
                onToggle={() => toggle("txAlerts")}
              />

              <SettingRow
                icon="DND"
                title="Do Not Disturb"
                subtitle="Mute alerts during night"
                toggle={s.doNotDisturb}
                onToggle={() => toggle("doNotDisturb")}
              />
            </Section>

            <Section label="Support">
              <SettingRow
                icon="HELP"
                title="Help Center"
                subtitle="FAQs and support guides"
                chevron
                onClick={() =>
                  showNotification("info", "Help Center content will be connected next.", {
                    title: "Support Coming Soon",
                  })
                }
              />

              <SettingRow
                icon="INFO"
                title="About NexBank"
                subtitle="Version 2.4.0 (Build 102)"
                chevron
                onClick={() =>
                  showNotification("info", "NexBank frontend notifications are ready for backend integration.", {
                    title: "About NexBank",
                  })
                }
              />
            </Section>

            <div className="settings-footer">
              NexBank Digital Banking • Made with care in South Africa
            </div>
          </div>
        </div>
      </div>

      {isPinModalOpen && (
        <div className="cards-modal-backdrop" role="presentation" onClick={closePinModal}>
          <div
            className="cards-modal modal-dialog modal-dialog-centered"
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-pin-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cards-modal-content modal-content">
              <div className="cards-modal-header">
                <div>
                  <h2 id="change-pin-title" className="cards-modal-title">
                    Change PIN
                  </h2>
                  <p className="cards-modal-copy">
                    This is a safe frontend-ready PIN flow for the Settings feature.
                  </p>
                </div>

                <button
                  type="button"
                  className="cards-modal-close"
                  aria-label="Close PIN form"
                  onClick={closePinModal}
                >
                  x
                </button>
              </div>

              <form className="cards-form row g-3" onSubmit={savePin}>
                <div className="col-12">
                  <label className="cards-form-label" htmlFor="current-pin">
                    Current PIN
                  </label>
                  <input
                    id="current-pin"
                    name="currentPin"
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    className="form-control cards-form-control"
                    value={pinForm.currentPin}
                    onChange={handlePinChange}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="cards-form-label" htmlFor="new-pin">
                    New PIN
                  </label>
                  <input
                    id="new-pin"
                    name="newPin"
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    className="form-control cards-form-control"
                    value={pinForm.newPin}
                    onChange={handlePinChange}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="cards-form-label" htmlFor="confirm-pin">
                    Confirm PIN
                  </label>
                  <input
                    id="confirm-pin"
                    name="confirmPin"
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    className="form-control cards-form-control"
                    value={pinForm.confirmPin}
                    onChange={handlePinChange}
                    required
                  />
                </div>

                {pinError && <div className="col-12 text-danger">{pinError}</div>}
                {pinMessage && <div className="col-12 text-success">{pinMessage}</div>}

                <div className="col-12 cards-form-actions">
                  <button
                    type="button"
                    className="cards-form-cancel"
                    onClick={closePinModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="cards-form-submit">
                    Save PIN
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
