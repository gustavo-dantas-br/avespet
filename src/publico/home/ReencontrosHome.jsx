import React, { useEffect, useState } from "react";
import { Link } from "../roteador";
import { listarAvesPerdidas } from "../../features/aves-perdidas/services/avesPerdidasService";
import ReencontrosCarousel from "../../features/aves-perdidas/components/ReencontrosCarousel";

export default function ReencontrosHome() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let active = true;
    listarAvesPerdidas().then(rows => {
      if (active) setItems(rows.filter(({data}) => data?.situacao === "reencontrado").slice(0, 8));
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  if (!items.length) return null;
  return <div className="mx-auto max-w-7xl px-5 pb-6 md:px-8">
    <ReencontrosCarousel items={items} compact />
    <div className="mt-3 flex flex-wrap justify-center gap-4">
      <Link para="/aves-perdidas" className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white">Ver reencontros e cadastrar minha ave</Link>
      <Link para="/campanha-ave-perdida" className="rounded-xl border border-emerald-700 bg-white px-5 py-3 text-sm font-semibold text-emerald-800">Conhecer opções de divulgação</Link>
    </div>
  </div>;
}
