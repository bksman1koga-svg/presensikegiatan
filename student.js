import {sql,getSet,wrap,fail,ORGS} from "./_lib.js";
const dist=(a,b,c,d)=>{const R=6371000,r=x=>x*Math.PI/180,h=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
const corr=(a,b)=>{let s=0,x=0,y=0;for(let i=0;i<a.length;i++){s+=a[i]*b[i];x+=a[i]*a[i];y+=b[i]*b[i]}return s/Math.sqrt(x*y||1)};
export default wrap(async(b,req,res)=>{
 const st=await getSet();
 if(b.action==="info"){const n=await sql`SELECT count(*)::int AS n FROM students`,h=await sql`SELECT count(*)::int AS n FROM att WHERE (to_timestamp(ts/1000.0) AT TIME ZONE 'Asia/Jakarta')::date=(now() AT TIME ZONE 'Asia/Jakarta')::date`;return res.json({sekolah:st.sekolah,logo:st.logo,siswa:n[0].n,hadir:h[0].n});}
 const id=String(b.id||"").trim();if(!id)fail("NIS/NISN kosong");
 const r=await sql`SELECT nis,nama,kelas,face FROM students WHERE nis=${id} OR nisn=${id} LIMIT 1`;
 if(!r.length)fail("NIS/NISN tidak ditemukan",404);const s=r[0];
 if(b.action==="login")return res.json({nis:s.nis,nama:s.nama,kelas:s.kelas,face:!!s.face});
 if(b.action!=="absen")fail("Aksi tidak dikenal");
 const{org,lat,lng,vec}=b;
 if(!ORGS.includes(org))fail("Organisasi tidak valid");
 if(typeof lat!=="number"||typeof lng!=="number")fail("Lokasi tidak valid");
 const d=dist(lat,lng,st.lat,st.lng);
 if(d>st.rad)fail(`Absen ditolak: Anda ${Math.round(d)} m dari sekolah (batas ${st.rad} m). Absen hanya bisa di area sekolah.`,403);
 if(!Array.isArray(vec)||vec.length!==576||vec.some(x=>typeof x!=="number"))fail("Data wajah tidak valid");
 const dup=await sql`SELECT 1 FROM att WHERE nis=${s.nis} AND org=${org} AND (to_timestamp(ts/1000.0) AT TIME ZONE 'Asia/Jakarta')::date=(now() AT TIME ZONE 'Asia/Jakarta')::date LIMIT 1`;
 if(dup.length)fail("Anda sudah absen "+org+" hari ini.",409);
 let note="";
 if(!s.face){await sql`UPDATE students SET face=${JSON.stringify(vec)}::jsonb WHERE nis=${s.nis}`;note=" Wajah Anda terdaftar sebagai acuan."}
 else{const c=corr(vec,s.face);if(c<.55)fail(`Wajah tidak cocok (${Math.round(c*100)}%). Absen ditolak.`,403)}
 await sql`INSERT INTO att(nis,nama,kelas,org,ts) VALUES(${s.nis},${s.nama},${s.kelas},${org},${Date.now()})`;
 res.json({msg:`Absen ${org} berhasil.`+note});
});
