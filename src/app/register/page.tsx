import { Suspense } from "react";
import { RegisterForm } from "./RegisterForm";

export const metadata = { title: "Inscription" };

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
