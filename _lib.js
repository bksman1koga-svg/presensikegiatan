import {neon} from "@neondatabase/serverless";
import {createHash} from "crypto";
export const dbUrl=()=>process.env.DATABASE_URL||process.env.POSTGRES_URL||process.env.POSTGRES_URL_NON_POOLING||"";
let _q;export const sql=(...a)=>(_q??=neon(dbUrl()))(...a);
export const hash=p=>createHash("sha256").update(String(p)).digest("hex");
const DEF={sekolah:"SMA Negeri 1 Kotagajah",kepsek:"",nipKepsek:"",pembina:"",nipPembina:"",logo:"",lat:-4.9833294,lng:105.3296201,rad:120,passHash:hash("admin123")};
export const ORGS=["MPK","OSIS","PIK-R","ROHIS","ROHIN","ROKRIS","ROKAT","DIKSI","ENGLISH CLUB","KIR","MUNSSAGA","OLIMPIADE","PASKIB","PKS","PMR","PRAMUKA","ROBOTIK","SNIKERS","SULAM TAPIS"];
let ready=false;
async function init(){if(ready)return;
 await sql`CREATE TABLE IF NOT EXISTS students(nis text PRIMARY KEY,nisn text,nama text,kelas text,face jsonb)`;
 await sql`CREATE TABLE IF NOT EXISTS att(id serial PRIMARY KEY,nis text,nama text,kelas text,org text,ts bigint)`;
 await sql`CREATE TABLE IF NOT EXISTS settings(id int PRIMARY KEY,data jsonb)`;
 await sql`INSERT INTO settings VALUES(1,${JSON.stringify(DEF)}::jsonb) ON CONFLICT DO NOTHING`;ready=true}
export async function getSet(){const r=await sql`SELECT data FROM settings WHERE id=1`;return{...DEF,...r[0].data}}
export const fail=(m,c=400)=>{const e=new Error(m);e.code=c;throw e};
export const wrap=f=>async(req,res)=>{try{res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Headers","content-type,x-admin-user,x-admin-pass");res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");if(req.method==="OPTIONS")return res.status(204).end();if(req.method!=="POST")fail("Gunakan POST",405);if(!dbUrl())fail("Database belum terhubung. Di Vercel: Storage > Create Database > Neon, lalu Redeploy.",500);await init();await f(req.body||{},req,res)}catch(e){console.error(e);res.status(e.code||500).json({error:e.code?e.message:"Kesalahan server"})}};
