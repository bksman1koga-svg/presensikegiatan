import {sql,dbUrl} from "./_lib.js";
export default async function handler(req,res){res.setHeader("Access-Control-Allow-Origin","*");let database="BELUM terhubung (DATABASE_URL kosong)";
 if(dbUrl()){try{await sql`SELECT 1`;database="terhubung"}catch(e){database="GAGAL: "+e.message}}
 res.status(200).json({server:"ok",database})}
