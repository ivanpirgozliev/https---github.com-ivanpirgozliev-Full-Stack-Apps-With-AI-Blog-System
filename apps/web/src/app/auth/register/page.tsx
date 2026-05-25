import { RegisterForm } from "./register-form";

export const metadata = { title: "Create account" };

interface RegisterPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { redirect } = await searchParams;
  return <RegisterForm redirect={redirect} />;
}
