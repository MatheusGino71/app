import AccountForm from "../components/account-form";
import "../entrar/account.css";
export default async function Recover({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const token = (await searchParams).token || ""; return <AccountForm initialMode="reset" initialCode={/^[a-f0-9]{48,64}$/.test(token) ? token : ""} />; }
