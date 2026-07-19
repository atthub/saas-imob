// Parser bem pequeno e só para o que precisamos: o plugin Classified Listing
// guarda a ordem das fotos da galeria (`_rtcl_attachments_order`) no formato
// de array serializado do PHP, por exemplo:
//   a:3:{i:0;i:2752;i:1;i:2750;i:2;i:2900;}
// Isso representa um array PHP com 3 itens, nas posições 0/1/2, com os
// valores (IDs de attachment) 2752, 2750 e 2900, nessa ordem.
//
// Não precisamos de um unserialize genérico (nem strings/objetos) — só de
// arrays de inteiros, então este parser cobre apenas esse caso e ignora
// (retorna []) qualquer formato inesperado, em vez de lançar erro — um
// anúncio com esse campo corrompido não deve travar a importação dos outros.
// Parser para o formato "images" do Classified Listing Pro (versão mais nova):
//   a:26:{i:0;a:6:{s:3:"uid";s:5:"34356";s:6:"status";...};...}
// Extrai todos os UIDs (IDs de attachment) na ordem em que aparecem.
export function extrairUidsDeImagesWp(valor: string | null | undefined): number[] {
  if (!valor) return [];
  const regex = /s:3:"uid";s:\d+:"(\d+)"/g;
  const ids: number[] = [];
  let match: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(valor)) !== null) {
    const id = Number(match[1]);
    if (Number.isFinite(id)) ids.push(id);
  }
  return ids;
}

export function extrairIdsDeArrayPhpSerializado(valor: string | null | undefined): number[] {
  if (!valor) return [];

  const ids: number[] = [];
  // Casa cada par "i:<posição>;i:<valor>;" e extrai o segundo número (valor).
  const regex = /i:\d+;i:(\d+);/g;
  let match: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(valor)) !== null) {
    const id = Number(match[1]);
    if (Number.isFinite(id)) ids.push(id);
  }
  return ids;
}
