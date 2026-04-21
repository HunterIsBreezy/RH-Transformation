import { SignIn } from "@clerk/nextjs";

export const metadata = { title: "Sign in" };

export default function Page() {
  return (
    <main className="min-h-screen grid place-items-center px-6 py-24">
      <SignIn />
    </main>
  );
}
