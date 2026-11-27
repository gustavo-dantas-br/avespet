import React from "react";
import { Mail, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "../publico/roteador";
import { PaginaPublica, CartaoPublico, TEMA_PUBLICO } from "../publico/ComponentesPublicos";
import { useSEO } from "../publico/seo";

const EMAIL_PRIVACIDADE = "contato@nebulaclw.com";

export default function PoliticaPrivacidade() {
  useSEO({
    titulo: "Política de Privacidade | Avespet",
    descricao: "Saiba como a NEBULA CLW LTDA trata os dados pessoais utilizados nos serviços Avespet.",
    caminho: "/privacidade",
  });

  return (
    <main style={{ background: TEMA_PUBLICO.fundo, minHeight: "70vh" }}>
      <PaginaPublica largura="max-w-4xl">
        <Link para="/" className="text-sm font-semibold underline" style={{ color: TEMA_PUBLICO.verde }}>← Voltar ao Avespet</Link>
        <div className="mt-6 mb-8">
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold" style={{ background: TEMA_PUBLICO.verdeClaro, color: TEMA_PUBLICO.verde }}>
            <ShieldCheck size={15} /> Privacidade e proteção de dados
          </span>
          <h1 className="mt-4 text-3xl font-bold md:text-4xl" style={{ color: TEMA_PUBLICO.tinta, fontFamily: "'Fraunces', Georgia, serif" }}>Política de Privacidade do Avespet</h1>
          <p className="mt-3 text-sm leading-6" style={{ color: TEMA_PUBLICO.texto }}>Versão inicial — 27 de novembro de 2026. Esta política explica os tratamentos de dados relacionados às páginas e funcionalidades públicas do Avespet. Ela deverá ser complementada se novos serviços, fornecedores ou finalidades forem adicionados.</p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <CartaoPublico className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TEMA_PUBLICO.texto }}>Controlador informado</p>
            <p className="mt-2 font-bold" style={{ color: TEMA_PUBLICO.tinta }}>NEBULA CLW LTDA</p>
            <p className="mt-1 text-sm" style={{ color: TEMA_PUBLICO.texto }}>CNPJ 67.073.285/0001-61</p>
          </CartaoPublico>
          <CartaoPublico className="p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: TEMA_PUBLICO.texto }}><MapPin size={14}/> Endereço informado</p>
            <p className="mt-2 text-sm leading-6" style={{ color: TEMA_PUBLICO.tinta }}>Rua Celestino Marinelli, 10 — Parque São Domingos, São Paulo/SP — CEP 05126-120</p>
          </CartaoPublico>
        </div>

        <CartaoPublico className="p-5 md:p-8">
          <div className="space-y-7 text-sm leading-7" style={{ color: TEMA_PUBLICO.tinta }}>
            <section>
              <h2 className="text-lg font-bold">1. Quem é responsável pelos dados?</h2>
              <p>A controladora informada do Avespet é NEBULA CLW LTDA, CNPJ 67.073.285/0001-61, no endereço acima. Para dúvidas, solicitações ou exercício de direitos relacionados a dados pessoais, entre em contato pelo e-mail <a className="font-semibold underline" href={`mailto:${EMAIL_PRIVACIDADE}`}>${EMAIL_PRIVACIDADE}</a>.</p>
              <p>Este canal recebe solicitações de privacidade. A indicação de um encarregado formal e seus dados de contato serão divulgados quando aplicável.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold">2. Quais dados podemos tratar?</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>Dados de conta: nome, e-mail, credenciais de autenticação geridas pelo provedor de autenticação e identificadores técnicos da conta.</li>
                <li>Contato e atendimento: telefone/WhatsApp, mensagens e informações que você envia ao suporte ou em solicitações de campanha.</li>
                <li>Dados do anúncio: espécie, nome da ave, cor, características, sexo e idade aproximada, anilha, data do desaparecimento, bairro, cidade, UF, descrição e fotografia.</li>
                <li>Solicitações de divulgação: pacote escolhido, região pretendida e dados de contato fornecidos para elaboração de orçamento.</li>
                <li>Dados técnicos: registros necessários à segurança, funcionamento, prevenção de abuso e métricas de navegação, conforme configurações dos serviços utilizados.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-lg font-bold">3. Para quais finalidades usamos os dados?</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>Criar e proteger sua conta, autenticar o acesso e permitir que você acompanhe e edite seus anúncios.</li>
                <li>Receber, moderar, publicar e administrar anúncios de aves perdidas e registros de aves encontradas.</li>
                <li>Intermediar o contato entre pessoas que possam ajudar e o responsável pela ave, sem expor automaticamente telefone, e-mail ou número da anilha na listagem pública.</li>
                <li>Responder solicitações, preparar orçamentos e administrar campanhas de divulgação solicitadas.</li>
                <li>Manter a segurança, prevenir fraude e cumprir obrigações legais e regulatórias aplicáveis.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-lg font-bold">4. O que fica público?</h2>
              <p>Quando um anúncio é aprovado, informações da ave e uma localização aproximada, como bairro e cidade, podem ser exibidas publicamente para ajudar na busca. Telefone, e-mail, endereço residencial completo e número da anilha não devem ser incluídos no conteúdo público do anúncio.</p>
              <p><strong>Atenção às fotografias:</strong> as imagens de aves enviadas para os anúncios são armazenadas em um espaço de arquivos configurado para acesso público por URL. Portanto, qualquer pessoa que tenha o endereço da imagem poderá visualizá-la ou compartilhá-la. Envie somente fotografias da ave; não envie documentos, rostos, placas, telas ou imagens que revelem informações pessoais.</p>
              <p>O anúncio passa por análise antes de ser publicado. A aprovação não garante localização ou recuperação da ave. A autorização e as informações apresentadas no formulário devem ser lidas antes do envio; dúvidas ou pedidos de retirada podem ser encaminhados ao canal de privacidade.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold">5. Bases e condições do tratamento</h2>
              <p>Os dados necessários para criar a conta, receber e administrar o anúncio e responder a uma solicitação são tratados conforme a base legal aplicável a cada finalidade, que pode incluir execução de procedimentos solicitados pelo titular, cumprimento de obrigação legal ou regulatória e legítimo interesse, quando cabível e após avaliação. Dados ou imagens destinados à divulgação pública serão tratados observando a necessidade de transparência e a autorização específica quando exigida. Não usamos o aceite desta política como consentimento genérico para finalidades incompatíveis.</p>
              <p>Mensagens promocionais e marketing, quando oferecidos, devem ter escolha separada, opcional e revogável; não são condição para o cadastro gratuito nem para a análise do anúncio.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold">6. Com quem os dados podem ser compartilhados?</h2>
              <p>Os dados podem ser processados por fornecedores de infraestrutura necessários ao funcionamento do Avespet, como hospedagem da aplicação, banco de dados, autenticação e armazenamento de arquivos, além de fornecedores de comunicação ou divulgação quando uma funcionalidade solicitada exigir esse uso. Esses fornecedores devem atuar conforme instruções e responsabilidades contratuais aplicáveis.</p>
              <p>Quando uma campanha paga for solicitada, informações necessárias à configuração e mensuração da divulgação poderão ser compartilhadas com plataformas de mídia, após apresentação das condições específicas da campanha. A solicitação de orçamento, por si só, não inicia campanha nem autoriza cobrança.</p>
              <p>Esta página não apresenta uma lista nominal completa de operadores, suboperadores ou países de armazenamento. Essa relação deverá ser mantida atualizada conforme os contratos e configurações efetivamente utilizados pelo Avespet.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold">7. Armazenamento, segurança e retenção</h2>
              <p>Adotamos medidas técnicas e administrativas destinadas a proteger os dados contra acessos não autorizados e situações acidentais ou ilícitas. Nenhum sistema é completamente livre de riscos. Os dados são mantidos pelo tempo necessário às finalidades do serviço, à segurança, ao cumprimento de obrigações legais e ao exercício regular de direitos; depois, poderão ser eliminados ou anonimizados quando cabível.</p>
              <p>Rascunhos de cadastro podem permanecer temporariamente no navegador utilizado para permitir a conclusão do fluxo. Evite usar dispositivo compartilhado e encerre sua sessão ao terminar. Não armazenamos a senha da conta no rascunho do anúncio.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold">8. Seus direitos</h2>
              <p>Nos termos da legislação aplicável, você pode solicitar confirmação da existência de tratamento, acesso, correção, anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade, portabilidade quando aplicável, informação sobre compartilhamentos, revisão de decisões automatizadas quando cabível, oposição e revogação de consentimento, observadas as condições legais.</p>
              <p>Para exercer seus direitos, escreva para <a className="font-semibold underline" href={`mailto:${EMAIL_PRIVACIDADE}`}>${EMAIL_PRIVACIDADE}</a>, descrevendo sua solicitação. Poderemos pedir informações razoáveis para confirmar sua identidade e proteger sua conta.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold">9. Crianças e adolescentes</h2>
              <p>O serviço é direcionado a responsáveis por aves e criadores. Se identificarmos dados pessoais de crianças ou adolescentes tratados de forma inadequada, adotaremos medidas compatíveis com a legislação e com o melhor interesse da criança ou adolescente.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold">10. Alterações nesta política</h2>
              <p>Esta política poderá ser atualizada para refletir mudanças no Avespet, em suas operações ou na legislação. A versão vigente será disponibilizada nesta página, com a data de atualização.</p>
            </section>
            <section className="rounded-xl p-4" style={{ background: TEMA_PUBLICO.verdeClaro }}>
              <h2 className="flex items-center gap-2 text-lg font-bold"><Mail size={18}/> Contato sobre privacidade</h2>
              <p>NEBULA CLW LTDA — CNPJ 67.073.285/0001-61</p>
              <p><a className="font-bold underline" href={`mailto:${EMAIL_PRIVACIDADE}`}>${EMAIL_PRIVACIDADE}</a></p>
              <p>Rua Celestino Marinelli, 10 — Parque São Domingos, São Paulo/SP — CEP 05126-120.</p>
            </section>
          </div>
        </CartaoPublico>
        <p className="mt-5 text-xs leading-5" style={{ color: TEMA_PUBLICO.texto }}>Documento informativo de privacidade. A publicação final deve ser acompanhada de revisão jurídica e da conferência das práticas, fornecedores, prazos de retenção e fluxos efetivamente ativos no Avespet.</p>
      </PaginaPublica>
    </main>
  );
}
