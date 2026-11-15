export function validateEvidence(name: string, mime: string, bytes: Uint8Array) {
  if (!bytes.length || bytes.length > 1_000_000) throw new Error("Cada anexo deve ter até 1 MB.");
  const b=Buffer.from(bytes); const valid=mime==="application/pdf"?b.subarray(0,5).toString()==="%PDF-":mime==="image/png"?b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):mime==="image/jpeg"?b[0]===255&&b[1]===216&&b[2]===255:mime==="image/webp"?b.subarray(0,4).toString()==="RIFF"&&b.subarray(8,12).toString()==="WEBP":false;
  if(!valid)throw new Error("Envie um PDF ou imagem PNG, JPEG ou WebP com formato válido.");
  return {name:name.replace(/[^\p{L}\p{N}._ -]/gu,"_").slice(0,100)||"evidencia",mime,content:b.toString("base64")};
}
