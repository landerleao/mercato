/* Mercato — conexão com o Firebase
   Firebase → Configurações do projeto → Seus apps → app da Web → "Configuração do SDK".
   Esses dados são públicos por natureza (ficam no navegador de todo mundo): a segurança
   vem das regras do Firestore (firestore.rules), não deles.
   Deixe FIREBASE = null para usar só no aparelho / modo demonstração. */
export const FIREBASE = {
  apiKey: 'AIzaSyAOkaGnus9Ea5k6pHbmDdw2KAhtTwQPPa8',
  authDomain: 'mercato-27840.firebaseapp.com',
  projectId: 'mercato-27840',
  storageBucket: 'mercato-27840.firebasestorage.app',
  messagingSenderId: '796847921275',
  appId: '1:796847921275:web:9649149f72f17487aaeade',
};
