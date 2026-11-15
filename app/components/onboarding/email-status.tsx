"use client";
import { useState } from "react";
export default function EmailStatus({ verified }: { verified?: boolean }) {
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  if(verified)return <div className="crm-note">E-mail confirmado. Seu perfil está pronto para a conferência comercial.</div>;
  return <div className="crm-note"><div><strong>Confirme seu e-mail.</strong><p>Acesse o link enviado para seu endereço. A equipe poderá aprovar seu nível depois da confirmação.</p>{message&&<p role="status">{message}</p>}</div><button className="crm-btn quiet" disabled={busy} onClick={async()=>{setBusy(true);try{const r=await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"resendVerification"})});const d=await r.json();if(!r.ok)throw new Error(d.error);setMessage(d.delivery==="local"?"Ambiente local: a mensagem está disponível na caixa de saída de desenvolvimento do servidor.":"Solicitação concluída. Confira sua caixa de entrada e o spam.");}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}}>{busy?"Enviando…":"Reenviar confirmação"}</button><button className="crm-btn quiet" onClick={()=>window.location.reload()}>Já confirmei</button></div>;
}
