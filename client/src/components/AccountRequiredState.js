import { FiBriefcase } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function AccountRequiredState({
  title = "Select an account",
  copy = "Choose an account before using this page.",
}) {
  const navigate = useNavigate();

  return (
    <article className="dashboard-empty-state">
      <span className="dashboard-empty-icon" aria-hidden="true">
        <FiBriefcase size={38} />
      </span>
      <p className="dashboard-empty-title">{title}</p>
      <p className="dashboard-empty-copy">{copy}</p>
      <button
        type="button"
        className="dashboard-pay-button mt-3"
        onClick={() => navigate("/accounts")}
      >
        Choose Account
      </button>
    </article>
  );
}
