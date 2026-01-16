<div align="center">

# Interaction Geography Slicer (IGS)

**Visualize movement, conversation, and video data across space and time**

[![Live Site](https://img.shields.io/badge/Live%20Site-interactiongeography.org-blue?style=for-the-badge)](https://www.interactiongeography.org)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-green.svg?style=for-the-badge)](https://www.gnu.org/licenses/gpl-3.0)
[![Built with Svelte](https://img.shields.io/badge/Built%20with-Svelte%205-FF3E00?style=for-the-badge&logo=svelte)](https://svelte.dev)

![IGS Visualization](./static/images/igs-background.png)

[Try it now](https://www.interactiongeography.org) · [Report Bug](https://github.com/BenRydal/igs/issues) · [Request Feature](https://github.com/BenRydal/igs/issues)

</div>

---

## About

The **Interaction Geography Slicer (IGS)** is an open-source, browser-based tool for creating interactive 2D/3D visualizations that reveal how spatial and multimodal interactions evolve over space and time.

**Your data stays private.** IGS runs entirely in your browser—no transcripts or videos are uploaded, stored, or transmitted.

### Use Cases

- **Micro-ethnographic analysis** of gesture and embodied interaction
- **Mid-scale analysis** of movement and conversation in settings like classrooms, museums, and workplaces
- **Large-scale analysis** of urban mobility and spatial behavior

---

## Features

| Feature | Description |
|---------|-------------|
| **Browser-based** | No installation required—runs entirely in your browser |
| **2D/3D Visualizations** | Create dynamic space-time visualizations at different scales |
| **Multi-modal Data** | Explore movement, conversation, and video data simultaneously |
| **Interactive Animations** | Build dynamic animations to communicate your findings |
| **Privacy-first** | All data processing happens locally on your device |
| **Qualitative Code Support** | Annotate and analyze data with custom coding schemes |

---

## Quick Start

### Option 1: Use Online (Recommended)

Visit **[interactiongeography.org](https://www.interactiongeography.org)** to start using IGS immediately.

### Option 2: Run Locally

```bash
# Clone the repository
git clone https://github.com/BenRydal/igs.git

# Navigate to project directory
cd igs

# Install dependencies
yarn install

# Start development server
yarn dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Data Formats

IGS accepts CSV files with the following formats:

| Data Type | Required Headers | Example |
|-----------|-----------------|---------|
| **Indoor Movement** | `time, x, y` | `0, 100, 200` |
| **GPS Movement** | `time, lat, lng` | `0, 40.7128, -74.0060` |
| **Conversation** | `time, speaker, talk` | `5, Alice, Hello everyone` |
| **Codes (multi)** | `code, start, end` | `teaching, 0, 30` |
| **Codes (single)** | `start, end` | `0, 30` (filename = code) |

You can also load:
- **GPX/KML files** for GPS tracks (must contain timestamps)
- **Floorplan images** (PNG, JPG) as background for indoor data
- **Video** (MP4, YouTube URL) synced to timeline

---

## Tech Stack

<table>
<tr>
<td align="center"><strong>Framework</strong></td>
<td>SvelteKit + Svelte 5</td>
</tr>
<tr>
<td align="center"><strong>Visualization</strong></td>
<td>p5.js</td>
</tr>
<tr>
<td align="center"><strong>Styling</strong></td>
<td>Tailwind CSS v4 + DaisyUI v5</td>
</tr>
<tr>
<td align="center"><strong>CSV Parsing</strong></td>
<td>PapaParse</td>
</tr>
<tr>
<td align="center"><strong>Package Manager</strong></td>
<td>Yarn 4</td>
</tr>
</table>

---

## Development

```bash
# Development server
yarn dev

# Type checking
yarn check

# Lint and format
yarn lint
yarn format

# Production build
yarn build
yarn preview
```

---

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

For major changes, please [open an issue](https://github.com/BenRydal/igs/issues) first to discuss your ideas.

---

## Feedback

Found a bug or have a suggestion?

- [Open an issue](https://github.com/BenRydal/igs/issues) on GitHub
- [Submit feedback](https://forms.gle/WaeHRt5Hug3fYzKW9) via our form

---

## Credits

**Developed by** Ben Rydal Shapiro, Edwin Zhao, and [contributors](https://github.com/BenRydal/igs/graphs/contributors)

**Supported by** the National Science Foundation

**Collaborators** Rogers Hall, David Owens, Christine Hsieh, Lani Horn, Brette Garner, Lizi Metts, and the TAU and SLaM research groups

### Data Sources

- Classroom discussion data from *Mathematics Teaching and Learning to Teach (MTLT)*, University of Michigan (2010)
- Classroom science lesson data from *The Third International Mathematics and Science Study (TIMSS) 1999 Video Study*

---

## Citation

If you use IGS in your research, please cite:

> Shapiro, B. R., Silvis, D., & Hall, R. (2025). Visualization as theory and experience: Interactive qualitative data visualization for the learning sciences. *Journal of the Learning Sciences, 34*(5), 840–871. https://doi.org/10.1080/10508406.2025.2537945

<details>
<summary>BibTeX</summary>

```bibtex
@article{shapiro2025visualization,
  title={Visualization as theory and experience: Interactive qualitative data visualization for the learning sciences},
  author={Shapiro, Ben Rydal and Silvis, Deborah and Hall, Rogers},
  journal={Journal of the Learning Sciences},
  volume={34},
  number={5},
  pages={840--871},
  year={2025},
  publisher={Taylor \& Francis},
  doi={10.1080/10508406.2025.2537945}
}
```

</details>

---

## License

This project is licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0).

---

<div align="center">

**[⬆ Back to Top](#interaction-geography-slicer-igs)**

</div>
