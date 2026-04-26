import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: "2rem", color: "white" }}>
      <h1>Dashboard</h1>

      <p>Welcome: {user?.displayName}</p>

      <button onClick={logout}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;