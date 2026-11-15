const {existsSync}=require("node:fs");
const required=["TURSO_DATABASE_URL","TURSO_AUTH_TOKEN","ATELIER_APP_ORIGIN","ATELIER_SETUP_TOKEN"];
let missing=false;for(const key of required){const ok=!!process.env[key];console.log(`${ok?"OK":"FALTA"} ${key}`);if(!ok)missing=true;}
if(process.env.ATELIER_APP_ORIGIN&&!/^https:\/\//.test(process.env.ATELIER_APP_ORIGIN)){console.log("FALTA: uma origem HTTPS de produção");missing=true;}
if(process.env.TURSO_DATABASE_URL&&!/^(libsql|https):/.test(process.env.TURSO_DATABASE_URL)){console.log("FALTA: URL remota do banco");missing=true;}
console.log(`${process.env.ATELIER_BACKUP_KEY?"OK":"PENDENTE"} ATELIER_BACKUP_KEY para o job de backup`);
console.log(`${process.env.RESEND_API_KEY&&process.env.MAIL_FROM?"OK":"OPCIONAL"} envio de recuperação por e-mail`);
console.log(`${existsSync("vercel.json")?"OK":"FALTA"} configuração Vercel`);process.exitCode=missing?1:0;
