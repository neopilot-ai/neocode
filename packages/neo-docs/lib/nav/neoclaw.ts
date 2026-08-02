import { NavSection } from "../types"

export const NeoClawNav: NavSection[] = [
  {
    title: "NeoClaw",
    links: [
      { href: "/neoclaw/overview", children: "Overview" },
      { href: "/neoclaw/dashboard", children: "Dashboard" },
      { href: "/neoclaw/pre-installed-software", children: "Pre-installed Software" },
      { href: "/neoclaw/end-to-end", children: "End to End Config" },
      {
        href: "/neoclaw/control-ui/overview",
        children: "Control UI",
        subLinks: [
          { href: "/neoclaw/control-ui/changing-models", children: "Changing Models" },
          { href: "/neoclaw/control-ui/exec-approvals", children: "Exec Approvals" },
          { href: "/neoclaw/control-ui/version-pinning", children: "Version Pinning" },
        ],
      },
      {
        href: "/neoclaw/chat-platforms",
        children: "Chat Platforms",
        subLinks: [
          { href: "/neoclaw/chat-platforms/telegram", children: "Telegram" },
          { href: "/neoclaw/chat-platforms/discord", children: "Discord" },
          { href: "/neoclaw/chat-platforms/slack", children: "Slack" },
        ],
      },
      {
        href: "/neoclaw/development-tools",
        children: "Integrations",
        subLinks: [
          { href: "/neoclaw/development-tools/github", children: "GitHub" },
          { href: "/neoclaw/development-tools/google", children: "Google Workspace" },
          { href: "/neoclaw/development-tools/linear", children: "Linear" },
          { href: "/neoclaw/development-tools/composio", children: "Composio" },
          { href: "/neoclaw/tools/1password", children: "1Password" },
          { href: "/neoclaw/tools/brave-search", children: "Brave Search" },
          { href: "/neoclaw/tools/agentcard", children: "AgentCard" },
          { href: "/neoclaw/tools/other-tools", children: "Other Tools" },
        ],
      },
      {
        href: "/neoclaw/triggers",
        children: "Triggers",
        subLinks: [
          { href: "/neoclaw/triggers/webhooks", children: "Webhooks" },
          { href: "/neoclaw/triggers/scheduled", children: "Scheduled" },
        ],
      },
      {
        href: "/neoclaw/troubleshooting/common-questions",
        children: "Troubleshooting",
        subLinks: [
          { href: "/neoclaw/troubleshooting/common-questions", children: "Common Questions" },
          { href: "/neoclaw/troubleshooting/gateway-process", children: "Gateway Process States" },
          { href: "/neoclaw/troubleshooting/architecture", children: "Architecture Notes" },
        ],
      },
      {
        href: "/neoclaw/faq/general",
        children: "FAQ",
        subLinks: [
          { href: "/neoclaw/faq/general", children: "General" },
          { href: "/neoclaw/faq/pricing", children: "Pricing" },
        ],
      },
    ],
  },
]
