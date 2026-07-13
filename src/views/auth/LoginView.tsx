import { useState, useEffect, type CSSProperties } from "react";
import { VStack } from "@astryxdesign/core/Layout";
import { Card } from "@astryxdesign/core/Card";
import { Text, Heading } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useAppStore } from "../../viewmodels/useAppStore";
import VaultBackdrop from "../../design-system/VaultBackdrop";

// Card has no `maxWidth` prop (same constraint Astryx's own login templates
// hit — see @astryxdesign/core's login/login-card reference templates).
// The translucent glass background is derived from a real token via
// color-mix() rather than a raw rgba() hex value.
const cardStyle: CSSProperties = {
  position: "relative",
  zIndex: 10,
  width: "100%",
  maxWidth: 440,
  maxHeight: "100vh",
  overflowY: "auto",
};

const titleStyle: CSSProperties = {
  fontFamily: "var(--font-family-ui)",
  fontWeight: 600,
  letterSpacing: "-0.02em",
};

const linkStyle: CSSProperties = {
  cursor: "pointer",
  textDecoration: "underline",
  textUnderlineOffset: "4px",
};

type AuthStep = "login" | "register";

export default function LoginView() {
  const hasLocalAccount = useAppStore((state) => state.hasLocalAccount);
  const hasAccount = useAppStore((state) => state.localUser !== null);
  const register = useAppStore((state) => state.register);
  const login = useAppStore((state) => state.login);

  const [step, setStep] = useState<AuthStep>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize step based on local account existence
  useEffect(() => {
    if (hasLocalAccount()) {
      setStep("login");
    } else {
      setStep("register");
    }
    setIsInitializing(false);
  }, [hasLocalAccount]);

  const handleRegister = async () => {
    setErrorMsg("");
    if (!email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    await register(email, password);
  };

  const handleLogin = async () => {
    setErrorMsg("");
    if (!email || !password) {
      setErrorMsg("Please enter email and password.");
      return;
    }

    const success = await login(email, password);
    if (!success) {
      setErrorMsg("Invalid email or password.");
    }
  };

  if (isInitializing) return null; // Prevent flash

  return (
    <VaultBackdrop>
      <Card variant="transparent" style={cardStyle} className="native-card">
        <VStack
          key={step}
          gap={4}
          hAlign="center"
          style={{ padding: "var(--spacing-12) var(--spacing-10)" }}
        >
          {step === "login" && (
            <VStack gap={2} hAlign="center" width="100%" className="fade-enter">
              <Heading level={1} style={titleStyle}>
                Unlock Vault
              </Heading>
              <Text
                type="body"
                color="secondary"
                justify="center"
                style={{ marginBottom: "var(--spacing-8)" }}
              >
                Enter your master password to access your universe.
              </Text>

              <VStack gap={4} width="100%" style={{ marginBottom: "var(--spacing-8)" }}>
                <TextInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(v) => setEmail(v)}
                  placeholder="author@mythos.com"
                />
                <TextInput
                  label="Master Password"
                  type="password"
                  value={password}
                  onChange={(v) => setPassword(v)}
                  placeholder="••••••••"
                  status={errorMsg ? { type: "error", message: errorMsg } : undefined}
                />
              </VStack>

              <Button
                label="Unlock"
                variant="primary"
                size="lg"
                onClick={handleLogin}
                style={{ width: "100%" }}
              />

              {!hasAccount && (
                <Text
                  type="supporting"
                  color="secondary"
                  justify="center"
                  style={{ ...linkStyle, marginTop: "var(--spacing-2)" }}
                  onClick={() => {
                    setStep("register");
                    setErrorMsg("");
                  }}
                >
                  Need to create a new vault?
                </Text>
              )}
            </VStack>
          )}

          {step === "register" && (
            <VStack gap={2} hAlign="center" width="100%" className="fade-enter">
              <Heading level={1} style={titleStyle}>
                Create Vault
              </Heading>
              <Text
                type="body"
                color="secondary"
                justify="center"
                style={{ marginBottom: "var(--spacing-8)" }}
              >
                Set a master password to encrypt your local universe.
              </Text>

              <VStack gap={4} width="100%" style={{ marginBottom: "var(--spacing-8)" }}>
                <TextInput
                  label="Email (Local ID)"
                  type="email"
                  value={email}
                  onChange={(v) => setEmail(v)}
                  placeholder="author@mythos.com"
                />
                <TextInput
                  label="Master Password"
                  type="password"
                  value={password}
                  onChange={(v) => setPassword(v)}
                  placeholder="At least 6 characters"
                />
                <TextInput
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(v) => setConfirmPassword(v)}
                  placeholder="••••••••"
                  status={errorMsg ? { type: "error", message: errorMsg } : undefined}
                />
              </VStack>

              <Button
                label="Create Local Vault"
                variant="primary"
                size="lg"
                onClick={handleRegister}
                style={{ width: "100%" }}
              />

              {hasAccount && (
                <Text
                  type="supporting"
                  color="secondary"
                  justify="center"
                  style={{ ...linkStyle, marginTop: "var(--spacing-2)" }}
                  onClick={() => {
                    setStep("login");
                    setErrorMsg("");
                  }}
                >
                  Already have a vault? Unlock it.
                </Text>
              )}
            </VStack>
          )}

          <VStack
            gap={0}
            hAlign="center"
            style={{ maxWidth: "85%", marginTop: "var(--spacing-2)" }}
          >
            <Text type="supporting" color="secondary" justify="center">
              This is a Local-First application.
            </Text>
            <Text type="supporting" color="secondary" justify="center">
              Your password is used to encrypt data on this device and is never sent to a server.
            </Text>
          </VStack>
        </VStack>
      </Card>
    </VaultBackdrop>
  );
}
