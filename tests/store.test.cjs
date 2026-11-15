require("./register.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, dirname, resolve } = require("node:path");
const { createStore } = require("../lib/server/store.ts");
const { emptySalon, emptyDiagnostic, profileLevel } = require("../lib/domain.ts");
const { validateEvidence } = require("../lib/server/evidence.ts");
const password = "Test-password-only-2026";
process.env.ATELIER_SETUP_TOKEN = "test-bootstrap-token-only";
async function setup(path = ":memory:") {
 const store = await createStore(path);
 const admin = await store.signup({kind:"staff",name:"Gestao",email:"admin@example.test",password,code:process.env.ATELIER_SETUP_TOKEN});
 const invite = await store.invite(admin,{email:"sales@example.test",role:"comercial"});
 const sales = await store.signup({kind:"staff",name:"Comercial",email:"sales@example.test",password,code:invite.code});
 const customer = await store.signup({name:"Cliente",email:"client@example.test",password,role:"admin"});
 return {store,admin,sales,customer};
}
function payload(name="Salao de teste"){const diagnostic=emptyDiagnostic();diagnostic.annualPurchase=400;diagnostic.source="Relatorio de testes";return {salonId:"",version:0,step:6,salon:{...emptySalon(),name,contact:"Decisor",country:"Polonia",city:"Varsovia"},diagnostic};}
test("cadastro publico nunca concede papel interno, inclusive na primeira conta",async()=>{
 const store=await createStore(":memory:");try{const user=await store.signup({name:"Cliente",email:"first@example.test",password,role:"admin"});assert.equal(user.role,"cliente");assert.equal(await store.hasAdmins(),false);await assert.rejects(()=>store.signup({kind:"staff",name:"Intruso",email:"staff@example.test",password,code:"errado"}),/configura/);await assert.rejects(()=>store.snapshot(user),/equipe/);}finally{store.close();}
});
test("convites preservam o papel e sao de uso unico; senhas e sessoes ficam como hash",async()=>{
 const {store,admin}=await setup();try{await assert.rejects(()=>store.signup({kind:"staff",name:"Intruso",email:"x@example.test",password}),/convite/);assert.equal((await store.login({email:admin.email.toUpperCase(),password})).id,admin.id);await assert.rejects(()=>store.login({email:admin.email,password:"errada"}),/incorretos/);assert.notEqual((await store.db.get("SELECT password FROM users WHERE id=?",admin.id)).password,password);const s=await store.createSession(admin,false);assert.equal((await store.session(s.token)).id,admin.id);assert.notEqual((await store.db.get("SELECT token FROM sessions LIMIT 1")).token,s.token);await store.logout(s.token);assert.equal(await store.session(s.token),null);}finally{store.close();}
});
test("segunda visita preserva salao e historico; conflitos sao recusados",async()=>{
 const {store,admin}=await setup();try{const p=payload();const {salonId}=await store.saveVisit(admin,p);const next={...p,salonId,version:1,diagnostic:{...p.diagnostic,annualPurchase:9000}};await store.saveVisit(admin,next);const data=await store.snapshot(admin);assert.equal(data.salons.length,1);assert.equal(data.visits.length,2);assert.equal(data.visits[0].category,"ICON");assert.equal(data.visits[1].category,"ORIGIN");await assert.rejects(()=>store.saveVisit(admin,next),/outra sess/);}finally{store.close();}
});
test("cliente nao acessa painel, convite, acao, importacao ou carteira de terceiros",async()=>{
 const {store,admin,sales,customer}=await setup();try{const p=payload();const {salonId}=await store.saveVisit(admin,p);assert.equal((await store.snapshot(sales)).salons.length,0);await assert.rejects(()=>store.saveVisit(sales,{...p,salonId,version:1}),/carteira/);await assert.rejects(()=>store.snapshot(customer),/equipe/);await assert.rejects(()=>store.saveVisit(customer,p),/equipe/);await assert.rejects(()=>store.updateAction(customer,{}),/equipe/);await assert.rejects(()=>store.importPurchases(customer,[]),/equipe/);await assert.rejects(()=>store.invite(customer,{email:"x@example.test",role:"admin"}),/restrito/);await store.assign(admin,{salonId,ownerId:sales.id,version:1});assert.equal((await store.snapshot(sales)).salons.length,1);await assert.rejects(()=>store.assign(admin,{salonId,ownerId:customer.id,version:2}),/equipe/);}finally{store.close();}
});
test("rascunhos sao privados e incompletos; cliente nao retoma salao alheio",async()=>{
 const {store,admin,customer}=await setup();try{const p=payload();await store.saveDraft(customer,p);assert.equal((await store.draftFor(customer)).salon.name,p.salon.name);assert.equal(await store.draftFor(admin),null);const {salonId}=await store.saveVisit(admin,p);await assert.rejects(()=>store.saveDraft(customer,{...p,salonId,version:1}),/conta/);await store.clearDraft(customer);assert.equal(await store.draftFor(customer),null);}finally{store.close();}
});
test("acordos exigem resultado e controle de versao",async()=>{
 const {store,admin,sales}=await setup();try{const p=payload();p.diagnostic.agreement={title:"Acompanhar aplicacao",responsible:"Equipe",due:"2026-12-01"};await store.saveVisit(admin,p);const a=(await store.snapshot(admin)).actions[0];await assert.rejects(()=>store.updateAction(admin,{...a,status:"done",result:""}),/resultado/);await assert.rejects(()=>store.updateAction(sales,{...a,status:"done",result:"Resultado observado no teste"}),/carteira/);await store.updateAction(admin,{...a,status:"done",result:"Resultado observado e registrado."});assert.equal((await store.snapshot(admin)).actions[0].status,"done");await assert.rejects(()=>store.updateAction(admin,{...a,status:"done",result:"Tentativa concorrente de alteracao"}),/outra sess/);}finally{store.close();}
});
test("compra autodeclarada e provisoria; cliente nao atribui estrelas e precisa confirmar email",async()=>{
 const {store,admin,customer}=await setup();try{const p=payload();p.diagnostic.annualPurchase=null;await assert.rejects(()=>store.saveVisit(customer,p,true),/compra/);p.diagnostic.annualPurchase=9000;p.diagnostic.assessments.influencia={score:5,evidence:"Autodeclarado"};await store.saveVisit(customer,p,true);let profile=await store.onboardingProfile(customer);assert.equal(profile.visit.category,"ICON");assert.equal(profile.visit.diagnostic.assessments.influencia.score,null);assert.equal(profileLevel(profile).confirmed,false);const review=(await store.snapshot(admin)).reviews[0];const decision={id:review.id,status:"approved",annualPurchase:4000,source:"Grace Pro confirmado",note:"Compra conferida com o relatorio oficial"};await assert.rejects(()=>store.reviewPurchase(admin,decision),/e-mail/);const token=await store.verification(customer);await store.verifyEmail(token.code);await assert.rejects(()=>store.verifyEmail(token.code),/expirado/);await store.reviewPurchase(admin,decision);profile=await store.onboardingProfile(customer);assert.equal(profileLevel(profile).category,"SIGNATURE");assert.equal(profileLevel(profile).amount,4000);assert.equal(profileLevel(profile).confirmed,true);await assert.rejects(()=>store.reviewPurchase(admin,decision),/conclu/);}finally{store.close();}
});
test("novo diagnostico nao substitui nivel confirmado antes da conferencia",async()=>{
 const {store,admin,customer}=await setup();try{const p=payload();p.diagnostic.annualPurchase=4000;const r=await store.saveVisit(customer,p,true);await store.verifyEmail((await store.verification(customer)).code);let profile=await store.onboardingProfile(customer);await store.reviewPurchase(admin,{id:profile.review.id,status:"approved",annualPurchase:4000,source:"Grace Pro",note:"Verificado no sistema oficial"});await store.saveVisit(customer,{...p,salonId:r.salonId,version:1,diagnostic:{...p.diagnostic,annualPurchase:9000}},true);profile=await store.onboardingProfile(customer);assert.equal(profileLevel(profile).category,"SIGNATURE");assert.equal(profileLevel(profile).pending,true);assert.equal((await store.snapshot(admin)).visits.length,2);}finally{store.close();}
});
test("um perfil nao pode assumir o salao de outra conta",async()=>{
 const {store,admin,customer}=await setup();try{const p=payload();const {salonId}=await store.saveVisit(customer,p,true);await assert.rejects(()=>store.saveVisit(admin,{...p,salonId,version:1},true),/pr.pria conta/);assert.equal(await store.onboardingProfile(admin),null);await assert.rejects(()=>store.saveVisit(customer,p,true),/vinculado/);}finally{store.close();}
});
test("importacao e atomica, confirma compras e preserva o historico",async()=>{
 const {store,admin}=await setup();try{const p=payload();p.diagnostic.assessments.tecnica={score:5,evidence:"Metodo reproduzido no teste"};const {salonId}=await store.saveVisit(admin,p);const r={salonId,annualPurchase:9000,orders:10,cutoff:p.diagnostic.cutoff,source:"Relatorio Grace Pro"};await assert.rejects(()=>store.importPurchases(admin,[r,{...r,salonId:"ausente"}]));assert.equal((await store.snapshot(admin)).visits.length,1);await store.importPurchases(admin,[r]);const data=await store.snapshot(admin);assert.equal(data.visits.length,2);assert.equal(data.visits[0].category,"ICON");assert.equal(data.visits[0].diagnostic.assessments.tecnica.score,null);assert.equal(data.visits[1].diagnostic.assessments.tecnica.score,5);assert.equal(data.reviews[0].status,"approved");}finally{store.close();}
});
test("recuperacao por email e unica, revoga sessoes e confirma o endereco",async()=>{
 const {store,customer}=await setup();try{const session=await store.createSession(customer,true);assert.equal(await store.recovery("absent@example.test"),null);const reset=await store.recovery(customer.email);await store.resetPassword({email:customer.email,code:reset.code,password:"New-test-password-2026"});assert.equal(await store.session(session.token),null);await assert.rejects(()=>store.login({email:customer.email,password}));assert.equal((await store.login({email:customer.email,password:"New-test-password-2026"})).emailVerified,true);await assert.rejects(()=>store.resetPassword({email:customer.email,code:reset.code,password}));}finally{store.close();}
});
test("anexos sao privados e validam formato real do arquivo",async()=>{
 const {store,admin,customer}=await setup();try{const {salonId}=await store.saveVisit(customer,payload(),true);const pdf=validateEvidence("teste.pdf","application/pdf",Buffer.from("%PDF-1.4 teste"));const {id}=await store.addEvidence(customer,salonId,pdf);assert.equal((await store.listEvidence(customer,salonId)).length,1);assert.equal((await store.getEvidence(admin,id)).name,"teste.pdf");const other=await store.signup({name:"Outro",email:"other@example.test",password});await assert.rejects(()=>store.getEvidence(other,id),/conta/);assert.throws(()=>validateEvidence("x.pdf","application/pdf",Buffer.from("<script>")),/formato/);assert.throws(()=>validateEvidence("x.png","image/png",Buffer.alloc(1000001)),/1 MB/);}finally{store.close();}
});
test("persistencia conserva contas ao fechar e reabrir",async()=>{
 const folder=mkdtempSync(join(tmpdir(),"atelier-store-test-"));let store;try{const s=await setup(join(folder,"test.sqlite"));store=s.store;await store.saveVisit(s.admin,payload());store.close();store=await createStore(join(folder,"test.sqlite"));const user=await store.login({email:s.admin.email,password});assert.equal(user.id,s.admin.id);assert.equal((await store.snapshot(user)).salons.length,1);}finally{store?.close();assert.equal(dirname(resolve(folder)),resolve(tmpdir()));assert.ok(folder.includes("atelier-store-test-"));rmSync(folder,{recursive:true,force:true});}
});
test("transacoes locais nao misturam requisicoes e fazem rollback",async()=>{
 const {store}=await setup();try{await store.db.exec("CREATE TABLE test_transactions (id INTEGER PRIMARY KEY)");await assert.rejects(()=>store.db.transaction(async q=>{await q.run("INSERT INTO test_transactions VALUES (1)");throw new Error("rollback");}));assert.equal((await store.db.all("SELECT * FROM test_transactions")).length,0);await Promise.all([1,2,3].map(id=>store.db.transaction(async q=>{await q.run("INSERT INTO test_transactions VALUES (?)",id);await new Promise(r=>setTimeout(r,5));})));assert.equal((await store.db.all("SELECT * FROM test_transactions")).length,3);}finally{store.close();}
});
test("limite de tentativas e aplicado atomicamente",async()=>{const store=await createStore(":memory:");try{for(let i=0;i<3;i++)await store.rateLimit("teste",3);await assert.rejects(()=>store.rateLimit("teste",3),/Muitas tentativas/);}finally{store.close();}});
