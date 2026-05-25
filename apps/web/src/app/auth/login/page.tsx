import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams;
  return <LoginForm redirect={redirect} />;
}
