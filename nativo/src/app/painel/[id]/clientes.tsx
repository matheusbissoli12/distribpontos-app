import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Row, usePanel, useWide } from '@/components/panel';
import { Box, Spinner, Tag, TierPill, Txt } from '@/components/ui';
import { sb } from '@/lib/supabase';
import { dataHora, num } from '@/lib/format';

type C = { cpf_mask: string; nome: string | null; cadastrado: boolean; saldo: number; acumulado_12m: number; ultima_compra: string | null };

export default function Clientes() {
  const wide = useWide();
  const { d } = usePanel();
  const [l, setL] = useState<C[] | null>(null);
  useEffect(() => { sb().rpc('dist_customers', { p_dist: d.id }).then(({ data }) => setL((data as C[]) ?? [])); }, [d.id]);
  if (!l) return <Spinner />;
  const nivel = (a: number) => (a >= d.nivel_ouro ? 'Ouro' : a >= d.nivel_prata ? 'Prata' : 'Bronze');
  return (
    <>
      {l.length === 0 && <Txt k="sub">Nenhum cliente com pontos ainda.</Txt>}
      {l.map((c, i) => (
        <Row key={i}>
          <View style={{ flex: wide ? 1.5 : undefined, minWidth: 160 }}>
            <Txt k="b">{c.nome ?? 'Aguardando cadastro'}</Txt>
            <Txt k="mono" style={{ color: undefined }}>{c.cpf_mask}</Txt>
          </View>
          <TierPill nivel={nivel(c.acumulado_12m)} />
          <View style={{ minWidth: 90 }}><Txt k="mini">Saldo</Txt><Txt k="b">{num(c.saldo)}</Txt></View>
          <View style={{ minWidth: 90 }}><Txt k="mini">Acum. 12m</Txt><Txt k="b">{num(c.acumulado_12m)}</Txt></View>
          <View style={{ minWidth: 110 }}><Txt k="mini">Última compra</Txt><Txt>{c.ultima_compra ? dataHora(c.ultima_compra) : '—'}</Txt></View>
          {c.cadastrado ? <Tag text="App" tone="bl" /> : <Tag text="Só balcão" />}
        </Row>
      ))}
      <Box tone="note">O CPF aparece mascarado (LGPD). Clientes “só balcão” ganharam pontos no caixa mas ainda não baixaram o app: vale lembrar no atendimento.</Box>
    </>
  );
}
