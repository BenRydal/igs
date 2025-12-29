# Contributing to IGS

Thank you for your interest in contributing to the Interaction Geography Slicer! We welcome contributions from the community.

Please read our [Code of Conduct](.github/CODE_OF_CONDUCT.md) before contributing.

## Reporting Bugs

Found a bug? Please [open a bug report](https://github.com/BenRydal/igs/issues/new?template=bug.yaml) using our template. Include:

- A clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Your browser/environment info

## Requesting Features

Have an idea? Please [open a feature request](https://github.com/BenRydal/igs/issues/new?template=feature.yaml) using our template. Include:

- A clear description of the feature
- Context on why it would be useful
- Any implementation ideas you have

## Contributing Code

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/igs.git
   cd igs
   ```
3. **Install dependencies**:
   ```bash
   yarn install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Workflow

```bash
# Start the development server
yarn dev

# Run type checking
yarn check

# Lint your code
yarn lint

# Format your code
yarn format

# Build for production
yarn build
```

### Code Style

Before committing:
- Run `yarn format` to ensure consistent formatting
- Run `yarn check` to catch TypeScript errors
- Run `yarn lint` to catch linting issues

### Submitting a Pull Request

1. **Update your branch** with the latest changes from `main`:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
2. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
3. **Open a Pull Request** against the `main` branch
4. **Fill out the PR template** describing your changes

## Project Structure

```
src/
├── routes/          # SvelteKit pages
├── lib/
│   ├── components/  # Svelte components
│   ├── core/        # Data processing logic
│   ├── p5/          # p5.js visualization
│   └── video/       # Video playback
├── stores/          # Svelte stores (state management)
└── models/          # TypeScript data models
```

## Questions?

Feel free to [open an issue](https://github.com/BenRydal/igs/issues) or reach out through our [feedback form](https://forms.gle/WaeHRt5Hug3fYzKW9).

## License

By contributing, you agree that your contributions will be licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0).
