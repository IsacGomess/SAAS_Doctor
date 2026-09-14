import { Link } from 'react-router-dom';

const PrivacyPolicyPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F7F9',
      color: '#1F2937',
      padding: '40px 20px',
      fontFamily: 'Segoe UI, sans-serif'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', background: '#fff', borderRadius: '18px', padding: '32px 24px 48px', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, color: '#1E6B65', fontWeight: 700, letterSpacing: '0.08em', fontSize: '12px', textTransform: 'uppercase' }}>
              Med1PE
            </p>
            <h1 style={{ margin: '8px 0 0', fontSize: '32px', color: '#111827' }}>POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS — MED1PE</h1>
          </div>
          <Link
            to="/login"
            style={{
              textDecoration: 'none',
              background: '#1E6B65',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Voltar ao login
          </Link>
        </div>

        <p style={{ color: '#4B5563', fontSize: '14px', marginBottom: '24px' }}>
          <strong>Última atualização:</strong> 14 de setembro de 2026
        </p>

        <div style={{ lineHeight: 1.8, fontSize: '15px' }}>
          <p>
            Esta Política explica como o <strong>Med1PE</strong>, disponibilizado por <strong>[RAZÃO SOCIAL/NOME EMPRESARIAL]</strong>,
            inscrita no CNPJ sob nº <strong>[CNPJ]</strong>, trata dados pessoais durante a utilização de sua plataforma de gestão de
            clínicas e atendimentos em saúde.
          </p>

          <p>
            A proteção dos dados pessoais, especialmente das informações relacionadas à saúde, constitui parte essencial do
            funcionamento do Med1PE.
          </p>

          <p>
            Esta Política deve ser lida juntamente com os Termos de Uso.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>1. Legislação aplicável</h2>
          <p>O tratamento de dados pessoais realizado no contexto da Plataforma observará, conforme aplicável:</p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD);</li>
            <li>Lei nº 12.965/2014 — Marco Civil da Internet;</li>
            <li>Lei nº 13.787/2018 — prontuários de pacientes;</li>
            <li>Lei nº 15.378/2026 — Estatuto dos Direitos do Paciente;</li>
            <li>regulamentações da Autoridade Nacional de Proteção de Dados — ANPD;</li>
            <li>demais normas sanitárias, profissionais e setoriais aplicáveis.</li>
          </ul>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>2. Quem são os agentes de tratamento?</h2>
          <p>A função exercida pelo Med1PE depende da operação realizada.</p>

          <h3 style={{ fontSize: '18px', margin: '20px 0 10px', color: '#111827' }}>2.1 Dados inseridos pela clínica ou profissional</h3>
          <p>
            Em relação aos dados de pacientes inseridos para prestação de serviços de saúde, a clínica ou profissional que
            determina a finalidade e os elementos essenciais do tratamento atua, em regra, como <strong>Controlador</strong>.
          </p>
          <p>
            Nestas situações, o Med1PE atua predominantemente como <strong>Operador</strong>, realizando atividades de
            armazenamento, organização, processamento e disponibilização das informações conforme as instruções do Controlador.
          </p>

          <h3 style={{ fontSize: '18px', margin: '20px 0 10px', color: '#111827' }}>2.2 Dados tratados diretamente pelo Med1PE</h3>
          <p>
            O Med1PE poderá atuar como <strong>Controlador</strong> em relação a determinadas operações necessárias à
            administração da própria Plataforma, incluindo:
          </p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>criação e administração de contas;</li>
            <li>segurança;</li>
            <li>autenticação;</li>
            <li>prevenção a fraude;</li>
            <li>suporte;</li>
            <li>relacionamento contratual;</li>
            <li>cobrança;</li>
            <li>registros técnicos;</li>
            <li>cumprimento de obrigações legais.</li>
          </ul>
          <p>A classificação poderá variar conforme as circunstâncias específicas do tratamento.</p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>3. Dados tratados</h2>
          <p>Dependendo da utilização da Plataforma, poderemos tratar diferentes categorias de dados.</p>

          <h3 style={{ fontSize: '18px', margin: '20px 0 10px', color: '#111827' }}>3.1 Dados de profissionais e usuários</h3>
          <p>Podem incluir:</p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>nome;</li>
            <li>e-mail;</li>
            <li>telefone;</li>
            <li>identificação da clínica;</li>
            <li>profissão;</li>
            <li>registro profissional;</li>
            <li>cargo e perfil de acesso;</li>
            <li>credenciais e informações de autenticação;</li>
            <li>informações de utilização da Plataforma.</li>
          </ul>

          <h3 style={{ fontSize: '18px', margin: '20px 0 10px', color: '#111827' }}>3.2 Dados da clínica</h3>
          <p>Podem incluir:</p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>nome empresarial;</li>
            <li>nome fantasia;</li>
            <li>dados cadastrais;</li>
            <li>endereço;</li>
            <li>contato;</li>
            <li>informações administrativas;</li>
            <li>usuários vinculados;</li>
            <li>informações relacionadas ao plano contratado.</li>
          </ul>

          <h3 style={{ fontSize: '18px', margin: '20px 0 10px', color: '#111827' }}>3.3 Dados dos pacientes</h3>
          <p>A clínica ou profissional poderá inserir:</p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>nome;</li>
            <li>CPF e outros identificadores;</li>
            <li>data de nascimento ou idade;</li>
            <li>telefone e outros meios de contato;</li>
            <li>informações de atendimento;</li>
            <li>histórico clínico;</li>
            <li>diagnósticos;</li>
            <li>evolução;</li>
            <li>condutas realizadas;</li>
            <li>recomendações;</li>
            <li>prescrições;</li>
            <li>medicamentos;</li>
            <li>comorbidades;</li>
            <li>observações;</li>
            <li>documentos clínicos;</li>
            <li>demais informações necessárias à assistência.</li>
          </ul>
          <p>
            Informações relacionadas à saúde são classificadas pela LGPD como <strong>dados pessoais sensíveis</strong>.
          </p>

          <h3 style={{ fontSize: '18px', margin: '20px 0 10px', color: '#111827' }}>3.4 Dados técnicos</h3>
          <p>Durante o uso da Plataforma poderão ser tratados:</p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>endereço IP;</li>
            <li>data e horário de acesso;</li>
            <li>registros de acesso;</li>
            <li>informações de sessão;</li>
            <li>eventos de autenticação;</li>
            <li>tipo de navegador;</li>
            <li>informações técnicas necessárias à segurança e funcionamento da aplicação.</li>
          </ul>

          <h3 style={{ fontSize: '18px', margin: '20px 0 10px', color: '#111827' }}>3.5 Dados financeiros</h3>
          <p>Quando serviços pagos forem disponibilizados, poderão ser tratados dados referentes a:</p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>plano contratado;</li>
            <li>status de pagamento;</li>
            <li>cobranças;</li>
            <li>documentos fiscais;</li>
            <li>identificação do responsável pelo pagamento.</li>
          </ul>
          <p>
            Dados completos de cartão poderão ser processados diretamente pelo provedor de pagamento, quando adotado, sem
            necessidade de armazenamento pelo Med1PE.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>4. Como obtemos os dados</h2>
          <p>Os dados poderão ser obtidos:</p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>diretamente do Usuário;</li>
            <li>pelo administrador da clínica;</li>
            <li>pelo profissional durante atendimento;</li>
            <li>automaticamente durante o uso da Plataforma;</li>
            <li>por integrações autorizadas;</li>
            <li>por prestadores necessários ao funcionamento do serviço.</li>
          </ul>
          <p>Dados clínicos dos pacientes são normalmente inseridos pelos profissionais ou clínicas responsáveis pelo atendimento.</p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>5. Finalidades do tratamento</h2>
          <p>Os dados podem ser tratados para:</p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>fornecer as funcionalidades da Plataforma;</li>
            <li>autenticar usuários;</li>
            <li>gerenciar clínicas e equipes;</li>
            <li>manter agendas;</li>
            <li>registrar atendimentos;</li>
            <li>criar e preservar prontuários;</li>
            <li>registrar evoluções;</li>
            <li>registrar condutas;</li>
            <li>registrar recomendações;</li>
            <li>criar documentos e prescrições;</li>
            <li>disponibilizar histórico clínico;</li>
            <li>gerar relatórios;</li>
            <li>prestar suporte;</li>
            <li>prevenir fraude;</li>
            <li>proteger contas e infraestrutura;</li>
            <li>identificar incidentes;</li>
            <li>cumprir obrigações legais;</li>
            <li>exercer direitos em processos;</li>
            <li>enviar comunicações relacionadas ao serviço;</li>
            <li>recuperar senhas;</li>
            <li>manter registros técnicos e de auditoria.</li>
          </ul>
          <p>
            Não utilizaremos dados clínicos para finalidades incompatíveis com a prestação dos serviços contratados sem
            fundamento jurídico adequado.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>6. Bases legais</h2>
          <p>
            As bases jurídicas aplicáveis dependem do tipo de dado, da finalidade e do papel exercido por cada agente de
            tratamento.
          </p>
          <p>Para dados pessoais comuns, poderão ser utilizadas, conforme o caso:</p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>execução de contrato ou procedimentos preliminares;</li>
            <li>cumprimento de obrigação legal ou regulatória;</li>
            <li>exercício regular de direitos;</li>
            <li>legítimo interesse, após avaliação de aplicabilidade;</li>
            <li>proteção do crédito;</li>
            <li>consentimento, quando necessário.</li>
          </ul>
          <p>Para dados pessoais sensíveis relacionados à saúde, o tratamento deverá estar enquadrado em uma das hipóteses previstas no artigo 11 da LGPD, que poderá incluir, conforme o caso:</p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>cumprimento de obrigação legal ou regulatória;</li>
            <li>exercício regular de direitos;</li>
            <li>proteção da vida ou da incolumidade física;</li>
            <li>tutela da saúde por profissionais ou serviços de saúde;</li>
            <li>prevenção à fraude e segurança em processos de autenticação;</li>
            <li>consentimento específico e destacado, quando essa for a base adequada.</li>
          </ul>
          <p>O consentimento não será apresentado como fundamento quando outra hipótese legal for mais apropriada.</p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>7. Dados clínicos e prontuário</h2>
          <p>O Med1PE reconhece a elevada sensibilidade das informações constantes de prontuários.</p>
          <p>Esses dados deverão ser acessíveis somente às pessoas devidamente autorizadas.</p>
          <p>O Med1PE adotará controles destinados a restringir o acesso conforme:</p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>clínica;</li>
            <li>usuário;</li>
            <li>função;</li>
            <li>perfil;</li>
            <li>permissões disponíveis na Plataforma.</li>
          </ul>
          <p>A clínica é responsável por determinar quais integrantes de sua organização podem acessar os dados dos pacientes.</p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>8. Sigilo profissional</h2>
          <p>O uso do Med1PE não altera as obrigações de sigilo próprias dos profissionais de saúde.</p>
          <p>Profissionais não devem divulgar ou compartilhar informações de pacientes com pessoas não autorizadas.</p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>9. Recomendações e documentos compartilhados</h2>
          <p>
            Recomendações, orientações, condutas ou documentos vinculados a determinado paciente continuam sendo dados pessoais
            e poderão constituir dados de saúde mesmo quando o nome do paciente não constar diretamente no texto.
          </p>
          <p>Quando funcionalidades de compartilhamento forem disponibilizadas, medidas adicionais poderão ser adotadas, como:</p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>links temporários;</li>
            <li>tokens aleatórios;</li>
            <li>prazos de expiração;</li>
            <li>registros de envio;</li>
            <li>revogação de acesso;</li>
            <li>autenticação adicional.</li>
          </ul>
          <p>O conteúdo clínico não deverá ser enviado para terceiros além do necessário à finalidade pretendida.</p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>10. Cookies e armazenamento no navegador</h2>
          <p>O Med1PE poderá utilizar cookies e mecanismos equivalentes necessários ao funcionamento da Plataforma.</p>
          <p>Entre eles podem estar mecanismos destinados a:</p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>autenticação;</li>
            <li>manutenção da sessão;</li>
            <li>segurança;</li>
            <li>prevenção a acessos indevidos;</li>
            <li>preferências da interface.</li>
          </ul>
          <p>
            Credenciais de autenticação sensíveis deverão utilizar os mecanismos de segurança implementados pela Plataforma.
          </p>
          <p>
            Algumas informações não sensíveis da interface poderão ser mantidas temporariamente no armazenamento local do
            navegador para melhorar a experiência de utilização.
          </p>
          <p>
            O Med1PE não deverá armazenar dados clínicos completos do paciente no armazenamento local do navegador como
            substituto do banco de dados seguro da Plataforma.
          </p>
          <p>
            Caso cookies analíticos, publicitários ou outras tecnologias não essenciais venham a ser implementados futuramente,
            esta Política e os mecanismos de consentimento serão atualizados quando exigido.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>11. Compartilhamento de dados</h2>
          <p>O Med1PE não comercializa prontuários ou dados de saúde.</p>
          <p>Dados poderão ser compartilhados somente quando necessário, por exemplo:</p>

          <h3 style={{ fontSize: '18px', margin: '20px 0 10px', color: '#111827' }}>11.1 Com fornecedores tecnológicos</h3>
          <p>Fornecedores poderão auxiliar em:</p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>hospedagem;</li>
            <li>banco de dados;</li>
            <li>infraestrutura de rede;</li>
            <li>segurança;</li>
            <li>distribuição de conteúdo;</li>
            <li>envio de e-mail;</li>
            <li>monitoramento;</li>
            <li>pagamentos.</li>
          </ul>
          <p>
            Atualmente, a infraestrutura poderá envolver prestadores como <strong>Cloudflare, Render, MongoDB Atlas e Resend</strong>,
            de acordo com a configuração utilizada pelo serviço.
          </p>
          <p>Essa relação poderá ser alterada conforme evolução da arquitetura.</p>

          <h3 style={{ fontSize: '18px', margin: '20px 0 10px', color: '#111827' }}>11.2 Com autoridades</h3>
          <p>Informações poderão ser disponibilizadas quando houver obrigação legal, regulatória ou determinação válida de autoridade competente.</p>

          <h3 style={{ fontSize: '18px', margin: '20px 0 10px', color: '#111827' }}>11.3 Em operações societárias</h3>
          <p>
            Em caso de fusão, aquisição, reorganização ou venda de ativos, dados poderão integrar a operação, observadas as
            obrigações legais de confidencialidade e proteção.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>12. Transferência internacional de dados</h2>
          <p>
            Alguns fornecedores tecnológicos utilizados pelo Med1PE possuem infraestrutura distribuída globalmente.
          </p>
          <p>
            Consequentemente, determinadas operações poderão envolver armazenamento, processamento ou acesso a dados fora do
            Brasil.
          </p>
          <p>Quando caracterizada transferência internacional de dados pessoais, deverão ser observados:</p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>LGPD;</li>
            <li>Resolução CD/ANPD nº 19/2024;</li>
            <li>mecanismos legalmente válidos de transferência;</li>
            <li>finalidade específica;</li>
            <li>minimização dos dados;</li>
            <li>medidas de proteção adequadas.</li>
          </ul>
          <p>
            Informações adicionais sobre transferências internacionais poderão ser disponibilizadas mediante solicitação,
            observados os segredos comercial e industrial.
          </p>
          <p>
            <strong>ANTES DA PUBLICAÇÃO:</strong> confirmar as regiões efetivamente utilizadas no MongoDB Atlas, Render,
            Cloudflare e demais fornecedores e documentar os países ou regiões relevantes.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>13. Retenção</h2>
          <p>Os dados serão conservados pelo período necessário às finalidades para as quais forem tratados e às obrigações legais aplicáveis.</p>

          <h3 style={{ fontSize: '18px', margin: '20px 0 10px', color: '#111827' }}>13.1 Prontuários</h3>
          <p>
            A retenção de prontuários observará as instruções do Controlador e a legislação aplicável.
          </p>
          <p>
            A Lei nº 13.787/2018 estabelece regras próprias para a guarda de prontuários e prevê, nas situações por ela
            disciplinadas, possibilidade de eliminação após prazo mínimo de 20 anos contado do último registro, sem prejuízo de
            prazos diferenciados previstos em outras normas.
          </p>
          <p>
            O encerramento do contrato com o Med1PE não elimina as obrigações legais da clínica relacionadas à conservação dos
            prontuários.
          </p>

          <h3 style={{ fontSize: '18px', margin: '20px 0 10px', color: '#111827' }}>13.2 Registros de acesso à aplicação</h3>
          <p>
            Quando aplicável ao Med1PE como provedor de aplicação sujeito ao artigo 15 do Marco Civil da Internet, registros de
            acesso serão mantidos sob sigilo e em ambiente controlado e seguro pelo prazo legal mínimo de seis meses, salvo
            necessidade de conservação por prazo superior decorrente de obrigação ou determinação válida.
          </p>

          <h3 style={{ fontSize: '18px', margin: '20px 0 10px', color: '#111827' }}>13.3 Dados de conta</h3>
          <p>
            Dados de usuários poderão ser mantidos durante a relação contratual e posteriormente pelo período necessário ao
            cumprimento de obrigações legais, resolução de disputas e exercício regular de direitos.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>14. Exclusão de dados</h2>
          <p>O pedido de exclusão não significa que toda informação poderá ser imediatamente apagada.</p>
          <p>Dados poderão ser conservados quando houver fundamento jurídico que justifique sua manutenção, inclusive:</p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>obrigação legal;</li>
            <li>obrigação regulatória;</li>
            <li>preservação de prontuários;</li>
            <li>exercício regular de direitos;</li>
            <li>ordem judicial;</li>
            <li>prevenção ou investigação de fraude.</li>
          </ul>
          <p>Quando não existir fundamento para conservação, os dados poderão ser eliminados ou anonimizados.</p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>15. Direitos dos titulares</h2>
          <p>Nos termos da LGPD e demais normas aplicáveis, o titular poderá solicitar, conforme a situação:</p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>confirmação da existência de tratamento;</li>
            <li>acesso aos dados;</li>
            <li>correção de dados incompletos ou desatualizados;</li>
            <li>anonimização, bloqueio ou eliminação de dados excessivos ou tratados irregularmente;</li>
            <li>portabilidade quando regulamentada e aplicável;</li>
            <li>informações sobre compartilhamentos;</li>
            <li>eliminação de dados tratados com base no consentimento, observadas exceções legais;</li>
            <li>revogação do consentimento;</li>
            <li>oposição ao tratamento nas hipóteses legais;</li>
            <li>informações acerca das consequências da negativa de consentimento;</li>
            <li>revisão das decisões exclusivamente automatizadas, quando aplicável.</li>
          </ul>
          <p>Os direitos não são absolutos e poderão ser limitados quando houver obrigação legal de manutenção das informações.</p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>16. Direito do paciente ao prontuário</h2>
          <p>O paciente possui direitos específicos relativos às informações referentes à sua saúde.</p>
          <p>
            Pedidos de acesso, cópia ou retificação referentes ao conteúdo clínico deverão normalmente ser direcionados à
            clínica ou ao profissional que atua como Controlador dessas informações.
          </p>
          <p>
            O Med1PE cooperará com o Controlador para viabilizar o atendimento às solicitações quando necessário.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>17. Como exercer direitos</h2>
          <p>Quando o Med1PE atuar como Controlador, solicitações poderão ser enviadas para:</p>
          <p><strong>[E-MAIL DE PRIVACIDADE / ENCARREGADO]</strong></p>
          <p>
            Poderemos solicitar informações necessárias à confirmação da identidade do solicitante antes de disponibilizar dados
            pessoais.
          </p>
          <p>
            Quando o pedido for relacionado a prontuário controlado por uma clínica, poderemos orientar o titular a entrar em
            contato diretamente com o respectivo estabelecimento ou auxiliar no encaminhamento adequado.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>18. Crianças e adolescentes</h2>
          <p>
            A Plataforma poderá conter informações de pacientes menores de idade quando cadastradas por profissionais ou
            estabelecimentos de saúde.
          </p>
          <p>
            O tratamento deverá observar o Estatuto da Criança e do Adolescente, LGPD, Estatuto dos Direitos do Paciente e
            demais normas aplicáveis.
          </p>
          <p>
            A clínica ou profissional responsável deverá verificar os requisitos relacionados ao representante legal quando
            necessários.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>19. Segurança</h2>
          <p>Dados de saúde demandam nível elevado de proteção.</p>
          <p>
            O Med1PE adota ou desenvolverá, conforme sua arquitetura e evolução, medidas técnicas e administrativas compatíveis
            com os riscos das operações, incluindo controles como:
          </p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>autenticação;</li>
            <li>autorização de acesso;</li>
            <li>isolamento entre clínicas;</li>
            <li>limitação de tentativas de autenticação;</li>
            <li>proteção de sessões;</li>
            <li>comunicação por HTTPS;</li>
            <li>proteção de credenciais;</li>
            <li>registros de eventos relevantes;</li>
            <li>atualização de dependências;</li>
            <li>gerenciamento de vulnerabilidades;</li>
            <li>políticas de acesso;</li>
            <li>mecanismos de recuperação e continuidade quando implementados.</li>
          </ul>
          <p>Nenhum sistema pode garantir segurança absoluta.</p>
          <p>
            <strong>ANTES DA PUBLICAÇÃO:</strong> documentar formalmente e confirmar quais mecanismos de backup, criptografia em
            repouso, retenção de logs e recuperação de desastre estão efetivamente ativos. Não publicar uma afirmação técnica
            que ainda não corresponda à infraestrutura real.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>20. Incidentes de segurança</h2>
          <p>Caso ocorra incidente envolvendo dados pessoais, serão adotadas medidas para:</p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>identificar o evento;</li>
            <li>conter seus efeitos;</li>
            <li>investigar sua causa;</li>
            <li>avaliar os dados afetados;</li>
            <li>corrigir vulnerabilidades;</li>
            <li>reduzir possíveis danos.</li>
          </ul>
          <p>
            Quando o Med1PE atuar como Operador, comunicará o incidente ao Controlador conforme as obrigações contratuais e
            legais aplicáveis.
          </p>
          <p>
            Quando atuar como Controlador e o incidente puder ocasionar risco ou dano relevante aos titulares, as comunicações
            à ANPD e aos titulares serão realizadas de acordo com a legislação e regulamentação vigente.
          </p>
          <p>Os registros de incidentes serão mantidos conforme os prazos regulatórios aplicáveis.</p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>21. Decisões automatizadas e inteligência artificial</h2>
          <p>Na versão atual da Plataforma, as funcionalidades clínicas não devem substituir o julgamento do profissional de saúde.</p>
          <p>
            Caso recursos de inteligência artificial, análise automatizada ou tomada de decisão automatizada sejam introduzidos
            futuramente e envolvam dados pessoais, esta Política deverá ser atualizada previamente de acordo com as
            características do tratamento.
          </p>
          <p>
            Dados clínicos não deverão ser utilizados para treinamento de modelos externos de inteligência artificial sem
            definição prévia de fundamento jurídico, finalidade, riscos e salvaguardas adequadas.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>22. Marketing</h2>
          <p>Dados clínicos dos pacientes não serão utilizados pelo Med1PE para publicidade comportamental ou venda de anúncios.</p>
          <p>
            Comunicações comerciais destinadas às clínicas ou profissionais poderão ser enviadas conforme fundamento jurídico
            aplicável e deverão permitir oposição quando exigido.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>23. Recuperação de senha e comunicações</h2>
          <p>Para recuperação de acesso, o Med1PE poderá utilizar o endereço de e-mail cadastrado e fornecedores de envio de mensagens.</p>
          <p>Tokens de recuperação possuem finalidade limitada e deverão ter validade temporária.</p>
          <p>O Med1PE nunca deverá solicitar a senha atual do Usuário por e-mail.</p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>24. Links e serviços de terceiros</h2>
          <p>A Plataforma poderá apresentar links ou integrações com serviços externos.</p>
          <p>
            O tratamento realizado diretamente por esses terceiros será regido também por suas próprias políticas e termos.
          </p>
          <p>
            O Usuário deverá avaliar as condições do serviço externo antes de utilizá-lo para compartilhar informações clínicas.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>25. Encarregado pelo tratamento de dados</h2>
          <p>O canal de comunicação relacionado à proteção de dados é:</p>
          <p><strong>Encarregado/DPO:</strong> [NOME OU IDENTIFICAÇÃO DO ENCARREGADO]</p>
          <p><strong>E-mail:</strong> [E-MAIL DE PRIVACIDADE]</p>
          <p>
            Quando aplicável regulamentação diferenciada relativa à indicação do encarregado, serão observadas as regras da ANPD.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>26. Autoridade Nacional de Proteção de Dados</h2>
          <p>
            O titular poderá inicialmente exercer seus direitos diretamente perante o Controlador.
          </p>
          <p>
            Caso entenda que sua solicitação não foi adequadamente atendida, poderá utilizar os mecanismos disponibilizados pela
            Autoridade Nacional de Proteção de Dados — ANPD, observados os procedimentos legais aplicáveis.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>27. Alterações desta Política</h2>
          <p>Esta Política poderá ser atualizada em razão de:</p>
          <ul style={{ paddingLeft: '22px', margin: '12px 0' }}>
            <li>novas funcionalidades;</li>
            <li>alterações tecnológicas;</li>
            <li>mudanças de fornecedores;</li>
            <li>alteração de práticas de tratamento;</li>
            <li>mudanças legais ou regulatórias.</li>
          </ul>
          <p>
            A versão vigente permanecerá disponível na Plataforma com indicação da data de atualização.
          </p>
          <p>Alterações relevantes poderão ser comunicadas aos usuários por meios adicionais.</p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>28. Contato</h2>
          <p>Para assuntos relacionados à privacidade e proteção de dados:</p>
          <p><strong>[RAZÃO SOCIAL / NOME EMPRESARIAL]</strong></p>
          <p><strong>CNPJ:</strong> [CNPJ]</p>
          <p><strong>Endereço:</strong> [ENDEREÇO]</p>
          <p><strong>E-mail de privacidade:</strong> [E-MAIL]</p>
          <p><strong>E-mail de suporte:</strong> [E-MAIL]</p>

          <p style={{ marginTop: '24px', fontWeight: 700 }}>
            Esta Política busca assegurar transparência sobre o tratamento de dados realizado no contexto do Med1PE e deverá ser
            interpretada de acordo com a legislação brasileira aplicável.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
