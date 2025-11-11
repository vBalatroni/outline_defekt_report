<template>
  <div class="wiki-page">
    <h2>Admin Wiki</h2>
    <p class="intro">Questa pagina riassume cosa puoi fare in ogni tab dell’editor di configurazione.</p>

    <section>
      <h3>Models & Fields</h3>
      <ul>
        <li>Seleziona una categoria e un modello per modificare i campi del form principale.</li>
        <li>Usa “Add Field” per creare nuovi input (testo, select, file) con dipendenze dinamiche.</li>
        <li>Export/Import (dal tasto Export) salva l’intera configurazione in JSON.</li>
      </ul>
    </section>

    <section>
      <h3>General Fields</h3>
      <ul>
        <li>Organizza l’anagrafica: company data, indirizzi, ecc.</li>
        <li>I campi qui definiti compaiono nella prima pagina del form pubblico.</li>
      </ul>
    </section>

    <section>
      <h3>Acceptance Page</h3>
      <ul>
        <li>Personalizza titolo, sottotitolo, checklist e pulsante della pagina iniziale.</li>
      </ul>
    </section>

    <section>
      <h3>General Settings</h3>
      <ul>
        <li>Gestisci destinatari email, download HTML di debug.</li>
        <li>Attiva la validazione seriale (algoritmo BARTILOMEU) e il debug.</li>
        <li>Definisci i limiti per numero, dimensione e formati degli allegati.</li>
      </ul>
    </section>

    <section>
      <h3>Symptom Sets</h3>
      <ul>
        <li>Crea e riutilizza liste di sintomi condivisi.</li>
        <li>Salva o ricarica i set con i pulsanti dedicati.</li>
      </ul>
    </section>

    <section>
      <h3>Workflow</h3>
      <ol>
        <li>Aggiorna Models & Fields o Symptom Sets secondo necessità.</li>
        <li>Regola i General Fields per l’anagrafica iniziale.</li>
        <li>Configura Acceptance Page e General Settings.</li>
        <li>Esporta la configurazione finale o salva su server.</li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.wiki-page {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.intro {
  margin: 0;
  color: #6c757d;
}
section {
  border-top: 1px solid #f0f0f0;
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
section:first-of-type {
  border-top: none;
  padding-top: 0;
}
ul,
ol {
  margin: 0;
  padding-left: 1.2rem;
  color: #3a3a3a;
}
li {
  margin-bottom: 0.35rem;
}
</style>
