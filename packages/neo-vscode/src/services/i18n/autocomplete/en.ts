// English runtime translations for autocomplete (neocode:autocomplete.* namespace)
// Source: src/i18n/locales/en/neocode.json → "autocomplete" section

export const dict = {
  "neocode:autocomplete.statusBar.enabled": "$(neo-logo) Autocomplete",
  "neocode:autocomplete.statusBar.snoozed": "snoozed",
  "neocode:autocomplete.statusBar.warning": "$(warning) Autocomplete",
  "neocode:autocomplete.statusBar.tooltip.basic": "Neo Code Autocomplete",
  "neocode:autocomplete.statusBar.tooltip.disabled": "Neo Code Autocomplete (disabled)",
  "neocode:autocomplete.statusBar.tooltip.noUsableProvider":
    "**No autocomplete model configured**\n\nTo enable autocomplete, add a profile with one of these supported providers: {{providers}}.\n\n[Open Settings]({{command}})",
  "neocode:autocomplete.statusBar.tooltip.sessionTotal": "Session total cost:",
  "neocode:autocomplete.statusBar.tooltip.provider": "Provider:",
  "neocode:autocomplete.statusBar.tooltip.model": "Model:",
  "neocode:autocomplete.statusBar.tooltip.profile": "Profile: ",
  "neocode:autocomplete.statusBar.tooltip.defaultProfile": "Default",
  "neocode:autocomplete.statusBar.tooltip.completionSummary":
    "Performed {{count}} completions between {{startTime}} and {{endTime}}, for a total cost of {{cost}}.",
  "neocode:autocomplete.statusBar.tooltip.providerInfo": "Autocompletions provided by {{model}} via {{provider}}.",
  "neocode:autocomplete.statusBar.cost.zero": "$0.00",
  "neocode:autocomplete.statusBar.cost.lessThanCent": "<$0.01",
  "neocode:autocomplete.toggleMessage": "Neo Code Autocomplete {{status}}",
  "neocode:autocomplete.progress.title": "Neo Code",
  "neocode:autocomplete.progress.analyzing": "Analyzing your code...",
  "neocode:autocomplete.progress.generating": "Generating suggested edits...",
  "neocode:autocomplete.progress.processing": "Processing suggested edits...",
  "neocode:autocomplete.progress.showing": "Displaying suggested edits...",
  "neocode:autocomplete.input.title": "Neo Code: Quick Task",
  "neocode:autocomplete.input.placeholder": "e.g., 'refactor this function to be more efficient'",
  "neocode:autocomplete.commands.generateSuggestions": "Neo Code: Generate Suggested Edits",
  "neocode:autocomplete.commands.displaySuggestions": "Display Suggested Edits",
  "neocode:autocomplete.commands.cancelSuggestions": "Cancel Suggested Edits",
  "neocode:autocomplete.commands.applyCurrentSuggestion": "Apply Current Suggested Edit",
  "neocode:autocomplete.commands.applyAllSuggestions": "Apply All Suggested Edits",
  "neocode:autocomplete.commands.category": "Neo Code",
  "neocode:autocomplete.codeAction.title": "Neo Code: Suggested Edits",
  "neocode:autocomplete.chatParticipant.fullName": "Neo Code Agent",
  "neocode:autocomplete.chatParticipant.name": "Agent",
  "neocode:autocomplete.chatParticipant.description": "I can help you with quick tasks and suggested edits.",
  "neocode:autocomplete.incompatibilityExtensionPopup.message":
    "The Neo Code Autocomplete is being blocked by a conflict with GitHub Copilot. To fix this, you must disable Copilot's inline suggestions.",
  "neocode:autocomplete.incompatibilityExtensionPopup.disableCopilot": "Disable Copilot",
  "neocode:autocomplete.incompatibilityExtensionPopup.disableInlineAssist": "Disable Autocomplete",
  "neocode:autocomplete.creditsExhausted.message":
    "Neo Code Autocomplete has been paused. Possible causes: your Neo account has no remaining credits, or your configured API key (BYOK) has reached its quota limit. Add Neo credits or check your API key configuration to resume autocomplete.",
  "neocode:autocomplete.creditsExhausted.addCredits": "Add Credits",
  "neocode:autocomplete.authError.message":
    "Neo Code Autocomplete has been paused due to an authentication issue. Possible causes: you are not signed in to Neo, or your API key (BYOK) is invalid or missing. Please sign in again or check your provider API key settings.",
}
