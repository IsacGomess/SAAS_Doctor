import { Link } from 'react-router-dom';

const TermsOfUsePage = () => {
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
            <h1 style={{ margin: '8px 0 0', fontSize: '32px', color: '#111827' }}>Termos de Uso</h1>
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
            Estes Termos de Uso regulam o acesso e a utilização da plataforma <strong>Med1PE</strong>, disponibilizada por
            <strong> [RAZÃO SOCIAL/NOME EMPRESARIAL]</strong>, inscrita no CNPJ sob nº <strong>[CNPJ]</strong>, com sede em
            <strong> [ENDEREÇO COMPLETO]</strong>, doravante denominada <strong>Med1PE</strong>, <strong>Plataforma</strong> ou
            <strong>Prestadora</strong>.
          </p>

          <p>
            Ao criar uma conta, acessar ou utilizar a Plataforma, o Usuário declara ter lido, compreendido e aceitado estes
            Termos de Uso e a Política de Privacidade do Med1PE.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>1. Sobre o Med1PE</h2>
          <p>
            O Med1PE é uma plataforma tecnológica destinada a auxiliar profissionais e estabelecimentos de saúde na gestão de
            suas atividades, podendo disponibilizar, conforme o plano contratado, funcionalidades como cadastro e gestão de
            pacientes, agenda e gerenciamento de atendimentos, prontuário eletrônico, registros de evolução clínica,
            condutas, recomendações ao paciente, histórico clínico, prescrições e documentos clínicos, impressão e geração de
            documentos, gestão de profissionais e funcionários, relatórios administrativos e financeiros, autenticação e
            gerenciamento de contas e outras funcionalidades adicionadas futuramente.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>2. Natureza da Plataforma</h2>
          <p>
            O Med1PE é uma ferramenta tecnológica de apoio à gestão e ao registro de informações de saúde. A Plataforma não
            substitui avaliação profissional, diagnóstico, decisão clínica, julgamento profissional, atendimento presencial ou
            remoto realizado por profissional habilitado, atendimento de urgência ou emergência e cumprimento das normas dos
            respectivos conselhos profissionais.
          </p>
          <p>
            O Med1PE não realiza diagnóstico de pacientes e não determina autonomamente tratamentos. Toda decisão clínica,
            prescrição, recomendação, conduta ou informação registrada por meio da Plataforma permanece sob responsabilidade do
            profissional de saúde responsável.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>3. Usuários da Plataforma</h2>
          <p>
            Poderão utilizar o Med1PE profissionais, clínicas, consultórios, estabelecimentos de saúde e seus colaboradores
            devidamente autorizados. O usuário responsável pela contratação ou administração de uma clínica poderá conceder
            acesso a outros profissionais ou funcionários.
          </p>
          <p>
            Cada usuário deverá possuir credenciais próprias. É proibido compartilhar deliberadamente contas, senhas ou
            mecanismos de autenticação entre diferentes usuários.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>4. Cadastro e informações fornecidas</h2>
          <p>
            O Usuário compromete-se a fornecer informações verdadeiras, completas e atualizadas. O Med1PE poderá solicitar
            informações como nome, e-mail, telefone, profissão, número de registro profissional, informações relativas à
            clínica e credenciais de autenticação.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>5. Segurança da conta</h2>
          <p>
            O Usuário é responsável por manter suas credenciais confidenciais. Caso identifique acesso suspeito, perda de
            senha ou possível comprometimento de sua conta, deverá comunicar o Med1PE imediatamente pelo canal
            <strong> [E-MAIL DE SEGURANÇA/SUPORTE]</strong>.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>6. Pacientes e dados de saúde</h2>
          <p>
            A Plataforma permite que clínicas e profissionais registrem informações relacionadas aos seus pacientes, incluindo
            dados cadastrais, histórico clínico, diagnósticos, evolução, condutas, prescrições, recomendações e observações.
          </p>
          <p>
            Tais dados podem constituir dados pessoais sensíveis nos termos da LGPD. A clínica ou profissional que determina a
            finalidade e os meios essenciais do tratamento dos dados do paciente atua, em regra, como Controlador. Quando o
            Med1PE realiza o armazenamento ou processamento dessas informações conforme instruções da clínica ou profissional,
            atua, em regra, como Operador.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>7. Responsabilidade da clínica e do profissional</h2>
          <p>
            O profissional ou estabelecimento de saúde deverá garantir que possui fundamento jurídico adequado para inserir e
            tratar dados dos pacientes na Plataforma. São de responsabilidade do Usuário, entre outros, a obtenção de
            consentimentos, a qualidade das informações inseridas e o cumprimento da legislação profissional e sanitária.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>8. Prontuários e registros clínicos</h2>
          <p>
            Os registros inseridos no prontuário devem refletir, de forma adequada, o atendimento realizado. O profissional é
            responsável pelo conteúdo que registra.
          </p>
          <p>
            O Med1PE poderá implementar mecanismos de preservação da integridade e rastreabilidade dos registros, como
            identificação do profissional, data e horário, histórico de ações, registros de auditoria e versionamento.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>9. Uso proibido</h2>
          <p>
            É proibido utilizar o Med1PE para acessar prontuário sem autorização, compartilhar credenciais, violar sigilo
            profissional, explorar vulnerabilidades, interferir no funcionamento da Plataforma, introduzir códigos maliciosos,
            falsificar registros profissionais ou utilizar dados de pacientes para finalidades incompatíveis com a legislação.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>10. Propriedade intelectual</h2>
          <p>
            O software, marca, interfaces, design, código, documentação e demais elementos desenvolvidos para o Med1PE
            pertencem aos seus respectivos titulares. A contratação concede ao Usuário licença limitada, revogável, não
            exclusiva e intransferível para uso da Plataforma conforme estes Termos.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>11. Suspensão e encerramento</h2>
          <p>
            O Med1PE poderá suspender ou encerrar contas em situações como violação destes Termos, fraude, uso ilegal,
            risco à segurança, tentativa de acesso não autorizado, ordem judicial ou administrativa ou inadimplemento.
          </p>

          <h2 style={{ fontSize: '22px', margin: '28px 0 12px', color: '#111827' }}>12. Legislação e contato</h2>
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Dúvidas poderão ser enviadas para:
            <strong> Med1PE / [RAZÃO SOCIAL]</strong>, CNPJ: <strong>[CNPJ]</strong>, e-mail:
            <strong> [E-MAIL DE SUPORTE]</strong>, endereço: <strong>[ENDEREÇO]</strong>.
          </p>

          <p style={{ marginTop: '24px', fontWeight: 700 }}>
            Ao utilizar a Plataforma, o Usuário declara que leu e compreendeu estes Termos de Uso.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUsePage;
