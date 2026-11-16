/* Mercato — conexão com o Firebase
   Firebase → Configurações do projeto → Seus apps → app da Web → "Configuração do SDK".
   Esses dados são públicos por natureza (ficam no navegador de todo mundo): a segurança
   vem das regras do Firestore (firestore.rules), não deles.
   Deixe FIREBASE = null para usar só no aparelho / modo demonstração. */
export const FIREBASE = null;
