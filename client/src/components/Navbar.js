export default function Navbar({ search, setSearch }) {
  return (
    <header className="topbar">
      <div className="search-bar">
        <span>🔍</span>
        <input
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="user-area">
        <div>
          <div className="user-name">Hi, Nozwelo 👋</div>
          <div className="user-role">Premium Member</div>
        </div>

        <div className="icon">🔔</div>
        <div className="avatar" />
      </div>
    </header>
  );
}
