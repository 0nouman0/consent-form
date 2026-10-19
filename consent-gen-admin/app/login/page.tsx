import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-screen" style={{ backgroundColor: "#F4F1E9" }}>
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: "rgba(23,20,16,0.15)", borderTopColor: "#171410" }}
          />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
