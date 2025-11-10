<template>
  <div class="guide">
    <section>
      <h3>Come aggiungere o modificare un campo</h3>
      <ol>
        <li>Seleziona la categoria e il modello nella colonna di sinistra.</li>
        <li>Nel pannello “Fields” scegli <strong>Add Field</strong> oppure premi <strong>Edit</strong> su un campo esistente.</li>
        <li>Compila le informazioni in “General”, scegli il tipo di campo e la sezione in cui deve apparire nel form.</li>
        <li>Usa “Options &amp; Dependencies” per configurare le opzioni, collegare Symptom Set o impostare menu dipendenti.</li>
        <li>Nella sezione “Display Conditions” puoi mostrare il campo solo se vengono soddisfatte determinate condizioni.</li>
        <li>Salva il campo, quindi usa “Save to Server” per pubblicare le modifiche.</li>
      </ol>
    </section>

    <section>
      <h3>Menu a cascata e Symptom Set</h3>
      <ul>
        <li>Attiva <strong>Use Symptom Sets as options</strong> per popolare automaticamente il menu con i Symptom Set disponibili per il modello.</li>
        <li>Disattiva l’opzione per gestire una lista manuale di opzioni. Puoi aggiungerle rapidamente con il campo “Add option”.</li>
        <li>Per creare o modificare Symptom Set visita la tab <em>Symptom Sets</em> (puoi aprirla dalla scorciatoia presente nell’editor).</li>
        <li>Se hai un menu dipendente da un altro select, utilizza la sezione <em>Parent/child options</em> per mappare le opzioni figlie.</li>
      </ul>
    </section>

    <section>
      <h3>Consigli rapidi</h3>
      <ul>
        <li>Dai un nome coerente agli ID (niente spazi o lettere accentate) e usa label descrittive per chi compilerà il form.</li>
        <li>Assegna sempre una <strong>section</strong> in modo che il campo appaia nel blocco corretto del form.</li>
        <li>Usa l’ordine per controllare la posizione dei campi: minore l’ordine, più in alto comparirà.</li>
        <li>Controlla il pulsante “Unsaved changes” nella barra in alto per sapere se ci sono modifiche non salvate.</li>
        <li>Prova il form dopo aver pubblicato le modifiche, così verifichi che menu e condizioni funzionino come previsto.</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.guide {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.75rem;
}

section h3 {
  margin-top: 0;
  color: #0f172a;
}

ol, ul {
  margin: 0;
  padding-left: 1.2rem;
  color: #334155;
}

li {
  margin-bottom: 0.5rem;
}

strong {
  color: #0d6efd;
}
</style>

