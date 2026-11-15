import VerifyEmail from "../components/onboarding/verify-email";
import "../workspace/workspace.css";
import "../diagnostico/onboarding.css";
export default async function ConfirmEmail({searchParams}:{searchParams:Promise<{token?:string}>}){const token=(await searchParams).token||"";return <VerifyEmail token={/^[a-f0-9]{64}$/.test(token)?token:""}/>;}
