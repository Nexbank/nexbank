import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

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

  const updateCardSettings = async (cardUpdates = {}) => {
    setSettingsMeta((prev) => ({
      ...prev,
      cardPin: cardUpdates.cardPin ?? prev.cardPin,
      cardNumber: cardUpdates.cardNumber ?? prev.cardNumber,
      cardPreferences: {
        ...prev.cardPreferences,
        ...(cardUpdates.cardPreferences ?? {}),
      },
    }));

    try {
      const userId = localStorage.getItem("userId");

      if (!userId) {
        return;
      }

      await axios.put(
        `http://localhost:5000/api/settings/${userId}`,
        buildSettingsPayload(s, {
          ...settingsMeta,
          cardPin: cardUpdates.cardPin ?? settingsMeta.cardPin,
          cardNumber: cardUpdates.cardNumber ?? settingsMeta.cardNumber,
          cardPreferences: {
            ...settingsMeta.cardPreferences,
            ...(cardUpdates.cardPreferences ?? {}),
          },
        })
      );
    } catch (error) {
      console.error("Card settings API not ready yet:", error);
    }
  };

  const updateAlertPreferences = async (alertUpdates = {}) => {
    const nextState = {
      ...s,
      txAlerts: alertUpdates.txAlerts ?? s.txAlerts,
      doNotDisturb: alertUpdates.doNotDisturb ?? s.doNotDisturb,
    };
    const nextMeta = {
      ...settingsMeta,
      notificationPreferences: {
        ...settingsMeta.notificationPreferences,
        ...(alertUpdates.notificationPreferences ?? {}),
        transactionAlerts:
          alertUpdates.txAlerts ?? settingsMeta.notificationPreferences.transactionAlerts,
        doNotDisturb:
          alertUpdates.doNotDisturb ?? settingsMeta.notificationPreferences.doNotDisturb,
      },
    };

    setSettingsMeta(nextMeta);

    try {
      const userId = localStorage.getItem("userId");

      if (!userId) {
        return;
      }

      await axios.put(
        `http://localhost:5000/api/settings/${userId}`,
        buildSettingsPayload(nextState, nextMeta)
      );
    } catch (error) {
      console.error("Alert preferences API not ready yet:", error);
    }
  };

  const updateLanguageSetting = async (language) => {
    const nextMeta = {
      ...settingsMeta,
      language: language ?? settingsMeta.language,
    };

    setSettingsMeta(nextMeta);

    try {
      const userId = localStorage.getItem("userId");

      if (!userId) {
        return;
      }

      await axios.put(
        `http://localhost:5000/api/settings/${userId}`,
        buildSettingsPayload(s, nextMeta)
      );
    } catch (error) {
      console.error("Language settings API not ready yet:", error);
    }
  };

  const preparedSettingsActions = {
    updateCardSettings,
    updateAlertPreferences,
    updateLanguageSetting,
  };
  void preparedSettingsActions;

  useEffect(() => {
    const fetchSettings = async () => {
      const userId = localStorage.getItem("userId");

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
      }
    };

    fetchSettings();
  }, []);

  const saveSettings = async (updatedState) => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/settings/${userId}`,
        buildSettingsPayload(updatedState)
      );
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const toggle = async (key) => {
    const updated = { ...s, [key]: !s[key] };

    setS(updated);

    if (key === "txAlerts" || key === "doNotDisturb") {
      updateAlertPreferences({
        txAlerts: key === "txAlerts" ? updated.txAlerts : undefined,
        doNotDisturb: key === "doNotDisturb" ? updated.doNotDisturb : undefined,
        notificationPreferences: {
          transactionAlerts: updated.txAlerts,
          doNotDisturb: updated.doNotDisturb,
        },
      });
    }

    await saveSettings(updated);
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
      return;
    }

    if (pinForm.currentPin !== (settingsMeta.cardPin ?? "")) {
      setPinError("Current PIN does not match.");
      setPinMessage("");
      return;
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinError("New PIN and confirm PIN do not match.");
      setPinMessage("");
      return;
    }

    const nextMeta = {
      ...settingsMeta,
      cardPin: pinForm.newPin,
    };

    setSettingsMeta(nextMeta);
    setPinError("");
    setPinMessage("PIN updated.");

    try {
      const userId = localStorage.getItem("userId");

      if (!userId) {
        return;
      }

      await axios.put(
        `http://localhost:5000/api/settings/${userId}`,
        buildSettingsPayload(s, nextMeta)
      );
    } catch (error) {
      console.error("PIN settings API not ready yet:", error);
    }
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
                icon="🔑"
                title="Change PIN"
                subtitle={`Current PIN: ${settingsMeta.cardPin ?? "12345"}`}
                chevron
                onClick={openPinModal}
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
                  ×
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
