import { ScrollView, View } from 'react-native';
import { SimpleHead } from '@/components/AppShell';
import { Box, Card, Txt } from '@/components/ui';
import { useColors } from '@/lib/theme';

/* Dados da empresa: configure no .env (veja .env.example). */
const EMPRESA = {
  nome: process.env.EXPO_PUBLIC_EMPRESA_NOME,
  cnpj: process.env.EXPO_PUBLIC_EMPRESA_CNPJ,
  endereco: process.env.EXPO_PUBLIC_EMPRESA_ENDERECO,
  suporte: process.env.EXPO_PUBLIC_EMAIL_SUPORTE,
  privacidade: process.env.EXPO_PUBLIC_EMAIL_PRIVACIDADE || process.env.EXPO_PUBLIC_EMAIL_SUPORTE,
};
const faltaDado = !EMPRESA.nome || !EMPRESA.cnpj || !EMPRESA.suporte;

function H({ children }: { children: string }) {
  return <Txt k="b" style={{ fontSize: 15, marginTop: 8 }}>{children}</Txt>;
}
function P({ children }: { children: string }) {
  return <Txt style={{ lineHeight: 21 }}>{children}</Txt>;
}
function Li({ children }: { children: string }) {
  return <Txt style={{ lineHeight: 21, paddingLeft: 8 }}>{`•  ${children}`}</Txt>;
}

export default function Termos() {
  const c = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: c.surface2 }}>
      <SimpleHead title="Termos e privacidade" back="/" />
      <ScrollView contentContainerStyle={{ padding: 14, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
        <Card style={{ gap: 6 }}>
          {faltaDado && <Box tone="err">Dados da empresa não configurados. Preencha as variáveis EXPO_PUBLIC_EMPRESA_* e EXPO_PUBLIC_EMAIL_* antes de publicar, e revise este texto com um advogado.</Box>}
          <H>1. Quem somos</H>
          <P>O DistribPontos é uma plataforma que conecta clientes a distribuidoras parceiras para pedidos e programa de pontos. Cada distribuidora é responsável pelos produtos, preços, entregas, notas fiscais e prêmios que oferece.</P>
          <H>2. Programa de pontos</H>
          <Li>Os pontos são pessoais, ligados ao CPF, e valem somente na distribuidora onde foram ganhos.</Li>
          <Li>Não podem ser vendidos, transferidos nem trocados por dinheiro.</Li>
          <Li>Vencem no prazo informado por cada distribuidora (padrão: 12 meses).</Li>
          <Li>Lançamentos indevidos ou compras canceladas podem ter os pontos estornados.</Li>
          <H>3. Dados que coletamos</H>
          <Li>CPF, nome, celular e, se você quiser, e-mail.</Li>
          <Li>Endereço de entrega informado em cada pedido.</Li>
          <Li>Histórico de compras no app e nas lojas físicas em que você informar o CPF.</Li>
          <H>4. Para que usamos</H>
          <Li>Identificar você, processar e entregar pedidos e calcular pontos (execução do contrato).</Li>
          <Li>Prevenir fraudes, como códigos de confirmação no balcão (legítimo interesse).</Li>
          <Li>Enviar ofertas, somente com seu consentimento, que você pode retirar no Perfil.</Li>
          <H>5. Com quem compartilhamos</H>
          <P>Somente com a distribuidora em que você compra, que vê seu nome, celular e endereço do pedido, com o CPF parcialmente mascarado. Pagamentos Pix são processados pelo Mercado Pago. Não vendemos seus dados.</P>
          <H>6. Seus direitos</H>
          <P>{`Você pode pedir cópia, correção ou exclusão dos seus dados em Perfil › Privacidade, ou pelo e-mail do encarregado de dados: ${EMPRESA.privacidade ?? '[e-mail do encarregado]'}. Respondemos em até 15 dias.`}</P>
          <H>7. Contato</H>
          <P>{`${EMPRESA.nome ?? '[Razão social]'} · CNPJ ${EMPRESA.cnpj ?? '[número]'}${EMPRESA.endereco ? ` · ${EMPRESA.endereco}` : ''} · ${EMPRESA.suporte ?? '[e-mail de suporte]'}`}</P>
        </Card>
      </ScrollView>
    </View>
  );
}
