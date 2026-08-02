export const dict = {
  "neocode:autocomplete.statusBar.enabled": "$(neo-logo) Saisie automatique",
  "neocode:autocomplete.statusBar.snoozed": "mis en pause",
  "neocode:autocomplete.statusBar.warning": "$(warning) Saisie automatique",
  "neocode:autocomplete.statusBar.tooltip.basic": "Saisie automatique Neo Code",
  "neocode:autocomplete.statusBar.tooltip.disabled": "Saisie automatique Neo Code (désactivée)",
  "neocode:autocomplete.statusBar.tooltip.noUsableProvider":
    "**Aucun modèle de saisie automatique configuré**\n\nPour activer la saisie automatique, ajoutez un profil avec l'un de ces fournisseurs pris en charge : {{providers}}.\n\n[Ouvrir les paramètres]({{command}})",
  "neocode:autocomplete.statusBar.tooltip.sessionTotal": "Coût total de la session :",
  "neocode:autocomplete.statusBar.tooltip.provider": "Fournisseur :",
  "neocode:autocomplete.statusBar.tooltip.model": "Modèle :",
  "neocode:autocomplete.statusBar.tooltip.profile": "Profil : ",
  "neocode:autocomplete.statusBar.tooltip.defaultProfile": "Par défaut",
  "neocode:autocomplete.statusBar.tooltip.completionSummary":
    "{{count}} complétions effectuées entre {{startTime}} et {{endTime}}, pour un coût total de {{cost}}.",
  "neocode:autocomplete.statusBar.tooltip.providerInfo":
    "Saisies automatiques fournies par {{model}} via {{provider}}.",
  "neocode:autocomplete.statusBar.cost.zero": "$0.00",
  "neocode:autocomplete.statusBar.cost.lessThanCent": "<$0.01",
  "neocode:autocomplete.toggleMessage": "Saisie automatique Neo Code {{status}}",
  "neocode:autocomplete.progress.title": "Neo Code",
  "neocode:autocomplete.progress.analyzing": "Analyse de votre code...",
  "neocode:autocomplete.progress.generating": "Génération des modifications suggérées...",
  "neocode:autocomplete.progress.processing": "Traitement des modifications suggérées...",
  "neocode:autocomplete.progress.showing": "Affichage des modifications suggérées...",
  "neocode:autocomplete.input.title": "Neo Code : tâche rapide",
  "neocode:autocomplete.input.placeholder": "p. ex., 'refactoriser cette fonction pour la rendre plus efficace'",
  "neocode:autocomplete.commands.generateSuggestions": "Neo Code : générer des modifications suggérées",
  "neocode:autocomplete.commands.displaySuggestions": "Afficher les modifications suggérées",
  "neocode:autocomplete.commands.cancelSuggestions": "Annuler les modifications suggérées",
  "neocode:autocomplete.commands.applyCurrentSuggestion": "Appliquer la modification suggérée actuelle",
  "neocode:autocomplete.commands.applyAllSuggestions": "Appliquer toutes les modifications suggérées",
  "neocode:autocomplete.commands.category": "Neo Code",
  "neocode:autocomplete.codeAction.title": "Neo Code : modifications suggérées",
  "neocode:autocomplete.chatParticipant.fullName": "Agent Neo Code",
  "neocode:autocomplete.chatParticipant.name": "Assistant",
  "neocode:autocomplete.chatParticipant.description":
    "Je peux vous aider avec des tâches rapides et des modifications suggérées.",
  "neocode:autocomplete.incompatibilityExtensionPopup.message":
    "La saisie automatique Neo Code est bloquée par un conflit avec GitHub Copilot. Pour résoudre ce problème, vous devez désactiver les suggestions en ligne de Copilot.",
  "neocode:autocomplete.incompatibilityExtensionPopup.disableCopilot": "Désactiver Copilot",
  "neocode:autocomplete.incompatibilityExtensionPopup.disableInlineAssist": "Désactiver la saisie automatique",
  "neocode:autocomplete.creditsExhausted.message":
    "La saisie semi-automatique de Neo Code a été mise en pause. Causes possibles : votre compte Neo n’a plus de crédits, ou votre clé API configurée (BYOK) a atteint sa limite de quota. Ajoutez des crédits Neo ou vérifiez la configuration de votre clé API pour reprendre la saisie semi-automatique.",
  "neocode:autocomplete.creditsExhausted.addCredits": "Ajouter des crédits",
  "neocode:autocomplete.authError.message":
    "La saisie semi-automatique de Neo Code a été mise en pause en raison d’un problème d’authentification. Causes possibles : vous n’êtes pas connecté à Neo, ou votre clé API (BYOK) est invalide ou manquante. Reconnectez-vous ou vérifiez les paramètres de clé API de votre fournisseur.",
}
