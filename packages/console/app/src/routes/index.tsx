import "./index.css"
import { Title, Meta, Link } from "@solidjs/meta"
import video from "../asset/lander/neocode-min.mp4"
import videoPoster from "../asset/lander/neocode-poster.png"
import { IconCopy, IconCheck } from "../component/icon"
import { A, createAsync } from "@solidjs/router"
import { Tabs } from "@kobalte/core/tabs"
import { Faq } from "~/component/faq"
import { Header } from "~/component/header"
import { Footer } from "~/component/footer"
import { github } from "~/lib/github"
import { createMemo, Show } from "solid-js"
import { config } from "~/config"

function CopyStatus() {
  return (
    <div data-component="copy-status">
      <IconCopy data-slot="copy" />
      <IconCheck data-slot="check" />
    </div>
  )
}

export default function Home() {
  const githubData = createAsync(() => github())
  const release = createMemo(() => githubData()?.release)
  const starsFormatted = createMemo(() => githubData()?.stars ?
    new Intl.NumberFormat('en-US', { notation: 'compact' }).format(githubData()?.stars!) :
    config.github.starsFormatted.compact)

  const handleCopyClick = (event: Event) => {
    const button = event.currentTarget as HTMLButtonElement
    const text = button.querySelector('[data-slot="protocol"]')?.textContent ||
      button.querySelector('[data-slot="highlight"]')?.textContent ||
      button.textContent
    if (text) {
      navigator.clipboard.writeText(text.trim())
      button.setAttribute("data-copied", "")
      setTimeout(() => {
        button.removeAttribute("data-copied")
      }, 1500)
    }
  }

  return (
    <main data-page="neocode">
      <Title>NeoCode | The open source AI coding agent</Title>
      <Link rel="canonical" href={config.baseUrl} />
      <Meta property="og:image" content="/social-share.png" />
      <Meta name="twitter:image" content="/social-share.png" />

      <div data-component="container">
        <Header />

        <div data-component="content">
          {/* Hero Section */}
          <section data-component="hero" class="hero-gradient">
            <div data-component="desktop-app-banner">
              <span data-slot="badge">v2.0 Live</span>
              <div data-slot="content">
                Desktop app in beta available on macOS, Windows, and Linux.
                <A href="/download" class="ml-2 underline">Download now</A>
              </div>
            </div>

            <h1>
              Coding at the <br />
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#136dec] to-[#7c3aed]">speed of thought.</span>
            </h1>
            <p>
              The open-source AI agent that writes, tests, and deploys.
              Support for your favorite LLMs or use our free built-in models.
            </p>

            <div class="flex flex-wrap gap-4 mt-4 mb-16 justify-center">
              <button class="bg-[#136dec] hover:bg-[#1557b7] text-white px-8 py-4 rounded-xl text-lg font-bold shadow-xl shadow-[#136dec]/30 flex items-center gap-2 transition-all">
                Get Started Free
                <span class="material-symbols-outlined">arrow_forward</span>
              </button>
              <a href={config.github.repoUrl} target="_blank" class="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-xl text-lg font-bold flex items-center gap-2 transition-all no-underline">
                <span class="material-symbols-outlined">code</span>
                View on GitHub
              </a>
            </div>

            {/* IDE Mockup */}
            <div class="ide-mockup">
              <div class="terminal-header">
                <div class="dots">
                  <div class="red"></div>
                  <div class="yellow"></div>
                  <div class="green"></div>
                </div>
                <div class="title">app.py — NeoCode Agent</div>
                <div class="w-12"></div>
              </div>
              <div class="editor-content">
                <div class="line-numbers">
                  01<br />02<br />03<br />04<br />05<br />06<br />07<br />08<br />09<br />10
                </div>
                <div class="code">
                  <span class="code-syntax-keyword">import</span> neocode<br />
                  <span class="code-syntax-keyword">from</span> models <span class="code-syntax-keyword">import</span> Engine<br /><br />
                  <span class="code-syntax-keyword">def</span> <span class="code-syntax-func">refactor_logic</span>(ctx):<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;agent = Engine(model=<span class="code-syntax-string">"claude-3-5"</span>)<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span class="code-syntax-comment"># AI starts writing here...</span><br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span class="inline-block px-1 bg-[#136dec]/20 border-l-2 border-[#136dec] animate-pulse">logic = agent.rewrite(ctx)</span><br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span class="code-suggestion">if logic.is_valid():</span><br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-suggestion">return logic.apply()</span><br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span class="code-suggestion">return ctx</span>
                </div>
              </div>
              <div class="ai-chat-overlay">
                <div class="ai-header">
                  <span class="material-symbols-outlined text-[#136dec] text-sm">auto_awesome</span>
                  <span class="text-[11px] font-bold text-slate-300 uppercase tracking-wider">AI Assistant</span>
                </div>
                <p class="ai-text">"I've optimized the refactor logic and added safety checks."</p>
                <div class="ai-actions">
                  <button class="ai-btn accept">Accept</button>
                  <button class="ai-btn discard">Discard</button>
                </div>
              </div>
            </div>
          </section>

          {/* Model Trust Bar */}
          <div class="model-grid">
            <h4>Powered by the world's best models</h4>
            <div class="models">
              <div class="model">
                <span class="material-symbols-outlined text-3xl">neurology</span>
                Claude 3.5
              </div>
              <div class="model">
                <span class="material-symbols-outlined text-3xl">psychology</span>
                GPT-4o
              </div>
              <div class="model">
                <span class="material-symbols-outlined text-3xl">temp_preferences_custom</span>
                Gemini 1.5
              </div>
              <div class="model">
                <span class="material-symbols-outlined text-3xl">hub</span>
                Llama 3
              </div>
              <div class="model">
                <span class="material-symbols-outlined text-3xl">storage</span>
                Local
              </div>
            </div>
          </div>

          {/* Features Section */}
          <section data-component="what">
            <div class="section-header">
              <h2>Smarter Coding, Faster Deployment</h2>
              <p>Experience the power of multi-model support and open-source flexibility. Run locally or in the cloud.</p>
            </div>
            <ul>
              <li>
                <div class="icon-box">
                  <span class="material-symbols-outlined text-3xl">layers</span>
                </div>
                <strong>Multi-Model Support</strong>
                <div>Toggle between the latest LLMs from Anthropic, OpenAI, and Google effortlessly.</div>
              </li>
              <li>
                <div class="icon-box" style="background: rgba(124, 58, 237, 0.1); color: #7c3aed;">
                  <span class="material-symbols-outlined text-3xl">offline_bolt</span>
                </div>
                <strong>Free Built-in Models</strong>
                <div>Start immediately with local models. No API keys required for offline exploration.</div>
              </li>
              <li>
                <div class="icon-box">
                  <span class="material-symbols-outlined text-3xl">security</span>
                </div>
                <strong>Privacy First</strong>
                <div>Your code stays yours. With local processing, you control where your data goes.</div>
              </li>
              <li>
                <div class="icon-box">
                  <span class="material-symbols-outlined text-3xl">terminal</span>
                </div>
                <strong>Terminal Native</strong>
                <div>Built for developers who live in the terminal but love high-fidelity AI.</div>
              </li>
              <li>
                <div class="icon-box">
                  <span class="material-symbols-outlined text-3xl">share</span>
                </div>
                <strong>Shareable Links</strong>
                <div>Collaborate with your team by sharing session links for debugging.</div>
              </li>
              <li>
                <div class="icon-box">
                  <span class="material-symbols-outlined text-3xl">extension</span>
                </div>
                <strong>IDE Extensions</strong>
                <div>Available for VS Code, JetBrains, and directly as a desktop application.</div>
              </li>
            </ul>
          </section>

          {/* Installation Tabs */}
          <section class="max-w-4xl mx-auto py-24 px-6">
            <div class="text-center mb-16">
              <h2 class="text-4xl font-bold mb-4">One command installation</h2>
              <p class="text-slate-400">Install NeoCode in seconds using your favorite manager.</p>
            </div>
            <div data-slot="installation">
              <Tabs defaultValue="curl" class="tabs">
                <Tabs.List data-slot="tablist">
                  <Tabs.Trigger value="curl" data-slot="tab">curl</Tabs.Trigger>
                  <Tabs.Trigger value="npm" data-slot="tab">npm</Tabs.Trigger>
                  <Tabs.Trigger value="bun" data-slot="tab">bun</Tabs.Trigger>
                  <Tabs.Trigger value="brew" data-slot="tab">brew</Tabs.Trigger>
                </Tabs.List>
                <div data-slot="panels">
                  <Tabs.Content value="curl">
                    <button onClick={handleCopyClick} data-slot="command">
                      <span>
                        <span data-slot="protocol">curl -fsSL https://neocode.ai/install.sh | </span>
                        <span data-slot="highlight">sh</span>
                      </span>
                      <CopyStatus />
                    </button>
                  </Tabs.Content>
                  <Tabs.Content value="npm">
                    <button onClick={handleCopyClick} data-slot="command">
                      <span>
                        <span data-slot="protocol">npm install -g </span>
                        <span data-slot="highlight">neocode</span>
                      </span>
                      <CopyStatus />
                    </button>
                  </Tabs.Content>
                  <Tabs.Content value="bun">
                    <button onClick={handleCopyClick} data-slot="command">
                      <span>
                        <span data-slot="protocol">bun install -g </span>
                        <span data-slot="highlight">neocode</span>
                      </span>
                      <CopyStatus />
                    </button>
                  </Tabs.Content>
                  <Tabs.Content value="brew">
                    <button onClick={handleCopyClick} data-slot="command">
                      <span>
                        <span data-slot="protocol">brew install </span>
                        <span data-slot="highlight">neocode</span>
                      </span>
                      <CopyStatus />
                    </button>
                  </Tabs.Content>
                </div>
              </Tabs>
            </div>
          </section>

          {/* Video Section */}
          <section class="py-24 border-t border-white/5">
            <div class="max-w-6xl mx-auto px-6">
              <div class="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <video src={video} autoplay playsinline loop muted preload="auto" poster={videoPoster} class="w-full">
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </section>

          {/* Growth / Star Section */}
          <section class="cta-section">
            <div class="cta-card">
              <div class="cta-inner">
                <h2>Open Source. Always.</h2>
                <p>
                  Join over 50,000 developers building the future of autonomous coding agents.
                  Currently at <strong>{starsFormatted()}</strong> GitHub stars and growing.
                </p>
                <div class="btns">
                  <A href="/download" class="primary no-underline">Get Started Now</A>
                  <a href={config.github.repoUrl} target="_blank" class="secondary no-underline flex items-center gap-2 justify-center">
                    <span class="material-symbols-outlined">star</span>
                    Star on GitHub
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section class="max-w-4xl mx-auto py-24 px-6 border-t border-white/5">
            <h2 class="text-4xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
            <div class="space-y-4">
              <Faq question="Is NeoCode really free?">
                <p class="text-slate-400 leading-relaxed">
                  Yes! NeoCode is open source under the MIT license and completely free to use.
                  You can use your own API keys for premium models or take advantage of our free built-in models for local development.
                </p>
              </Faq>
              <Faq question="Can I run it completely offline?">
                <p class="text-slate-400 leading-relaxed">
                  Absolutely. One of NeoCode's core strengths is its support for local models like Llama 3 via Ollama or LM Studio.
                  This allows you to maintain full privacy and code with AI even without an internet connection.
                </p>
              </Faq>
              <Faq question="Which platforms are supported?">
                <p class="text-slate-400 leading-relaxed">
                  NeoCode is designed to be cross-platform. We provide official builds and support for macOS (Apple Silicon & Intel), Windows, and Linux.
                  Our command-line tool and desktop app are optimized for each environment.
                </p>
              </Faq>
              <Faq question="How does it handle my data privacy?">
                <p class="text-slate-400 leading-relaxed">
                  Privacy is central to NeoCode. When using local models, your code never leaves your machine.
                  When using cloud providers, we follow standard security protocols and only send the context necessary for the AI to fulfill your request.
                </p>
              </Faq>
            </div>
          </section>
        </div>
        <Footer />
      </div>
    </main>
  )
}
