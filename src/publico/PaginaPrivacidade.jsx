import React from "react";
import { Link } from "./roteador";
import { useSEO } from "./seo";
import { PaginaPublica, TEMA_PUBLICO } from "./ComponentesPublicos";

const contato = "contato@nebulaclw.com";

function Secao({ titulo, children }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-bold" style={{ color: TEMA_PUBLICO.tinta }}>{titulo}</h2>
      <div className="space-y-3 text-sm leading-7" style={{ color: TEMA_PUBLICO.texto }}>{children}</div>
    </section>
  );
}

export default function PaginaPrivacidade() {
  useSEO({
    titulo: "Política de Privacidade | Avespet",
    descricao: "Saiba como a NEBULA CLW LTDA trata dados pessoais no Avespet, como exercer seus direitos e entrar em contato.",
    caminho: "/privacidade",
  });

  return (
    <div style={{ background: TEMA_PUBLICO.fundo, minHeight: "70vh" }}>
      <PaginaPublica largura="max-w-4xl">
        <div className="mb-8">
          <Link para="/" className="text-sm font-semibold underline" style={{ color: TEMA_PUBLICO.verde }}>← Voltar ao Avespet</Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-wider" style={{ color: TEMA_PUBLICO.verde }}>Privacidade e proteção de dados</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl" style={{ color: TEMA_PUBLICO.tinta, fontFamily: "'Fraunces', Georgia, serif" }}>Política de Privacidade do Avespet</h1>
          <p className="mt-3 text-sm leading-6" style={{ color: TEMA_PUBLICO.texto }}>Versão inicial — 27 de novembro de 2026. Este documento descreve as práticas identificadas no serviço nesta data. Ele deve ser atualizado sempre que os tratamentos, fornecedores ou funcionalidades mudarem.</p>
        </div>

        <div className="mb-8 rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid " + TEMA_PUBLICO.borda }}>
          <h2 className="font-bold" style={{ color: TEMA_PUBLICO.tinta }}>Quem é responsável pelos dados?</h2>
          <p className="mt-2 text-sm leading-6" style={{ color: TEMA_PUBLICO.texto }}>
            O controlador indicado para o Avespet é <strong>NEBULA CLW LTDA</strong>, CNPJ <strong>67.073.285/0001-61</strong>, com endereço informado na Rua Celestino Marinelli, 10 — Parque São Domingos, São Paulo/SP, CEP 05126-120.
          </p>
          <p className="mt-2 text-sm leading-6" style={{ color: TEMA_PUBLICO.texto }}>Canal para assuntos de privacidade e exercício de direitos: <a className="font-semibold underline" style={{ color: TEMA_PUBLICO.verde }} href={"mailto:" + contato}>{contato}</a>.</p>
        </div>

        <Secao titulo="1. A quem e a que esta política se aplica">
          <p>Esta política se aplica às pessoas que navegam no Avespet, criam uma conta, cadastram aves perdidas, registram aves encontradas, solicitam campanhas de divulgação ou entram em contato com a equipe.</p>
          <p>O Avespet é uma plataforma de apoio à organização de anúncios e à aproximação entre pessoas que procuram e encontram aves. O serviço não garante a localização ou recuperação de qualquer animal.</p>
        </Secao>

        <Secao titulo="2. Quais dados podemos tratar">
          <ul className="list-disc space-y-2 pl-5">
            <li><strong>Conta e autenticação:</strong> e-mail, identificador da conta e dados necessários para autenticar o usuário. A senha é processada pelo serviço de autenticação e não deve ser compartilhada com a equipe Avespet.</li>
            <li><strong>Contato:</strong> nome, WhatsApp e, quando fornecidos, e-mail e dados necessários para responder solicitações.</li>
            <li><strong>Dados da ave:</strong> nome, espécie, cor/mutação, sexo, idade aproximada, características, descrição, data do desaparecimento, bairro/região, cidade, UF, fotografia e número de anilha.</li>
            <li><strong>Solicitação de campanha:</strong> pacote selecionado, região desejada, descrição da ave e dados de contato necessários para preparar orçamento.</li>
            <li><strong>Registros de uso e segurança:</strong> informações técnicas e registros de navegação/visitas usados para operar, proteger e melhorar o serviço.</li>
            <li><strong>Comunicações:</strong> conteúdo enviado ao suporte e registros necessários para acompanhar solicitações, moderação e reencontros.</li>
          </ul>
        </Secao>

        <Secao titulo="3. Para que usamos os dados">
          <ul className="list-disc space-y-2 pl-5">
            <li>Criar e proteger contas e permitir que o titular acompanhe e edite seus anúncios.</li>
            <li>Receber, analisar, moderar e publicar anúncios de aves perdidas, quando aprovados.</li>
            <li>Exibir informações necessárias para que a comunidade reconheça a ave e possa ajudar na busca.</li>
            <li>Intermediar contatos, atender solicitações e apoiar o registro de aves encontradas e reencontros.</li>
            <li>Responder pedidos de orçamento e organizar campanhas, sem contratação ou cobrança automática no simples envio da solicitação.</li>
            <li>Prevenir fraude, abuso, incidentes de segurança e uso indevido da plataforma.</li>
            <li>Cumprir obrigações legais e regulatórias e exercer direitos em processos administrativos ou judiciais, quando necessário.</li>
          </ul>
        </Secao>

        <Secao titulo="4. O que fica público nos anúncios">
          <p>Quando um anúncio é aprovado, a página pública pode exibir informações da ave e da busca, como nome da ave, espécie, cor, características, fotografia, data do desaparecimento e localização aproximada (bairro/cidade/UF), conforme os campos disponíveis no anúncio.</p>
          <p>O telefone, e-mail e número completo da anilha não fazem parte da exibição pública da vitrine de aves perdidas. O contato é intermediado pelo Avespet. Não informe telefone, endereço residencial, documentos ou dados pessoais no campo de descrição ou nas características da ave.</p>
          <p><strong>Atenção às fotografias:</strong> as imagens de aves perdidas são enviadas ao bucket de armazenamento atualmente configurado como público. Isso significa que uma imagem pode ser acessada por quem possuir sua URL, mesmo que a exibição do anúncio na vitrine dependa de aprovação. Envie somente a fotografia da ave; não envie documentos, pessoas, placas, comprovantes ou imagens com informações privadas.</p>
        </Secao>

        <Secao titulo="5. Bases legais e escolhas do titular">
          <p>O tratamento pode ocorrer, conforme a finalidade concreta, para executar serviços solicitados pelo titular, cumprir obrigações legais, proteger direitos, prevenir fraude e atender interesses legítimos avaliados do controlador e de terceiros. Quando uma finalidade depender de consentimento, ele deverá ser específico, informado, destacado e passível de revogação.</p>
          <p>O envio de uma solicitação de campanha é apenas um pedido de orçamento. A equipe entra em contato para apresentar condições; não há cobrança automática. Dados de contato são usados para responder ao pedido.</p>
          <p>Mensagens de marketing não são necessárias para manter a conta ou administrar um anúncio. Quando houver campanhas de marketing, a escolha deverá ser separada e opcional, com possibilidade de descadastramento.</p>
        </Secao>

        <Secao titulo="6. Com quem os dados podem ser compartilhados">
          <p>O acesso aos dados é limitado a pessoas autorizadas e a fornecedores que apoiam a operação técnica do Avespet, na medida necessária às finalidades informadas. A infraestrutura identificada nesta versão utiliza serviços de hospedagem e banco de dados/autenticação/armazenamento em nuvem, incluindo Vercel e Supabase.</p>
          <p>Se uma campanha de divulgação for contratada e envolver plataformas externas de publicidade, os dados estritamente necessários à execução poderão ser tratados por essas plataformas. O Avespet deverá informar a plataforma, a finalidade e os dados envolvidos no momento da contratação. Não afirmamos que campanhas ou integrações de publicidade estejam ativas por padrão.</p>
          <p>Também poderá haver compartilhamento quando exigido por lei, ordem válida de autoridade ou para proteger direitos, usuários e a segurança do serviço.</p>
        </Secao>

        <Secao titulo="7. Armazenamento, segurança e retenção">
          <p>Adotamos medidas técnicas e administrativas compatíveis com a operação do serviço para reduzir riscos de acesso não autorizado, perda, alteração ou divulgação indevida. Nenhum sistema conectado à internet oferece segurança absoluta.</p>
          <p>Os dados são mantidos pelo período necessário às finalidades do tratamento, à administração da conta e dos anúncios, ao atendimento de solicitações e ao cumprimento de obrigações legais. Prazos específicos de retenção e descarte serão observados conforme a categoria de dado e as obrigações aplicáveis. Cópias de segurança e registros técnicos podem permanecer por período adicional limitado.</p>
          <p>O cadastro de anúncio não deve incluir dados pessoais excessivos. A senha não é armazenada no rascunho temporário do formulário de aves perdidas. O navegador pode preservar temporariamente dados do rascunho para permitir a conclusão do cadastro no mesmo dispositivo.</p>
        </Secao>

        <Secao titulo="8. Transferência internacional">
          <p>Fornecedores de infraestrutura em nuvem podem processar ou armazenar dados em outros países, conforme a configuração dos serviços e seus contratos. Quando houver transferência internacional, ela deverá observar os requisitos da legislação brasileira e as salvaguardas aplicáveis. O titular pode solicitar informações adicionais pelo canal de privacidade.</p>
        </Secao>

        <Secao titulo="9. Direitos do titular">
          <p>Nos termos da legislação aplicável, o titular pode solicitar confirmação da existência de tratamento, acesso, correção, anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade, portabilidade quando aplicável, informação sobre compartilhamentos, revisão de decisões automatizadas quando cabível e revogação de consentimento.</p>
          <p>Para exercer seus direitos, escreva para <a className="font-semibold underline" style={{ color: TEMA_PUBLICO.verde }} href={"mailto:" + contato}>{contato}</a>, informando o pedido e dados suficientes para localizar a conta ou solicitação. Poderemos pedir confirmação razoável de identidade para proteger o titular. Responderemos nos prazos previstos na legislação aplicável.</p>
        </Secao>

        <Secao titulo="10. Crianças e adolescentes">
          <p>O Avespet não é direcionado a crianças. Se o serviço vier a tratar dados de crianças ou adolescentes, o tratamento deverá observar seu melhor interesse e os requisitos específicos da legislação, inclusive as medidas de informação e autorização aplicáveis.</p>
        </Secao>

        <Secao titulo="11. Cookies e tecnologias semelhantes">
          <p>O Avespet pode utilizar armazenamento local ou de sessão do navegador para manter funcionalidades, preservar rascunhos e evitar contagens repetidas de visita na mesma sessão. Configurações do navegador podem limitar esses recursos, mas algumas funcionalidades podem deixar de operar corretamente. Esta versão não declara a utilização de cookies publicitários ou pixels de terceiros como ativos.</p>
        </Secao>

        <Secao titulo="12. Atualizações desta política">
          <p>Esta política poderá ser atualizada para refletir mudanças no serviço, nos tratamentos, nos fornecedores ou na legislação. A versão vigente ficará disponível nesta página, com a data de atualização. Mudanças relevantes serão comunicadas por meios adequados.</p>
        </Secao>

        <div className="mt-10 rounded-2xl p-5" style={{ background: "#E8F1E9", border: "1px solid #CAE1D0" }}>
          <h2 className="font-bold" style={{ color: TEMA_PUBLICO.verde }}>Fale com o Avespet sobre privacidade</h2>
          <p className="mt-2 text-sm leading-6" style={{ color: TEMA_PUBLICO.texto }}>NEBULA CLW LTDA · CNPJ 67.073.285/0001-61 · Rua Celestino Marinelli, 10 — Parque São Domingos, São Paulo/SP — CEP 05126-120.</p>
          <a className="mt-3 inline-flex font-bold underline" style={{ color: TEMA_PUBLICO.verde }} href={"mailto:" + contato}>{contato}</a>
        </div>
      </PaginaPublica>
    </div>
  );
}
