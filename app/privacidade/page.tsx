import { privacyNoticeConfig } from "../../lib/privacy-notice";
import PrivacyNotice from "../components/privacy-notice";
import "../conta/privacy.css";
export const dynamic = "force-dynamic";
export default function Page() { return <PrivacyNotice config={privacyNoticeConfig()} />; }
