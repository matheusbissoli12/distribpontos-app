/**
 * Configuração do app. Preencha os valores entre aspas abaixo e rode `npx expo start`.
 * Não precisa criar arquivo .env. Se existir um .env, os valores dele têm prioridade.
 *
 * Tudo aqui é público e pode ficar dentro do app (a chave "anon" do Supabase foi feita para isso).
 * NUNCA coloque aqui a chave service_role do Supabase: ela é secreta e só vai na Vercel.
 */
const CONFIG = {
  /** Supabase › Project Settings › API › Project URL (ex.: https://abcd1234.supabase.co) */
  supabaseUrl: '',
  /** Supabase › Project Settings › API › anon public */
  supabaseAnonKey: '',
  /** Endereço do site publicado na Vercel, sem barra no final (ex.: https://distribpontos.vercel.app) */
  apiUrl: '',

  /** Dados da empresa, exibidos em Termos e privacidade */
  empresaNome: '',
  empresaCnpj: '',
  empresaEndereco: '',
  emailSuporte: '',
  emailPrivacidade: '',
};

/* O Expo só troca process.env.EXPO_PUBLIC_* quando o nome aparece escrito por extenso, por isso a lista abaixo. */
const pick = (env: string | undefined, fixo: string) => (env && env.trim()) || fixo;

export const SUPABASE_URL = pick(process.env.EXPO_PUBLIC_SUPABASE_URL, CONFIG.supabaseUrl);
export const SUPABASE_ANON_KEY = pick(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY, CONFIG.supabaseAnonKey);
export const API_URL = pick(process.env.EXPO_PUBLIC_API_URL, CONFIG.apiUrl).replace(/\/$/, '');
export const EMPRESA = {
  nome: pick(process.env.EXPO_PUBLIC_EMPRESA_NOME, CONFIG.empresaNome) || undefined,
  cnpj: pick(process.env.EXPO_PUBLIC_EMPRESA_CNPJ, CONFIG.empresaCnpj) || undefined,
  endereco: pick(process.env.EXPO_PUBLIC_EMPRESA_ENDERECO, CONFIG.empresaEndereco) || undefined,
  suporte: pick(process.env.EXPO_PUBLIC_EMAIL_SUPORTE, CONFIG.emailSuporte) || undefined,
  privacidade:
    pick(process.env.EXPO_PUBLIC_EMAIL_PRIVACIDADE, CONFIG.emailPrivacidade) ||
    pick(process.env.EXPO_PUBLIC_EMAIL_SUPORTE, CONFIG.emailSuporte) ||
    undefined,
};
