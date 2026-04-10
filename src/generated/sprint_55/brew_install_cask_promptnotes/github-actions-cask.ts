// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 55-1
// @task-title: `brew install --cask promptnotes` でインストール・起動可能
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/design/system_design.md §2.7

/**
 * Generates the GitHub Actions workflow YAML string for the Homebrew Cask
 * release pipeline.  The caller writes this to .github/workflows/cask-release.yml.
 *
 * Workflow:
 *   trigger: published release on GitHub
 *   steps:
 *     1. Download the .dmg artifact from the release
 *     2. Compute SHA256
 *     3. Generate the cask formula
 *     4. Submit PR to homebrew-cask (via fork)
 */
export function generateCaskWorkflow(): string {
  return `name: Homebrew Cask Release

on:
  release:
    types: [published]

jobs:
  cask-pr:
    runs-on: macos-latest
    permissions:
      contents: read

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install ts-node
        run: npm install -g ts-node typescript

      - name: Download macOS DMG artifact
        run: |
          VERSION="\${{ github.event.release.tag_name }}"
          VERSION="\${VERSION#v}"
          DMG_NAME="promptnotes_\${VERSION}_universal.dmg"
          DMG_URL="https://github.com/dev-komenzar/promptnotes/releases/download/\${{ github.event.release.tag_name }}/\${DMG_NAME}"
          curl -L -o promptnotes.dmg "\${DMG_URL}"
          echo "VERSION=\${VERSION}" >> "\$GITHUB_ENV"
          echo "DMG_URL=\${DMG_URL}" >> "\$GITHUB_ENV"

      - name: Compute SHA256
        id: sha256
        run: |
          SHA256=\$(shasum -a 256 promptnotes.dmg | awk '{print \$1}')
          echo "SHA256=\${SHA256}" >> "\$GITHUB_ENV"
          echo "sha256=\${SHA256}" >> "\$GITHUB_OUTPUT"

      - name: Generate Cask formula
        run: |
          ts-node src/generated/sprint_55/brew_install_cask_promptnotes/cask-formula-generator.ts \\
            --version "\${{ env.VERSION }}" \\
            --sha256 "\${{ env.SHA256 }}" \\
            --output promptnotes.rb
          cat promptnotes.rb

      - name: Audit Cask formula
        run: |
          # Copy to local tap for auditing
          mkdir -p "\$(brew --repository)/Library/Taps/local/homebrew-cask/Casks/p"
          cp promptnotes.rb "\$(brew --repository)/Library/Taps/local/homebrew-cask/Casks/p/promptnotes.rb"
          brew audit --cask local/homebrew-cask/promptnotes || true
          brew style --cask local/homebrew-cask/promptnotes || true

      - name: Submit PR to homebrew-cask
        env:
          GITHUB_TOKEN: \${{ secrets.HOMEBREW_CASK_PAT }}
          FORK_REMOTE: \${{ secrets.HOMEBREW_CASK_FORK_REMOTE }}
        run: |
          ts-node src/generated/sprint_55/brew_install_cask_promptnotes/cask-pr-helper.ts \\
            --version "\${{ env.VERSION }}" \\
            --sha256 "\${{ env.SHA256 }}" \\
            --fork-remote "\${FORK_REMOTE}" \\
            --github-token "\${GITHUB_TOKEN}"
`;
}

// CLI: generate and print the workflow YAML
if (require.main === module) {
  process.stdout.write(generateCaskWorkflow());
}
