// frontend/src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const API_BASE = "http://localhost:5000";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("nutrigraph_user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(
        `Could not connect to backend. Is it running at ${API_BASE}?`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1>NutriTrack AI</h1>
      <p className="tagline">Smart Food Recommendations for Your Health</p>

      <form className="login-form" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}

      <p className="signup-text">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          className="link-button"
          onClick={() => navigate("/signup")}
        >
          Sign up
        </button>
      </p>
    </div>
  );
}

export default Login;
