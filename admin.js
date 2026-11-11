import {sql,getSet,wrap,fail,hash,ORGS} from "./_lib.js";
const KEYS=["sekolah","kepsek","nipKepsek","pembina","nipPembina","logo"];
export default wrap(async(b,req,res)=>{
 const st=await getSet(),h=req.headers;
 if(h["x-admin-user"]!=="admin"||hash(h["x-admin-pass"]||"")!==st.passHash)fail("Username/password salah",401);
 if(b.action==="load"){
  const students=await sql`SELECT nis,nisn,nama,kelas,face IS NOT NULL AS face FROM students ORDER BY nama`;
  const att=await sql`SELECT nis,nama,kelas,org,ts::float8 AS ts FROM att ORDER BY ts`;
  const{passHash,...set}=st;return res.json({students,att,set});}
 if(b.action==="saveStudents"){
  const a=(Array.isArray(b.students)?b.students:[]).filter(s=>s&&s.nis);
  const g=k=>a.map(s=>String(s[k]??""));
  await sql`INSERT INTO students(nis,nisn,nama,kelas) SELECT * FROM unnest(${g("nis")}::text[],${g("nisn")}::text[],${g("nama")}::text[],${g("kelas")}::text[]) ON CONFLICT (nis) DO UPDATE SET nisn=EXCLUDED.nisn,nama=EXCLUDED.nama,kelas=EXCLUDED.kelas`;
  await sql`DELETE FROM students WHERE nis <> ALL(${g("nis")}::text[])`;return res.json({ok:true});}
 if(b.action==="resetFace"){await sql`UPDATE students SET face=NULL WHERE nis=${String(b.nis)}`;return res.json({ok:true});}
 if(b.action==="saveSettings"){
  const n={...st},i=b.set||{};KEYS.forEach(k=>{if(typeof i[k]==="string")n[k]=i[k]});
  ["lat","lng","rad"].forEach(k=>{if(Number.isFinite(i[k]))n[k]=i[k]});
  if(b.newPass)n.passHash=hash(b.newPass);
  await sql`UPDATE settings SET data=${JSON.stringify(n)}::jsonb WHERE id=1`;return res.json({ok:true});}
 if(b.action==="mark"){const id=String(b.id||"").trim();if(!ORGS.includes(b.org))fail("Organisasi tidak valid");
  const r=await sql`SELECT nis,nama,kelas FROM students WHERE nis=${id} OR nisn=${id} LIMIT 1`;if(!r.length)fail("Siswa tidak ditemukan: "+id,404);const s=r[0];
  const d=await sql`SELECT 1 FROM att WHERE nis=${s.nis} AND org=${b.org} AND (to_timestamp(ts/1000.0) AT TIME ZONE 'Asia/Jakarta')::date=(now() AT TIME ZONE 'Asia/Jakarta')::date LIMIT 1`;
  if(d.length)fail(s.nama+" sudah absen "+b.org+" hari ini.",409);const ts=Date.now();
  await sql`INSERT INTO att(nis,nama,kelas,org,ts) VALUES(${s.nis},${s.nama},${s.kelas},${b.org},${ts})`;return res.json({att:{nis:s.nis,nama:s.nama,kelas:s.kelas,org:b.org,ts}});}
 fail("Aksi tidak dikenal");
});
