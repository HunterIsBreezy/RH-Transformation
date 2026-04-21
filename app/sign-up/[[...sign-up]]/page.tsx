import { SignUp } from "@clerk/nextjs";

export const metadata = { title: "Sign up" };

export default function Page() {
  return (
    <main className="min-h-screen grid place-items-center px-6 py-24">
      <SignUp />
    </main>
  );
}
