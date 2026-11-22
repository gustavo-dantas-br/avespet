import { supabase } from "../../supabaseClient";
import { normalizarPerfil } from "./perfilAve.js";
import { validarVinculo } from "./diarioMapeamento.js";

// Desligado por padrão. Ativar apenas após aplicar e validar RLS em ambiente de teste.
export const PERFIL_NUVEM_ATIVO = false;
function verificar(userId, aveId) {
 if (!PERFIL_NUVEM_ATIVO) throw new Error("Sincronização ainda não habilitada.");
 if (validarVinculo({userId,aveId})) throw new Error("Vínculo inválido.");
}
export async function lerPerfilNuvem(userId,aveId) {
 verificar(userId,aveId);
 const [pref,ave]=await Promise.all([
 supabase.from("avespet_ia_preferencias").select("nivel,ave_ativa_id").eq("user_id",userId).maybeSingle(),
 supabase.from("avespet_ia_perfis_ave").select("fase,etapa_vida,idade_dias").eq("user_id",userId).eq("ave_id",aveId).maybeSingle()
 ]);
 if(pref.error)throw pref.error;
 if(ave.error)throw ave.error;
 return {nivel:pref.data?.nivel||"iniciante",aveAtivaId:pref.data?.ave_ativa_id||"",perfil:ave.data?{fase:ave.data.fase,etapaVida:ave.data.etapa_vida,idadeDias:ave.data.idade_dias==null?"":String(ave.data.idade_dias)}:null};
}
export async function salvarPerfilNuvem(userId,aveId,perfil) {
 verificar(userId,aveId);
 const p=normalizarPerfil(perfil);
 const agora=new Date().toISOString();
 const {error}=await supabase.from("avespet_ia_perfis_ave").upsert({user_id:userId,ave_id:aveId,fase:p.fase,etapa_vida:p.etapaVida,idade_dias:p.nascimento||p.idadeDias===""?null:Number(p.idadeDias),atualizado_em:agora},{onConflict:"user_id,ave_id"});
 if(error)throw error;
 const pref=await supabase.from("avespet_ia_preferencias").upsert({user_id:userId,nivel:p.nivel,ave_ativa_id:aveId,atualizado_em:agora},{onConflict:"user_id"});
 if(pref.error)throw pref.error;
}
