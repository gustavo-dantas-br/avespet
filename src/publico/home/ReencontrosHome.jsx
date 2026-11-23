import React from "react";
import { Link } from "../roteador";
import ReencontrosVitrine from "../../features/aves-perdidas/components/ReencontrosVitrine";

export default function ReencontrosHome() {
  return <div className="mx-auto max-w-7xl px-5 pb-6 md:px-8">
    <ReencontrosVitrine compact variant="home" />
    <div className="mt-3 flex flex-wrap justify-center gap-4">
      <Link para="/aves-perdidas" className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white">Ver histórias e cadastrar minha ave</Link>
      <Link para="/campanha-ave-perdida" className="rounded-xl border border-emerald-700 bg-white px-5 py-3 text-sm font-semibold text-emerald-800">Conhecer opções de divulgação</Link>
    </div>
  </div>;
}
