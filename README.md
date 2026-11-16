# mercato

**Compras organizadas. Vida mais leve.**

O Mercato é uma lista de compras compartilhada com a família, organizada pelos setores do mercado. Em vez de uma caixa de texto em branco, o app conduz um **passeio pelo mercado**: você passa por cada setor (Hortifrúti, Padaria, Açougue…) e toca no que está faltando. Assim, nada fica para trás.

![Painel no computador](prints/painel-escuro.png)
![Telas no celular](prints/celular.png)

## O que o app faz

- **Painel**: gasto no mês, itens faltando, setores do mercado com contagem, listas e gráfico de gastos por semana.
- **Passeio pelo mercado**: 9 setores na ordem de um mercado, com os "seus de sempre" no topo e mais de 130 itens prontos para tocar.
- **Escreva ou fale**: "2 kg de arroz, feijão e três latas de milho" vira 3 itens, cada um no setor certo, com a quantidade certa.
- **Modo compra**: marque o que foi para o carrinho, anote o preço e acompanhe o total e o progresso em tempo real.
- **Família**: todos na mesma lista. Quem pega um item aparece para os outros na hora.
- **Tema claro e escuro**, app instalável (iPhone, Mac e Android) e funcionamento offline.

## Modo demonstração

**App no ar:** [mercato-psi.vercel.app](https://mercato-psi.vercel.app)

Abra com `?demo` para ver uma família de exemplo (Ana, Lucas e Bia) com listas, compras e histórico fictícios:
[mercato-psi.vercel.app/?demo](https://mercato-psi.vercel.app/?demo)

## Tecnologia

- HTML, CSS e JavaScript puros (módulos ES), sem etapa de build
- PWA: `manifest.webmanifest` + `sw.js` (offline)
- Fontes: Plus Jakarta Sans, Inter e Outfit · ícones Tabler
- Firebase: login por e-mail e senha, casa da família com código de convite, Firestore em tempo real e regras de segurança por família
- Offline primeiro: tudo é salvo no aparelho e sincroniza quando a internet volta

## Configurar a nuvem (Firebase)

1. Crie um projeto no Firebase, ative **Authentication → E-mail/senha** e crie o **Firestore Database**.
2. Em **Firestore → Regras**, cole o conteúdo de `firestore.rules` e publique.
3. Registre um app da Web e cole a configuração em `js/config.js` (`FIREBASE = { apiKey, authDomain, projectId, … }`).
4. Em **Authentication → Configurações → Domínios autorizados**, adicione o domínio onde o app ficar publicado.
5. Sem configuração (`FIREBASE = null`), o app funciona só no aparelho e no modo demonstração.

## Rodar localmente

```bash
python3 -m http.server 8080
```

Depois abra `http://localhost:8080/?demo`.

## Estrutura

```
index.html            casca do app
css/app.css           identidade visual, temas e animações
js/app.js             telas e navegação
js/store.js           dados (salvos no aparelho)
js/nuvem.js           Firebase: conta, casa, tempo real e offline
js/config.js          configuração pública do Firebase
firestore.rules       regras de segurança do banco
js/catalogo.js        setores, itens e leitura de texto/voz
icons/                logo e ícones do app
marca/                proposta de marca
prints/               imagens para o portfólio
```

---

Projeto de [Leão Design](https://github.com/landerleao) · design e programação.
