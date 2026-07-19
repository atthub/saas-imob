// Mapeamento central de ícones (lucide-react) usados na vitrine pública e no
// admin. A ideia é detectar o ícone certo a partir do NOME da característica
// (texto livre cadastrado pelo admin), sem depender de configuração manual.

import {
  BedDouble,
  BedSingle,
  Bed,
  Bath,
  Car,
  Waves,
  Flame,
  Trees,
  DoorOpen,
  WashingMachine,
  AirVent,
  Sofa,
  Shirt,
  PawPrint,
  Sun,
  ShieldCheck,
  PartyPopper,
  Dumbbell,
  Baby,
  Trophy,
  DoorClosed,
  ArrowUpDown,
  Ruler,
  Sparkles,
  Home,
  Tag,
  Key,
  Building2,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Music2,
  MessageSquare,
  PhoneCall,
} from "lucide-react";

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

const REGRAS_CARACTERISTICA = [
  { palavras: ["suite"], icone: BedDouble },
  { palavras: ["closet", "guarda-roupa", "guarda roupa"], icone: Shirt },
  { palavras: ["piscina"], icone: Waves },
  { palavras: ["churrasqueira"], icone: Flame },
  { palavras: ["quintal", "jardim"], icone: Trees },
  { palavras: ["varanda", "sacada"], icone: DoorOpen },
  { palavras: ["area de servico", "lavanderia"], icone: WashingMachine },
  { palavras: ["garagem", "vaga"], icone: Car },
  { palavras: ["ar condicionado"], icone: AirVent },
  { palavras: ["mobiliado", "mobilia"], icone: Sofa },
  { palavras: ["pet"], icone: PawPrint },
  { palavras: ["energia solar", "solar"], icone: Sun },
  { palavras: ["portaria", "seguranca"], icone: ShieldCheck },
  { palavras: ["salao de festas", "festa"], icone: PartyPopper },
  { palavras: ["academia", "fitness"], icone: Dumbbell },
  { palavras: ["playground", "infantil"], icone: Baby },
  { palavras: ["quadra", "poliesportiv"], icone: Trophy },
  { palavras: ["elevador"], icone: ArrowUpDown },
  { palavras: ["portao eletronico", "portao"], icone: DoorClosed }
];

export const ICONE_PADRAO_CARACTERISTICA = Sparkles;

export function iconeDaCaracteristica(nome: string) {
  const alvo = normalizar(nome);
  for (const regra of REGRAS_CARACTERISTICA) {
    if (regra.palavras.some((palavra) => alvo.includes(palavra))) {
      return regra.icone;
    }
  }
  return ICONE_PADRAO_CARACTERISTICA;
}

export const IconeQuartos = Bed;
export const IconeSuites = BedDouble;
export const IconeBanheiros = Bath;
export const IconeVagas = Car;
export const IconeArea = Ruler;
export const IconeBedSingle = BedSingle;

export const IconeMenuInicio = Home;
export const IconeMenuComprar = Tag;
export const IconeMenuAlugar = Key;
export const IconeMenuTodos = Building2;

export const IconeTelefone = Phone;
export const IconeWhatsapp = MessageCircle;
export const IconeEmail = Mail;
export const IconeEndereco = MapPin;

const REGRAS_REDE_SOCIAL = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Music2,
  whatsapp: MessageCircle
};

export function iconeDaRedeSocial(plataforma: string) {
  const alvo = normalizar(plataforma);
  return REGRAS_REDE_SOCIAL[alvo as keyof typeof REGRAS_REDE_SOCIAL] || Sparkles;
}

// ---------------------------------------------------------------------------
// Balão flutuante de WhatsApp (vitrine pública) — opções de ícone
// selecionáveis no painel administrativo (Configurações).
// ---------------------------------------------------------------------------

// Logo oficial do WhatsApp não existe no lucide-react (lucide é só contorno),
// então desenhamos um SVG simples próprio para essa opção específica.
export function LogoWhatsapp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.149-.149.347-.397.521-.595.174-.198.232-.347.347-.595.116-.246.058-.453-.04-.595-.099-.149-.768-1.852-1.04-2.532-.27-.667-.546-.576-.768-.586-.198-.01-.43-.012-.66-.012-.236 0-.59.087-.83.32-.24.235-.92.9-.92 2.195 0 1.296.94 2.553 1.07 2.726.13.174 1.847 2.825 4.485 3.961 2.638 1.137 2.638.758 3.117.71.478-.05 1.554-.635 1.776-1.247.222-.611.222-1.135.155-1.246-.067-.111-.272-.198-.57-.346zM12.052 21.6h-.005a9.546 9.546 0 01-4.868-1.333l-.349-.21-3.622.96.97-3.536-.227-.362a9.546 9.546 0 01-1.462-5.084c.001-5.288 4.31-9.59 9.583-9.59 2.56 0 4.97 1 6.776 2.811a9.55 9.55 0 012.804 6.79c-.002 5.288-4.31 9.554-9.6 9.554zm8.16-17.834A11.473 11.473 0 0012.052 0C5.65 0 .463 5.184.46 11.554a11.5 11.5 0 001.741 6.085L0 24l6.59-2.115a11.6 11.6 0 005.46 1.39h.005c6.4 0 11.587-5.184 11.59-11.554a11.477 11.477 0 00-3.433-8.155z" />
    </svg>
  );
}

export const OPCOES_ICONE_WHATSAPP = {
  whatsapp: { label: "WhatsApp", Icone: LogoWhatsapp },
  "message-circle": { label: "Balão de fala", Icone: MessageCircle },
  "message-square": { label: "Caixa de mensagem", Icone: MessageSquare },
  phone: { label: "Telefone", Icone: PhoneCall }
} as const;

export type ChaveIconeWhatsapp = keyof typeof OPCOES_ICONE_WHATSAPP;

export function iconeBotaoWhatsapp(chave: string) {
  return (OPCOES_ICONE_WHATSAPP[chave as ChaveIconeWhatsapp] || OPCOES_ICONE_WHATSAPP.whatsapp).Icone;
}
