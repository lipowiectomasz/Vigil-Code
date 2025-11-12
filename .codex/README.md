# Codex Agent Runtime

Lokalny runtime Codex odtwarza system agentów znany z `.claude`, ale działa w TypeScript/Node i jest całkowicie poza repozytorium (katalog `.codex/` jest ignorowany przez Git). Ten dokument opisuje strukturę, konfigurację oraz sposób codziennego korzystania.

---

## 1. Przegląd katalogów

```
.codex/
  agents/             # Kod agentów TS (10 specjalistów)
  config/
    permissions.json  # Allowlist poleceń shellowych
    PermissionsManager.ts
  orchestrator/       # MasterOrchestrator, WorkflowExecutor, CLI
  runtime/            # BaseAgent, MessageBus, StateManager, ProgressReporter, TaskClassifier
  tests/              # Smoke test orchestratora
  tsconfig.json       # Niezależna konfiguracja TypeScript
bin/vg-orchestrate    # Launcher (działa na buildzie lub ts-node)
```

---

## 2. Pierwsze uruchomienie

1. **Zainstaluj zależności** (repo główne korzysta z workspace’ów):
   ```bash
   npm install
   ```

2. **Skompiluj kod TS runtime’u** (raz na start, później po zmianach):
   ```bash
   npx tsc -p .codex/tsconfig.json
   ```
   > Jeśli wolisz tryb „na żywo”, zainstaluj `ts-node` (globalnie lub w repo) – launcher spróbuje z niego skorzystać, gdy buildu brak.

3. **Sprawdź status orchestratora**:
   ```bash
   bin/vg-orchestrate --status
   ```
   Zobaczysz listę załadowanych agentów i podstawowe statystyki message-busa.

---

## 3. Używanie na co dzień

### Uruchamianie zadań

```bash
bin/vg-orchestrate --task "Dodaj regułę do wykrywania SQL injection i przetestuj"
```

CLI przekazuje tekst do `MasterOrchestrator.handleTask`, który:
1. Klasyfikuje zadanie (`TaskClassifier`).
2. Wybiera strategię (workflow / single / parallel / sequential).
3. Tworzy stan workflow (`StateManager`) i uruchamia odpowiednich agentów.
4. Raportuje postęp w konsoli (`ProgressReporter`) i finalnie zwraca podsumowanie JSON.

> Dodaj `--context '{ "branch": "feature/*" }'`, aby przekazać dodatkowe dane JSON.

### Monitoring & logi

- Każdy agent loguje do stdout (prefiks `[timestamp][LEVEL][agent]`).
- MessageBus publikuje wydarzenia (progress, completion), które trafiają do `ProgressReporter`.
- Stan workflow jest zapisywany w `.codex/state/…` (automatycznie tworzony).

### Testy

Po kompilacji TypeScript:
```bash
node --test .codex/tests/orchestrator-smoke.spec.ts
```

Smoke test ładuje rejestr agentów i weryfikuje, że orchestrator zna komplet 10 specjalistów.

---

## 4. Agenci i zależności

| Agent ID                      | Rola                                      | Zależności (invoke/save)                   | Shell |
|-------------------------------|-------------------------------------------|--------------------------------------------|-------|
| `vg-test-automation`          | Vitest / e2e testy wzorców                | `vg-workflow-business-logic`, `vg-pii-detection` | Tak (`npx vitest …`) |
| `vg-workflow-business-logic`  | Reguły, unified_config, wzorce            | wysyła notify do `vg-test-automation`      | Nie   |
| `vg-infrastructure-deployment`| Docker Compose                            | —                                          | Tak (`docker-compose …`) |
| `vg-security-compliance`      | `npm audit`, skany tajemnic               | —                                          | Tak (`npm audit --json`) |
| `vg-workflow-infrastructure`  | JSON workflowów n8n                       | `vg-pii-detection`                         | Nie   |
| `vg-backend-api`              | Express API, middleware, rate limit       | `vg-data-analytics` (zapytania)            | Nie   |
| `vg-frontend-ui`              | React/Tailwind komponenty                 | `vg-backend-api`                           | Nie   |
| `vg-data-analytics`           | ClickHouse / Grafana / raporty            | —                                          | Nie   |
| `vg-pii-detection`            | Presidio fallback, konfiguracja PII       | `vg-workflow-business-logic` (notify)      | Nie   |
| `vg-documentation`            | Dokumentacja i README/API                 | —                                          | Nie   |

---

## 5. System uprawnień (shell)

Wszystkie polecenia powłoki przechodzą przez `ShellTool`, który wymaga nazwy agenta i korzysta z `PermissionsManager`.

- Konfiguracja: `.codex/config/permissions.json`.
- Każdy agent ma listę `allowed` (prefiks komendy) i `workingDirectories` (whitelist katalogów).
- Niedozwolone polecenie powoduje wyjątek przed jego uruchomieniem.

Przykład fragmentu konfiguracji:
```json
"vg-test-automation": {
  "shell": {
    "allowed": ["npx vitest run", "npm run test*"],
    "workingDirectories": ["services/workflow"]
  }
}
```
→ Agent może uruchamiać `npx vitest run tests/e2e/file.test.js`, ale nie ma dostępu do `rm`, `git` itp.

Więcej informacji znajdziesz w `.codex/README_PERMISSIONS.md`.

---

## 6. Rozszerzanie runtime’u

### Dodawanie nowego agenta
1. Utwórz plik w `.codex/agents/<id>/agent.ts` (rozszerz `BaseAgent`).
2. Jeśli agent korzysta z powłoki – zdefiniuj wpis w `permissions.json`.
3. Zarejestruj agenta w `createAgentRegistry()` (zwracany loader `import('./<id>/agent.js')`).
4. Zaktualizuj testy (np. smoke test sprawdzający listę agentów).

### Nowe workflows / strategie
- Edytuj `TaskClassifier` (`runtime/TaskClassifier.ts`) i `runtime/workflows.ts`.
- Dodaj/zmień strategie w orchestratorze jeśli potrzebujesz specjalnych zachowań.

### Integracje CLI
- `bin/vg-orchestrate` ładuje build (`.codex/dist`) lub `ts-node`. Jeżeli chcesz dedykowane polecenia, utwórz wrappery skryptowe obok.

---

## 7. Typowy cykl pracy

1. Zrób zmiany w agentach / orchestratorze w `.codex/`.
2. `npx tsc -p .codex/tsconfig.json`
3. `bin/vg-orchestrate --status` – upewnij się, że orchestrator ładuje agentów.
4. `bin/vg-orchestrate --task "..."` – uruchom workflow.
5. (Opcjonalnie) `node --test .codex/tests/orchestrator-smoke.spec.ts`
6. Skopiuj wyniki i/lub wprowadź zmiany w repo głównym (np. generowane pliki dokumentacji/testów).

Pamiętaj, że `.codex/` pozostaje lokalne (jest w `.gitignore`). Jeśli generujesz artefakty do repo (np. nowy plik w `docs/`), przenieś je ręcznie przed commitem.

---

## 8. Najczęstsze problemy

- **Agent próbuje wykonać polecenie spoza allowlisty**  
  → Aktualizuj `.codex/config/permissions.json`, dodaj nowy prefiks i ewentualnie katalog.

- **Launcher narzeka na brak builda**  
  → Wykonaj `npx tsc -p .codex/tsconfig.json` lub zainstaluj `ts-node`.

- **`node --test` nie znajdują modułów**  
  → Testy wymagają plików `.js` (kompilacja TypeScript).

- **Agent wprowadza konflikty w repo**  
  → Pamiętaj, że runtime generuje pliki (np. testy, dokumentację) w katalogach repo – commituj tylko to, co potrzebne.

---

## 9. Kontakt / rozwój

- Główna konfiguracja runtime: `.codex/runtime/`.
- CLI / orchestrator: `.codex/orchestrator/`.
- Shell & permissions: `.codex/agents/tools/` + `.codex/config/`.
- Dokumentacja zasad uprawnień: `.codex/README_PERMISSIONS.md`.

Zmiany w runtime zawsze pozostają lokalne; jeżeli chcesz dzielić się usprawnieniami, przekonwertuj je na patch/PR w repo głównym (np. portując generator dokumentacji czy testów do oficjalnych narzędzi).
