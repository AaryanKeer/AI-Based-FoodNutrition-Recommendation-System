// frontend/src/pages/Signup.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // reuse same styles

const API_BASE = "http://localhost:5000";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name,
        email,
        password,
        // keep other fields optional; will be filled in profile later
        preference: "both",
        activity_level: "moderate",
      };

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      // auto-login after signup
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
      <h1>Create your NutriTrack account</h1>
      <p className="tagline">Start getting personalised meal recommendations</p>

      <form className="login-form" onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email address"
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

        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}

      <p className="signup-text">
        Already have an account?{" "}
        <button
          type="button"
          className="link-button"
          onClick={() => navigate("/")}
        >
          Back to Login
        </button>
      </p>
    </div>
  );
}

export default Signup;
