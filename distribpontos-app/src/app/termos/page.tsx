import Link from 'next/link';

export const metadata = { title: 'Termos e privacidade · DistribPontos' };

export default function Termos() {
  return (
    <div className="shell">
      <header className="ahead" style={{ background: 'var(--primary)', color: 'var(--primary-ink)' }}>
        <div className="row"><div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Link className="back" href="/" aria-label="Voltar">‹</Link><div className="logo">Termos e privacidade</div></div></div>
      </header>
      <main className="scr">
        <div className="card legal">
          <p className="sub">Modelo inicial. Revise com um advogado e preencha os dados da sua empresa antes de publicar.</p>
          <h3>1. Quem somos</h3>
          <p>O DistribPontos é uma plataforma que conecta clientes a distribuidoras parceiras para pedidos e programa de pontos. Cada distribuidora é responsável pelos produtos, preços, entregas, notas fiscais e prêmios que oferece.</p>
          <h3>2. Programa de pontos</h3>
          <ul>
            <li>Os pontos são pessoais, ligados ao CPF, e valem somente na distribuidora onde foram ganhos.</li>
            <li>Não podem ser vendidos, transferidos nem trocados por dinheiro.</li>
            <li>Vencem no prazo informado por cada distribuidora (padrão: 12 meses).</li>
            <li>Lançamentos indevidos ou compras canceladas podem ter os pontos estornados.</li>
          </ul>
          <h3>3. Dados que coletamos</h3>
          <ul><li>CPF, nome, celular e, se você quiser, e-mail.</li><li>Endereço de entrega informado em cada pedido.</li><li>Histórico de compras no app e nas lojas físicas em que você informar o CPF.</li></ul>
          <h3>4. Para que usamos</h3>
          <ul><li>Identificar você, processar e entregar pedidos e calcular pontos (execução do contrato).</li><li>Prevenir fraudes, como códigos de confirmação no balcão (legítimo interesse).</li><li>Enviar ofertas, somente com seu consentimento, que você pode retirar no Perfil.</li></ul>
          <h3>5. Com quem compartilhamos</h3>
          <p>Somente com a distribuidora em que você compra, que vê seu nome, celular e endereço do pedido, com o CPF parcialmente mascarado. Pagamentos Pix são processados pelo Mercado Pago. Não vendemos seus dados.</p>
          <h3>6. Seus direitos</h3>
          <p>Você pode pedir cópia, correção ou exclusão dos seus dados em Perfil › Privacidade, ou pelo e-mail do encarregado de dados: [e-mail do encarregado]. Respondemos em até 15 dias.</p>
          <h3>7. Contato</h3>
          <p>[Razão social] · CNPJ [número] · [endereço] · [e-mail de suporte]</p>
        </div>
      </main>
    </div>
  );
}
