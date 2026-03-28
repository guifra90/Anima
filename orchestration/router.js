// orchestration/router.js
// Scopo: Entry point per gli eventi. Riceve webhook o trigger e smista all'agente corretto.

async function route(event) {
  console.log('Routing event:', event);
  // Logica di routing da implementare
}

module.exports = { route };
